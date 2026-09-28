"use client";

import { useState } from "react";
import { getAlerts } from "../../lib/api";

const SEED_ALERTS = [
  {
    severity: "high",
    title: "Diabetic patients with no blood sugar test in 12 months",
    detail: "168 patients have had no HbA1c test in over a year. Average gap: 16 months.",
    patient_count: 168,
    isNew: false,
  },
  {
    severity: "high",
    title: "Hypertensive patients with no blood pressure reading",
    detail: "131 patients have no BP reading on record. Follow-up overdue 90 or more days.",
    patient_count: 131,
    isNew: false,
  },
  {
    severity: "medium",
    title: "COPD patients with no breathing test this year",
    detail: "11 patients have had no spirometry test. Last encounter over 180 days ago for most.",
    patient_count: 11,
    isNew: false,
  },
];

export default function AlertsTab() {
  const [alerts, setAlerts] = useState(SEED_ALERTS);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getAlerts();
      const newAlerts = data.alerts.map((a: any) => ({ ...a, isNew: true }));
      setAlerts((prev) => [...newAlerts, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const severityStyle = (s: string) => {
    if (s === "high") return { bg: "#FDEAEA", color: "#9B2525", bd: "#F0A0A0", dot: "#C93A3A" };
    if (s === "medium") return { bg: "#FEF0D4", color: "#7A4A08", bd: "#F5C56A", dot: "#BA7517" };
    return { bg: "#E2EEFA", color: "#1456A0", bd: "#90BAF0", dot: "#378ADD" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div className="card-title">Clinical alerts</div>
            <div className="card-sub">Claude scans the patient records and surfaces care gaps, risk spikes, and overdue monitoring.</div>
          </div>
          <button className="btn-primary" onClick={refresh} disabled={loading}>
            {loading ? "Scanning..." : "↻ Refresh alerts"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map((a, i) => {
            const c = severityStyle(a.severity);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: c.bg,
                  border: `1px solid ${c.bd}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.dot, flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#181816", marginBottom: 4, letterSpacing: "-0.1px" }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: "#4E4C48", lineHeight: 1.5 }}>{a.detail}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.7)", color: c.color, border: `1px solid ${c.bd}` }}>
                    {a.patient_count} patients
                  </span>
                  {(a as any).isNew && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#C93A3A", color: "#fff", letterSpacing: "0.04em" }}>
                      NEW
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}