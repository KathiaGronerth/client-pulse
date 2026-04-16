# Client Pulse

**An AI-powered client prioritization dashboard for financial advisors.**

Financial advisors spend ~25 minutes every morning clicking between their CRM and risk assessment tools trying to answer one question: *"Which clients need my attention today?"* Client Pulse answers it in 30 seconds.

[Live Demo](https://your-vercel-url.vercel.app) · [3-Min Video Walkthrough](https://loom.com/your-link) · [Product Requirements Document](./docs/PRD.md)

---

## The Problem

Financial advisors managing 80–150 client households operate across two disconnected systems:

- **Redtail CRM** — knows the relationship (contact history, tasks, notes, calendar) but has no prioritization layer. Its "Today" dashboard shows a flat list of activities and birthdays.
- **Nitrogen** — knows the risk (Risk Number tolerance vs. portfolio actual, 95% Historical Range, Riskalyze GPA) but doesn't tell you which misalignment is most urgent.

The systems are linked — Nitrogen syncs account data from Redtail — but neither synthesizes both datasets into: *"Here's who matters most right now, and here's why."*

**That's the product gap Client Pulse fills.**

---

## The Solution

Client Pulse synthesizes engagement history, risk alignment, task status, and life events into a single **transparent Health Score** per client — surfacing who needs attention today with one-tap actions and AI-generated call preparation briefs.

### Three Features. Not Twelve.

| Feature | What It Does | Why It Matters |
|---------|-------------|----------------|
| **Morning Priority List** | Ranked client cards sorted by Health Score | Replaces 25 min of manual triage with a 30-second glance |
| **Transparent Health Score** | 1–100 score with visible penalty breakdown | Every number traces to a specific Redtail or Nitrogen field. No black box. |
| **AI Call-Prep Brief** | LLM-generated contextual summary from structured data | Advisor gets risk status, last conversation context, and open commitments in 3 sentences |

> The first version had 12 features. I cut it to 3. That restraint made it 10x more useful.

---

## How the Scoring Works

```
Health Score = 100 + Engagement Penalty + Risk Penalty + Task Penalty + Life Event Penalty
```

| Signal | Weight | Data Source | Example |
|--------|--------|------------|---------|
| **Engagement Recency** | 35% | Redtail → Last Activity Date vs. contact cadence target | 73 days since contact (target: 60) → penalty: -25 |
| **Risk Alignment** | 30% | Nitrogen → Client Risk Number vs. Portfolio Risk Number | Target 50, actual 61 (gap: 11) → penalty: -20 |
| **Open Tasks** | 20% | Redtail → Past Due Activities + task due dates | 2 tasks, 32 days overdue → penalty: -20 |
| **Life Events** | 15% | Redtail → Date of Birth, UDFs, calendar | Birthday in 6 days → penalty: -3 (opportunity signal) |

**Priority thresholds:** Urgent (< 35) · Attention (35–54) · Healthy (55+)

---

## Data Architecture

Built on real financial advisor tool data structures:

```
┌─────────────────────┐     ┌─────────────────────┐
│    REDTAIL CRM      │     │      NITROGEN        │
│                     │     │                      │
│ • Contact Details   │     │ • Risk Number        │
│ • Activity History  │◄───►│ • Portfolio Risk #   │
│ • Tasks & Workflows │sync │ • 95% Hist. Range    │
│ • Notes & UDFs      │     │ • Riskalyze GPA      │
│ • Calendar          │     │ • Max Drawdown       │
│ • Portfolio Balance  │     │ • Goals & Prob.      │
└────────┬────────────┘     └────────┬─────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
          ┌──────────▼──────────┐
          │    CLIENT PULSE     │
          │                     │
          │ • Health Score      │
          │ • Priority Ranking  │
          │ • AI Call-Prep Brief│
          │ • One-Tap Actions   │
          └─────────────────────┘
```

**Redtail fields used:** Contact ID, Status, Category, Date of Birth, Client Since, Servicing Advisor, Last Activity Date/Type/Notes, Past Due Activities, Portfolio Balance, UDFs (Cadence Target, Client Tier, Life Goal)

**Nitrogen fields used:** Client Risk Number (tolerance), Portfolio Risk Number (actual), 95% Historical Range (6-month downside/upside), Riskalyze GPA, Max Drawdown %, Stocks/Bonds/Cash allocation, Goal, Probability of Success

---

## Where AI Fits

AI in Client Pulse is **intentional, invisible, and useful** — not a chatbot.

1. **Scoring Engine** — Deterministic weighted algorithm (not ML). Deliberate V1 choice: a transparent formula the advisor can verify beats a black-box model they can't explain to clients.

2. **Call-Prep Brief** — LLM generates natural-language briefing from structured Redtail + Nitrogen data. The advisor taps "Prepare for Call" and sees a clean 3-sentence summary. No prompt interface. No chatbot.

3. **Future: Agentic Monitoring** — AI agent ingests data daily via API, detects multi-week patterns ("engagement declining 3 months in a row"), and surfaces proactive alerts without the advisor opening any tool.

> Design philosophy: AI should feel like the iPhone's notification summary — not a feed of everything, but a curated set of things that matter to you today.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React (Next.js) |
| Styling | Apple Human Interface Guidelines — SF Pro, system colors, 16pt grid |
| Scoring Engine | Excel with live formulas (also implemented in React) |
| AI Brief Generation | LLM integration (Claude/GPT API with structured prompts) |
| Data | Sample dataset — 12 clients across 27 Redtail fields + 24 Nitrogen fields |
| Deployment | Vercel |

---

## Project Structure

```
client-pulse/
├── app/
│   ├── page.js              # Entry point
│   └── ClientPulse.jsx      # Main prototype component
├── docs/
│   └── PRD.md               # Product Requirements Document
├── data/
│   └── client_pulse_final.xlsx  # Scoring engine (3 sheets)
└── README.md
```

---

## Design Principles

1. **Simplicity over features** — 3 features, not 12. Analytics, client portals, and portfolio tools were deliberately cut.
2. **Transparency over magic** — Every score traces to a specific Redtail field or Nitrogen data point.
3. **Direction over data** — Advisors need answers ("call Tom Bradley"), not dashboards.
4. **Invisible AI** — No chatbot. No prompt interface. The right client surfaces at the right time.
5. **Privacy by design** — All data stays within the advisor's existing systems.

---

## Sample Scores (from prototype data)

| Client | Score | Priority | Top Signal |
|--------|-------|----------|------------|
| Thomas R. Bradley | 23 | 🔴 Urgent | 73d no contact + risk drift + overdue tasks |
| Robert T. Chen | 37 | 🟡 Attention | 128d no contact, retirement review imminent |
| Margaret A. Johnson | 47 | 🟡 Attention | Risk drift 45→62, birthday in 6 days |
| Diana L. Morales | 51 | 🟡 Attention | Conservative client, significant risk drift |
| Elena M. Gutierrez | 85 | 🟢 Healthy | Fully aligned, recent contact |
| David & Lisa Kim | 87 | 🟢 Healthy | Perfectly aligned portfolio |

---

## About

**Client Pulse** is a product design concept exploring AI-powered client prioritization in financial advisory workflows. Built with sample data — not connected to live systems.

Designed by **Kathia Villavicencio** — Product Manager with experience in cross-platform enterprise software (Dell Technologies) and financial advisory operations. MS Computer Science, MBA, MIT xPRO AI Products certification, published U.S. patent inventor.

[LinkedIn](https://www.linkedin.com/in/kathia-v-5135b0237/) · kathia.villavicencio@outlook.com

---

*This project uses fictional sample data only. No proprietary or client information is included.*
