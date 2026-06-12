import { useState, useEffect } from "react";
import { computeHealthScore } from "../lib/scoring";
import { generateBrief } from "../lib/brief";
import { getDashboardClients } from "../lib/data";

/*
  CLIENT PULSE v3 — Grounded in Real Redtail CRM Fields
  
  Data sources mapped to actual Redtail screens (from screenshots):
  
  REDTAIL "Today" Dashboard → AUM, Reminders, Timeline count, Workflow Tasks, 
    Things to do today (activities), Today's Birthdays, Client Reviews
  
  REDTAIL Contact Detail → ID, Status, Category, Source, Referred By, 
    Date of Birth, Marital Status, Servicing Advisor, Writing Advisor, 
    Client Since, Contact Created, Added By
  
  REDTAIL Contact Header Bar → Next Review, Next Activity, Last Activity, 
    Past Due Activities, Active Workflows, Portfolio Balance
  
  REDTAIL Contact Sub-pages → Accounts (type, balance), Activities (history), 
    Notes, Client Reviews, Documents, Know Your Client, Email History, 
    UDFs (User Defined Fields), Assets/Liabilities, Workflows
  
  REDTAIL Reports → Activities By Contact, Contacts By Category/Status/Keyword
  
  NITROGEN → Risk Number (tolerance), Portfolio Risk Number (actual), 
    Risk Gap, Goals, Probability of Success, 6-month projections
  
  WHAT REDTAIL'S "TODAY" VIEW SHOWS:
    - Flat list of activities for today (tasks, calls, appointments)
    - Birthday alerts
    - Workflow tasks due
    - Reminders count
  
  WHAT IT DOESN'T SHOW (= Client Pulse's value):
    - Which client is highest priority across ALL signals
    - Risk alignment status (needs Nitrogen cross-reference)
    - Engagement gap analysis (days since last activity vs cadence)
    - A single synthesized score combining all factors
    - AI-generated call preparation context
*/

// Client data is loaded through the data-source adapter layer (lib/data),
// which defaults to MockAdapter reading Redtail/Nitrogen-shaped fixtures.
// Scores are computed at runtime from those fields. See lib/scoring.js.
const clients = getDashboardClients().map(c => ({ ...c, ...computeHealthScore(c) }));

const needsAttention = clients.filter(c => c.score < 55).sort((a,b) => a.score - b.score);
const healthy = clients.filter(c => c.score >= 55).sort((a,b) => b.score - a.score);

const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : `$${(n/1000).toFixed(0)}K`;

function ScoreRing({ score, size = 48 }) {
  const r = (size - 6) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 55 ? "#34C759" : score >= 35 ? "#FF9500" : "#FF3B30";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F2F2F7" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: size * 0.3, fontWeight: 700, fill: color, fontFamily: "-apple-system" }}>
        {score}
      </text>
    </svg>
  );
}

function Tag({ label, color }) {
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: color + "14", color, marginRight: 5 }}>{label}</span>;
}

function PenaltyRow({ label, penalty, detail, source, color }) {
  const w = Math.min(Math.abs(penalty) * 2.8, 100);
  return (
    <div style={{ padding: "8px 0", borderBottom: "1px solid #F2F2F7" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 100, fontSize: 12, fontWeight: 600, color: "#1D1D1F" }}>{label}</div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, background: "#F2F2F7", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s" }} />
          </div>
        </div>
        <div style={{ width: 36, textAlign: "right", fontSize: 13, fontWeight: 700, color }}>{penalty}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 10, color: "#86868B" }}>{detail}</span>
        <span style={{ fontSize: 9, color: "#C7C7CC", fontStyle: "italic" }}>{source}</span>
      </div>
    </div>
  );
}

export default function ClientPulse() {
  const [sel, setSel] = useState(null);
  const [view, setView] = useState("dash");
  const [logged, setLogged] = useState(new Set());
  // Brief result, keyed to the client it belongs to. Loading/text/source are
  // derived from this (below) so the effect never calls setState synchronously
  // in its body — which would trigger cascading renders.
  const [briefData, setBriefData] = useState(null);

  // Fetch the brief from /api/brief whenever the brief view opens for a client.
  // The route returns an LLM-generated brief when a key is configured, else a
  // rule-based one. If the request itself fails, fall back to the local
  // deterministic generator so the view always has content.
  useEffect(() => {
    if (view !== "brief" || !sel) return;
    let cancelled = false;
    fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sel),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const text = data && data.brief ? data.brief : generateBrief(sel);
        const source = data && data.brief ? (data.source || "rule-based") : "rule-based";
        setBriefData({ id: sel.id, text, source });
      })
      .catch(() => {
        if (!cancelled) setBriefData({ id: sel.id, text: generateBrief(sel), source: "rule-based" });
      });
    return () => { cancelled = true; };
  }, [view, sel]);

  // Derived brief view state: show the brief only once it has loaded for the
  // currently-selected client; otherwise the loading placeholder.
  const briefReady = !!(sel && briefData && briefData.id === sel.id);
  const briefLoading = view === "brief" && !briefReady;
  const brief = briefReady ? briefData.text : null;
  const briefSource = briefReady ? briefData.source : null;

  const handleLog = (id) => {
    const n = new Set(logged); n.add(id); setLogged(n);
    if (n.size >= needsAttention.length) setView("done");
    else { setView("dash"); setSel(null); }
  };

  const active = needsAttention.filter(c => !logged.has(c.id));
  const S = { fontFamily: "-apple-system, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif" };

  // === ALL CAUGHT UP ===
  if (view === "done") return (
    <div style={{ minHeight: "100vh", background: "#FFF", ...S, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 40 }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#34C75910", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>All caught up</h2>
      <p style={{ fontSize: 15, color: "#86868B", margin: "0 0 20px", textAlign: "center", maxWidth: 280 }}>All priority clients have been addressed today.</p>
      <p style={{ fontSize: 12, color: "#C7C7CC", textAlign: "center", maxWidth: 260, lineHeight: 1.5 }}>Consider reaching out to Carlos & Maria Reyes (score 63) or William Thompson (score 75) if time permits.</p>
      <button onClick={() => { setLogged(new Set()); setView("dash"); setSel(null); }}
        style={{ marginTop: 24, padding: "11px 24px", background: "#007AFF", color: "#FFF", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Reset Demo</button>
    </div>
  );

  // === AI CALL-PREP BRIEF ===
  if (view === "brief" && sel) return (
    <div style={{ minHeight: "100vh", background: "#FFF", ...S, padding: "0 20px 40px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <button onClick={() => setView("detail")} style={{ background: "none", border: "none", color: "#007AFF", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "14px 0" }}>← Back</button>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1D1D1F", margin: "4px 0 2px" }}>Call Preparation Brief</h2>
        <p style={{ fontSize: 12, color: "#86868B", margin: "0 0 4px" }}>{sel.name} · ID: {sel.id} · {sel.clientTier} · {fmt(sel.portfolioBalance)}</p>
        <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
          <Tag label={`Risk: ${sel.riskActual}/${sel.riskTarget}`} color={sel.riskGap > 10 ? "#FF3B30" : sel.riskGap > 5 ? "#FF9500" : "#34C759"} />
          <Tag label={sel.riskStatus} color={sel.riskStatus === "Misaligned" ? "#FF3B30" : sel.riskStatus === "Minor Drift" ? "#FF9500" : "#34C759"} />
          {sel.lifeEvent && <Tag label={sel.lifeEvent} color="#5856D6" />}
          {sel.pastDueActivities > 0 && <Tag label={`${sel.pastDueActivities} past due`} color="#FF3B30" />}
        </div>
        <div style={{ background: "#F2F2F7", borderRadius: 14, padding: 18, marginBottom: 6 }}>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: briefLoading ? "#86868B" : "#1D1D1F", margin: 0 }}>{briefLoading ? "Preparing brief…" : brief}</p>
        </div>
        <p style={{ fontSize: 10, color: "#C7C7CC", margin: "0 0 16px", fontStyle: "italic" }}>
          Generated from Redtail CRM + Nitrogen data · Review before calling
          {!briefLoading && briefSource && ` · ${briefSource === "ai" ? "AI-generated" : "Rule-based"}`}
        </p>
        {sel.advisorNote && (
          <div style={{ background: "#FFFBEB", borderRadius: 10, padding: "10px 14px", marginBottom: 16, border: "1px solid #FEF3C7" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#92400E", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: 0.5 }}>Advisor Note</p>
            <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.4 }}>{sel.advisorNote}</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => handleLog(sel.id)} style={{ flex: 1, padding: 13, background: "#34C759", color: "#FFF", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Log Touchpoint</button>
          <button onClick={() => setView("detail")} style={{ flex: 1, padding: 13, background: "#F2F2F7", color: "#1D1D1F", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Back</button>
        </div>
      </div>
    </div>
  );

  // === CLIENT DETAIL ===
  if (view === "detail" && sel) return (
    <div style={{ minHeight: "100vh", background: "#FFF", ...S, padding: "0 20px 40px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <button onClick={() => { setView("dash"); setSel(null); }} style={{ background: "none", border: "none", color: "#007AFF", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "14px 0" }}>← Dashboard</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <ScoreRing score={sel.score} size={56} />
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{sel.name}</h2>
            <p style={{ fontSize: 11, color: "#86868B", margin: "2px 0 0" }}>ID: {sel.id} · {sel.clientTier} · Client since {sel.clientSince} · {fmt(sel.portfolioBalance)}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
          <Tag label={sel.status} color="#007AFF" />
          <Tag label={sel.riskStatus} color={sel.riskStatus === "Misaligned" ? "#FF3B30" : sel.riskStatus === "Minor Drift" ? "#FF9500" : "#34C759"} />
          {sel.lifeEvent && <Tag label={`${sel.lifeEvent}: ${sel.lifeEventDate}`} color="#5856D6" />}
          {sel.pastDueActivities > 0 && <Tag label={`${sel.pastDueActivities} Past Due Activities`} color="#FF3B30" />}
        </div>

        {/* Redtail Header Bar equivalent */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
          {[
            { val: sel.lastActivity, label: "Last Activity", sub: sel.lastActivityType },
            { val: `${sel.pastDueActivities}`, label: "Past Due", sub: "Activities" },
            { val: fmt(sel.portfolioBalance), label: "Portfolio", sub: "Balance" },
          ].map((item, i) => (
            <div key={i} style={{ background: "#F9F9FB", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{item.val}</div>
              <div style={{ fontSize: 9, color: "#86868B" }}>{item.label}</div>
              <div style={{ fontSize: 9, color: "#C7C7CC" }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Health Score Breakdown */}
        <div style={{ background: "#FFF", borderRadius: 14, padding: "12px 16px", marginBottom: 10, boxShadow: "0 1px 5px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Health Score Breakdown</h3>
          <PenaltyRow label="Engagement" penalty={sel.engPenalty} detail={`${sel.daysSince}d since last activity (cadence: ${sel.contactCadenceTarget}d)`} source="Redtail: Activities" color="#FF3B30" />
          <PenaltyRow label="Risk" penalty={sel.riskPenalty} detail={`Target ${sel.riskTarget} → Actual ${sel.riskActual} (gap: ${sel.riskGap})`} source="Nitrogen" color="#FF9500" />
          <PenaltyRow label="Tasks" penalty={sel.taskPenalty} detail={`${sel.openTasks} open, ${sel.taskDaysOverdue}d overdue`} source="Redtail: Activities" color="#5856D6" />
          <PenaltyRow label="Life Events" penalty={sel.lifePenalty} detail={sel.lifeEvent ? `${sel.lifeEvent}: ${sel.lifeEventDate}` : "None detected"} source="Redtail: DOB/UDFs" color="#007AFF" />
        </div>

        {/* Last Activity — from Redtail Activities tab */}
        <div style={{ background: "#FFF", borderRadius: 14, padding: "12px 16px", marginBottom: 10, boxShadow: "0 1px 5px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <h3 style={{ fontSize: 11, fontWeight: 600, color: "#86868B", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Last Activity</h3>
            <span style={{ fontSize: 9, color: "#C7C7CC", fontStyle: "italic" }}>Redtail → Activities</span>
          </div>
          <p style={{ fontSize: 13, color: "#1D1D1F", margin: "0 0 2px", fontWeight: 500 }}>{sel.lastActivityType}: {sel.lastActivitySubject}</p>
          <p style={{ fontSize: 11, color: "#86868B", margin: "0 0 2px" }}>{sel.lastActivity} ({sel.daysSince} days ago)</p>
          <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0", lineHeight: 1.4 }}>{sel.lastActivityNotes}</p>
          {sel.oldestTaskSubject && (
            <div style={{ marginTop: 8, padding: "6px 10px", background: "#FFF7ED", borderRadius: 8, borderLeft: "3px solid #FF9500" }}>
              <p style={{ fontSize: 11, color: "#9A3412", margin: 0 }}>Open task: {sel.oldestTaskSubject} {sel.taskDaysOverdue > 0 && <span style={{ fontWeight: 600 }}>({sel.taskDaysOverdue}d overdue)</span>}</p>
            </div>
          )}
        </div>

        {/* Nitrogen Risk Snapshot */}
        <div style={{ background: "#FFF", borderRadius: 14, padding: "12px 16px", marginBottom: 10, boxShadow: "0 1px 5px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h3 style={{ fontSize: 11, fontWeight: 600, color: "#86868B", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Risk Snapshot</h3>
            <span style={{ fontSize: 9, color: "#C7C7CC", fontStyle: "italic" }}>Nitrogen</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              { val: sel.riskTarget, label: "Risk Target", sub: "Client tolerance" },
              { val: sel.riskActual, label: "Risk Actual", sub: "Portfolio" },
              { val: sel.downside6mo, label: "6mo Downside", sub: "Projected" },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: "center", padding: "6px", background: "#F9F9FB", borderRadius: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>{item.val}</div>
                <div style={{ fontSize: 9, color: "#86868B", marginTop: 1 }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: "#86868B", margin: "6px 0 0" }}>Goal: {sel.lifeGoal} · Success: {sel.probSuccess}% · Trend: {sel.riskTrend}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          <button onClick={() => setView("brief")} style={{ padding: 13, background: "#007AFF", color: "#FFF", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Prepare for Call</button>
          <button onClick={() => handleLog(sel.id)} style={{ padding: 13, background: "#F2F2F7", color: "#1D1D1F", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Log Touchpoint</button>
        </div>
      </div>
    </div>
  );

  // === MORNING DASHBOARD ===
  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F7", ...S, padding: "0 0 40px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>
        {/* Compare to Redtail "Today" view: shows AUM, Reminders, Timeline, 
            Things to do today as flat list. Client Pulse replaces this with 
            PRIORITIZED client view */}
        <div style={{ padding: "40px 0 16px" }}>
          <p style={{ fontSize: 12, color: "#86868B", margin: "0 0 2px", fontWeight: 500 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1D1D1F", margin: "0 0 3px", letterSpacing: -0.5 }}>Good morning, Kathia</h1>
          <p style={{ fontSize: 16, color: "#86868B", margin: 0 }}>
            <span style={{ color: active.length > 0 ? "#FF3B30" : "#34C759", fontWeight: 700 }}>{active.length}</span>
            {active.length === 1 ? " client needs" : " clients need"} your attention today
          </p>
        </div>

        {/* What Redtail Today shows vs what Client Pulse shows */}
        <div style={{ background: "#FFF", borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-around" }}>
          {[
            { val: "8", label: "Clients", sub: "Total" },
            { val: `${active.length}`, label: "Need Attn", sub: "Today", color: "#FF3B30" },
            { val: `${healthy.length}`, label: "On Track", sub: "", color: "#34C759" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color || "#1D1D1F" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#86868B" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Priority Clients */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {active.map(c => {
            const urgLabel = c.score < 35 ? "Urgent" : "Attention";
            const urgColor = c.score < 35 ? "#FF3B30" : "#FF9500";
            return (
              <div key={c.id} onClick={() => { setSel(c); setView("detail"); }}
                style={{ background: "#FFF", borderRadius: 14, padding: "13px 16px", cursor: "pointer",
                  boxShadow: "0 1px 5px rgba(0,0,0,0.04)", transition: "transform 0.12s, box-shadow 0.12s",
                  border: c.score < 35 ? "1px solid #FF3B3015" : "1px solid transparent" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.006)"; e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 1px 5px rgba(0,0,0,0.04)"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <ScoreRing score={c.score} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F" }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: "#C7C7CC" }}>{c.clientTier}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#86868B", margin: "1px 0 4px", lineHeight: 1.3 }}>{c.reason}</p>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <Tag label={urgLabel} color={urgColor} />
                      {c.riskStatus === "Misaligned" && <Tag label={`Risk: ${c.riskTarget}→${c.riskActual}`} color="#FF3B30" />}
                      {c.lifeEvent && <Tag label={c.lifeEvent} color="#5856D6" />}
                      {c.pastDueActivities > 0 && <Tag label={`${c.pastDueActivities} past due`} color="#FF9500" />}
                    </div>
                  </div>
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0 }}><path d="M1 1l5 5-5 5" stroke="#C7C7CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* On Track */}
        {healthy.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 11, fontWeight: 600, color: "#86868B", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px" }}>On Track ({healthy.length})</h3>
            {healthy.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #E5E5EA" }}>
                <ScoreRing score={c.score} size={30} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#1D1D1F" }}>{c.name}</span>
                  <p style={{ fontSize: 10, color: "#86868B", margin: "1px 0 0" }}>Last: {c.lastActivity} · Risk: {c.riskActual}/{c.riskTarget} · {fmt(c.portfolioBalance)}</p>
                </div>
                <Tag label="Healthy" color="#34C759" />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24, padding: "12px 14px", background: "#FFF", borderRadius: 10, border: "1px solid #E5E5EA" }}>
          <p style={{ fontSize: 10, color: "#C7C7CC", margin: 0, lineHeight: 1.5, textAlign: "center" }}>
            Client Pulse v3.0 — Product design concept by Kathia Villavicencio<br/>
            Data architecture: Redtail CRM (contacts, activities, tasks, UDFs) + Nitrogen (Risk Number, goals)<br/>
            Prototype uses sample data · Not connected to live systems
          </p>
        </div>
      </div>
    </div>
  );
}
