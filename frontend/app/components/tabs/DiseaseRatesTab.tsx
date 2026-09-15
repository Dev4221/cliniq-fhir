"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function DiseaseRatesTab({ cohort }: { cohort: any }) {
  if (!cohort) return null;

  const conditionData = Object.entries(cohort.conditions).map(([name, value]: [string, any]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    patients: value,
    pct: Math.round((value / cohort.total_patients) * 100),
  }));

  const careGapData = [
    { name: "HbA1c (diabetes)", value: cohort.care_gaps.hba1c, color: "#C93A3A" },
    { name: "eGFR (kidney)", value: cohort.care_gaps.egfr, color: "#BA7517" },
    { name: "BP (hypertension)", value: cohort.care_gaps.bp, color: "#378ADD" },
    { name: "Spirometry (COPD)", value: cohort.care_gaps.spirometry, color: "#7F77DD" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { label: "Conditions tracked", value: Object.keys(cohort.conditions).length, color: "var(--blue)" },
          { label: "Diabetic patients", value: cohort.conditions.diabetes, color: "var(--red)" },
          { label: "Hypertensive patients", value: cohort.conditions.hypertension, color: "var(--amber)" },
          { label: "Total care gaps", value: cohort.total_care_gap_patients, color: "var(--red)" },
        ].map((k) => (
          <div key={k.label} className="kpi-card">
            <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 12 }}>Condition prevalence</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={conditionData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v: any) => [`${v} patients`]} />
              <Bar dataKey="patients" fill="#1D9E75" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 12 }}>Care gap coverage</div>
          <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 12 }}>
            Patients missing recommended monitoring (target: 0)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {careGapData.map((g) => (
              <div key={g.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--sub)" }}>{g.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: g.color }}>{g.value}</span>
                </div>
                <div style={{ height: 6, background: "var(--card)", borderRadius: 3, overflow: "hidden", border: "0.5px solid var(--border)" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round((g.value / cohort.total_patients) * 100)}%`,
                      background: g.color,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}