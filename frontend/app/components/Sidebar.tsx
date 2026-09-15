"use client";

import { Tab } from "../page";

const navItems: { tab: Tab; label: string; group: string }[] = [
  { tab: "overview", label: "Population", group: "Overview" },
  { tab: "disease", label: "Disease rates", group: "Overview" },
  { tab: "find", label: "Find patients", group: "Overview" },
  { tab: "alerts", label: "Alerts", group: "Risk" },
  { tab: "reports", label: "Send reports", group: "Risk" },
  { tab: "scenario", label: "Scenario planner", group: "Risk" },
  { tab: "ask", label: "Ask the data", group: "AI" },
  { tab: "executive", label: "Executive view", group: "AI" },
];

const groups = ["Overview", "Risk", "AI"];

export default function Sidebar({
  activeTab,
  setActiveTab,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  return (
    <aside
      style={{
        background: "var(--surface)",
        borderRight: "0.5px solid var(--border)",
        padding: "10px 0",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        gridRow: "2 / 3",
      }}
    >
      {groups.map((group) => (
        <div key={group}>
          <div
            style={{
              fontSize: 10,
              color: "var(--muted)",
              padding: "8px 14px 3px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {group}
          </div>
          {navItems
            .filter((item) => item.group === group)
            .map((item) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "7px 14px",
                  fontSize: 12,
                  color: activeTab === item.tab ? "var(--blue)" : "var(--sub)",
                  background:
                    activeTab === item.tab ? "var(--blue-bg)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {item.label}
              </button>
            ))}
          <div
            style={{
              height: "0.5px",
              background: "var(--border)",
              margin: "5px 14px",
            }}
          />
        </div>
      ))}
    </aside>
  );
}