/**
 * ClinIQ API client
 * All functions call the FastAPI backend at localhost:8000
 */
const API_BASE = "http://127.0.0.1:8000";

export async function getCohortSummary() {
  const res = await fetch(`${API_BASE}/api/cohort-summary`);
  if (!res.ok) throw new Error("Failed to fetch cohort summary");
  return res.json();
}

export async function findPatients(query: string, limit = 10) {
  const res = await fetch(`${API_BASE}/api/find-patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) throw new Error("Failed to find patients");
  return res.json();
}

export async function getAlerts() {
  const res = await fetch(`${API_BASE}/api/alerts`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function generateReport(report_type: string, stakeholder: string) {
  const res = await fetch(`${API_BASE}/api/generate-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report_type, stakeholder }),
  });
  if (!res.ok) throw new Error("Failed to generate report");
  return res.json();
}

export async function modelScenario(params: {
  intervention: string;
  scale: string;
  contact_rate: number;
  reduction_pct: number;
  cost_per_readmission: number;
}) {
  const res = await fetch(`${API_BASE}/api/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to model scenario");
  return res.json();
}

export async function getGroupSummary(group: string) {
  const res = await fetch(`${API_BASE}/api/group-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group }),
  });
  if (!res.ok) throw new Error("Failed to get group summary");
  return res.json();
}

export async function askQuestion(question: string) {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Failed to ask question");
  return res.json();
}