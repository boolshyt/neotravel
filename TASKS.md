# NeoTravel — Task Board

> **Team:** Gendell · Inde · Yahia | **Repo:** github.com/boolshyt/neotravel

---

## Deadlines

| Date | Deliverable | Who |
|---|---|---|
| **June 24 at 23:59** | L1 — Dossier de cadrage | All 3 |
| **June 29 at 23:59** | L2 — Prototype + L3 — Handoff docs | Gendell + Inde |
| **June 30 at 23:59** | Presentation slides | Yahia + Inde |
| **July 1** | Live presentation + demo | All 3 |

---

## PHASE 0 — L1 Dossier de Cadrage _(due June 24 at 23:59)_

> No tools or setup needed — this is a writing task. The draft is already in `L1_DOSSIER_DE_CADRAGE.md`.
> Each person writes their section and pushes. Gendell submits the final PDF.

| #   | Who         | Task                     | Detail                                                                                                                                                |
| --- | ----------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Gendell** | Read the full draft      | Open `L1_DOSSIER_DE_CADRAGE.md` and read through all 9 sections                                                                                       |
| 2   | **Gendell** | Push to GitHub           | `git add . && git commit -m "docs: L1 draft" && git push` so the team can access it                                                                   |
| 3   | **Inde**    | Pull the repo            | `git pull` to get the latest version                                                                                                                  |
| 4   | **Inde**    | Write Section 2.1        | Add 2–3 paragraphs in French in Section 2.1: what NeoTravel does today, why the manual process is a problem, what automation changes for the business |
| 5   | **Inde**    | Push your changes        | `git add L1_DOSSIER_DE_CADRAGE.md && git commit -m "docs: add business analysis" && git push`                                                         |
| 6   | **Yahia**   | Pull the repo            | `git pull` to get the latest version                                                                                                                  |
| 7   | **Yahia**   | Write competitor section | In Section 9, add 2–3 competitor examples (name + one line each — e.g. GetTransfer, Mozio, Autocars.com)                                              |
| 8   | **Yahia**   | Push your changes        | `git add L1_DOSSIER_DE_CADRAGE.md && git commit -m "docs: add competitor research" && git push`                                                       |
| 9   | **Gendell** | Final review             | Pull latest, read the full document with all additions, adjust anything off                                                                           |
| 10  | **Gendell** | Submit                   | Export to PDF and submit on the Epitech platform before **June 24 at 23:59**                                                                          |

---

## PHASE 1 — Dev Setup _(June 24–25, after L1 is submitted)_

> One-time setup so everyone can run the project locally. Everything is free — no credit card needed.

| Account / Tool | Who | How |
|---|---|---|
| **Gemini API key** | Gendell | Go to [aistudio.google.com](https://aistudio.google.com) → sign in → Get API key → save it somewhere safe |
| **Node.js** | Gendell + Inde | Download LTS from [nodejs.org](https://nodejs.org) → install → verify: `node --version` |
| **n8n** | Gendell | In terminal: `npm install n8n -g` then `n8n start` → open [localhost:5678](http://localhost:5678) |
| **Airtable account** | Gendell | Sign up at [airtable.com](https://airtable.com) → create a base called **"NeoTravel CRM"** |
| **Airtable API key** | Gendell | Profile icon → Account → API → generate personal access token → save it |
| **GitHub collaborators** | Gendell | Settings → Collaborators → add Inde and Yahia's GitHub usernames |
| **Vercel** | Inde | Sign up at [vercel.com](https://vercel.com) using your GitHub account |
| **Resend** | Inde | Sign up at [resend.com](https://resend.com) → API Keys → create a key → save it |
| **Clone repo** | Inde + Yahia | `git clone https://github.com/boolshyt/neotravel.git` |

---

## PHASE 2 — Database + Frontend _(June 25–26)_

> Gendell builds the Airtable database. Inde initializes the Next.js project. They work in parallel.

### Gendell — Airtable Database

| # | Task | Detail |
|---|---|---|
| 1 | Build `Demandes` table | Fields: Name, Company, Email, Phone, Departure, Destination, Date, Passengers, TripType, Urgency, Comment, Status, CompletenessScore, CreatedAt |
| 2 | Build `Matrices` table | Fields: SeasonalityCoeff, UrgencyCoeff, CapacityCoeff, Margin — these are editable by the client without touching code |
| 3 | Build `Devis` table | Fields: LeadID, PrixHT, TVA, PrixTTC, Status, PDFUrl, SentAt, RelanceCount, NextRelanceAt |
| 4 | Build `Clients` table | Fields: Name, Company, Email, Phone, History |
| 5 | Set up Airtable Interface | Click "Interfaces" tab → create a dashboard with views: leads by status / new this week / awaiting follow-up |

### Inde — Next.js Project

| # | Task | Detail |
|---|---|---|
| 1 | Initialize the project | In the `neotravel` folder: `npx create-next-app@latest . --typescript --tailwind --app` |
| 2 | Create folders | Create `components/` and `lib/` at the root |
| 3 | Create `.env.local` | At the root (never commit this file): add `RESEND_API_KEY=` and `N8N_WEBHOOK_URL=` (get URL from Gendell in Phase 3) |
| 4 | Push to GitHub | `git add . && git commit -m "feat: init next.js" && git push` |
| 5 | Connect to Vercel | vercel.com → New Project → Import from GitHub → select `boolshyt/neotravel` → Deploy |

---

## PHASE 3 — Automation + Conversational Form _(June 26–27)_

> Gendell builds the n8n workflows. Inde builds the multi-step form. They work in parallel.

### Gendell — n8n Workflows

**Workflow 1 — Lead Qualification**

| # | Task | Detail |
|---|---|---|
| 1 | Create workflow | n8n → New Workflow → name it "Lead Qualification" |
| 2 | Add Webhook node | Entry point — copy the webhook URL and share it with Inde |
| 3 | Add Airtable node | Save lead immediately → base "NeoTravel CRM" → table "Demandes" → Status: "New Lead" |
| 4 | Add Gemini node | Google Gemini Chat Model → connect API key → model `gemini-2.0-flash` → check completeness score + passenger count |
| 5 | Write system prompt | Role, rules, tone (see `project/PROJECT_RULES.md`) — AI only evaluates completeness, never calculates prices |
| 6 | Add If node (passengers) | If passengers > 85 → update Status: "Complex Case" → send acknowledgment email → stop |
| 7 | Add If node (completeness) | If score < 70% → update Status: "Incomplete" → send clarification email → stop |
| 8 | Add Code node | Implement `calculer_devis()` (full formula in `project/PRICING_ENGINE.md`) — takes distance_km from form data |
| 9 | Add PDF generation | Generate quote PDF from calculer_devis() output |
| 10 | Add Resend node | Send email + PDF to client |
| 11 | Add Airtable update node | Status: "Quote Sent" → set NextRelanceAt (J+2 if urgent, J+3 if standard) |
| 12 | Test | Submit fake form data → confirm lead in Airtable + email received with PDF |

**Workflow 2 — Follow-up Scheduler**

| # | Task | Detail |
|---|---|---|
| 1 | Create workflow | New Workflow → name it "Follow-up Scheduler" |
| 2 | Add Schedule Trigger | Every 2 minutes (demo) — change to daily for production |
| 3 | Add Airtable node | Query: Status = "Quote Sent" OR "Follow-up 1" AND NextRelanceAt ≤ today |
| 4 | Add If node | RelanceCount < 2 → true: send follow-up email / false: update Status to "Closed" |
| 5 | Add Resend node | Send follow-up email (true branch only) |
| 6 | Add Airtable update node | RelanceCount +1 → update Status ("Follow-up 1" or "Follow-up 2") → set new NextRelanceAt |

### Inde — Conversational Form

| # | Task | Detail |
|---|---|---|
| 1 | Build multi-step form | One question per screen, progress bar, French copy — steps: client type → name → email → phone → departure → destination → date → passengers → trip type → urgency → **distance approximative (km)** → comment → confirmation |
| 2 | Connect to n8n | On submit: POST form data as JSON to the `N8N_WEBHOOK_URL` from `.env.local` (get URL from Gendell) |
| 3 | Test | Submit the form → ask Gendell to confirm the lead appeared in Airtable |
| 4 | Push | `git add . && git commit -m "feat: add lead capture form" && git push` |

---

## PHASE 4 — Email + PDF _(June 27–28)_

> Full flow: form → AI → quote → PDF → email. Inde writes templates, Gendell wires them in.

| Who | Task | Detail |
|---|---|---|
| **Inde** | Write email template | HTML, French, professional: quote HT/TVA/TTC, trip details, CTA to confirm or call, NeoTravel contact info |
| **Inde** | Write PDF template | NeoTravel header, client details, trip details, full price breakdown, validity date, signature area |
| **Inde** | Share Resend API key | Send it to Gendell — he needs it for the n8n email node |
| **Gendell** | Connect email in n8n | Wire the Resend node with Inde's key → confirm emails send correctly |
| **Both** | End-to-end test | Submit form → verify email is received with PDF attached → check content looks correct |

---

## PHASE 5 — Testing + Demo Prep _(June 28–29)_

> All 5 demo scenarios must run cleanly before June 29. L2 + L3 submitted June 29 at 23:59.

### Demo Scenarios — run all 5

| # | Scenario | What to verify |
|---|---|---|
| 1 | **Happy path** — complete data submitted | Lead in Airtable, quote generated, email + PDF received |
| 2 | **Incomplete data** — missing a required field | AI asks for the missing info, completes on retry |
| 3 | **>85 passengers** — enter 100 passengers | Routes to "Cas Complexe", no auto-quote, human alert sent |
| 4 | **Follow-up** — submit a lead, wait 2 minutes | Follow-up email arrives automatically |
| 5 | **Dashboard** — open Airtable Interface | Pipeline shows leads by status, new this week, follow-ups pending |

### Who does what

| Who         | Task                     | Detail                                                                                     |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| **Gendell** | Run all 5 scenarios      | Fix anything that breaks                                                                   |
| **Gendell** | Set up ngrok             | `npm install -g ngrok` → `ngrok http 5678` → share public URL with Inde for live demo      |
| **Gendell** | Confirm dashboard        | Airtable Interface shows pipeline correctly                                                |
| **Inde**    | Write L3 — technical doc | How to install and run the system from scratch: clone, env setup, n8n start, next.js start |
| **Inde**    | Write L3 — usage doc     | How a salesperson uses the Airtable dashboard day-to-day (non-technical)                   |
| **Inde**    | Submit L2 + L3           | Before **June 29 at 23:59**                                                                |
| **Yahia**   | Test as a real client    | Submit 3 requests (standard, urgent, >85 passengers) → report what worked and what didn't  |

---

## PHASE 6 — Slides + Oral Prep _(June 29–30, due June 30 at 23:59)_

### Slide Structure (Yahia leads)

| Slide | Content |
|---|---|
| 1 | Title — NeoTravel · team names · MBA1 Epitech · July 1, 2026 |
| 2–3 | The problem — 60 leads/day, manual process, missed revenue |
| 4–5 | The solution — architecture diagram + the 10 functions |
| 6 | Demo flow — what happens when a client submits the form |
| 7 | Business impact — leads treated, time saved, follow-up rate |
| 8 | Technical choices and why |
| 9 | What we'd build next (roadmap) |
| 10 | Q&A |

### Jury Q&A — prepare answers

| Question | Who answers |
|---|---|
| What business problem does this solve? | Yahia |
| Why n8n over other tools? | Gendell |
| How does the system preserve the human relationship? | Inde |
| What would NeoTravel need to do to put this in production? | All 3 |
| Walk me through what happens when a lead submits the form | Gendell |

### Oral prep

| Task | Who | When |
|---|---|---|
| Assign speaking sections | All 3 | June 29 |
| First rehearsal (full demo included) | All 3 | June 30 morning |
| Second rehearsal | All 3 | June 30 evening |

---

## Git — Stay in Sync

```bash
# Before starting work
git pull

# After finishing
git add .
git commit -m "short description of what you did"
git push
```
