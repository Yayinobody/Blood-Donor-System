"""
AnonBlood ingestion pipeline (with duplicate detection)

New in this version:
  - Each document gets a stable doc_id (file path for local files, URL for
    web pages) and a content hash (sha256 of its text).
  - A manifest file (ingest_manifest.json) persists doc_id -> hash across
    runs.
  - On each run:
      * unchanged doc (hash matches manifest)      -> skipped entirely,
        no re-embedding, no API cost.
      * new doc (doc_id not in manifest)            -> chunked + embedded.
      * changed doc (hash differs from manifest)    -> old vectors for
        that doc_id are deleted from Milvus first, then the new version
        is chunked + embedded.
  - --overwrite still rebuilds everything from scratch and resets the
    manifest, for when you want a clean slate.

Usage:
    python ingest.py                # incremental, skips unchanged docs
    python ingest.py --overwrite    # rebuild everything from scratch
"""

import os
import json
import hashlib
import argparse
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup
from dotenv import load_dotenv

from llama_index.core import (
    Settings,
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
    Document,
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.vector_stores.milvus import MilvusVectorStore

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

PH_BLOOD_DONATION_LINKS = [
    "https://www.who.int/philippines/health-topics/blood-safety",
    "https://redcross.org.ph/give-blood/",
    "https://redcross.org.ph/",
]

SOURCE_MAP = {
    "redcross": "Philippine Red Cross",
    "doh": "Department of Health",
    "who": "World Health Organization",
    "anonblood": "AnonBlood Documentation",
}

CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
MANIFEST_PATH = "ingest_manifest.json"

load_dotenv()

Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.llm = OpenAI(model="gpt-4o-mini")


# ------------------------------------------------------------
# MANIFEST (doc_id -> content hash) FOR DUPLICATE DETECTION
# ------------------------------------------------------------

def load_manifest() -> dict:
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, "r") as f:
            return json.load(f)
    return {}


def save_manifest(manifest: dict):
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# ------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------

def get_requests_session() -> requests.Session:
    session = requests.Session()
    retries = Retry(
        total=3,
        backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    session.mount("https://", HTTPAdapter(max_retries=retries))
    session.mount("http://", HTTPAdapter(max_retries=retries))
    return session


def get_vector_store(overwrite: bool) -> MilvusVectorStore:
    return MilvusVectorStore(
        uri=os.environ["ZILLIZ_URI"],
        token=os.environ["ZILLIZ_TOKEN"],
        dim=1536,
        overwrite=overwrite,
    )


def resolve_organization(path: str) -> str:
    path_lower = path.lower()
    for key, org_name in SOURCE_MAP.items():
        if key in path_lower:
            return org_name
    return "Unknown"


def fetch_main_content(url: str, session: requests.Session) -> tuple[str, str]:
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        resp = session.get(url, timeout=15, headers=headers)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else url

        main = soup.find("main") or soup.find("article")
        container = main if main else soup

        text = container.get_text(separator="\n")
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase for line in lines for phrase in line.split("  "))
        text = "\n".join(chunk for chunk in chunks if chunk)
        return title, text
    except Exception as e:
        print(f"⚠️  Could not fetch {url}: {e}")
        return url, ""


# ------------------------------------------------------------
# LOADING (each doc gets a stable doc_id + metadata)
# ------------------------------------------------------------

def load_local_documents() -> list[Document]:
    local_docs = SimpleDirectoryReader(
        input_dir="./medical_docs",
        recursive=True,
        filename_as_id=True,
    ).load_data()

    for doc in local_docs:
        path = doc.metadata.get("file_path", "")
        file_name = os.path.basename(path)
        # filename_as_id=True already sets doc.doc_id to the file path
        # (plus a page suffix for multi-page PDFs) - that's our stable id.
        doc.metadata.update({
            "organization": resolve_organization(path),
            "document_title": os.path.splitext(file_name)[0],
            "file_name": file_name,
            "page": doc.metadata.get("page_label", None),
            "document_type": "local_file",
            "url": None,
        })

    return local_docs


def load_web_documents() -> list[Document]:
    session = get_requests_session()
    web_docs = []
    for url in PH_BLOOD_DONATION_LINKS:
        print(f"🌐 Fetching: {url}")
        title, text = fetch_main_content(url, session)
        if not text:
            continue
        doc = Document(
            text=text,
            doc_id=url,  # stable id across runs
            metadata={
                "organization": resolve_organization(url),
                "document_title": title,
                "file_name": url.rstrip("/").split("/")[-1] or url,
                "page": None,
                "document_type": "web_page",
                "url": url,
            },
        )
        web_docs.append(doc)
    return web_docs


# ------------------------------------------------------------
# INGESTION
# ------------------------------------------------------------

def ingest(overwrite: bool):
    manifest = {} if overwrite else load_manifest()

    local_docs = load_local_documents()
    web_docs = load_web_documents()
    all_documents = local_docs + web_docs
    print(f"✅ Loaded {len(local_docs)} local docs + {len(web_docs)} web docs")

    vector_store = get_vector_store(overwrite=overwrite)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex.from_vector_store(vector_store) if not overwrite else None

    splitter = SentenceSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)

    new_or_changed_docs = []
    skipped = 0
    changed_doc_ids = []

    for doc in all_documents:
        doc_id = doc.doc_id
        current_hash = content_hash(doc.text)
        previous_hash = manifest.get(doc_id)

        if previous_hash == current_hash:
            skipped += 1
            continue

        if previous_hash is not None and previous_hash != current_hash:
            # Doc changed since last run - remove its old vectors before
            # re-inserting the new version, so stale chunks don't linger.
            changed_doc_ids.append(doc_id)

        manifest[doc_id] = current_hash
        new_or_changed_docs.append(doc)

    print(f"⏭️  Skipped {skipped} unchanged doc(s)")
    print(f"🔄 {len(changed_doc_ids)} doc(s) changed, {len(new_or_changed_docs) - len(changed_doc_ids)} new doc(s)")

    if overwrite:
        # Fresh collection - just build the index directly from all docs.
        nodes = splitter.get_nodes_from_documents(all_documents)
        VectorStoreIndex(nodes, storage_context=storage_context)
        print(f"✅ Rebuilt collection from scratch with {len(nodes)} chunks")
    else:
        if changed_doc_ids:
            for doc_id in changed_doc_ids:
                index.delete_ref_doc(doc_id, delete_from_docstore=True)
            print(f"🗑️  Removed stale vectors for {len(changed_doc_ids)} changed doc(s)")

        if new_or_changed_docs:
            nodes = splitter.get_nodes_from_documents(new_or_changed_docs)
            index.insert_nodes(nodes)
            print(f"✅ Inserted {len(nodes)} chunks for new/changed docs")
        else:
            print("✅ Nothing new to ingest - collection already up to date")

    save_manifest(manifest)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AnonBlood ingestion pipeline")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Rebuild the Milvus collection from scratch and reset the manifest.",
    )
    args = parser.parse_args()
    ingest(overwrite=args.overwrite)
