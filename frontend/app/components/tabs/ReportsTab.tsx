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
    const body = report.content;
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Send reports</div>
        <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 14 }}>
          Choose who you are sending to. Claude builds a report tailored to that audience.
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>Who is this for?</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
          {STAKEHOLDERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStakeholder(s.id)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: `0.5px solid ${stakeholder === s.id ? "var(--blue-bd)" : "var(--border)"}`,
                background: stakeholder === s.id ? "var(--blue-bg)" : "var(--card)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 500, color: stakeholder === s.id ? "var(--blue)" : "var(--text)", marginBottom: 3 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>Report type</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
          {REPORT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              style={{
                fontSize: 11,
                padding: "5px 11px",
                borderRadius: 6,
                border: `0.5px solid ${reportType === t ? "var(--blue-bd)" : "var(--border)"}`,
                background: reportType === t ? "var(--blue-bg)" : "var(--card)",
                color: reportType === t ? "var(--blue)" : "var(--sub)",
                cursor: "pointer",
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

      {report && (
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>
            {reportType} · {STAKEHOLDERS.find((s) => s.id === stakeholder)?.label}
          </div>
          <div style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.7, marginBottom: 12 }}>
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
          <div style={{ display: "flex", gap: 7 }}>
            <button className="btn-teal" onClick={openGmail}>Open in Gmail</button>
            <button className="btn-primary" onClick={() => navigator.clipboard.writeText(report.content)}>
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}