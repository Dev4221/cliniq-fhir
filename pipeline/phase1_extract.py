"""
Phase 1: Full FHIR Extraction
Target: SMART Health IT public FHIR R4 server (no auth required)
Server: https://r4.smarthealthit.org

Pulls Patient, Encounter, Condition, Observation, MedicationRequest
and Procedure records. Uses per-patient extraction on the SMART server
which has rich Synthea-generated data per patient.

Run with: uv run python pipeline/phase1_extract.py
"""

import requests
import json
import time
from pathlib import Path

BASE_URL = "https://r4.smarthealthit.org"
HEADERS = {"Accept": "application/fhir+json"}
RAW_DIR = Path("data/raw")
RAW_DIR.mkdir(parents=True, exist_ok=True)

PATIENT_TARGET = 500
REQUEST_DELAY = 0.3


def get_bundle(url: str, params: dict = {}) -> dict:
    """Fetch a single FHIR bundle from the server."""
    response = requests.get(url, headers=HEADERS, params=params)
    response.raise_for_status()
    time.sleep(REQUEST_DELAY)
    return response.json()


def get_all_pages(url: str, params: dict = {}) -> list[dict]:
    """
    Follow FHIR bundle pagination until there is no next link.
    Returns a flat list of all resource entries across all pages.
    """
    entries = []
    page = 1
    current_url = url
    current_params = params

    while current_url:
        try:
            bundle = get_bundle(current_url, current_params)
        except requests.HTTPError as e:
            print(f"    HTTP error on page {page}: {e}")
            break

        page_entries = bundle.get("entry", [])
        entries.extend(page_entries)
        print(f"    Page {page}: {len(page_entries)} records (total: {len(entries)})")

        links = {
            link["relation"]: link["url"]
            for link in bundle.get("link", [])
        }
        current_url = links.get("next")
        current_params = {}
        page += 1

    return entries


def extract_patients(target: int = PATIENT_TARGET) -> list[str]:
    """
    Pull patients by paging through the server until we hit the target.
    Saves raw entries to data/raw/patients.json.
    Returns a list of patient IDs.
    """
    print(f"\n[1] Extracting up to {target} patients...")

    all_entries = []
    url = f"{BASE_URL}/Patient"
    params = {"_count": 50, "_sort": "-_lastUpdated"}
    page = 1

    while len(all_entries) < target:
        try:
            bundle = get_bundle(url, params)
        except requests.HTTPError as e:
            print(f"  HTTP error: {e}")
            break

        page_entries = bundle.get("entry", [])
        if not page_entries:
            print("  No more patients on server.")
            break

        all_entries.extend(page_entries)
        print(f"  Page {page}: {len(page_entries)} patients (total: {len(all_entries)})")

        links = {
            link["relation"]: link["url"]
            for link in bundle.get("link", [])
        }
        url = links.get("next")
        params = {}
        page += 1

        if not url:
            print("  Reached last page of patients on server.")
            break

    all_entries = all_entries[:target]

    out = RAW_DIR / "patients.json"
    with open(out, "w") as f:
        json.dump(all_entries, f, indent=2)

    patient_ids = [
        e["resource"]["id"]
        for e in all_entries
        if e.get("resource", {}).get("id")
    ]

    print(f"  Saved {len(patient_ids)} patients to {out}")
    return patient_ids


def extract_resource_for_patients(
    resource_type: str,
    patient_ids: list[str],
    filename: str,
    extra_params: dict = {}
) -> list[dict]:
    """
    For each patient ID pull all records of a given resource type.
    Pages through results and saves combined output to data/raw/.
    Skips patients that return errors without stopping the whole run.
    """
    print(f"\n[+] Extracting {resource_type} for {len(patient_ids)} patients...")

    all_entries = []
    failed = 0

    for i, patient_id in enumerate(patient_ids):
        if (i + 1) % 25 == 0:
            print(f"  Progress: {i + 1}/{len(patient_ids)} patients processed")

        url = f"{BASE_URL}/{resource_type}"
        params = {"patient": patient_id, "_count": 50, **extra_params}

        try:
            entries = get_all_pages(url, params)
            all_entries.extend(entries)
        except requests.HTTPError as e:
            failed += 1
            continue
        except Exception as e:
            failed += 1
            continue

    out = RAW_DIR / filename
    with open(out, "w") as f:
        json.dump(all_entries, f, indent=2)

    print(f"  Saved {len(all_entries)} {resource_type} records to {out}")
    if failed > 0:
        print(f"  Skipped {failed} patients due to errors")

    return all_entries


def print_summary():
    """Print a summary of what was saved to data/raw/."""
    print("\n" + "=" * 60)
    print("Phase 1 complete.")
    print(f"Raw FHIR data saved to {RAW_DIR.resolve()}:")
    total_kb = 0
    for f in sorted(RAW_DIR.glob("*.json")):
        size_kb = round(f.stat().st_size / 1024, 1)
        total_kb += size_kb
        count = len(json.loads(f.read_text()))
        print(f"  {f.name}: {size_kb} KB, {count} records")
    print(f"  Total: {round(total_kb, 1)} KB")
    print("\nNext: Phase 2, flatten JSON into clean CSV tables.")
    print("=" * 60)


if __name__ == "__main__":
    print("=" * 60)
    print("PHASE 1: FULL FHIR EXTRACTION")
    print(f"Server: SMART Health IT FHIR R4 (https://r4.smarthealthit.org)")
    print(f"Patient target: {PATIENT_TARGET}")
    print(f"Output: {RAW_DIR.resolve()}")
    print("=" * 60)

    # Step 1: patients
    patient_ids = extract_patients(target=PATIENT_TARGET)

    if not patient_ids:
        print("No patients returned. Exiting.")
        exit()

    # Step 2: encounters
    extract_resource_for_patients(
        resource_type="Encounter",
        patient_ids=patient_ids,
        filename="encounters.json",
        extra_params={"_sort": "-date"}
    )

    # Step 3: conditions
    extract_resource_for_patients(
        resource_type="Condition",
        patient_ids=patient_ids,
        filename="conditions.json"
    )

    # Step 4: observations
    extract_resource_for_patients(
        resource_type="Observation",
        patient_ids=patient_ids,
        filename="observations.json",
        extra_params={"_sort": "-date", "_count": 20}
    )

    # Step 5: medication requests
    extract_resource_for_patients(
        resource_type="MedicationRequest",
        patient_ids=patient_ids,
        filename="medications.json"
    )

    # Step 6: procedures
    extract_resource_for_patients(
        resource_type="Procedure",
        patient_ids=patient_ids,
        filename="procedures.json"
    )

    print_summary()