import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from llama_index.core import Settings, VectorStoreIndex, StorageContext
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.vector_stores.milvus import MilvusVectorStore
import uvicorn

# Load environment variables
load_dotenv()

# Configure models
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.llm = OpenAI(model="gpt-4o-mini")

app = FastAPI(title="AnonBlood AI Assistant API")

# Enable CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]

def get_vector_store(overwrite: bool = False):
    return MilvusVectorStore(
        uri=os.environ["ZILLIZ_URI"],
        token=os.environ["ZILLIZ_TOKEN"],
        dim=1536,
        overwrite=overwrite,
    )

@app.post("/api/chat", response_model=QueryResponse)
async def chat(request: QueryRequest):
    try:
        vector_store = get_vector_store(overwrite=False)
        index = VectorStoreIndex.from_vector_store(vector_store)
        query_engine = index.as_query_engine(
            similarity_top_k=5, 
            response_mode="compact"
        )
        
        response = query_engine.query(request.question)
        
        sources = []
        for node in response.source_nodes:
            sources.append({
                "source": node.metadata.get("source", "Unknown"),
                "file_name": node.metadata.get("file_name", "Unknown"),
                "score": round(node.score, 2) if hasattr(node, 'score') else None
            })
        
        return QueryResponse(
            answer=str(response),
            sources=sources
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)