# ClinIQ Project Conventions

## Writing rules (apply everywhere)
- No em dashes anywhere. Use commas, colons, or rewrite the sentence.
- No hyphens used as em dashes.
- Summaries and findings must use bullet points, not prose paragraphs.
- No "automated" or "automate" in any copy or documentation.

## These rules apply to
- Code comments
- Docstrings
- README and all markdown files
- UI copy and labels
- All Claude API prompts and system messages
- All AI-generated output (enforce via system prompt)

## Claude API system prompt template
Every call to the Claude API must include this in the system prompt:

  You are a clinical data assistant for ClinIQ.
  Rules for all responses:
  - Use bullet points for all summaries and findings
  - Never use em dashes anywhere in your output
  - Never use hyphens as em dashes
  - Write in plain English with no clinical jargon unless the audience is clinical staff
  - Be concise and specific

## Stack
- Python 3.12+ with uv
- HAPI FHIR public server (https://hapi.fhir.org/baseR4)
- FastAPI for the backend API layer (Phase 4)
- ChromaDB for RAG vector store (Phase 4)
- Power BI for the main dashboard (Phase 3)
- Claude claude-sonnet-4-6 via Anthropic API (Phase 4)

## Folder structure
- pipeline/   FHIR extraction and flattening scripts
- data/       raw and processed files (gitignored)
- ai/         RAG pipeline and Claude integration
- public/     any static assets or exports