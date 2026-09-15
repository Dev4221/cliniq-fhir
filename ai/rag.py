"""
RAG pipeline for ClinIQ.
Indexes patient summary data into ChromaDB for semantic search.
Used by the find patients and ask the data features.
"""

import csv
import json
from pathlib import Path
import chromadb
from chromadb.utils import embedding_functions

PROCESSED_DIR = Path("data/processed")
CHROMA_DIR = Path("data/chroma")
COLLECTION_NAME = "cliniq_patients"


def get_collection():
    """Get or create the ChromaDB collection."""
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    ef = embedding_functions.DefaultEmbeddingFunction()
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=ef
    )
    return collection


def build_patient_document(row: dict) -> str:
    """
    Convert a patient summary row into a plain-English document
    for embedding. This is what the semantic search runs against.
    """
    parts = []

    name = row.get("name", "Unknown patient")
    age = row.get("age", "unknown age")
    gender = row.get("gender", "unknown gender")
    parts.append(f"Patient {name}, {age} years old, {gender}.")

    conditions = []
    if row.get("has_diabetes") == "True":
        conditions.append("diabetes")
    if row.get("has_ckd") == "True":
        conditions.append("chronic kidney disease")
    if row.get("has_copd") == "True":
        conditions.append("COPD")
    if row.get("has_hypertension") == "True":
        conditions.append("hypertension")
    if conditions:
        parts.append(f"Conditions: {', '.join(conditions)}.")
    else:
        parts.append("No major chronic conditions recorded.")

    chronic_count = row.get("chronic_condition_count", "0")
    encounter_count = row.get("encounter_count", "0")
    parts.append(
        f"Has {chronic_count} chronic conditions and {encounter_count} total encounters."
    )

    gaps = []
    if row.get("gap_hba1c") == "True":
        gaps.append("no blood sugar test in over 12 months")
    if row.get("gap_egfr") == "True":
        gaps.append("no kidney function test this year")
    if row.get("gap_bp") == "True":
        gaps.append("no blood pressure reading recorded")
    if row.get("gap_spirometry") == "True":
        gaps.append("no breathing test this year")
    if gaps:
        parts.append(f"Care gaps: {', '.join(gaps)}.")

    risk = row.get("risk_tier", "unknown")
    score = row.get("readmission_risk_score", "0")
    parts.append(f"Readmission risk: {risk} (score {score}).")

    days = row.get("days_since_last_encounter", "")
    if days:
        parts.append(f"Last seen {days} days ago.")

    return " ".join(parts)


def index_patients() -> int:
    """
    Read patient_summary.csv and index all patients into ChromaDB.
    Returns the number of patients indexed.
    """
    path = PROCESSED_DIR / "patient_summary.csv"
    if not path.exists():
        raise FileNotFoundError(f"patient_summary.csv not found at {path}")

    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    collection = get_collection()

    # Clear existing documents
    existing = collection.count()
    if existing > 0:
        collection.delete(where={"source": "patient_summary"})

    documents = []
    ids = []
    metadatas = []

    for row in rows:
        doc = build_patient_document(row)
        documents.append(doc)
        ids.append(row["patient_id"])
        metadatas.append({
            "source": "patient_summary",
            "patient_id": row["patient_id"],
            "risk_tier": row.get("risk_tier", ""),
            "has_diabetes": row.get("has_diabetes", "False"),
            "has_ckd": row.get("has_ckd", "False"),
            "has_copd": row.get("has_copd", "False"),
            "has_hypertension": row.get("has_hypertension", "False"),
            "gap_hba1c": row.get("gap_hba1c", "False"),
        })

    # Index in batches of 100
    batch_size = 100
    for i in range(0, len(documents), batch_size):
        collection.add(
            documents=documents[i:i + batch_size],
            ids=ids[i:i + batch_size],
            metadatas=metadatas[i:i + batch_size]
        )
        print(f"  Indexed {min(i + batch_size, len(documents))}/{len(documents)} patients")

    return len(documents)


def search_patients(query: str, limit: int = 10) -> list[str]:
    """
    Search the ChromaDB collection for patients matching a plain-English query.
    Returns a list of matching patient IDs ordered by relevance.
    """
    collection = get_collection()
    results = collection.query(
        query_texts=[query],
        n_results=min(limit, collection.count())
    )
    return results["ids"][0] if results["ids"] else []


if __name__ == "__main__":
    print("Building ChromaDB index from patient_summary.csv...")
    count = index_patients()
    print(f"Indexed {count} patients.")
    print("Testing search: diabetic patients over 60 with no blood test...")
    ids = search_patients("diabetic patients over 60 with no blood test", limit=5)
    print(f"Top matches: {ids}")