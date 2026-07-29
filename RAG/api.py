import os
import sys
from datetime import date, datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from llama_index.core import Settings, VectorStoreIndex, StorageContext
from llama_index.core.prompts import PromptTemplate
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.vector_stores.milvus import MilvusVectorStore
import uvicorn

# Load environment variables
load_dotenv()

# Configure models
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.llm = OpenAI(model="gpt-4o-mini")

# Small, cheap model used only for classification and for phrasing
# personalized answers -- keep this separate from the main RAG LLM setting
# above so it's easy to swap/tune independently.
classifier_llm = OpenAI(model="gpt-4o-mini", temperature=0)

# ------------------- Custom Prompt Template with Markdown formatting -------------------
qa_prompt = PromptTemplate(
    """
You are the AI assistant for AnonBlood.
You answer questions about:
- Blood donation
- Blood compatibility
- Blood donation eligibility
- How to use the AnonBlood platform
- Privacy rules
- Donor and seeker workflows
- Blood banks location
Do not invent features or procedures.
Do not answer unrelated questions.
**Formatting instructions:**
- Structure your answer with clear headings (use `##` for sections).
- Use **bold** for important terms, dates, or numbers.
- Use bullet points (`- `) or numbered lists for steps or options.
- Add blank lines between paragraphs for readability.
- Keep the tone professional and helpful.
Question:
{query_str}
"""
)

# Prompt used ONLY to classify a question -- kept deliberately tiny/cheap.
classification_prompt = """Classify the user's message into exactly one label:

GREETING - a simple greeting or small talk with no real question yet,
           e.g. "hello", "hi", "good morning", "how are you".
EMERGENCY - the message describes symptoms, pain, injury, or a medical emergency
            of any kind. e.g. "I have appendicitis", "I'm bleeding a lot",
            "I feel dizzy and my chest hurts". Classify as EMERGENCY whenever a
            health complaint or symptom is mentioned, even briefly or in passing,
            even if it's phrased like a question about donating.
PUBLIC - a general question about blood donation, compatibility, eligibility rules,
         or how the AnonBlood platform works in general.
PERSONAL - a question about the logged-in donor's OWN donation status, e.g. "when
           can I donate again", "am I eligible right now", "what's my availability
           status". Only use this label for donation-status questions, not symptoms.
OUT_OF_SCOPE - a real question, unrelated to blood donation, the platform, or health.

When in doubt between OUT_OF_SCOPE and one of the other labels, prefer the other
label. OUT_OF_SCOPE should only be used for messages that are clearly unrelated
to blood donation, health, or the platform.

Respond with exactly one word: GREETING, EMERGENCY, PUBLIC, PERSONAL, or OUT_OF_SCOPE.

Message: {question}
Label:"""

# Prompt used to phrase a personalized answer. The LLM is given the ALREADY-COMPUTED
# facts and must not invent or recompute anything -- it only explains them clearly.
personalized_phrasing_prompt = """You are the AnonBlood AI assistant. A donor asked a
question about their own donation eligibility. Do not invent any facts -- only use
the computed facts given below. Phrase a clear, warm, professional answer.

Donor's question: {question}

Computed facts (already calculated by the system trust these exactly):
- Blood type: {blood_type}
- Availability status: {availability_status}
- Can donate right now: {can_donate_now}
- Days until next eligible date (0 if already eligible): {days_until_eligible}
- Next eligible date: {next_eligible_date}

Answer:"""

# ------------------------------------------------------------------------------------
app = FastAPI(title="AnonBlood AI Assistant API")

# Enable CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DonorContext(BaseModel):
    """
    Prototype-stage only: the frontend sends the already-logged-in donor's
    own profile fields here so the backend can answer personalized questions.

    # TODO (before real launch / real users): DO NOT keep trusting this
    # client-sent object. Replace this entire field with server-side
    # verification of a Supabase JWT (Authorization header), and fetch this
    # donor's row from the `donors` table using the verified user id from
    # the token. never from a value the client provided. Right now a user
    # could edit this payload and claim to be a different donor.
    """
    id: str
    blood_type: Optional[str] = None
    availability_status: Optional[str] = None
    last_donation_date: Optional[str] = None
    next_eligible_date: Optional[str] = None
    display_id: Optional[str] = None


class QueryRequest(BaseModel):
    question: str
    # Optional: present only when the requester is a logged-in donor asking
    # about themselves. Absent/None => treat the request as public mode.
    donor_context: Optional[DonorContext] = None


class SourceInfo(BaseModel):
    organization: str
    document_title: str
    page: str | None = None
    url: str | None = None
    document_type: str | None = None
    score: float | None = None


class QueryResponse(BaseModel):
    answer: str
    mode: str  # "public" or "personal"
    sources: list[SourceInfo]


def get_vector_store(overwrite: bool = False):
    return MilvusVectorStore(
        uri=os.environ["ZILLIZ_URI"],
        token=os.environ["ZILLIZ_TOKEN"],
        dim=1536,
        overwrite=overwrite,
    )


def classify_question(question: str, has_donor_context: bool) -> str:
    """
    Classify a question as PUBLIC, PERSONAL, or OUT_OF_SCOPE using a small,
    cheap LLM call. If there's no donor_context at all, we never need to
    call PERSONAL, since there'd be nothing to answer it with.
    """
    prompt = classification_prompt.format(question=question)
    result = classifier_llm.complete(prompt)
    label = str(result).strip().upper()

    valid_labels = {"GREETING", "EMERGENCY", "PUBLIC", "PERSONAL", "OUT_OF_SCOPE"}
    if label not in valid_labels:
        # Fail safe: if the classifier returns something unexpected,
        # default to PUBLIC rather than guessing into PERSONAL or dropping
        # a real emergency into OUT_OF_SCOPE.
        label = "PUBLIC"

    if label == "PERSONAL" and not has_donor_context:
        # No donor data to answer a personal question with -- caller will
        # turn this into a "please log in" response.
        return "PERSONAL_NO_CONTEXT"

    return label


def compute_eligibility_facts(donor: DonorContext) -> dict:
    """
    All date/eligibility math happens HERE in code never inside the LLM.
    The LLM only ever receives these already-computed values to phrase.
    """
    today = date.today()
    next_eligible = None
    days_until_eligible = 0
    can_donate_now = True

    if donor.next_eligible_date:
        try:
            # Handles both "YYYY-MM-DD" and full ISO timestamps.
            next_eligible = datetime.fromisoformat(
                donor.next_eligible_date.replace("Z", "+00:00")
            ).date()
        except ValueError:
            next_eligible = None

    if next_eligible:
        days_until_eligible = max((next_eligible - today).days, 0)
        can_donate_now = next_eligible <= today

    if donor.availability_status and donor.availability_status.lower() != "available":
        can_donate_now = can_donate_now and donor.availability_status.lower() == "available"

    return {
        "blood_type": donor.blood_type or "unknown",
        "availability_status": donor.availability_status or "unknown",
        "can_donate_now": can_donate_now,
        "days_until_eligible": days_until_eligible,
        "next_eligible_date": donor.next_eligible_date or "unknown",
    }


@app.post("/api/chat", response_model=QueryResponse)
async def chat(request: QueryRequest):
    try:
        has_donor_context = request.donor_context is not None
        label = classify_question(request.question, has_donor_context)

        # --- Greeting: respond warmly, no decline ---
        if label == "GREETING":
            return QueryResponse(
                answer=(
                    "Hi! I'm the AnonBlood assistant. I can help with blood "
                    "donation eligibility, blood type compatibility, how "
                    "matching and verification work on the platform, and "
                    "similar questions. What would you like to know?"
                ),
                mode="public",
                sources=[],
            )

        # --- Possible medical emergency: redirect immediately, don't
        # attempt to answer a donation question in this turn ---
        if label == "EMERGENCY":
            return QueryResponse(
                answer=(
                    "This sounds like it may be a medical emergency or a "
                    "symptom I'm not able to help with. Please contact "
                    "emergency services or a medical professional right "
                    "away! I'm only able to help with general blood "
                    "donation and platform questions, not medical advice."
                ),
                mode="public",
                sources=[],
            )

        # --- Out of scope: keep existing decline behavior ---
        if label == "OUT_OF_SCOPE":
            return QueryResponse(
                answer=(
                    "I can only help with blood donation and AnonBlood platform "
                    "questions. Could you rephrase your question around that?"
                ),
                mode="public",
                sources=[],
            )

        # --- Personal question but no donor context available ---
        if label == "PERSONAL_NO_CONTEXT":
            return QueryResponse(
                answer=(
                    "That looks like a question about your own donation status. "
                    "please log in as a donor first so I can check your details."
                ),
                mode="public",
                sources=[],
            )

        # --- Personal question, donor context present: deterministic + LLM phrasing ---
        if label == "PERSONAL":
            facts = compute_eligibility_facts(request.donor_context)
            prompt = personalized_phrasing_prompt.format(
                question=request.question,
                **facts,
            )
            phrased = classifier_llm.complete(prompt)

            # Minimal logging -- log which fields were used, not full PII.
            print(
                f"[personalized-query] donor_id_hash={hash(request.donor_context.id)} "
                f"fields_used=blood_type,availability_status,next_eligible_date"
            )

            return QueryResponse(
                answer=str(phrased),
                mode="personal",
                sources=[],
            )

        # --- PUBLIC: existing RAG flow, unchanged ---
        vector_store = get_vector_store(overwrite=False)
        index = VectorStoreIndex.from_vector_store(vector_store)
        query_engine = index.as_query_engine(
            similarity_top_k=5,
            response_mode="compact",
            text_qa_template=qa_prompt,
        )
        response = query_engine.query(request.question)

        sources = []
        for node in response.source_nodes:
            sources.append(SourceInfo(
                organization=node.metadata.get("organization", "Unknown"),
                document_title=node.metadata.get("document_title", "Unknown"),
                page=node.metadata.get("page"),
                url=node.metadata.get("url"),
                document_type=node.metadata.get("document_type"),
                score=round(node.score, 2) if hasattr(node, "score") and node.score is not None else None,
            ))

        return QueryResponse(
            answer=str(response),
            mode="public",
            sources=sources,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
