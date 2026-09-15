"""
ClinIQ FastAPI backend.
Provides endpoints for all AI features in the dashboard.

Run with: uv run uvicorn ai.main:app --reload --port 8000
"""

import csv
import json
import os
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from ai.models import (
    PatientSearchRequest, PatientSearchResponse, PatientResult,
    AlertsResponse, ReportRequest, ReportResponse,
    ScenarioRequest, ScenarioResponse,
    SummaryRequest, SummaryResponse,
    AskRequest, AskResponse,
)
from ai.prompts import (
    SYSTEM_PROMPT, PATIENT_SEARCH_PROMPT, ALERTS_PROMPT,
    REPORT_PROMPT, SCENARIO_PROMPT, SUMMARY_PROMPT, ASK_PROMPT,
)
from ai.rag import search_patients, index_patients

load_dotenv()

PROCESSED_DIR = Path("data/processed")
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def load_patient_summary() -> list[dict]:
    path = PROCESSED_DIR / "patient_summary.csv"
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def build_cohort_summary(patients: list[dict]) -> str:
    """Build a plain-English cohort summary for use in prompts."""
    total = len(patients)
    high_risk = sum(1 for p in patients if p.get("risk_tier") == "High")
    medium_risk = sum(1 for p in patients if p.get("risk_tier") == "Medium")
    diabetic = sum(1 for p in patients if p.get("has_diabetes") == "True")
    ckd = sum(1 for p in patients if p.get("has_ckd") == "True")
    copd = sum(1 for p in patients if p.get("has_copd") == "True")
    hypertensive = sum(1 for p in patients if p.get("has_hypertension") == "True")
    gap_hba1c = sum(1 for p in patients if p.get("gap_hba1c") == "True")
    gap_egfr = sum(1 for p in patients if p.get("gap_egfr") == "True")
    gap_bp = sum(1 for p in patients if p.get("gap_bp") == "True")
    gap_spirometry = sum(1 for p in patients if p.get("gap_spirometry") == "True")
    multi_condition = sum(
        1 for p in patients
        if int(p.get("chronic_condition_count", 0)) >= 2
    )

    return f"""Cohort summary ({total} patients):
- High risk: {high_risk} patients ({round(high_risk/total*100, 1)}%)
- Medium risk: {medium_risk} patients ({round(medium_risk/total*100, 1)}%)
- Diabetic: {diabetic} patients ({round(diabetic/total*100, 1)}%)
- Chronic kidney disease: {ckd} patients ({round(ckd/total*100, 1)}%)
- COPD: {copd} patients ({round(copd/total*100, 1)}%)
- Hypertension: {hypertensive} patients ({round(hypertensive/total*100, 1)}%)
- Managing 2 or more conditions: {multi_condition} patients ({round(multi_condition/total*100, 1)}%)
- No blood sugar test in 12 months (diabetics): {gap_hba1c} patients
- No kidney function test this year (CKD): {gap_egfr} patients
- No blood pressure reading (hypertensive): {gap_bp} patients
- No breathing test this year (COPD): {gap_spirometry} patients"""


def call_claude(prompt: str, max_tokens: int = 1000) -> str:
    """Make a Claude API call and return the text response."""
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Building ChromaDB index...")
    try:
        count = index_patients()
        print(f"Indexed {count} patients.")
    except Exception as e:
        print(f"Warning: could not build index: {e}")
    yield


app = FastAPI(
    title="ClinIQ API",
    description="AI-powered clinical operations dashboard backend",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ClinIQ API is running"}


@app.get("/api/cohort-summary")
def get_cohort_summary():
    """Return key cohort metrics for the dashboard KPI cards."""
    patients = load_patient_summary()
    total = len(patients)
    high_risk = sum(1 for p in patients if p.get("risk_tier") == "High")
    medium_risk = sum(1 for p in patients if p.get("risk_tier") == "Medium")
    low_risk = sum(1 for p in patients if p.get("risk_tier") == "Low")
    diabetic = sum(1 for p in patients if p.get("has_diabetes") == "True")
    ckd = sum(1 for p in patients if p.get("has_ckd") == "True")
    copd = sum(1 for p in patients if p.get("has_copd") == "True")
    hypertensive = sum(1 for p in patients if p.get("has_hypertension") == "True")
    gap_hba1c = sum(1 for p in patients if p.get("gap_hba1c") == "True")
    gap_egfr = sum(1 for p in patients if p.get("gap_egfr") == "True")
    gap_bp = sum(1 for p in patients if p.get("gap_bp") == "True")
    gap_spirometry = sum(1 for p in patients if p.get("gap_spirometry") == "True")
    total_care_gaps = sum(
        1 for p in patients
        if any([
            p.get("gap_hba1c") == "True",
            p.get("gap_egfr") == "True",
            p.get("gap_bp") == "True",
            p.get("gap_spirometry") == "True",
        ])
    )
    multi_condition = sum(
        1 for p in patients
        if int(p.get("chronic_condition_count", 0)) >= 2
    )
    avg_risk_score = round(
        sum(float(p.get("readmission_risk_score", 0)) for p in patients) / total, 3
    )

    age_groups = {}
    for p in patients:
        ag = p.get("age_group", "Unknown")
        age_groups[ag] = age_groups.get(ag, 0) + 1

    risk_tiers = {"High": high_risk, "Medium": medium_risk, "Low": low_risk}

    gender_counts = {}
    for p in patients:
        g = p.get("gender", "unknown")
        gender_counts[g] = gender_counts.get(g, 0) + 1

    return {
        "total_patients": total,
        "high_risk_patients": high_risk,
        "medium_risk_patients": medium_risk,
        "low_risk_patients": low_risk,
        "avg_risk_score": avg_risk_score,
        "total_care_gap_patients": total_care_gaps,
        "multi_condition_patients": multi_condition,
        "conditions": {
            "diabetes": diabetic,
            "ckd": ckd,
            "copd": copd,
            "hypertension": hypertensive,
        },
        "care_gaps": {
            "hba1c": gap_hba1c,
            "egfr": gap_egfr,
            "bp": gap_bp,
            "spirometry": gap_spirometry,
        },
        "age_groups": age_groups,
        "risk_tiers": risk_tiers,
        "gender": gender_counts,
    }


@app.post("/api/find-patients", response_model=PatientSearchResponse)
def find_patients(request: PatientSearchRequest):
    """Find patients matching a plain-English description using RAG."""
    try:
        matching_ids = search_patients(request.query, limit=request.limit * 2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {e}")

    all_patients = load_patient_summary()
    patient_map = {p["patient_id"]: p for p in all_patients}

    results = []
    for pid in matching_ids:
        if pid not in patient_map:
            continue
        p = patient_map[pid]
        try:
            results.append(PatientResult(
                patient_id=p["patient_id"],
                name=p.get("name", ""),
                age=int(p["age"]) if p.get("age") else None,
                gender=p.get("gender", ""),
                risk_tier=p.get("risk_tier", ""),
                chronic_condition_count=int(p.get("chronic_condition_count", 0)),
                encounter_count=int(p.get("encounter_count", 0)),
                has_diabetes=p.get("has_diabetes") == "True",
                has_ckd=p.get("has_ckd") == "True",
                has_copd=p.get("has_copd") == "True",
                has_hypertension=p.get("has_hypertension") == "True",
                gap_hba1c=p.get("gap_hba1c") == "True",
                gap_egfr=p.get("gap_egfr") == "True",
                gap_bp=p.get("gap_bp") == "True",
                gap_spirometry=p.get("gap_spirometry") == "True",
                readmission_risk_score=float(p.get("readmission_risk_score", 0)),
            ))
        except Exception:
            continue
        if len(results) >= request.limit:
            break

    return PatientSearchResponse(
        query=request.query,
        count=len(results),
        patients=results
    )


@app.get("/api/alerts", response_model=AlertsResponse)
def get_alerts():
    """Generate clinical alerts using Claude based on current cohort data."""
    patients = load_patient_summary()
    cohort_summary = build_cohort_summary(patients)

    prompt = ALERTS_PROMPT.format(cohort_summary=cohort_summary)

    try:
        response = call_claude(prompt)
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        alerts = json.loads(clean.strip())
    except Exception as e:
        alerts = [
            {
                "severity": "high",
                "title": "Could not generate alerts",
                "detail": f"Error: {e}",
                "patient_count": 0
            }
        ]

    return AlertsResponse(alerts=alerts)


@app.post("/api/generate-report", response_model=ReportResponse)
def generate_report(request: ReportRequest):
    """Generate a stakeholder report using Claude."""
    patients = load_patient_summary()
    cohort_summary = build_cohort_summary(patients)

    prompt = REPORT_PROMPT.format(
        report_type=request.report_type,
        stakeholder=request.stakeholder,
        cohort_summary=cohort_summary
    )

    try:
        response = call_claude(prompt, max_tokens=1500)
        lines = response.strip().split("\n")
        bullets = [
            l.lstrip("- ").strip()
            for l in lines
            if l.strip().startswith("-")
        ]
    except Exception as e:
        response = f"Could not generate report: {e}"
        bullets = []

    return ReportResponse(
        report_type=request.report_type,
        stakeholder=request.stakeholder,
        content=response,
        bullets=bullets
    )


@app.post("/api/scenario", response_model=ScenarioResponse)
def model_scenario(request: ScenarioRequest):
    """Model the impact of a clinical intervention using Claude."""
    patients = load_patient_summary()
    cohort_summary = build_cohort_summary(patients)
    total = len(patients)
    high_risk = sum(1 for p in patients if p.get("risk_tier") == "High")
    baseline_rate = 0.184

    reached = round(high_risk * (request.contact_rate / 100))
    prevented = round(reached * baseline_rate * (request.reduction_pct / 100))
    new_rate = round(baseline_rate - (prevented / total), 3)
    saving = prevented * request.cost_per_readmission
    break_even = round((saving / 12000) / 12, 1)

    prompt = SCENARIO_PROMPT.format(
        intervention=request.intervention,
        scale=request.scale,
        contact_rate=request.contact_rate,
        reduction_pct=request.reduction_pct,
        cost_per_readmission=request.cost_per_readmission,
        cohort_summary=cohort_summary
    )

    try:
        narrative = call_claude(prompt, max_tokens=400)
    except Exception as e:
        narrative = f"Could not generate narrative: {e}"

    return ScenarioResponse(
        intervention=request.intervention,
        scale=request.scale,
        projected_readmit_rate=new_rate,
        readmissions_prevented=prevented,
        annual_saving=saving,
        break_even_months=break_even,
        narrative=narrative
    )


@app.post("/api/group-summary", response_model=SummaryResponse)
def group_summary(request: SummaryRequest):
    """Generate a plain-English summary for a patient group."""
    patients = load_patient_summary()

    group_lower = request.group.lower()
    if "diabetes" in group_lower or "diabetic" in group_lower:
        group_patients = [p for p in patients if p.get("has_diabetes") == "True"]
    elif "ckd" in group_lower or "kidney" in group_lower:
        group_patients = [p for p in patients if p.get("has_ckd") == "True"]
    elif "copd" in group_lower or "lung" in group_lower:
        group_patients = [p for p in patients if p.get("has_copd") == "True"]
    elif "hypertension" in group_lower or "blood pressure" in group_lower:
        group_patients = [p for p in patients if p.get("has_hypertension") == "True"]
    elif "high risk" in group_lower:
        group_patients = [p for p in patients if p.get("risk_tier") == "High"]
    else:
        group_patients = patients

    count = len(group_patients)
    if count == 0:
        raise HTTPException(status_code=404, detail="No patients found for this group")

    avg_risk = round(
        sum(float(p.get("readmission_risk_score", 0)) for p in group_patients) / count, 2
    )
    gaps = {
        "hba1c": sum(1 for p in group_patients if p.get("gap_hba1c") == "True"),
        "egfr": sum(1 for p in group_patients if p.get("gap_egfr") == "True"),
        "bp": sum(1 for p in group_patients if p.get("gap_bp") == "True"),
        "spirometry": sum(1 for p in group_patients if p.get("gap_spirometry") == "True"),
    }
    top_gaps = [k for k, v in sorted(gaps.items(), key=lambda x: x[1], reverse=True) if v > 0]

    group_data = build_cohort_summary(group_patients)

    prompt = SUMMARY_PROMPT.format(
        group=request.group,
        group_data=group_data
    )

    try:
        narrative = call_claude(prompt, max_tokens=600)
    except Exception as e:
        narrative = f"Could not generate summary: {e}"

    return SummaryResponse(
        group=request.group,
        patient_count=count,
        readmit_rate=avg_risk,
        top_gaps=top_gaps,
        narrative=narrative
    )


@app.post("/api/ask", response_model=AskResponse)
def ask_question(request: AskRequest):
    """Answer a plain-English question about the cohort using Claude."""
    patients = load_patient_summary()
    cohort_summary = build_cohort_summary(patients)

    prompt = ASK_PROMPT.format(
        question=request.question,
        cohort_summary=cohort_summary
    )

    try:
        answer = call_claude(prompt, max_tokens=600)
    except Exception as e:
        answer = f"Could not answer the question: {e}"

    return AskResponse(
        question=request.question,
        answer=answer
    )