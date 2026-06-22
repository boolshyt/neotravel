# NeoTravel — Complete Project Guide
> **MBA1 Epitech · Automation of Commercial Processes**
> Team: Gendell, Inde, Yahia | Kickoff: June 22, 2026 | Presentation: July 1, 2026

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Company and Industry Context](#2-company-and-industry-context)
3. [What You Are Actually Building](#3-what-you-are-actually-building)
4. [Concepts and Topics to Learn](#4-concepts-and-topics-to-learn)
5. [Resources](#5-resources)
6. [Priority Breakdown](#6-priority-breakdown)
7. [Tools Guide](#7-tools-guide)
8. [Rules Guidelines and Checklist](#8-rules-guidelines-and-checklist)
9. [Critical Rules That Can Kill the Project](#9-critical-rules-that-can-kill-the-project)
10. [Reading Between the Lines](#10-reading-between-the-lines)
11. [Decisions to Agree On Before Building](#11-decisions-to-agree-on-before-building)
12. [Project Phases and Task Organization](#12-project-phases-and-task-organization)
13. [Workspace and Atelier Setup](#13-workspace-and-atelier-setup)
14. [Chatbot vs Form](#14-chatbot-vs-form)
15. [Grading Breakdown](#15-grading-breakdown)
16. [Deadlines](#16-deadlines)

---

## 1. Project Summary

NeoTravel is a group transport intermediary founded in 2010 (Levallois-Perret, France). They coordinate coach and bus partners for individuals, businesses, and public organizations — but own no vehicles themselves.

**The problem:** NeoTravel receives ~60 leads/day. Their salespeople are commissioned, so they naturally prioritize the biggest deals. Many paid-ad leads are never contacted. The commercial process is manual, slow, and leaks revenue.

**Your mission:** Build a functional prototype that automates the full commercial chain:

```
Lead capture → Qualification → Quote generation → Quote sending → Follow-up → Dashboard
```

This is graded on 100 points:
- **50 pts** — Deliverables + prototype (L1, L2, L3)
- **25 pts** — Live demo in front of jury
- **25 pts** — Oral defense

**The golden question for every decision:** *"Does this help NeoTravel better treat its leads, faster, with more traceability, without weakening the human relationship?"*

---

## 2. Company and Industry Context

### NeoTravel at a Glance

| Detail | Info |
|--------|------|
| Founded | 2010 |
| Model | Intermediation — no own fleet |
| Location | 55 Rue Raspail, 92300 Levallois-Perret |
| Website | autocar-location.com |
| Phone | 09 80 40 04 84 |
| Email | reservation@autocar-location.com |
| Coverage | 647 priority cities across 98 French departments |

### Vehicle Categories
- **Minibus**: 9–19 passengers
- **Midibus**: 20–30 passengers
- **Standard coach**: 30–45 passengers
- **Large coach**: 50–60 passengers
- **Over 85 passengers**: Manual commercial handling required (no automation)

### Internal Teams
- **Sales team**: Receive leads, qualify, make first proposal, manage client relationship
- **Reservation agents**: Find carrier partners, verify quality, confirm, coordinate logistics

### Business Constraints
- Partner dependency: carriers have variable availability
- Complex pricing (seasonality, urgency, capacity, options)
- Transport regulation (driver hours, rest periods)
- Margin pressure + disintermediation risk (clients finding carriers directly)
- Budget: **tools must stay below €1,000/month**
- AI budget: **€10–15 per group** (use affordable models, not GPT-4o or Claude Opus for everything)

### Core Business Values (to preserve in the system)
Human advice · Business expertise · Reliability · Reactivity · Transparency · Responsibility

**The motto:** "Digitaliser sans déshumaniser" — digitalize without dehumanizing.

### Why This Problem Matters
- Problem is NOT too few leads — it's under-exploitation of existing flow
- Commissioned salespeople cherry-pick high-value leads → paid ad leads ignored → revenue loss
- Ad budgets are capped by operational capacity: more leads = more pressure, not more revenue
- Automation allows treating more opportunities without growing the team

---

## 3. What You Are Actually Building

### The 10 Functions to Cover

1. **Lead/demand capture** — conversational interface or form
2. **Auto-centralization in CRM** — every lead logged, no exceptions
3. **Request qualification** — is the data complete? What's missing?
4. **Missing info detection** — prompt client to complete the request
5. **Auto/semi-auto quote calculation** — deterministic `calculer_devis()` function
6. **Quote/commercial proposal generation** — PDF document
7. **Quote sending** — automated email with PDF attachment
8. **Follow-up system** — scheduled relances based on urgency
9. **Commercial pipeline tracking** — dashboard with statuses
10. **Key commercial indicator reporting** — metrics for the manager

### Commercial Statuses (the pipeline)

```
New Lead → Incomplete → Qualified → Quote Sent → Follow-up 1 → Follow-up 2 → Accepted / Refused / Complex Case → Closed
```

### Required Data Fields

| Field | Why it's needed |
|-------|----------------|
| Client type | Individual / business / public org |
| Name / Company | Identity |
| Email | Sending quote + follow-ups |
| Phone | Contact |
| Departure city | Route calculation |
| Destination city | Route calculation |
| Travel dates | Seasonality coefficient |
| Passenger count | Vehicle type + capacity coefficient |
| Trip type | One-way / round trip |
| Urgency | Urgency coefficient |
| Free comment | Context for complex cases |
| Request status | Pipeline tracking |

### Follow-up Timing Rules

| Urgency | First follow-up | Second follow-up | After 2 follow-ups |
|---------|----------------|------------------|--------------------|
| **Urgent** | J+2 | — | Close |
| **Standard** | J+3 | J+7 | Close |

### The Target Architecture

```
Landing Page + Chat/Form
        ↓
    AI Agent
   ↙  ↓  ↓  ↘
Lookup  calculer_  Generate  CRM     Schedule
Rules   devis()    PDF       Write   Relance
        ↓
    Data Layer (Airtable or Supabase)
        ↓
    Dashboard
```

**Key distinction:** The agent **reads** rules (lookup). The **code calculates** the price.

---

## 4. Concepts and Topics to Learn

### Core AI Concepts

| Term | What it means for this project |
|------|-------------------------------|
| **LLM** | The brain (GPT-4o-mini, Claude Haiku) — understands conversation, routes to tools |
| **Token** | Unit of text consumed/produced — affects cost and the €10-15 budget per group |
| **Context Window** | How much the LLM remembers in one session — must manage session memory |
| **Temperature** | How random/creative the output is — use LOW (0.0–0.2) for data extraction |
| **Prompt / System Prompt** | Instructions to the LLM — defines role, rules, guardrails, tone |
| **Prompt Engineering** | Crafting system prompts so the agent does exactly what you want |
| **Agent** | LLM + ability to call tools + loop until task is done |
| **Tool/Function Calling** | The agent calls `calculer_devis()`, CRM write, PDF gen as tools |
| **Structured Outputs / JSON Schema** | Force LLM to output valid typed data before calling tools |
| **Session Memory** | Conversation history kept in one session (not across sessions — that's bonus) |
| **Streaming** | Show the LLM response word-by-word in the UI as it's generated |
| **Orchestration** | Controlling the sequence: receive → qualify → calculate → generate → send |
| **MCP** | Model Context Protocol — standardized tool interface (advanced) |
| **RAG** | Retrieve context from a knowledge base — e.g., reading pricing rules |
| **Hallucination** | LLM inventing prices or data — eliminated by `calculer_devis()` guardrail |
| **Guardrail** | Rule that prevents the LLM from doing something wrong |
| **Deterministic vs Non-deterministic** | Code always gives same result (deterministic); LLM varies (non-deterministic) |
| **HITL (Human-in-the-Loop)** | Escalate to human salesperson for complex/high-value cases |
| **Prompt Injection** | Attacker puts instructions inside client message to hijack the agent |
| **Observability/Tracing** | Logging every LLM call: prompt, response, tokens, cost, latency |
| **Evals** | Testing the AI: code evals for `calculer_devis()`, LLM-judge for conversation |
| **Golden Dataset** | A set of known-correct test cases to validate your system |
| **Idempotency** | Running the same action twice doesn't send two emails or two follow-ups |
| **Webhook** | HTTP endpoint that receives events (e.g., new form submission triggers n8n) |

### Technical Stack Concepts

| Term | What it is |
|------|-----------|
| **n8n** | Visual workflow automation tool — can host AI agents, call APIs, schedule tasks |
| **Vercel AI SDK** | TypeScript SDK for building AI apps with Next.js — streaming, tool calling |
| **Next.js** | React framework for full-stack web apps — used for the frontend UI |
| **Airtable** | No-code database with built-in dashboard UI |
| **Supabase** | Open-source Postgres with REST API, real-time, auth |
| **Resend / Brevo** | Email sending APIs — for quotes and follow-ups |
| **Vercel** | Platform to deploy Next.js apps (free tier works) |
| **Zod** | TypeScript schema validation — enforce structured outputs from LLM |
| **Pydantic** | Python equivalent of Zod — not used here (Node stack) |

---

## 5. Resources

### Must Read (from the project files)

| Document | Purpose | Priority |
|----------|---------|----------|
| `Automatisation-des-processus-commerciaux-v4.pdf` | Full project context, pricing matrices, 10 functions | **READ FIRST** |
| `4-brief-demarrage-neotravel-v5.pdf` | Starting brief, architecture, weekly plan, data model | **READ SECOND** |
| `5-Mot_du_president_Neotravel.pdf` | Business context, constraints, values | Essential |
| `2-faq-neotravel-v3.pdf` | 25 answered questions about the project | Essential |
| `3-stack-technique-neotravel.pdf` | Stack A vs B comparison, tool matrix | Before coding |
| `REGLES DE CALCUL COTATION DEVIS NEOTRAVEL.pdf` | Exact pricing tables and formulas | Before coding `calculer_devis()` |
| `6-livret-technique-points-d-attention.pdf` | 7 key technical warnings | Before coding |
| `1-glossaire-neotravel.pdf` | AI/tech glossary | When confused by a term |

### External Resources

**n8n**
- https://n8n.io/integrations/ — integration list
- https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.airtable/ — Airtable node
- https://docs.n8n.io/advanced-ai/ — AI Agent node docs

**Vercel AI SDK (Option B)**
- https://sdk.vercel.ai/docs — main docs
- https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling — tool calling

**Inspiration**
- https://mindtrip.ai — conversational travel interface (what the landing should feel like)

**Email**
- https://resend.com/docs — Resend API (recommended, generous free tier)
- https://www.brevo.com/fr/ — Brevo alternative

**PDF Generation**
- https://pptr.dev/ — Puppeteer (for HTML → PDF in Option B)
- https://react-pdf.org/ — React PDF library

**Airtable**
- https://airtable.com/developers/web/api/introduction — API docs

**Supabase**
- https://supabase.com/docs — main docs
- https://supabase.com/docs/guides/database/tables — creating tables

**Grading Rubric Reference**
- File: `7-livrables-attendus-et-modalites-soutenance-v4.pdf`

---

## 6. Priority Breakdown

### 🔴 Must Understand (Project Cannot Work Without These)

1. **The `calculer_devis()` pricing engine** — exact formula, all coefficients, flat rate table. Must be coded in pure JavaScript/TypeScript with no LLM involvement. Test it isolated before connecting anything.

2. **The deterministic guardrail** — LLM never calculates prices. LLM decides WHEN to call `calculer_devis()` and WHAT to pass to it. Code does the math. Always.

3. **The full commercial pipeline** — 8 statuses, what triggers each transition, who acts at each step.

4. **Tool/Function calling** — how the agent calls `calculer_devis()`, CRM write, PDF gen as tools. This is the core architecture.

5. **HITL thresholds** — when does automation hand off to a human? (high amount, low certainty, >85 passengers, incomplete data, complex case).

6. **Session memory** — how the agent remembers what the user said earlier in the same conversation.

7. **Idempotency for follow-ups** — prevent sending the same follow-up email twice. Must deduplicate.

8. **The data model** — Demandes, Matrices, Devis, Clients tables. Know what fields go where.

### 🟡 Important (Affects Quality and Grade)

9. **Structured outputs with JSON Schema / Zod** — extract typed lead data from conversation before calling tools.

10. **Prompt injection defense** — separate untrusted client text from system instructions.

11. **GDPR basics** — justify each data field collected, inform user of purpose, don't log PII in tests.

12. **Observability** — trace each LLM call (prompt, response, tokens, cost, latency). Counts toward bonus points.

13. **System prompt design** — role definition, guardrails, tone, what the agent can and cannot do.

14. **The difference between n8n Option A and Vercel AI SDK Option B** — you must choose ONE and stick to it. Do not implement both.

15. **Evals** — testing `calculer_devis()` with known inputs/outputs is straightforward. LLM conversation testing needs more thought.

16. **PDF quote generation** — HTML template rendered as PDF, attached to email.

### 🟢 Nice to Have (Bonus Points)

17. Fully hosted prototype (Vercel + n8n cloud)
18. Observability dashboard (tokens, cost, latency per call)
19. LLM-as-judge eval system for conversational quality
20. WhatsApp integration (out of scope for 1 week, but impressive if done)
21. Custom Next.js dashboard instead of Airtable Interface
22. Cross-session memory (remembering a client from a previous conversation)

---

## 7. Tools Guide

### Tool Decision Matrix

| Tool                      | Required?      | Option A             | Option B         | Free Tier                 | Notes                            |
| ------------------------- | -------------- | -------------------- | ---------------- | ------------------------- | -------------------------------- |
| **GitHub**                | ✅ Yes          | Yes                  | Yes              | Free                      | Version control is graded        |
| **n8n**                   | ✅ Yes          | Brain                | Back-office      | Free (self-hosted)        | Run locally with tunnel for demo |
| **Next.js / React**       | ✅ Yes          | Frontend             | Frontend + brain | Free                      | The UI layer                     |
| **Vercel**                | ✅ Yes          | Deploy               | Deploy           | Free tier                 | Auto-deploys from GitHub         |
| **Airtable**              | Option A only  | Database + dashboard | No               | Free tier                 | No-code dashboard is the appeal  |
| **Supabase**              | Option B only  | No                   | Database         | Free tier                 | Postgres + REST API              |
| **Resend or Brevo**       | ✅ Yes          | Email                | Email            | Free tier (Resend: 3k/mo) | Sending quotes + relances        |
| **LLM API**               | ✅ Yes          | OpenAI/Anthropic     | OpenAI/Anthropic | Paid (€10-15 budget)      | GPT-4o-mini or Claude Haiku      |
| **Notion**                | ❌ Not required | Optional             | Optional         | Free                      | GitHub MD files can replace it   |
| **Puppeteer / react-pdf** | Option B       | No                   | PDF generation   | Free                      | For generating quote PDFs        |

### GitHub — Setup

```bash
# One person creates the repo, others are added as collaborators
git init
git remote add origin https://github.com/[team-org]/neotravel
git branch -M main
git push -u origin main

# Branch strategy (simple, for 1 week)
main          # stable, demo-ready
dev           # integration branch  
feat/[name]  # individual feature branches
```

**Required files in repo:**
- `README.md` — project overview, setup instructions, architecture diagram
- `CLAUDE.md` — auto-loaded context for Claude Cowork sessions
- `project/PROJECT_RULES.md` — rules and checklist
- `project/PRICING_ENGINE.md` — pricing reference

### n8n — Setup (Local with Tunnel)

```bash
# Install n8n globally
npm install n8n -g

# Start n8n
n8n start

# Access at http://localhost:5678
# For demo: use ngrok or cloudflare tunnel to expose publicly
npx ngrok http 5678
```

**n8n free self-hosted:** No limits on workflows. For production: n8n cloud ~$20/month (not needed for this project).

**Key nodes you'll use:**
- Webhook (trigger from form/Next.js)
- AI Agent + OpenAI Chat Model
- Airtable node (Option A)
- HTTP Request node (call your own `calculer_devis()` endpoint)
- Code node (run JS — where `calculer_devis()` lives in Option A)
- Schedule Trigger (for relances)
- Send Email (Resend/SMTP)
- If/Switch (routing: complete? urgent? >85 pax?)

### Vercel — Setup

```bash
# Install Vercel CLI
npm install -g vercel

# In your Next.js project
vercel login
vercel         # deploy (follows prompts)
vercel --prod  # deploy to production URL
```

**Free tier:** Unlimited deployments, custom domain, HTTPS. More than enough.

### Airtable — Setup (Option A)

1. Create a free account at airtable.com
2. Create a new base: "NeoTravel CRM"
3. Create tables: Demandes, Matrices, Devis, Clients, Logs
4. Get API key: Account → API → Generate key
5. Get Base ID: from the URL when viewing your base
6. In n8n: add Airtable credentials with API key

**Pricing matrices in Airtable:** Create the Matrices table so the client can update coefficients without touching code. See [project/PRICING_ENGINE.md](project/PRICING_ENGINE.md) for the exact structure.

### Supabase — Setup (Option B)

1. Create account at supabase.com
2. Create new project: "NeoTravel"
3. Get URL and anon key from Settings → API
4. Run SQL to create tables (see data model below)
5. In Next.js: `npm install @supabase/supabase-js`

```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
```

### Resend — Setup (Recommended)

1. Create account at resend.com (free: 3,000 emails/month)
2. Add and verify a sender domain (or use the test domain for demo)
3. Get API key from dashboard
4. `npm install resend`

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({ from: 'quotes@yourdomain.com', to: client.email, subject: 'Votre devis NeoTravel', attachments: [{ filename: 'devis.pdf', content: pdfBuffer }] });
```

### Notion — Is It Required?

**No.** GitHub with `.md` files is sufficient for project management and documentation. However:
- Notion is better for living docs that non-technical team members edit
- The L1 dossier de cadrage can be a PDF or Notion page — either works
- If you already use Notion, keep it. If not, don't spend time setting it up.

**Recommendation:** Use GitHub MD files + a simple Kanban in GitHub Projects (free). That's enough.

---

## 8. Rules Guidelines and Checklist

### Architecture Rules

- [ ] Choose ONE orchestrator: n8n AI Agent OR Vercel AI SDK. Never both.
- [ ] `calculer_devis()` is pure deterministic code. LLM never calls a math formula.
- [ ] Pricing coefficients live in the database (Airtable/Supabase), not hardcoded.
- [ ] LLM uses tools for every real action (DB write, price calc, PDF gen, email send).
- [ ] The conversational UI is the main experience — not a corner chatbot widget.

### Data Rules

- [ ] Every lead is stored in the CRM immediately upon capture.
- [ ] Status is updated at every pipeline transition.
- [ ] >85 passengers → route to "Complex Case" status → human handling.
- [ ] Each data field has a documented purpose (GDPR: purpose specification).
- [ ] Test data does not contain real PII — use anonymized or fake data.

### Follow-up Rules

- [ ] Maximum 2 follow-ups per lead. After that: close the file.
- [ ] Urgent lead: J+2 first follow-up.
- [ ] Standard lead: J+3 first follow-up, J+7 second.
- [ ] Follow-up trigger is idempotent — same lead cannot receive the same follow-up twice.
- [ ] For demo: configure 2-minute delay instead of days to show relance live.

### Code Quality Rules

- [ ] Git repo initialized before writing first line of code.
- [ ] Meaningful commit messages (e.g., `feat: add calculer_devis() with flat rate table`).
- [ ] README.md includes: project description, architecture diagram, setup instructions.
- [ ] `calculer_devis()` has unit tests with known input/output pairs.
- [ ] Environment variables in `.env.local`, never committed to Git.

### Security Rules

- [ ] Client message text is separated from system instructions in prompts.
- [ ] Tools follow least-privilege: agent can only read/write what it needs.
- [ ] No sensitive client data logged in plain text.

### Budget Rules

- [ ] All tools together: <€1,000/month (client constraint).
- [ ] LLM calls: budget €10–15 per group project (use mini/haiku models).
- [ ] Do not use AI for price calculation (wastes tokens, introduces errors).
- [ ] Do not test with expensive models during development.

---

## 9. Critical Rules That Can Kill the Project

These are the rules that, if broken, directly cost you grade points or compromise the live demo.

### ❌ RULE 1: Never Let the LLM Calculate Prices
If an AI hallucinating "€2,400" instead of "€1,850" is caught by the jury → project credibility gone. The deterministic guardrail is explicitly graded under "Reliability & Guardrails" (10 points). **Zero tolerance.**

### ❌ RULE 2: Do Not Duplicate Agent Logic in Both Tools
If you start with n8n AI Agent and also wire up Vercel AI SDK to do the same thing, you'll have two agents fighting each other, broken state, and a system impossible to debug. **Pick one orchestrator and use the other for its non-brain role only.**

### ❌ RULE 3: The Demo Must Actually Work Live
15/25 demo points require a working live path: lead in → quote out → follow-up triggered. A slideshow of screenshots will not pass. If you demo n8n: have it running and accessible via a public URL. **If the system is down during demo, you lose the most points.**

### ❌ RULE 4: Everyone Must Speak at the Presentation
"All members must speak — those who do not speak cannot be graded on the oral block." That's 25 points at risk. Plan speaking parts for all three of you NOW.

### ❌ RULE 5: Do Not Miss the L1 Deadline
L1 (dossier de cadrage) is due June 24 at 23:59. No late submissions accepted. Submit whatever you have. L1 is worth 15 points and is the only deliverable due before the main build.

### ❌ RULE 6: The Conversational UI Must Be Central
"We do not want a chatbot in the corner." If you build a chatbot bubble in the bottom-right of a normal landing page, you are misunderstanding the project. The conversation IS the main interface. Inspiration: Mindtrip.ai.

### ❌ RULE 7: Handle the >85 Passengers Edge Case
If a request comes in for 100 passengers and your system crashes or sends a wrong quote, the jury will notice. This is a known constraint — route it to "Complex Case" and show a proper human handoff message.

### ❌ RULE 8: README Must Exist and Be Readable
Code quality (6 points) includes the Git repo and README. A missing README is easy points thrown away.

---

## 10. Reading Between the Lines

These are things that were implied but not stated directly.

**The evaluator was once an actual NeoTravel consultant.** Julien (the president in the brief) is not just a fictional character — the presenter confirmed deep familiarity with the exact pain points. They know when your system is realistic vs. theoretically plausible. A fake demo or a system that "works in slides" will be transparent.

**The jury evaluates you as digital consultants, not just coders.** Block C (oral) asks for business reasoning: what does this save? What are the KPIs? What risk did you mitigate? You should be able to talk business ROI, not just tech architecture. Prepare: "What would happen if NeoTravel treated 20% more leads with the same team?"

**HITL is graded explicitly.** Human-in-the-loop is listed under "Reliability & Guardrails" (10 pts). It's not a nice-to-have. You MUST show a scenario where the system escalates to human: either a complex case flag, a high-value quote threshold, or incomplete data.

**The L3 passation (handoff doc) is 7 points that most teams overlook.** It's a technical procedure (how to run/deploy the system) + a team procedure (how a salesperson uses it). Write it last but do not forget it.

**The pricing matrices must be editable without touching code.** The brief says "all these elements must be controllable to be adjusted in real time." Store them in Airtable/Supabase. The jury may ask: "How does the client update seasonal coefficients?" You must have an answer.

**"A form is acceptable if justified" is real — but the emphasis is on "justified."** If you submit a plain HTML form with no explanation of why you chose it over conversational UI, you lose narrative coherence. If you say "we chose a structured form for higher data quality and combined it with an assistant for clarification on ambiguous fields," you have a defensible position.

**Session history is required; cross-session memory is bonus.** Do not confuse these. Within a session, the agent must remember what the user said 5 messages ago. Between sessions — if they come back tomorrow — you don't need to remember them (but it's a bonus).

**The 2-minute follow-up delay for demo is not a hack — the brief suggests it.** Reconfigure your n8n Schedule Trigger to fire every 2 minutes for the demo instead of every day. Revert before submission.

**The €10–15 AI credit is per group, not per person.** That's your total budget for LLM API calls across the entire project. Use cheap models (GPT-4o-mini ≈ $0.15/1M tokens input, Claude Haiku ≈ $0.25/1M). Do not use GPT-4o or Claude Sonnet for everything.

**The agile 4 points are for process, not just commits.** They want to see: backlog created early, tasks assigned, progress tracked. A GitHub Projects Kanban board with cards created on Day 1 shows this.

---

## 11. Decisions to Agree On Before Building

These are the things your team must align on. Each is a fork in the road — wrong choice, and you waste days.

### Decision 1: Stack Option A (n8n) or Option B (Vercel AI SDK)?

|                | Option A — n8n AI Agent                     | Option B — Vercel AI SDK             |
| -------------- | ------------------------------------------- | ------------------------------------ |
| Who it's for   | Comfortable with no-code/low-code           | Comfortable in TypeScript/React      |
| AI brain       | n8n AI Agent node                           | Vercel AI SDK in Next.js             |
| n8n role       | Everything                                  | Back-office (relances, CRM writes)   |
| Dashboard      | Airtable Interface (no-code)                | Custom React/Next.js page            |
| Difficulty     | Lower                                       | Higher                               |
| Recommendation | Works standalone, Claude is blind to n8n UI | **✅ RECOMMENDED with Claude Cowork** |

**Use Option B.** The key factor: Claude Cowork works with *files*. With Option A, the AI agent lives inside n8n's browser UI — Claude can't read or edit it, so you're constantly copy-pasting between Claude and n8n. When something breaks, Claude can't see the workflow to debug it. With Option B, everything is TypeScript files in your GitHub repo — Claude reads, writes, and fixes all of it directly. You run `npm run dev`, paste an error, Claude fixes the file. The "technical difficulty" of Option B disappears when Claude is doing the coding. The only n8n you need is a minimal one for scheduled follow-ups (2 nodes, 15 minutes to set up).

### Decision 2: Chatbot Interface or Form?

**Use the hybrid approach** — structured form for required fields, then AI assistant for clarification. Why: a pure chatbot must extract structured data from free text ("I need a bus for 45 people to Lyon next Friday"). That extraction can fail, and when it fails the whole chain (pricing, PDF, email) breaks. A form guarantees clean data into `calculer_devis()`. The AI handles the human part after. This is the safest path to a complete working demo, where 40 of your 100 points come from.

See [Section 14](#14-chatbot-vs-form) for the full breakdown.

### Decision 3: Who owns which component?

Suggested split:
- **Person A**: `calculer_devis()` + pricing engine + n8n tool nodes
- **Person B**: Frontend UI (Next.js form/chat) + webhook connection
- **Person C**: CRM schema (Airtable/Supabase) + PDF generation + email sending + dashboard

### Decision 4: What's your HITL threshold?

Decide on specific thresholds now, before building:
- Quote above €X → flag for human review
- Passenger count >85 → complex case
- Completeness score <70% after 2 attempts → escalate
- Client explicitly says "urgent" or "custom contract" → escalate

### Decision 5: What LLM model do you use?

- GPT-4o-mini (OpenAI) — very cheap, good enough for qualification and conversation
- Claude Haiku (Anthropic) — similar price/quality
- Do NOT use GPT-4o or Claude Sonnet for every call — burns the budget

### Decision 6: Airtable or Supabase?

If you pick Option A: use Airtable (it has a built-in dashboard UI, no-code).
If you pick Option B: use Supabase (better suited for code-first stack).
Do not mix both.

---

## 12. Project Phases and Task Organization

### Phase 0 — Align & Setup (June 22, Today)
**Goal:** Everyone understands the project and tools are ready.

- [x] Read project documents (all three team members)
- [x] Decide: Stack A or B?
- [x] Decide: Chatbot or form?
- [ ] Define HITL thresholds
- [ ] Create GitHub repo + invite collaborators
- [ ] Create accounts: LLM API, Airtable or Supabase, Resend, Vercel
- [ ] Set up n8n locally (run `n8n start`)
- [ ] Initialize Next.js project: `npx create-next-app@latest neotravel`
- [ ] Create GitHub Projects Kanban board with initial cards
- [ ] Set up `.env.local` with all API keys

### Phase 1 — Framing & L1 (June 22–24)
**Goal:** L1 dossier submitted by June 24 at 23:59.

- [ ] Write L1: business problem analysis
- [ ] Write L1: technical framing (stack choice + justification)
- [ ] Write L1: architecture diagram
- [ ] Write L1: 2–3 usage scenarios (happy path, edge case, HITL)
- [ ] Write L1: data model (tables + fields)
- [ ] Review + submit L1 before 23:59 on June 24

**L1 is 15 points. Do not skip this.**

### Phase 2 — Pricing Engine (June 24–25)
**Goal:** `calculer_devis()` works perfectly before any AI is connected.

- [ ] Implement `calculer_devis()` in pure TypeScript/JavaScript
- [ ] Implement flat rate table (up to 180km)
- [ ] Implement formula for >180km: `(km × 2) × €2.50`
- [ ] Implement round trip: simple transfer × 2
- [ ] Implement all coefficients: seasonality, urgency, capacity, margin
- [ ] Write unit tests: at least 5 known input/output pairs
- [ ] Store pricing matrices in Airtable/Supabase (editable without code)
- [ ] Test isolated: call function directly, verify results match pricing PDF

### Phase 3 — Data Model & CRM (June 25–26)
**Goal:** Database ready, forms working, data flowing.

- [ ] Create Demandes table with all required fields
- [ ] Create Matrices table (coefficients, editable)
- [ ] Create Devis table (quote records)
- [ ] Create Clients table
- [ ] Create Logs table (for observability)
- [ ] Test CRUD operations manually

### Phase 4 — Agent & Orchestration (June 26–27)
**Goal:** AI agent qualifies leads and calls tools.

- [ ] Write system prompt (role, rules, guardrails, tone)
- [ ] Connect LLM to n8n AI Agent (or Vercel AI SDK)
- [ ] Implement tool: `calculer_devis()` call
- [ ] Implement tool: CRM write (save lead to Airtable/Supabase)
- [ ] Implement tool: status update
- [ ] Implement tool: HITL escalation
- [ ] Test: full happy path from lead capture to quote generation
- [ ] Test: edge case — >85 passengers → complex case
- [ ] Test: incomplete data → agent asks clarifying question

### Phase 5 — PDF & Email (June 27–28)
**Goal:** Quote PDF generated and sent by email.

- [ ] Build PDF quote template (HTML or react-pdf)
- [ ] Implement PDF generation from `calculer_devis()` output
- [ ] Connect Resend/Brevo for email sending
- [ ] Send test email with PDF attachment
- [ ] Test full path: lead → quote → PDF → email sent

### Phase 6 — Follow-ups & Dashboard (June 28–29)
**Goal:** Relances work, pipeline is visible.

- [ ] Build n8n Schedule Trigger workflow for relances
- [ ] Implement urgency-based timing (J+2 vs J+3/J+7)
- [ ] Implement idempotency check (don't send relance twice)
- [ ] Implement max 2 follow-up cap → auto-close
- [ ] Build or configure dashboard (Airtable Interface or custom Next.js page)
- [ ] Configure demo mode: 2-minute delay for relances

### Phase 7 — L2, L3 & Hardening (June 29)
**Goal:** Deliverables submitted by June 29 at 23:59.

- [ ] Write L3: technical procedure (how to deploy and run the system)
- [ ] Write L3: team procedure (how a salesperson uses the dashboard)
- [ ] Finalize README
- [ ] Run through all 7 demo scenarios
- [ ] Test edge cases: >85 passengers, urgent request, missing data
- [ ] Test idempotency: trigger follow-up twice, confirm only one email sent
- [ ] Submit L2 (prototype) + L3 (handoff doc)

### Phase 8 — Slides & Oral Prep (June 30)
**Goal:** Slides submitted, everyone knows what they say.

- [ ] Build presentation deck (slides due June 30 at 23:59)
- [ ] Include: problem, solution, demo screenshots, architecture, KPIs/business value
- [ ] Assign speaking sections to each team member (all must speak)
- [ ] Rehearse the live demo at least twice
- [ ] Prepare answers for likely jury questions (see below)

### Phase 9 — Presentation (July 1)
**Goal:** Strong demo + confident oral defense.

**Likely jury questions to prepare:**
- "Why did you choose n8n over Vercel AI SDK / the reverse?"
- "How does the client update pricing coefficients?"
- "What happens if someone enters 200 passengers?"
- "How do you prevent sending the same follow-up twice?"
- "What is the business impact? What KPIs would you track?"
- "How does your system preserve the human relationship?"
- "What would you build next if you had 3 more weeks?"

---

## 13. Workspace and Atelier Setup

### Step-by-step: Day 1 Setup

**1. Create the GitHub repo**
```bash
# Person A creates the repo on github.com, sets it to private
# Invites Person B and Person C as collaborators
# Everyone clones:
git clone https://github.com/[team]/neotravel.git
cd neotravel
```

**2. Initialize the Next.js project**
```bash
npx create-next-app@latest . --typescript --tailwind --app
npm install
npm run dev  # verify http://localhost:3000 works
```

**3. Create the GitHub Projects Kanban**
- Go to github.com/[team]/neotravel → Projects → New Project
- Use "Board" layout
- Columns: Backlog → In Progress → Review → Done
- Add cards for every Phase task above

**4. Set up your LLM API accounts**
- OpenAI: platform.openai.com → API keys → Create key (add €15 credit)
- OR Anthropic: console.anthropic.com → API keys

**5. Set up n8n locally**
```bash
npm install -g n8n
n8n start
# Opens at http://localhost:5678
# Create a free account when prompted
```

**6. Set up Airtable (Option A) or Supabase (Option B)**
- Airtable: airtable.com → Create new base → "NeoTravel CRM"
- Supabase: supabase.com → New project → "NeoTravel"

**7. Set up Resend**
- resend.com → Create account → API Keys → Create key
- For demo: use test domain (no DNS setup needed for testing)

**8. Set up Vercel**
```bash
npm install -g vercel
vercel login  # authenticate with GitHub
# When ready to deploy:
vercel  # follows prompts, connects to your GitHub repo
```

**9. Create `.env.local` at project root**
```bash
# Never commit this file to Git
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

RESEND_API_KEY=re_...

# Option A
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=app...

# Option B
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# n8n webhook URL (update when tunneled)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/neotravel
```

**10. Create `.gitignore`** (create-next-app does this, just verify)
```
.env.local
.env
node_modules/
.next/
```

### What Needs to be Agreed Before the First Commit

1. ✅ Stack A or B
2. ✅ Chatbot or form  
3. ✅ HITL thresholds
4. ✅ Task ownership per person
5. ✅ Branch naming convention
6. ✅ Commit message convention

---

## 14. Chatbot vs Form

### The Short Answer

**Both are acceptable. A form alone is valid if justified. A hybrid is also fine.**

From the FAQ document (verbatim): *"Oui, si vous le justifiez. Un formulaire peut être plus fiable pour collecter des données structurées. Un parcours hybride (formulaire pour les informations obligatoires + assistant pour clarifier) est aussi recevable."*

### The Long Answer

The **chatbot** approach:
- Collects data conversationally — feels like a travel advisor
- Aligns with the Mindtrip.ai inspiration the teacher cited
- More impressive technically
- Harder to implement: must manage state, extract structured data from natural language
- Risk: if the conversation flow is buggy, the whole system breaks during demo

The **form** approach:
- More reliable for structured data collection
- Easier to build and less likely to fail during demo
- Less impressive, but demonstrates the same automation chain
- Must be justified in L1 dossier

The **hybrid** approach (recommended if unsure):
- Form for required structured fields (dates, passengers, route)
- Assistant picks up after form submission for: clarification, missing info, tone
- Avoids the risk of an LLM failing to extract `nb_passagers` from a free-text input
- Shows both technical capabilities

### What Matters More Than The Interface

The interface is the entry point. What's graded is the full chain that follows:
- Does data get into the CRM? ✓
- Is the quote calculated deterministically? ✓
- Does the PDF get generated? ✓
- Is the email sent? ✓
- Are follow-ups triggered on schedule? ✓
- Does HITL work? ✓

A beautiful chatbot that breaks on step 3 scores lower than a plain form that completes the full chain.

### Recommendation

If you have the time and skill: **conversational UI as the main interface** (what the teacher envisions).

If you're under time pressure: **hybrid** — structured form for data capture, then AI assistant takes over for qualification, clarification, and personalization.

Either way, **write a 2–3 sentence justification in L1** explaining why you chose your approach.

---

## 15. Grading Breakdown

### Block A — Deliverables (50 points)

**L1 — Dossier de cadrage (15 points)** · Due June 24
- Problem analysis + prioritization: **7 pts**
  - Business framing, identified friction, KPIs
- Technical framing + scenarios: **8 pts**
  - Architecture, stack justification, 2-3 usage scenarios, data model

**L2 — Prototype + Artifacts (28 points)** · Due June 29
- Functional prototype: **8 pts**
  - SOCLE (required): Full chain working + n8n accessible from outside
  - BONUS: Fully hosted (Vercel + n8n cloud)
- Reliability + guardrails: **10 pts**
  - Deterministic price calculation
  - Test cases for `calculer_devis()`
  - HITL implemented
  - GDPR basic compliance
  - Prompt injection protection
  - BONUS: Observability/tracing
- Code quality: **6 pts**
  - Git repo with history
  - README (setup + architecture)
  - Tests
- Agile approach: **4 pts**
  - Backlog created early
  - Tasks tracked
  - Commits show progressive work

**L3 — Handoff Documentation (7 points)** · Due June 29
- Technical procedure: how to deploy and run the system
- Team procedure: how a salesperson uses the dashboard and tools

### Block B — Demo (25 points)

- Full live path (lead → quote → email → follow-up): **15 pts**
- Robustness on unscripted/edge cases: **6 pts**
- Tool mastery (you know what you built): **4 pts**

### Block C — Oral (25 points)

- Pitch + clarity: **7 pts**
- Technical defense: **8 pts**
- Jury Q&A: **5 pts**
- Posture + professionalism: **5 pts**

**Important:** Those who don't speak cannot be graded on Block C (25 pts).

---

## 16. Deadlines

| Deliverable | Deadline | Points at Risk |
|------------|----------|----------------|
| **L1 — Dossier de cadrage** | **June 24, 2026 at 23:59** | 15 pts |
| **L2 — Prototype + artifacts** | **June 29, 2026 at 23:59** | 28 pts |
| **L3 — Handoff documentation** | **June 29, 2026 at 23:59** | 7 pts |
| **Presentation slides** | **June 30, 2026 at 23:59** | — |
| **Live presentation** | **July 1, 2026** | 25 + 25 pts |

**No late submissions accepted.**

---

*Last updated: June 22, 2026 | Generated from all 12 project source documents*
