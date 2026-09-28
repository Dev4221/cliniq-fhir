"use client";

import { useState } from "react";
import { generateReport } from "../../lib/api";

const STAKEHOLDERS = [
  { id: "executive", label: "Executive team", desc: "Verdict, 3 actions, plain English" },
  { id: "clinical", label: "Clinical team", desc: "Patient lists, care gaps, risk scores" },
  { id: "governance", label: "Governance board", desc: "Compliance rates, targets, liability" },
  { id: "finance", label: "Finance team", desc: "Cost of readmissions, projected savings" },
];

const REPORT_TYPES = [
  "Population overview",
  "Missed care summary",
  "Readmission risk briefing",
  "Group summary",
];

export default function ReportsTab() {
  const [stakeholder, setStakeholder] = useState("executive");
  const [reportType, setReportType] = useState("Population overview");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setReport(null);
    try {
      const data = await generateReport(reportType, stakeholder);
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openGmail = () => {
    if (!report) return;
    const subject = `ClinIQ ${reportType} · ${new Date().toLocaleDateString("en-AU")}`;
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(report.content)}`);
  };

  const filteredBullets = report
    ? report.bullets.filter((b: string) => b.trim().length > 0)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <div className="card-title">Send reports</div>
        <div className="card-sub">Choose who you are sending to. Claude builds a report tailored to that audience.</div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Who is this for?</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 18 }}>
          {STAKEHOLDERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStakeholder(s.id)}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: `0.5px solid ${stakeholder === s.id ? "var(--blue-bd)" : "var(--border)"}`,
                background: stakeholder === s.id ? "var(--blue-bg)" : "var(--card)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.12s",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: stakeholder === s.id ? "var(--blue)" : "var(--text)", marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Report type</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
          {REPORT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              style={{
                fontSize: 12,
                fontWeight: reportType === t ? 500 : 400,
                padding: "7px 14px",
                borderRadius: 8,
                border: `0.5px solid ${reportType === t ? "var(--blue-bd)" : "var(--border)"}`,
                background: reportType === t ? "var(--blue-bg)" : "var(--card)",
                color: reportType === t ? "var(--blue)" : "var(--sub)",
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn-primary" onClick={generate} disabled={loading}>
            {loading ? "Generating..." : "Generate report"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Claude is writing the report...</div>
        </div>
      )}

      {report && !loading && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div className="card-title">{reportType}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {STAKEHOLDERS.find((s) => s.id === stakeholder)?.label}
              </div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button className="btn-teal" onClick={openGmail}>Open in Gmail</button>
              <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(report.content)}>Copy</button>
            </div>
          </div>
          <div className="divider" />
          {filteredBullets.length > 0 ? (
            <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredBullets.map((b: string, i: number) => (
                <li key={i} style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6 }}>{b}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{report.content}</p>
          )}
        </div>
      )}
    </div>
  );
}