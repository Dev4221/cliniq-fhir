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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Intervention inputs</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Intervention</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {INTERVENTIONS.map((i) => (
              <button
                key={i}
                onClick={() => setIntervention(i)}
                style={{
                  padding: "7px 10px",
                  borderRadius: 6,
                  border: `0.5px solid ${intervention === i ? "var(--blue-bd)" : "var(--border)"}`,
                  background: intervention === i ? "var(--blue-bg)" : "var(--card)",
                  color: intervention === i ? "var(--blue)" : "var(--sub)",
                  cursor: "pointer",
                  fontSize: 11,
                  textAlign: "left",
                }}
              >
                {i}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Scale</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {SCALES.map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                style={{
                  padding: "7px 10px",
                  borderRadius: 6,
                  border: `0.5px solid ${scale === s ? "var(--blue-bd)" : "var(--border)"}`,
                  background: scale === s ? "var(--blue-bg)" : "var(--card)",
                  color: scale === s ? "var(--blue)" : "var(--sub)",
                  cursor: "pointer",
                  fontSize: 11,
                  textAlign: "left",
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {[
            { label: "Contact rate", value: contactRate, set: setContactRate, min: 10, max: 100, suffix: "%" },
            { label: "Readmission reduction", value: reductionPct, set: setReductionPct, min: 5, max: 60, suffix: "%" },
            { label: "Cost per readmission", value: costPer, set: setCostPer, min: 5000, max: 20000, suffix: "", step: 500 },
          ].map((slider) => (
            <div key={slider.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "var(--sub)" }}>{slider.label}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--blue)" }}>
                  {slider.suffix === "%" ? `${slider.value}%` : `$${slider.value.toLocaleString()}`}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={(slider as any).step || 5}
                value={slider.value}
                onChange={(e) => slider.set(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--blue)" }}
              />
            </div>
          ))}
          <button className="btn-primary" onClick={model} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Modelling..." : "Model this"}
          </button>
        </div>

        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Projected outcomes</div>
          {result ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Projected readmit rate", value: `${(result.projected_readmit_rate * 100).toFixed(1)}%`, color: "var(--teal)" },
                  { label: "Readmissions prevented", value: result.readmissions_prevented, color: "var(--teal)" },
                  { label: "Annual saving", value: `$${Math.round(result.annual_saving / 1000)}K`, color: "var(--teal)" },
                ].map((m) => (
                  <div key={m.label} style={{ background: "var(--card)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 18, fontWeight: 500, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.65, padding: "10px 12px", background: "var(--card)", borderRadius: 8, border: "0.5px solid var(--border)" }}>
                {result.narrative}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
              Select an intervention and scale, then click Model this to see the projected impact.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}