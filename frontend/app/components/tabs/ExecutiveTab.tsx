"use client";

import { useState } from "react";
import { generateReport } from "../../lib/api";

export default function ExecutiveTab({ cohort }: { cohort: any }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setReport(null);
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
      ? { text: "Needs attention", color: "#ECA83A", bg: "rgba(186,117,23,0.2)", bd: "rgba(236,168,58,0.4)" }
      : cohort.high_risk_patients > 100
      ? { text: "Monitor closely", color: "#ECA83A", bg: "rgba(186,117,23,0.2)", bd: "rgba(236,168,58,0.4)" }
      : { text: "On track", color: "#3DC99A", bg: "rgba(29,158,117,0.2)", bd: "rgba(61,201,154,0.4)" };

  const actions = [
    {
      priority: "Priority 1",
      title: `Contact ${cohort.care_gaps.hba1c} diabetes patients overdue for a blood sugar check`,
      detail: "These patients have had no blood sugar test in over a year. Average gap: 16 months. Patient list ready to export.",
      color: "#E87070",
      bg: "rgba(163,45,45,0.15)",
    },
    {
      priority: "Priority 2",
      title: `Call ${cohort.high_risk_patients} high-risk patients within 7 days of discharge`,
      detail: "The current policy is a 30-day follow-up. The data shows 74% of readmissions happen in the first 10 days.",
      color: "#ECA83A",
      bg: "rgba(186,117,23,0.12)",
    },
    {
      priority: "Priority 3",
      title: `Set up breathing test reminders for ${cohort.care_gaps.spirometry} lung disease patients`,
      detail: "COPD patients should be tested every 12 months. Most have had no appointment in over 6 months.",
      color: "#7AB3E8",
      bg: "rgba(24,95,165,0.12)",
    },
  ];

  const filteredBullets = report
    ? report.bullets.filter((b: string) => b.trim().length > 0)
    : [];

  return (
    <div style={{ margin: -20, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#0F1A24", padding: "28px 24px 24px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#6A8090", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          Population health status
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#E8E4DC", lineHeight: 1.35, maxWidth: 560, marginBottom: 14, letterSpacing: "-0.3px" }}>
          {cohort.total_care_gap_patients} patients have missed critical check-ups and{" "}
          {cohort.high_risk_patients} are at high risk of readmission within 30 days.
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center",
          fontSize: 12, fontWeight: 600,
          padding: "5px 14px", borderRadius: 20,
          background: verdict.bg, color: verdict.color,
          border: `0.5px solid ${verdict.bd}`,
          marginBottom: 20,
        }}>
          {verdict.text}
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { val: cohort.total_patients.toLocaleString(), label: "patients tracked", color: "#E8E4DC" },
            { val: cohort.total_care_gap_patients.toLocaleString(), label: "missed a check-up", color: "#ECA83A" },
            { val: `1 in ${Math.round(1 / 0.184)}`, label: "return within 30 days", color: "#E87070" },
            { val: cohort.high_risk_patients.toLocaleString(), label: "high risk patients", color: "#E87070" },
          ].map((k, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.06)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 26, fontWeight: 600, color: k.color, lineHeight: 1, letterSpacing: "-0.5px" }}>{k.val}</div>
              <div style={{ fontSize: 11, color: "#6A8090", marginTop: 6 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, background: "var(--bg)" }}>
        <div>
          <div className="section-label">Priority actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {actions.map((a) => (
              <div key={a.priority} style={{
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: 14, padding: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: a.color,
                  marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {a.priority}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8, lineHeight: 1.4 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>{a.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div className="card-title">AI summary</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Plain-English briefing generated by Claude</div>
            </div>
            <button className="btn-primary" onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate summary"}
            </button>
          </div>
          {loading && (
            <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", padding: "16px 0" }}>
              Claude is writing the summary...
            </div>
          )}
          {report && !loading && (
            <>
              <div className="divider" />
              {filteredBullets.length > 0 ? (
                <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                  {filteredBullets.map((b: string, i: number) => (
                    <li key={i} style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.65 }}>{b}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{report.content}</p>
              )}
            </>
          )}
          {!report && !loading && (
            <div style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>
              Click Generate summary to get a plain-English briefing from Claude based on the current patient data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}