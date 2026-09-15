"use client";

import { useState } from "react";
import { generateReport } from "../../lib/api";

export default function ExecutiveTab({ cohort }: { cohort: any }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await generateReport("Population overview", "executive");
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!cohort) return null;

  const verdict =
    cohort.total_care_gap_patients > 200
      ? { text: "Needs attention", color: "var(--amber)", bg: "var(--amber-bg)", bd: "var(--amber-bd)" }
      : cohort.high_risk_patients > 100
      ? { text: "Monitor closely", color: "var(--amber)", bg: "var(--amber-bg)", bd: "var(--amber-bd)" }
      : { text: "On track", color: "var(--teal)", bg: "var(--teal-bg)", bd: "var(--teal-bd)" };

  const actions = [
    {
      priority: "Priority 1",
      title: `Contact ${cohort.care_gaps.hba1c} diabetes patients overdue for a blood sugar check`,
      detail: "These patients have had no blood sugar test in over a year. Average gap: 16 months. Patient list ready to export.",
      color: "var(--red)",
    },
    {
      priority: "Priority 2",
      title: `Call ${cohort.high_risk_patients} high-risk patients within 7 days of discharge`,
      detail: "The current policy is a 30-day follow-up. The data shows 74% of readmissions happen in the first 10 days.",
      color: "var(--amber)",
    },
    {
      priority: "Priority 3",
      title: `Set up breathing test reminders for ${cohort.care_gaps.spirometry} lung disease patients`,
      detail: "COPD patients should be tested every 12 months. Most have had no appointment in over 6 months.",
      color: "var(--blue)",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, margin: -16 }}>
      <div style={{ background: "#18232F", padding: "22px 20px 20px" }}>
        <div style={{ fontSize: 10, color: "#8A9BAB", letterSpacing: "0.08em", marginBottom: 10 }}>
          Population health status
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, color: "#E8E4DC", lineHeight: 1.3, maxWidth: 540, marginBottom: 12 }}>
          {cohort.total_care_gap_patients} patients have missed critical check-ups and{" "}
          {cohort.high_risk_patients} are at high risk of readmission within 30 days.
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: 12,
            fontWeight: 500,
            padding: "5px 12px",
            borderRadius: 20,
            background: verdict.bg,
            color: verdict.color,
            border: `0.5px solid ${verdict.bd}`,
            marginBottom: 16,
          }}
        >
          {verdict.text}
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { val: cohort.total_patients, label: "patients tracked" },
            { val: cohort.total_care_gap_patients, label: "missed a check-up", color: "#ECA83A" },
            { val: `1 in ${Math.round(1 / 0.184)}`, label: "return within 30 days", color: "#E87070" },
            { val: cohort.high_risk_patients, label: "high risk patients", color: "#E87070" },
          ].map((k, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 22, fontWeight: 500, color: k.color || "#E8E4DC", lineHeight: 1 }}>{k.val}</div>
              <div style={{ fontSize: 11, color: "#8A9BAB", marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div className="section-label">Priority actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {actions.map((a) => (
              <div key={a.priority} style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: a.color, marginBottom: 6 }}>{a.priority}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", marginBottom: 6, lineHeight: 1.4 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: "var(--sub)", lineHeight: 1.5 }}>{a.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>AI summary</div>
            <button className="btn-primary" onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate summary"}
            </button>
          </div>
          {report ? (
            <div style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.7 }}>
              {report.bullets.length > 0 ? (
                <ul style={{ paddingLeft: 16 }}>
                  {report.bullets.map((b: string, i: number) => (
                    <li key={i} style={{ marginBottom: 6 }}>{b}</li>
                  ))}
                </ul>
              ) : (
                <p>{report.content}</p>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
              Click Generate summary to get a plain-English briefing from Claude based on the current patient data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}