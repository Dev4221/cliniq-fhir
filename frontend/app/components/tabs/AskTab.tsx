"use client";

import { useState } from "react";
import { askQuestion } from "../../lib/api";

const SUGGESTIONS = [
  "Which patients have the highest readmission risk?",
  "What is the most common care gap in the cohort?",
  "Which age group has the most chronic conditions?",
  "How many patients have both diabetes and kidney disease?",
];

function renderAnswer(text: string) {
  const lines = text.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("- ")) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--blue)", flexShrink: 0, marginTop: 6 }} />
              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{trimmed.slice(2)}</div>
            </div>
          );
        }
        return (
          <div key={i} style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{trimmed}</div>
        );
      })}
    </div>
  );
}

export default function AskTab() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ask = async (q?: string) => {
    const finalQ = q || question;
    if (!finalQ.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const data = await askQuestion(finalQ);
      setConversation((prev) => [...prev, { q: finalQ, a: data.answer }]);
      setQuestion("");
    } catch (e) {
      setError("Could not reach the API. Make sure the backend is running at localhost:8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <div className="card-title">Ask the data</div>
        <div className="card-sub">Ask questions in plain English. Claude reads the patient records and answers using real data.</div>

        {error && (
          <div style={{ fontSize: 12, color: "var(--red)", background: "var(--red-bg)", border: "0.5px solid var(--red-bd)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
            {error}
          </div>
        )}

        {conversation.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
            {conversation.map((item, i) => (
              <div key={i}>
                <div style={{ background: "var(--card)", border: "0.5px solid var(--border)", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>You asked</div>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>{item.q}</div>
                </div>
                <div style={{ background: "var(--blue-bg)", border: "0.5px solid var(--blue-bd)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--blue)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Claude</div>
                  {renderAnswer(item.a)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask anything about the patient cohort..."
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={() => ask()} disabled={loading}>
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Try asking</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => ask(s)} className="chip" style={{ opacity: loading ? 0.5 : 1 }}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}