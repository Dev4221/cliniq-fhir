"""
Phase 2: Flatten FHIR JSON into clean CSV tables
Reads raw JSON from data/raw/ and produces flat CSV files in data/processed/.

Output tables:
- patients.csv
- encounters.csv
- conditions.csv
- observations.csv
- medications.csv
- procedures.csv

Run with: uv run python pipeline/phase2_flatten.py
"""

import json
import csv
from pathlib import Path

RAW_DIR = Path("data/raw")
OUT_DIR = Path("data/processed")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def safe_get(d: dict, *keys, default=""):
    """Safely navigate nested dicts without throwing KeyError."""
    for key in keys:
        if not isinstance(d, dict):
            return default
        d = d.get(key, default)
        if d == default:
            return default
    return d if d is not None else default


def load_raw(filename: str) -> list[dict]:
    """Load a raw JSON file and return the list of entries."""
    path = RAW_DIR / filename
    if not path.exists():
        print(f"  Warning: {filename} not found, skipping.")
        return []
    with open(path) as f:
        return json.load(f)


def write_csv(filename: str, rows: list[dict], fieldnames: list[str]) -> None:
    """Write a list of dicts to a CSV file."""
    path = OUT_DIR / filename
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"  Saved {len(rows)} rows to {path}")


# Patients

def flatten_patients(entries: list[dict]) -> list[dict]:
    rows = []
    for entry in entries:
        r = entry.get("resource", {})
        if r.get("resourceType") != "Patient":
            continue

        name_list = r.get("name", [])
        name = name_list[0] if name_list else {}
        family = name.get("family", "")
        given = " ".join(name.get("given", []))

        address_list = r.get("address", [])
        address = address_list[0] if address_list else {}

        rows.append({
            "patient_id": r.get("id", ""),
            "name": f"{given} {family}".strip(),
            "gender": r.get("gender", ""),
            "dob": r.get("birthDate", ""),
            "city": address.get("city", ""),
            "state": address.get("state", ""),
            "country": address.get("country", ""),
            "marital_status": safe_get(r, "maritalStatus", "text"),
            "language": safe_get(r, "communication", default=[{}])[0].get(
                "language", {}
            ).get("text", "") if r.get("communication") else "",
        })
    return rows


# Encounters

def flatten_encounters(entries: list[dict]) -> list[dict]:
    rows = []
    for entry in entries:
        r = entry.get("resource", {})
        if r.get("resourceType") != "Encounter":
            continue

        patient_ref = safe_get(r, "subject", "reference", default="")
        patient_id = patient_ref.replace("Patient/", "") if patient_ref else ""

        period = r.get("period", {})
        type_list = r.get("type", [])
        enc_type = type_list[0].get("text", "") if type_list else ""

        class_block = r.get("class", {})
        enc_class = class_block.get("display", class_block.get("code", ""))

        reason_list = r.get("reasonCode", [])
        reason = reason_list[0].get("text", "") if reason_list else ""

        rows.append({
            "encounter_id": r.get("id", ""),
            "patient_id": patient_id,
            "status": r.get("status", ""),
            "class": enc_class,
            "type": enc_type,
            "reason": reason,
            "start": period.get("start", ""),
            "end": period.get("end", ""),
        })
    return rows


# Conditions

def flatten_conditions(entries: list[dict]) -> list[dict]:
    rows = []
    for entry in entries:
        r = entry.get("resource", {})
        if r.get("resourceType") != "Condition":
            continue

        patient_ref = safe_get(r, "subject", "reference", default="")
        patient_id = patient_ref.replace("Patient/", "") if patient_ref else ""

        code_block = r.get("code", {})
        codings = code_block.get("coding", [])
        code = codings[0].get("code", "") if codings else ""
        display = codings[0].get("display", "") if codings else code_block.get("text", "")

        clinical_status = safe_get(r, "clinicalStatus", "coding", default=[{}])
        status = clinical_status[0].get("code", "") if clinical_status else ""

        category_list = r.get("category", [])
        category = ""
        if category_list:
            cat_codings = category_list[0].get("coding", [])
            category = cat_codings[0].get("display", "") if cat_codings else ""

        rows.append({
            "condition_id": r.get("id", ""),
            "patient_id": patient_id,
            "code": code,
            "condition": display,
            "category": category,
            "clinical_status": status,
            "onset": r.get("onsetDateTime", r.get("recordedDate", "")),
            "recorded_date": r.get("recordedDate", ""),
        })
    return rows


# Observations

def flatten_observations(entries: list[dict]) -> list[dict]:
    rows = []
    for entry in entries:
        r = entry.get("resource", {})
        if r.get("resourceType") != "Observation":
            continue

        patient_ref = safe_get(r, "subject", "reference", default="")
        patient_id = patient_ref.replace("Patient/", "") if patient_ref else ""

        code_block = r.get("code", {})
        codings = code_block.get("coding", [])
        code = codings[0].get("code", "") if codings else ""
        display = codings[0].get("display", "") if codings else code_block.get("text", "")

        value = ""
        unit = ""
        value_block = r.get("valueQuantity")
        if value_block:
            value = value_block.get("value", "")
            unit = value_block.get("unit", "")
        elif r.get("valueCodeableConcept"):
            value = safe_get(r, "valueCodeableConcept", "text")
        elif r.get("valueString"):
            value = r.get("valueString", "")

        category_list = r.get("category", [])
        category = ""
        if category_list:
            cat_codings = category_list[0].get("coding", [])
            category = cat_codings[0].get("code", "") if cat_codings else ""

        rows.append({
            "observation_id": r.get("id", ""),
            "patient_id": patient_id,
            "code": code,
            "observation": display,
            "category": category,
            "value": value,
            "unit": unit,
            "status": r.get("status", ""),
            "date": r.get("effectiveDateTime", ""),
        })
    return rows


# Medications

def flatten_medications(entries: list[dict]) -> list[dict]:
    rows = []
    for entry in entries:
        r = entry.get("resource", {})
        if r.get("resourceType") != "MedicationRequest":
            continue

        patient_ref = safe_get(r, "subject", "reference", default="")
        patient_id = patient_ref.replace("Patient/", "") if patient_ref else ""

        med_block = r.get("medicationCodeableConcept", {})
        codings = med_block.get("coding", [])
        code = codings[0].get("code", "") if codings else ""
        medication = codings[0].get("display", "") if codings else med_block.get("text", "")

        dosage_list = r.get("dosageInstruction", [])
        dosage = dosage_list[0].get("text", "") if dosage_list else ""

        rows.append({
            "medication_id": r.get("id", ""),
            "patient_id": patient_id,
            "code": code,
            "medication": medication,
            "status": r.get("status", ""),
            "intent": r.get("intent", ""),
            "dosage": dosage,
            "authored_on": r.get("authoredOn", ""),
        })
    return rows


# Procedures

def flatten_procedures(entries: list[dict]) -> list[dict]:
    rows = []
    for entry in entries:
        r = entry.get("resource", {})
        if r.get("resourceType") != "Procedure":
            continue

        patient_ref = safe_get(r, "subject", "reference", default="")
        patient_id = patient_ref.replace("Patient/", "") if patient_ref else ""

        code_block = r.get("code", {})
        codings = code_block.get("coding", [])
        code = codings[0].get("code", "") if codings else ""
        procedure = codings[0].get("display", "") if codings else code_block.get("text", "")

        performed = r.get("performedPeriod", {})
        performed_date = performed.get("start", r.get("performedDateTime", ""))

        rows.append({
            "procedure_id": r.get("id", ""),
            "patient_id": patient_id,
            "code": code,
            "procedure": procedure,
            "status": r.get("status", ""),
            "performed_date": performed_date,
        })
    return rows


if __name__ == "__main__":
    print("=" * 60)
    print("PHASE 2: FLATTEN FHIR JSON TO CSV")
    print(f"Input:  {RAW_DIR.resolve()}")
    print(f"Output: {OUT_DIR.resolve()}")
    print("=" * 60)

    print("\n[1] Flattening patients...")
    patients = flatten_patients(load_raw("patients.json"))
    write_csv("patients.csv", patients, [
        "patient_id", "name", "gender", "dob",
        "city", "state", "country", "marital_status", "language"
    ])

    print("\n[2] Flattening encounters...")
    encounters = flatten_encounters(load_raw("encounters.json"))
    write_csv("encounters.csv", encounters, [
        "encounter_id", "patient_id", "status", "class",
        "type", "reason", "start", "end"
    ])

    print("\n[3] Flattening conditions...")
    conditions = flatten_conditions(load_raw("conditions.json"))
    write_csv("conditions.csv", conditions, [
        "condition_id", "patient_id", "code", "condition",
        "category", "clinical_status", "onset", "recorded_date"
    ])

    print("\n[4] Flattening observations...")
    observations = flatten_observations(load_raw("observations.json"))
    write_csv("observations.csv", observations, [
        "observation_id", "patient_id", "code", "observation",
        "category", "value", "unit", "status", "date"
    ])

    print("\n[5] Flattening medications...")
    medications = flatten_medications(load_raw("medications.json"))
    write_csv("medications.csv", medications, [
        "medication_id", "patient_id", "code", "medication",
        "status", "intent", "dosage", "authored_on"
    ])

    print("\n[6] Flattening procedures...")
    procedures = flatten_procedures(load_raw("procedures.json"))
    write_csv("procedures.csv", procedures, [
        "procedure_id", "patient_id", "code", "procedure",
        "status", "performed_date"
    ])

    print("\n" + "=" * 60)
    print("Phase 2 complete.")
    print("Clean CSV tables saved to data/processed/:")
    for f in sorted(OUT_DIR.glob("*.csv")):
        with open(f, encoding="utf-8") as csv_file:
            row_count = sum(1 for _ in csv_file) - 1
        print(f"  {f.name}: {row_count} rows")
    print("\nNext: Phase 3, Power BI dashboard.")
    print("=" * 60)