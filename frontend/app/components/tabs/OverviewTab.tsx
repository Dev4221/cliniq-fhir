"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#1D9E75", "#378ADD", "#7F77DD", "#BA7517", "#D85A30", "#639922", "#D4537E"];

export default function OverviewTab({ cohort }: { cohort: any }) {
  if (!cohort) return null;

  const ageData = Object.entries(cohort.age_groups)
    .filter(([k]) => k !== "Unknown")
    .map(([name, value]) => ({ name, value }));

  const riskData = Object.entries(cohort.risk_tiers).map(([name, value]) => ({
    name,
    value,
  }));

  const genderData = Object.entries(cohort.gender)
    .filter(([k]) => k !== "unknown")
    .map(([name, value]) => ({ name, value }));

  const kpis = [
    { label: "Total patients", value: cohort.total_patients, color: "var(--blue)" },
    { label: "High risk", value: cohort.high_risk_patients, color: "var(--red)" },
    { label: "Care gaps", value: cohort.total_care_gap_patients, color: "var(--amber)" },
    { label: "Multi-condition", value: cohort.multi_condition_patients, color: "var(--teal)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card">
            <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 12 }}>Patients by age group</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                {ageData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 12 }}>Patients by risk tier</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={riskData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
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
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 12 }}>Patients by gender</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={genderData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
              <Tooltip />
              <Bar dataKey="value" fill="#378ADD" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 12 }}>Condition prevalence</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(cohort.conditions).map(([key, value]: [string, any]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: "var(--sub)", width: 120, flexShrink: 0 }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </div>
              <div style={{ flex: 1, height: 7, background: "var(--card)", borderRadius: 4, overflow: "hidden", border: "0.5px solid var(--border)" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.round((value / cohort.total_patients) * 100)}%`,
                    background: "#1D9E75",
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", width: 40, textAlign: "right" }}>
                {Math.round((value / cohort.total_patients) * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}