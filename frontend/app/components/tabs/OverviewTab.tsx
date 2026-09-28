"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#1D9E75", "#378ADD", "#7F77DD", "#BA7517", "#D85A30", "#639922", "#D4537E"];

const CONDITION_COLORS: Record<string, string> = {
  diabetes: "#378ADD",
  ckd: "#D85A30",
  copd: "#7F77DD",
  hypertension: "#1D9E75",
};

const CONDITION_LABELS: Record<string, string> = {
  diabetes: "Diabetes",
  ckd: "CKD",
  copd: "COPD",
  hypertension: "Hypertension",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #E3DFD8", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ fontWeight: 600, color: "#181816", marginBottom: 2 }}>{label}</div>
        <div style={{ color: "#4E4C48" }}>{payload[0].value} patients</div>
      </div>
    );
  }
  return null;
};

export default function OverviewTab({ cohort }: { cohort: any }) {
  if (!cohort) return null;

  const ageData = Object.entries(cohort.age_groups as Record<string, number>)
    .filter(([k]) => k !== "Unknown")
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, value]) => ({ name, value }));

  const riskData = [
    { name: "High", value: cohort.risk_tiers.High },
    { name: "Medium", value: cohort.risk_tiers.Medium },
    { name: "Low", value: cohort.risk_tiers.Low },
  ];

  const genderData = Object.entries(cohort.gender as Record<string, number>)
    .filter(([k]) => k === "male" || k === "female")
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  const conditionEntries = Object.entries(cohort.conditions as Record<string, number>);

  const kpis = [
    { label: "Total patients", value: cohort.total_patients, color: "#1456A0", sub: "in this cohort", cls: "kpi-card-blue" },
    { label: "High risk", value: cohort.high_risk_patients, color: "#9B2525", sub: `${Math.round(cohort.high_risk_patients / cohort.total_patients * 100)}% of cohort`, cls: "kpi-card-red" },
    { label: "Care gaps", value: cohort.total_care_gap_patients, color: "#7A4A08", sub: "missed monitoring", cls: "kpi-card-amber" },
    { label: "Multi-condition", value: cohort.multi_condition_patients, color: "#0A6B52", sub: "2 or more conditions", cls: "kpi-card-teal" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {kpis.map((k) => (
          <div key={k.label} className={`kpi-card ${k.cls}`}>
            <div className="kpi-label">{k.label}</div>
            <div>
              <div className="kpi-value" style={{ color: k.color }}>{k.value.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5, fontWeight: 500 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-title">Age distribution</div>
          <div className="card-sub">Patients by age group</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={ageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45}>
                {ageData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: "var(--sub)" }} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Risk tier breakdown</div>
          <div className="card-sub">Patients by readmission risk</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={riskData} layout="vertical" barSize={28}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--sub)", fontWeight: 500 }} width={58} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {riskData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === "High" ? "#C93A3A" : entry.name === "Medium" ? "#BA7517" : "#1D9E75"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Gender breakdown</div>
          <div className="card-sub">Patients by gender</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={genderData} layout="vertical" barSize={28}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--sub)", fontWeight: 500 }} width={58} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#378ADD" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-title">Condition prevalence</div>
          <div className="card-sub">Share of cohort with each chronic condition</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {conditionEntries.map(([key, value]) => {
              const pct = Math.round((value / cohort.total_patients) * 100);
              const color = CONDITION_COLORS[key] || "#378ADD";
              const label = CONDITION_LABELS[key] || key;
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{label}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
                      <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>{value.toLocaleString()} patients</span>
                    </div>
                  </div>
                  <div style={{ height: 10, background: "var(--card)", borderRadius: 5, overflow: "hidden", border: "1px solid var(--border)" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 5, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Care gap summary</div>
          <div className="card-sub">Patients missing recommended monitoring by condition</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "HbA1c (diabetes)", value: cohort.care_gaps.hba1c, total: cohort.conditions.diabetes, color: "#C93A3A" },
              { label: "eGFR (kidney disease)", value: cohort.care_gaps.egfr, total: cohort.conditions.ckd, color: "#BA7517" },
              { label: "BP (hypertension)", value: cohort.care_gaps.bp, total: cohort.conditions.hypertension, color: "#378ADD" },
              { label: "Spirometry (COPD)", value: cohort.care_gaps.spirometry, total: cohort.conditions.copd, color: "#7F77DD" },
            ].map((g) => {
              const pct = g.total > 0 ? Math.round((g.value / g.total) * 100) : 0;
              return (
                <div key={g.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{g.label}</span>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: g.color }}>{pct}%</span>
                      <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>{g.value} patients</span>
                    </div>
                  </div>
                  <div style={{ height: 10, background: "var(--card)", borderRadius: 5, overflow: "hidden", border: "1px solid var(--border)" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: g.color, borderRadius: 5, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}