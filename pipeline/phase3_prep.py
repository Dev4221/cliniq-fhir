"""
Phase 3 prep: Add calculated columns to the clean CSV tables.
Produces enriched CSVs in data/processed/ ready for Power BI.

Adds:
- patients.csv:     age, age_group
- encounters.csv:   duration_days, year, month, hour
- conditions.csv:   onset_year, is_chronic
- observations.csv: year, month, is_abnormal (basic flag)
- A summary table:  patient_summary.csv with risk scores and care gap flags

Run with: uv run python pipeline/phase3_prep.py
"""

import csv
import json
from pathlib import Path
from datetime import datetime, date

PROCESSED_DIR = Path("data/processed")
RAW_DIR = Path("data/raw")

REFERENCE_DATE = date.today()

CHRONIC_CONDITIONS = {
    "diabetes",
    "hypertension",
    "copd",
    "heart failure",
    "chronic kidney",
    "atrial fibrillation",
    "asthma",
    "depression",
    "osteoarthritis",
    "hyperlipidemia",
    "hyperlipidaemia",
    "obesity",
    "anxiety",
    "hypothyroidism",
}

# LOINC codes for key observations used in care gap detection
HBALC_CODES = {"4548-4", "17856-6", "59261-8"}
EGFR_CODES = {"33914-3", "62238-1", "48642-3"}
BP_CODES = {"8480-6", "8462-4", "55284-4"}
SPIROMETRY_CODES = {"19868-9", "20150-9", "FEV1"}


def read_csv(filename: str) -> list[dict]:
    path = PROCESSED_DIR / filename
    if not path.exists():
        print(f"  Warning: {filename} not found.")
        return []
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(filename: str, rows: list[dict], fieldnames: list[str]) -> None:
    path = PROCESSED_DIR / filename
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"  Saved {len(rows)} rows to {path}")


def parse_date(date_str: str):
    """Parse ISO date string to date object. Returns None if invalid."""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str[:10]).date()
    except Exception:
        return None


def calc_age(dob_str: str) -> int:
    dob = parse_date(dob_str)
    if not dob:
        return -1
    delta = REFERENCE_DATE - dob
    return int(delta.days / 365.25)


def age_group(age: int) -> str:
    if age < 0:
        return "Unknown"
    if age < 18:
        return "0 to 17"
    if age < 35:
        return "18 to 34"
    if age < 55:
        return "35 to 54"
    if age < 70:
        return "55 to 69"
    if age < 85:
        return "70 to 84"
    return "85 plus"


def enrich_patients(rows: list[dict]) -> list[dict]:
    for r in rows:
        age = calc_age(r.get("dob", ""))
        r["age"] = age if age >= 0 else ""
        r["age_group"] = age_group(age)
    return rows


def enrich_encounters(rows: list[dict]) -> list[dict]:
    for r in rows:
        start = parse_date(r.get("start", ""))
        end = parse_date(r.get("end", ""))
        if start and end:
            r["duration_days"] = (end - start).days
        else:
            r["duration_days"] = ""
        if start:
            r["year"] = start.year
            r["month"] = start.month
            r["month_name"] = start.strftime("%b")
        else:
            r["year"] = ""
            r["month"] = ""
            r["month_name"] = ""
    return rows


def enrich_conditions(rows: list[dict]) -> list[dict]:
    for r in rows:
        onset = parse_date(r.get("onset", ""))
        r["onset_year"] = onset.year if onset else ""
        condition_lower = r.get("condition", "").lower()
        r["is_chronic"] = any(
            term in condition_lower for term in CHRONIC_CONDITIONS
        )
    return rows


def enrich_observations(rows: list[dict]) -> list[dict]:
    for r in rows:
        obs_date = parse_date(r.get("date", ""))
        r["year"] = obs_date.year if obs_date else ""
        r["month"] = obs_date.month if obs_date else ""
        try:
            val = float(r.get("value", ""))
            code = r.get("code", "")
            obs = r.get("observation", "").lower()
            abnormal = False
            if code in HBALC_CODES or "hba1c" in obs or "hemoglobin a1c" in obs:
                abnormal = val > 7.0
            elif "systolic" in obs:
                abnormal = val > 140
            elif "diastolic" in obs:
                abnormal = val > 90
            elif "glucose" in obs:
                abnormal = val > 7.0
            r["is_abnormal"] = abnormal
        except Exception:
            r["is_abnormal"] = ""
    return rows


def build_patient_summary(
    patients: list[dict],
    encounters: list[dict],
    conditions: list[dict],
    observations: list[dict],
) -> list[dict]:
    """
    Build a patient-level summary table with:
    - condition count
    - encounter count
    - chronic condition flag
    - readmission risk score (simple rule-based)
    - care gap flags for HbA1c, eGFR, BP, spirometry
    - days since last encounter
    """
    from collections import defaultdict

    enc_by_patient = defaultdict(list)
    for e in encounters:
        enc_by_patient[e["patient_id"]].append(e)

    cond_by_patient = defaultdict(list)
    for c in conditions:
        cond_by_patient[c["patient_id"]].append(c)

    obs_by_patient = defaultdict(list)
    for o in observations:
        obs_by_patient[o["patient_id"]].append(o)

    rows = []
    for p in patients:
        pid = p["patient_id"]
        age = int(p["age"]) if p.get("age") else -1

        enc_list = enc_by_patient[pid]
        cond_list = cond_by_patient[pid]
        obs_list = obs_by_patient[pid]

        condition_count = len(cond_list)
        encounter_count = len(enc_list)
        chronic_count = sum(
            1 for c in cond_list if str(c.get("is_chronic", "")).lower() == "true"
        )

        # Days since last encounter
        enc_dates = [
            parse_date(e.get("start", ""))
            for e in enc_list
            if parse_date(e.get("start", ""))
        ]
        last_enc = max(enc_dates) if enc_dates else None
        days_since_encounter = (
            (REFERENCE_DATE - last_enc).days if last_enc else 9999
        )

        # Care gap flags: no relevant observation in last 365 days
        recent_obs_codes = set()
        for o in obs_list:
            obs_date = parse_date(o.get("date", ""))
            if obs_date and (REFERENCE_DATE - obs_date).days <= 365:
                recent_obs_codes.add(o.get("code", ""))

        has_diabetes = any(
            "diabet" in c.get("condition", "").lower() for c in cond_list
        )
        has_ckd = any(
            "kidney" in c.get("condition", "").lower() or
            "renal" in c.get("condition", "").lower()
            for c in cond_list
        )
        has_copd = any(
            "copd" in c.get("condition", "").lower() or
            "pulmonary" in c.get("condition", "").lower()
            for c in cond_list
        )
        has_hypertension = any(
            "hypertension" in c.get("condition", "").lower() or
            "blood pressure" in c.get("condition", "").lower()
            for c in cond_list
        )

        gap_hba1c = has_diabetes and not any(
            c in recent_obs_codes for c in HBALC_CODES
        )
        gap_egfr = has_ckd and not any(
            c in recent_obs_codes for c in EGFR_CODES
        )
        gap_bp = has_hypertension and not any(
            c in recent_obs_codes for c in BP_CODES
        )
        gap_spirometry = has_copd and not any(
            c in recent_obs_codes for c in SPIROMETRY_CODES
        )

        # Readmission risk score: simple rule-based 0 to 1
        score = 0.0
        if chronic_count >= 3:
            score += 0.35
        elif chronic_count >= 2:
            score += 0.20
        elif chronic_count >= 1:
            score += 0.10
        if age >= 70:
            score += 0.20
        elif age >= 55:
            score += 0.10
        if encounter_count >= 10:
            score += 0.20
        elif encounter_count >= 5:
            score += 0.10
        if days_since_encounter <= 30:
            score += 0.15
        if gap_hba1c or gap_egfr:
            score += 0.10
        score = min(round(score, 2), 1.0)

        if score >= 0.65:
            risk_tier = "High"
        elif score >= 0.35:
            risk_tier = "Medium"
        else:
            risk_tier = "Low"

        rows.append({
            "patient_id": pid,
            "name": p.get("name", ""),
            "gender": p.get("gender", ""),
            "age": age if age >= 0 else "",
            "age_group": p.get("age_group", ""),
            "city": p.get("city", ""),
            "state": p.get("state", ""),
            "condition_count": condition_count,
            "chronic_condition_count": chronic_count,
            "encounter_count": encounter_count,
            "days_since_last_encounter": days_since_encounter if days_since_encounter < 9999 else "",
            "last_encounter_date": last_enc.isoformat() if last_enc else "",
            "has_diabetes": has_diabetes,
            "has_ckd": has_ckd,
            "has_copd": has_copd,
            "has_hypertension": has_hypertension,
            "gap_hba1c": gap_hba1c,
            "gap_egfr": gap_egfr,
            "gap_bp": gap_bp,
            "gap_spirometry": gap_spirometry,
            "readmission_risk_score": score,
            "risk_tier": risk_tier,
        })

    return rows


if __name__ == "__main__":
    print("=" * 60)
    print("PHASE 3 PREP: ENRICH CSV TABLES FOR POWER BI")
    print(f"Input and output: {PROCESSED_DIR.resolve()}")
    print("=" * 60)

    print("\n[1] Enriching patients...")
    patients = enrich_patients(read_csv("patients.csv"))
    write_csv("patients.csv", patients, [
        "patient_id", "name", "gender", "dob", "age", "age_group",
        "city", "state", "country", "marital_status", "language"
    ])

    print("\n[2] Enriching encounters...")
    encounters = enrich_encounters(read_csv("encounters.csv"))
    write_csv("encounters.csv", encounters, [
        "encounter_id", "patient_id", "status", "class", "type",
        "reason", "start", "end", "duration_days", "year", "month", "month_name"
    ])

    print("\n[3] Enriching conditions...")
    conditions = enrich_conditions(read_csv("conditions.csv"))
    write_csv("conditions.csv", conditions, [
        "condition_id", "patient_id", "code", "condition", "category",
        "clinical_status", "onset", "recorded_date", "onset_year", "is_chronic"
    ])

    print("\n[4] Enriching observations...")
    observations = enrich_observations(read_csv("observations.csv"))
    write_csv("observations.csv", observations, [
        "observation_id", "patient_id", "code", "observation", "category",
        "value", "unit", "status", "date", "year", "month", "is_abnormal"
    ])

    print("\n[5] Building patient summary table...")
    summary = build_patient_summary(patients, encounters, conditions, observations)
    write_csv("patient_summary.csv", summary, [
        "patient_id", "name", "gender", "age", "age_group", "city", "state",
        "condition_count", "chronic_condition_count", "encounter_count",
        "days_since_last_encounter", "last_encounter_date",
        "has_diabetes", "has_ckd", "has_copd", "has_hypertension",
        "gap_hba1c", "gap_egfr", "gap_bp", "gap_spirometry",
        "readmission_risk_score", "risk_tier"
    ])

    print("\n" + "=" * 60)
    print("Phase 3 prep complete.")
    print("Enriched tables saved to data/processed/:")
    for f in sorted(PROCESSED_DIR.glob("*.csv")):
        with open(f, encoding="utf-8") as csv_file:
            row_count = sum(1 for _ in csv_file) - 1
        print(f"  {f.name}: {row_count} rows")
    print("\nNext: open Power BI and import from data/processed/")
    print("=" * 60)