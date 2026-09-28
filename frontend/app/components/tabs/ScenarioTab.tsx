"use client";

import { useState } from "react";
import { modelScenario } from "../../lib/api";

const INTERVENTIONS = [
  "7-day discharge follow-up",
  "HbA1c recall program",
  "COPD breathing test reminders",
  "Medication review for CKD",
];

const SCALES = [
  "High-risk group only",
  "All eligible patients",
  "Full cohort",
];

export default function ScenarioTab() {
  const [intervention, setIntervention] = useState(INTERVENTIONS[0]);
  const [scale, setScale] = useState(SCALES[1]);
  const [contactRate, setContactRate] = useState(70);
  const [reductionPct, setReductionPct] = useState(35);
  const [costPer, setCostPer] = useState(8500);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const model = async () => {
    setLoading(true);
    try {
      const data = await modelScenario({
        intervention,
        scale,
        contact_rate: contactRate,
        reduction_pct: reductionPct,
        cost_per_readmission: costPer,
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sliders = [
    { label: "Contact rate", value: contactRate, set: setContactRate, min: 10, max: 100, step: 5, fmt: (v: number) => `${v}%` },
    { label: "Readmission reduction", value: reductionPct, set: setReductionPct, min: 5, max: 60, step: 5, fmt: (v: number) => `${v}%` },
    { label: "Cost per readmission", value: costPer, set: setCostPer, min: 5000, max: 20000, step: 500, fmt: (v: number) => `$${v.toLocaleString()}` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-title">Intervention inputs</div>
          <div className="card-sub">Configure the scenario and click Model this to see the projected impact.</div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Intervention</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            {INTERVENTIONS.map((item) => (
              <button
                key={item}
                onClick={() => setIntervention(item)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `0.5px solid ${intervention === item ? "var(--blue-bd)" : "var(--border)"}`,
                  background: intervention === item ? "var(--blue-bg)" : "var(--card)",
                  color: intervention === item ? "var(--blue)" : "var(--sub)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: intervention === item ? 600 : 400,
                  textAlign: "left",
                  transition: "all 0.12s",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Scale</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            {SCALES.map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `0.5px solid ${scale === s ? "var(--blue-bd)" : "var(--border)"}`,
                  background: scale === s ? "var(--blue-bg)" : "var(--card)",
                  color: scale === s ? "var(--blue)" : "var(--sub)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: scale === s ? 600 : 400,
                  textAlign: "left",
                  transition: "all 0.12s",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.07em" }}>Parameters</div>
          {sliders.map((s) => (
            <div key={s.label} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: "var(--sub)", fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)" }}>{s.fmt(s.value)}</span>
              </div>
              <input
                type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                onChange={(e) => s.set(Number(e.target.value))}
              />
            </div>
          ))}

          <button
            className="btn-primary"
            onClick={model}
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "10px 14px", fontSize: 13, fontWeight: 600 }}
          >
            {loading ? "Modelling..." : "Model this"}
          </button>
        </div>

        <div className="card">
          <div className="card-title">Projected outcomes</div>
          <div className="card-sub">Based on current cohort data and your selected parameters.</div>
          {result ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                {[
                  { label: "Projected readmit rate", value: `${(result.projected_readmit_rate * 100).toFixed(1)}%`, color: "var(--teal)", bg: "var(--teal-bg)", bd: "var(--teal-bd)" },
                  { label: "Readmissions prevented", value: result.readmissions_prevented.toLocaleString(), color: "var(--teal)", bg: "var(--teal-bg)", bd: "var(--teal-bd)" },
                  { label: "Annual saving", value: `$${Math.round(result.annual_saving / 1000)}K`, color: "var(--teal)", bg: "var(--teal-bg)", bd: "var(--teal-bd)" },
                ].map((m) => (
                  <div key={m.label} style={{ background: m.bg, border: `0.5px solid ${m.bd}`, borderRadius: 12, padding: "14px 14px" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: m.color, letterSpacing: "-0.3px" }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="divider" />
              <div style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.7 }}>
                {result.narrative}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260, flexDirection: "column", gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--blue-bg)", border: "0.5px solid var(--blue-bd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                📊
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>Select an intervention and click Model this</div>
              <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>Projected outcomes will appear here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}