# ClinIQ

A clinical operations dashboard built on synthetic FHIR patient data.

Pulls live data from the HAPI FHIR public test server, flattens it into
clean tables, and surfaces population health insights through a Power BI
dashboard and an AI query layer powered by Claude.

## What it shows

- Population overview: patient counts by age, sex, and condition
- Disease prevalence: which long-term conditions are most common and how they trend
- Patient groups: segments by condition combination and risk level
- Readmission risk: patients most likely to return to hospital within 30 days
- Missed care: patients overdue for a check-up or follow-up
- AI layer: plain-English queries over the patient data via RAG

## Stack

- Python and uv for FHIR extraction
- HAPI FHIR public test server (no auth required)
- Power BI for the dashboard
- Claude claude-sonnet-4-6 for the AI layer
- ChromaDB for the RAG vector store
- FastAPI for the backend

## Build phases

- Phase 0: FHIR API exploration and sandbox setup
- Phase 1: Full extraction across all record types with paging
- Phase 2: Flatten JSON into clean tables
- Phase 3: Power BI dashboard
- Phase 4: AI layer, RAG, and plain-English query
- Phase 5: Risk scoring, missed care alerts, and demo prep

## Data

All patient data is synthetic. The project uses the HAPI FHIR public
test server which contains fake records only. No real patient data is
used at any point.

## Running the project

Install dependencies:

    uv add requests

Run Phase 0 exploration:

    uv run python pipeline/phase0_explore.py