"""
Phase 1: Full FHIR Extraction
Pulls Patient, Encounter, Condition, Observation, MedicationRequest,
and Procedure records from the HAPI FHIR public test server.

Strategy:
- Patients: page through until we hit the target
- All other resources: pull globally for volume rather than
  filtering by patient ID, because the HAPI public server has
  sparse per-patient data but abundant global records

Run with: uv run python pipeline/phase1_extract.py
"""

import requests
import json
import time
from pathlib import Path

BASE_URL = "https://hapi.fhir.org/baseR4"
HEADERS = {"Accept": "application/fhir+json"}
RAW_DIR = Path("data/raw")
RAW_DIR.mkdir(parents=True, exist_ok=True)

PATIENT_TARGET = 500
REQUEST_DELAY = 0.2


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


def extract_resource_global(
    resource_type: str,
    filename: str,
    target: int = 500,
    extra_params: dict = {}
) -> list[dict]:
    """
    Pull records globally without filtering by patient ID.
    Gives far more volume than per-patient extraction on
    the HAPI public server.
    """
    print(f"\n  Extracting {resource_type} globally (target: {target})...")

    all_entries = []
    url = f"{BASE_URL}/{resource_type}"
    params = {"_count": 50, **extra_params}
    page = 1

    while len(all_entries) < target:
        try:
            bundle = get_bundle(url, params)
        except requests.HTTPError as e:
            print(f"  HTTP error: {e}")
            break

        page_entries = bundle.get("entry", [])
        if not page_entries:
            print("  No more records.")
            break

        all_entries.extend(page_entries)
        print(f"  Page {page}: {len(page_entries)} records (total: {len(all_entries)})")

        links = {
            link["relation"]: link["url"]
            for link in bundle.get("link", [])
        }
        url = links.get("next")
        params = {}
        page += 1

        if not url:
            print("  Reached last page.")
            break

    all_entries = all_entries[:target]

    out = RAW_DIR / filename
    with open(out, "w") as f:
        json.dump(all_entries, f, indent=2)

    print(f"  Saved {len(all_entries)} {resource_type} records to {out}")
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
    print(f"Server: HAPI FHIR public test server (R4)")
    print(f"Patient target: {PATIENT_TARGET}")
    print(f"Output: {RAW_DIR.resolve()}")
    print("=" * 60)

    # Step 1: patients
    patient_ids = extract_patients(target=PATIENT_TARGET)

    if not patient_ids:
        print("No patients returned. Exiting.")
        exit()

    # Step 2: pull all other resources globally for volume
    extract_resource_global(
        resource_type="Condition",
        filename="conditions.json",
        target=1000
    )

    extract_resource_global(
        resource_type="Encounter",
        filename="encounters.json",
        target=1000,
        extra_params={"_sort": "-date"}
    )

    extract_resource_global(
        resource_type="Observation",
        filename="observations.json",
        target=2000,
        extra_params={"_sort": "-date"}
    )

    extract_resource_global(
        resource_type="MedicationRequest",
        filename="medications.json",
        target=500
    )

    extract_resource_global(
        resource_type="Procedure",
        filename="procedures.json",
        target=500
    )

    print_summary()