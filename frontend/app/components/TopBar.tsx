"use client";

export default function TopBar({ cohort }: { cohort: any }) {
  return (
    <header
      style={{
        gridColumn: "1 / -1",
        background: "var(--surface)",
        borderBottom: "0.5px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#378ADD", fontSize: 16 }}>♥</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
          ClinIQ
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>
        {cohort
          ? `SMART Health IT · ${cohort.total_patients} patients · FHIR R4`
          : "Loading..."}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 20,
            background: "var(--teal-bg)",
            color: "var(--teal)",
            border: "0.5px solid var(--teal-bd)",
          }}
        >
          Live
        </span>
        {cohort && cohort.total_care_gap_patients > 0 && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 20,
              background: "var(--amber-bg)",
              color: "var(--amber)",
              border: "0.5px solid var(--amber-bd)",
            }}
          >
            {cohort.total_care_gap_patients} care gaps
          </span>
        )}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--blue-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--blue)",
          }}
        >
          DB
        </div>
      </div>
    </header>
  );
}