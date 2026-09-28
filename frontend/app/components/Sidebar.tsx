"use client";

import { Tab } from "../page";

const navItems: { tab: Tab; label: string; group: string; emoji: string }[] = [
  { tab: "overview", label: "Population", group: "Overview", emoji: "👥" },
  { tab: "disease", label: "Disease rates", group: "Overview", emoji: "🦠" },
  { tab: "find", label: "Find patients", group: "Overview", emoji: "🔍" },
  { tab: "alerts", label: "Alerts", group: "Risk", emoji: "🔔" },
  { tab: "reports", label: "Send reports", group: "Risk", emoji: "📤" },
  { tab: "scenario", label: "Scenario planner", group: "Risk", emoji: "📊" },
  { tab: "ask", label: "Ask the data", group: "AI", emoji: "💬" },
  { tab: "executive", label: "Executive view", group: "AI", emoji: "⚡" },
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
    <aside style={{
      background: "#FFFFFF",
      borderRight: "1px solid #E3DFD8",
      padding: "20px 10px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      gridRow: "2 / 3",
      boxShadow: "1px 0 4px rgba(0,0,0,0.03)",
    }}>
      {groups.map((group, gi) => (
        <div key={group} style={{ marginBottom: gi < groups.length - 1 ? 6 : 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 700,
            color: "#96948E",
            padding: "6px 12px 5px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
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
                  gap: 9,
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: activeTab === item.tab ? 600 : 400,
                  color: activeTab === item.tab ? "#1456A0" : "#4E4C48",
                  background: activeTab === item.tab
                    ? "linear-gradient(135deg, #E2EEFA 0%, #EEF4FD 100%)"
                    : "transparent",
                  border: activeTab === item.tab ? "1px solid #90BAF0" : "1px solid transparent",
                  borderRadius: 9,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.12s",
                  boxShadow: activeTab === item.tab ? "0 1px 3px rgba(20,86,160,0.1)" : "none",
                }}
              >
                <span style={{ fontSize: 14 }}>{item.emoji}</span>
                {item.label}
              </button>
            ))}
          {gi < groups.length - 1 && (
            <div style={{ height: 1, background: "#E3DFD8", margin: "10px 12px 6px" }} />
          )}
        </div>
      ))}
    </aside>
  );
}