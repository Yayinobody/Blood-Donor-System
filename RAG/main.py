import os
import sys
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from llama_index.core import (
    Settings,
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
    Document,                      # for manual document creation
)
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.vector_stores.milvus import MilvusVectorStore

# ------------------------------------------------------------
# PHILIPPINE BLOOD DONATION REFERENCES (array for easy use)
# ------------------------------------------------------------
PH_BLOOD_DONATION_LINKS = [
    "https://www.who.int/philippines/health-topics/blood-safety",
    "https://www.pbcs.com.ph/",   # Philippine Blood Center Service (example)
    "https://www.facebook.com/PhilippineRedCross/",  # official Red Cross FB
]
# ------------------------------------------------------------

# Load variables from .env into the environment
load_dotenv()

# Configure models
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.llm = OpenAI(model="gpt-4o-mini")


def get_vector_store(overwrite: bool):
    return MilvusVectorStore(
        uri=os.environ["ZILLIZ_URI"],
        token=os.environ["ZILLIZ_TOKEN"],
        dim=1536,
        overwrite=overwrite,
    )


def fetch_webpage_text(url: str) -> str:
    """Fetch and extract readable text from a URL."""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        resp = requests.get(url, timeout=15, headers=headers)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        # Get text and clean up whitespace
        text = soup.get_text(separator="\n")
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase for line in lines for phrase in line.split("  "))
        text = "\n".join(chunk for chunk in chunks if chunk)
        return text
    except Exception as e:
        print(f"⚠️  Could not fetch {url}: {e}")
        return ""


def ingest():
    # ------------------- 1. Load local documents -------------------
    local_docs = SimpleDirectoryReader(
        input_dir="./medical_docs",
        recursive=True,
        filename_as_id=True,
    ).load_data()

    # Add source metadata for local docs
    for doc in local_docs:
        path = doc.metadata["file_path"].lower()
        if "redcross" in path:
            doc.metadata["source"] = "Philippine Red Cross"
        elif "doh" in path:
            doc.metadata["source"] = "DOH"
        elif "who" in path:
            doc.metadata["source"] = "WHO"
        elif "anonblood" in path:
            doc.metadata["source"] = "AnonBlood Documentation"
        else:
            doc.metadata["source"] = "Unknown"
        doc.metadata["file_name"] = os.path.basename(doc.metadata["file_path"])

    # ------------------- 2. Fetch web content from the links -------------------
    web_docs = []
    for url in PH_BLOOD_DONATION_LINKS:
        print(f"🌐 Fetching: {url}")
        text = fetch_webpage_text(url)
        if not text:
            continue
        # Create a Document object for this webpage
        doc = Document(
            text=text,
            metadata={
                "source": url,
                "file_name": url.split("/")[-1] or url,
                "url": url,
            },
        )
        web_docs.append(doc)

    # Combine both sources
    all_documents = local_docs + web_docs
    print(f"✅ Loaded {len(local_docs)} local docs + {len(web_docs)} web docs")

    # ------------------- 3. Index into Milvus -------------------
    vector_store = get_vector_store(overwrite=True)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    VectorStoreIndex.from_documents(all_documents, storage_context=storage_context)
    print("✅ Ingestion complete!")


def query(question: str):
    vector_store = get_vector_store(overwrite=False)
    index = VectorStoreIndex.from_vector_store(vector_store)
    query_engine = index.as_query_engine(similarity_top_k=5, response_mode="compact")

    response = query_engine.query(question)

    print("\nANSWER:\n", response)
    print("\n--- Sources ---")
    for node in response.source_nodes:
        src = node.metadata.get("source", "Unknown")
        fname = node.metadata.get("file_name", "Unknown")
        print(f"{src} — {fname} (score: {node.score:.2f})")

    # Optional: show the reference links again
    print("\n--- Philippine blood donation resources (for reference) ---")
    for url in PH_BLOOD_DONATION_LINKS:
        print(f"  • {url}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python main.py ingest")
        print("  python main.py query \"your question here\"")
        sys.exit(1)

    command = sys.argv[1]

    if command == "ingest":
        ingest()
    elif command == "query":
        if len(sys.argv) < 3:
            print("Please provide a question, e.g.:")
            print('  python main.py query "What is first aid for a snake bite?"')
            sys.exit(1)
        query(sys.argv[2])
    else:
        print(f"Unknown command: {command}")
