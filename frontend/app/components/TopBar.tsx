"use client";

export default function TopBar({ cohort }: { cohort: any }) {
  return (
    <header
      style={{
        gridColumn: "1 / -1",
        background: "#FFFFFF",
        borderBottom: "1px solid #E3DFD8",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, #1456A0 0%, #378ADD 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#fff",
          boxShadow: "0 2px 6px rgba(20,86,160,0.3)",
        }}>
          ♥
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#181816", letterSpacing: "-0.4px" }}>
          ClinIQ
        </span>
      </div>
      <div style={{
        fontSize: 11, color: "#96948E",
        background: "#F7F5F0",
        border: "1px solid #E3DFD8",
        borderRadius: 6,
        padding: "4px 11px",
        fontWeight: 500,
      }}>
        SMART Health IT · {cohort ? cohort.total_patients : "..."} patients · FHIR R4
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {cohort && cohort.total_care_gap_patients > 0 && (
          <span style={{
            fontSize: 12, fontWeight: 600,
            padding: "5px 12px", borderRadius: 20,
            background: "#FEF0D4", color: "#7A4A08",
            border: "1px solid #F5C56A",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            ⚠ {cohort.total_care_gap_patients} care gaps
          </span>
        )}
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #1456A0 0%, #378ADD 100%)",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700,
          boxShadow: "0 2px 6px rgba(20,86,160,0.3)",
        }}>
          DB
        </div>
      </div>
    </header>
  );
}