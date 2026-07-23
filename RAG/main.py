import os
import sys
from dotenv import load_dotenv
from llama_index.core import (
    Settings,
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
)
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.vector_stores.milvus import MilvusVectorStore

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


def ingest():
    documents = SimpleDirectoryReader(
        input_dir="./medical_docs",
        recursive=True,
        filename_as_id=True,
    ).load_data()

    for doc in documents:
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

    vector_store = get_vector_store(overwrite=True)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    VectorStoreIndex.from_documents(documents, storage_context=storage_context)
    print("Ingestion complete!")


def query(question: str):
    vector_store = get_vector_store(overwrite=False)
    index = VectorStoreIndex.from_vector_store(vector_store)
    query_engine = index.as_query_engine(similarity_top_k=5, response_mode="compact")

    response = query_engine.query(question)

    print("\nANSWER:\n", response)
    print("\n--- Sources ---")
    for node in response.source_nodes:
        print(f"{node.metadata.get('source')} — {node.metadata.get('file_name')} (score: {node.score:.2f})")


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
