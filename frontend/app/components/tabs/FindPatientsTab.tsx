"use client";

import { useState } from "react";
import { findPatients } from "../../lib/api";

const SUGGESTIONS = [
  "Diabetic patients over 60 with no blood test in the last year",
  "High risk patients managing 3 or more conditions",
  "Patients with COPD and no breathing test this year",
  "Kidney disease patients with very low kidney function",
  "Discharged patients with no GP visit booked",
];

export default function FindPatientsTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const search = async (q?: string) => {
    const finalQuery = q || query;
    if (!finalQuery.trim()) return;
    setLoading(true);
    setResults(null);
    setFlagged(false);
    try {
      const data = await findPatients(finalQuery, 10);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <div className="card-title">Find patients</div>
        <div className="card-sub">Describe who you are looking for in plain English. ClinIQ searches the records and shows the matching patients.</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && search()}
            placeholder="e.g. diabetic patients over 60 with no blood test in the last year"
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={() => search()} disabled={loading}>
            {loading ? "Searching..." : "Find"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 500 }}>Try one of these</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); search(s); }}
              className="chip"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Searching patient records...</div>
        </div>
      )}

      {results && !loading && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div className="card-title">{results.count} patients found</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                Query: "{results.query}"
              </div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button className="btn-teal">Export list</button>
              <button
                className={flagged ? "btn-ghost" : "btn-primary"}
                onClick={() => setFlagged(true)}
              >
                {flagged ? "Flagged for outreach" : "Flag for outreach"}
              </button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Risk</th>
                <th>Conditions</th>
                <th>Encounters</th>
                <th>Gaps</th>
              </tr>
            </thead>
            <tbody>
              {results.patients.map((p: any) => (
                <tr key={p.patient_id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.age}</td>
                  <td style={{ textTransform: "capitalize" }}>{p.gender}</td>
                  <td>
                    <span className={`pill-${p.risk_tier.toLowerCase()}`}>{p.risk_tier}</span>
                  </td>
                  <td>{p.chronic_condition_count}</td>
                  <td>{p.encounter_count}</td>
                  <td style={{ fontSize: 11, color: "var(--muted)" }}>
                    {[
                      p.gap_hba1c && "HbA1c",
                      p.gap_egfr && "eGFR",
                      p.gap_bp && "BP",
                      p.gap_spirometry && "Spirometry",
                    ].filter(Boolean).join(", ") || "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}