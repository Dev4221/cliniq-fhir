"use client";

import { useEffect, useState } from "react";
import { getCohortSummary } from "./lib/api";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import OverviewTab from "./components/tabs/OverviewTab";
import DiseaseRatesTab from "./components/tabs/DiseaseRatesTab";
import FindPatientsTab from "./components/tabs/FindPatientsTab";
import AlertsTab from "./components/tabs/AlertsTab";
import ReportsTab from "./components/tabs/ReportsTab";
import ScenarioTab from "./components/tabs/ScenarioTab";
import AskTab from "./components/tabs/AskTab";
import ExecutiveTab from "./components/tabs/ExecutiveTab";

export type Tab =
  | "overview"
  | "disease"
  | "find"
  | "alerts"
  | "reports"
  | "scenario"
  | "ask"
  | "executive";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [cohort, setCohort] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCohortSummary()
      .then(setCohort)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const renderTab = () => {
    if (loading) return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading cohort data...</p>
      </div>
    );
    switch (activeTab) {
      case "overview": return <OverviewTab cohort={cohort} />;
      case "disease": return <DiseaseRatesTab cohort={cohort} />;
      case "find": return <FindPatientsTab />;
      case "alerts": return <AlertsTab />;
      case "reports": return <ReportsTab />;
      case "scenario": return <ScenarioTab />;
      case "ask": return <AskTab />;
      case "executive": return <ExecutiveTab cohort={cohort} />;
      default: return <OverviewTab cohort={cohort} />;
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gridTemplateRows: "46px 1fr", height: "100vh", background: "var(--bg)" }}>
      <TopBar cohort={cohort} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ overflow: "auto", padding: 16 }}>
        {renderTab()}
      </main>
    </div>
  );
}