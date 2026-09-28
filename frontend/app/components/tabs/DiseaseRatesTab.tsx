"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const CONDITION_LABELS: Record<string, string> = {
  diabetes: "Diabetes",
  ckd: "CKD",
  copd: "COPD",
  hypertension: "Hypertension",
};

export default function DiseaseRatesTab({ cohort }: { cohort: any }) {
  if (!cohort) return null;

  const conditionData = Object.entries(cohort.conditions as Record<string, number>).map(([key, value]) => ({
    name: CONDITION_LABELS[key] || key,
    patients: value,
    pct: Math.round((value / cohort.total_patients) * 100),
  }));

  const careGapData = [
    { name: "HbA1c (diabetes)", value: cohort.care_gaps.hba1c, color: "#C93A3A", total: cohort.conditions.diabetes },
    { name: "eGFR (CKD)", value: cohort.care_gaps.egfr, color: "#BA7517", total: cohort.conditions.ckd },
    { name: "BP (hypertension)", value: cohort.care_gaps.bp, color: "#378ADD", total: cohort.conditions.hypertension },
    { name: "Spirometry (COPD)", value: cohort.care_gaps.spirometry, color: "#7F77DD", total: cohort.conditions.copd },
  ];

  const kpis = [
    { label: "Conditions tracked", value: Object.keys(cohort.conditions).length, color: "var(--blue)", sub: "chronic conditions" },
    { label: "Diabetic patients", value: cohort.conditions.diabetes, color: "var(--red)", sub: `${Math.round(cohort.conditions.diabetes / cohort.total_patients * 100)}% of cohort` },
    { label: "Hypertensive patients", value: cohort.conditions.hypertension, color: "var(--amber)", sub: `${Math.round(cohort.conditions.hypertension / cohort.total_patients * 100)}% of cohort` },
    { label: "Total care gaps", value: cohort.total_care_gap_patients, color: "var(--red)", sub: "patients missing tests" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div>
              <div className="kpi-value" style={{ color: k.color }}>{k.value.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-title">Condition prevalence</div>
          <div className="card-sub">Patients per condition across the cohort</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={conditionData} layout="vertical" barSize={28}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--sub)" }} width={100} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: any) => [`${v} patients`]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "0.5px solid var(--border)" }}
              />
              <Bar dataKey="patients" radius={[0, 6, 6, 0]}>
                {conditionData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={["#378ADD", "#D85A30", "#7F77DD", "#1D9E75"][i % 4]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Care gap coverage</div>
          <div className="card-sub">Share of each condition group missing recommended monitoring</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 8 }}>
            {careGapData.map((g) => {
              const pct = g.total > 0 ? Math.round((g.value / g.total) * 100) : 0;
              return (
                <div key={g.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--sub)", fontWeight: 500 }}>{g.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{g.value} of {g.total} patients</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: g.color }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="bar-track" style={{ height: 10 }}>
                    <div className="bar-fill" style={{ width: `${pct}%`, background: g.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20, padding: "12px 14px", background: "var(--red-bg)", border: "0.5px solid var(--red-bd)", borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--red)", marginBottom: 4 }}>100% gap across all groups</div>
            <div style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>
              Every patient in every condition group is missing at least one required monitoring test. This is a systemic gap, not an isolated issue.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {careGapData.map((g) => (
          <div key={g.name} style={{ background: "var(--surface)", border: `0.5px solid var(--border)`, borderRadius: 14, padding: "16px 18px", borderTop: `3px solid ${g.color}` }}>
            <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 6, fontWeight: 500 }}>{g.name}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: g.color, letterSpacing: "-0.5px" }}>{g.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>patients without this test</div>
          </div>
        ))}
      </div>
    </div>
  );
}