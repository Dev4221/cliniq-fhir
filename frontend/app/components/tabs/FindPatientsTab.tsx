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

  const search = async (q?: string) => {
    const finalQuery = q || query;
    if (!finalQuery.trim()) return;
    setLoading(true);
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Find patients</div>
        <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 12 }}>
          Describe who you are looking for in plain English. ClinIQ searches the records and shows the matching patients.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Who are you looking for? e.g. diabetic patients over 60 with no blood test..."
            style={{
              flex: 1,
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 6,
              border: "0.5px solid var(--border)",
              background: "var(--card)",
              color: "var(--text)",
              outline: "none",
            }}
          />
          <button className="btn-primary" onClick={() => search()} disabled={loading}>
            {loading ? "Searching..." : "Find"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>Try one of these</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); search(s); }}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 6,
                border: "0.5px solid var(--border)",
                background: "var(--card)",
                color: "var(--sub)",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {results && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "var(--blue)", background: "var(--blue-bg)", border: "0.5px solid var(--blue-bd)", borderRadius: 6, padding: "3px 10px" }}>
              "{results.query}"
            </div>
            <div style={{ fontSize: 11, color: "var(--sub)" }}>{results.count} patients found</div>
          </div>
          <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Patient ID", "Name", "Age", "Gender", "Risk", "Conditions", "Encounters"].map((h) => (
                  <th key={h} style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textAlign: "left", padding: "5px 8px", borderBottom: "0.5px solid var(--border)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.patients.map((p: any) => (
                <tr key={p.patient_id}>
                  <td style={{ padding: "6px 8px", borderBottom: "0.5px solid var(--border)", fontFamily: "monospace", fontSize: 10 }}>
                    {p.patient_id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: "6px 8px", borderBottom: "0.5px solid var(--border)" }}>{p.name}</td>
                  <td style={{ padding: "6px 8px", borderBottom: "0.5px solid var(--border)" }}>{p.age}</td>
                  <td style={{ padding: "6px 8px", borderBottom: "0.5px solid var(--border)" }}>{p.gender}</td>
                  <td style={{ padding: "6px 8px", borderBottom: "0.5px solid var(--border)" }}>
                    <span className={`pill-${p.risk_tier.toLowerCase()}`}>{p.risk_tier}</span>
                  </td>
                  <td style={{ padding: "6px 8px", borderBottom: "0.5px solid var(--border)" }}>{p.chronic_condition_count}</td>
                  <td style={{ padding: "6px 8px", borderBottom: "0.5px solid var(--border)" }}>{p.encounter_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
            <button className="btn-teal">Export list</button>
            <button className="btn-primary">Flag for outreach</button>
          </div>
        </div>
      )}
    </div>
  );
}