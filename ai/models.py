"""
Data models for the ClinIQ API.
Pydantic models for request and response validation.
"""

from pydantic import BaseModel
from typing import Optional


class PatientSearchRequest(BaseModel):
    query: str
    limit: int = 10


class PatientResult(BaseModel):
    patient_id: str
    name: str
    age: Optional[int] = None
    gender: str
    risk_tier: str
    chronic_condition_count: int
    encounter_count: int
    has_diabetes: bool
    has_ckd: bool
    has_copd: bool
    has_hypertension: bool
    gap_hba1c: bool
    gap_egfr: bool
    gap_bp: bool
    gap_spirometry: bool
    readmission_risk_score: float


class PatientSearchResponse(BaseModel):
    query: str
    count: int
    patients: list[PatientResult]


class AlertsResponse(BaseModel):
    alerts: list[dict]


class ReportRequest(BaseModel):
    report_type: str
    stakeholder: str = "clinical"


class ReportResponse(BaseModel):
    report_type: str
    stakeholder: str
    content: str
    bullets: list[str]


class ScenarioRequest(BaseModel):
    intervention: str
    scale: str
    contact_rate: int = 70
    reduction_pct: int = 35
    cost_per_readmission: int = 8500


class ScenarioResponse(BaseModel):
    intervention: str
    scale: str
    projected_readmit_rate: float
    readmissions_prevented: int
    annual_saving: int
    break_even_months: float
    narrative: str


class SummaryRequest(BaseModel):
    group: str


class SummaryResponse(BaseModel):
    group: str
    patient_count: int
    readmit_rate: float
    top_gaps: list[str]
    narrative: str


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    question: str
    answer: str