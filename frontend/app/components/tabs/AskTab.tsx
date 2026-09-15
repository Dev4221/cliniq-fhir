"use client";

import { useState } from "react";
import { askQuestion } from "../../lib/api";

const SUGGESTIONS = [
  "Which patients have the highest readmission risk?",
  "What is the most common care gap in the cohort?",
  "Which age group has the most chronic conditions?",
  "How many patients have both diabetes and kidney disease?",
];

export default function AskTab() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const ask = async (q?: string) => {
    const finalQ = q || question;
    if (!finalQ.trim()) return;
    setLoading(true);
    try {
      const data = await askQuestion(finalQ);
      setConversation((prev) => [...prev, { q: finalQ, a: data.answer }]);
      setQuestion("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Ask the data</div>
        <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 12 }}>
          Ask questions in plain English. Claude reads the patient records and answers using real data.
        </div>

        {conversation.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {conversation.map((item, i) => (
              <div key={i}>
                <div style={{ background: "var(--card)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "9px 12px", marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>You asked</div>
                  <div style={{ fontSize: 12, color: "var(--text)" }}>{item.q}</div>
                </div>
                <div style={{ background: "var(--blue-bg)", border: "0.5px solid var(--blue-bd)", borderRadius: 8, padding: "9px 12px" }}>
                  <div style={{ fontSize: 10, color: "var(--blue)", marginBottom: 4, fontWeight: 500 }}>Claude</div>
                  <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask anything about the patient cohort..."
            style={{
              flex: 1,
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 6,
              border: "0.5px solid var(--blue-bd)",
              background: "var(--card)",
              color: "var(--text)",
              outline: "none",
            }}
          />
          <button className="btn-primary" onClick={() => ask()} disabled={loading}>
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>

        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>Try asking</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 6,
                border: "0.5px solid var(--border)",
                background: "var(--card)",
                color: "var(--sub)",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}