"use client";

import { useState } from "react";
import { getAlerts } from "../../lib/api";

const SEED_ALERTS = [
  {
    severity: "high",
    title: "Diabetic patients with no blood sugar test in 12 months",
    detail: "168 patients have had no HbA1c test in over a year. Average gap: 16 months.",
    patient_count: 168,
  },
  {
    severity: "high",
    title: "Hypertensive patients with no blood pressure reading",
    detail: "131 patients have no BP reading on record. Follow-up overdue 90 or more days.",
    patient_count: 131,
  },
  {
    severity: "medium",
    title: "COPD patients with no breathing test this year",
    detail: "11 patients have had no spirometry test. Last encounter over 180 days ago for most.",
    patient_count: 11,
  },
];

export default function AlertsTab() {
  const [alerts, setAlerts] = useState(SEED_ALERTS);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getAlerts();
      setAlerts([...data.alerts, ...alerts]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (s: string) => {
    if (s === "high") return { bg: "var(--red-bg)", color: "var(--red)", bd: "var(--red-bd)" };
    if (s === "medium") return { bg: "var(--amber-bg)", color: "var(--amber)", bd: "var(--amber-bd)" };
    return { bg: "var(--blue-bg)", color: "var(--blue)", bd: "var(--blue-bd)" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>Clinical alerts</div>
            <div style={{ fontSize: 11, color: "var(--sub)" }}>
              Claude scans the patient records and surfaces care gaps, risk spikes, and overdue monitoring.
            </div>
          </div>
          <button className="btn-primary" onClick={refresh} disabled={loading}>
            {loading ? "Scanning..." : "Refresh alerts"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alerts.map((a, i) => {
            const c = severityColor(a.severity);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: c.bg,
                  border: `0.5px solid ${c.bd}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", marginBottom: 3 }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sub)" }}>{a.detail}</div>
                </div>
                <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: c.bg, color: c.color, border: `0.5px solid ${c.bd}`, flexShrink: 0 }}>
                  {a.patient_count} patients
                </div>
                {i < 2 && (
                  <div style={{ fontSize: 9, padding: "1px 6px", borderRadius: 20, background: "var(--red-bg)", color: "var(--red)", border: "0.5px solid var(--red-bd)", flexShrink: 0 }}>
                    New
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}