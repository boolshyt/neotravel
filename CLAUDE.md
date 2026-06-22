# NeoTravel — Claude Cowork Context

> This file is automatically read by Claude Cowork at the start of every session.
> Team: Gendell, Inde, Yahia | MBA1 Epitech | Presentation: July 1, 2026

**GitHub Repo:** https://github.com/boolshyt/neotravel

---

## What This Project Is

NeoTravel is a group transport intermediary (France, since 2010). They receive ~60 leads/day but manually process them — missing leads, slow quotes, no follow-up automation.

**Our mission:** Build a functional prototype automating the full commercial chain:
`Lead capture → Qualification → Quote (deterministic) → PDF → Email → Follow-ups → Dashboard`

---

## The Single Most Important Rule

**THE LLM NEVER CALCULATES PRICES. EVER.**

All pricing goes through `calculer_devis()` — a pure, deterministic code function. The AI agent calls this as a tool and passes the result. It does not compute or estimate any prices in natural language.

See `project/PRICING_ENGINE.md` for the exact formula and coefficients.

---

## Project Files Map

| File | What it contains | When to read |
|------|-----------------|--------------|
| `NEOTRAVEL_PROJECT_GUIDE.md` | Full English guide: context, concepts, phases, setup | Full project orientation |
| `project/PROJECT_RULES.md` | Rules checklist + critical guardrails | Before any code decision |
| `project/PRICING_ENGINE.md` | `calculer_devis()` function spec + all pricing tables | Before working on pricing or quotes |
| `README.md` | Tech setup instructions | Dev environment setup |

---

## Stack Decision

**We are using:** *(confirm and check the box once decided)*
- [ ] Option A: n8n AI Agent + Next.js (UI only) + Airtable + Resend
- [ ] **Option B: Vercel AI SDK + Next.js (brain) + Supabase + n8n (scheduling only) + Resend** ← RECOMMENDED when working with Claude Cowork

Do not implement both. Pick one, check the box, and update this line.

---

## Architecture (Target)

```
Landing Page (Next.js) — conversational UI OR form, NOT a corner chatbot widget
        ↓ webhook
    AI Agent (n8n or Vercel AI SDK)
    ↙      ↓         ↓        ↘
lookup  calculer_  CRM write  schedule
rules   devis()    (Airtable  relance
(DB)    [CODE]     /Supabase) (n8n)
        ↓
    Generate PDF → Send via Resend
        ↓
    Dashboard (Airtable Interface or custom Next.js page)
```

---

## Commercial Pipeline (Statuses)

```
New Lead → Incomplete → Qualified → Quote Sent → Follow-up 1 → Follow-up 2 → [Accepted | Refused | Complex Case] → Closed
```

- >85 passengers → always routes to "Complex Case" → human handling
- Urgent: J+2 follow-up | Standard: J+3 then J+7 | Max 2 follow-ups then close

---

## Data Tables

**Demandes:** prospect info, route, dates, passengers, status, urgency, completeness_score
**Matrices:** seasonality coeff, urgency coeff, capacity coeff, options — EDITABLE by client in DB
**Devis:** prix_ht, tva, prix_ttc, calculation lines, status, PDF, sent_date, relance_date, relance_count
**Clients:** client identity + history
**Logs:** LLM traces (prompt, response, tokens, cost, latency) — bonus

---

## `calculer_devis()` Contract

```typescript
// Inputs
interface DevisInput {
  nb_passagers: number;
  date_depart: Date;        // for seasonality coefficient
  date_demande: Date;       // for urgency coefficient (gap between demand and departure)
  distance_km: number;
  type_vehicule: 'minibus' | 'midibus' | 'standard' | 'large';
  aller_retour: boolean;
  options: ('guide' | 'chauffeur_nuit' | 'peages')[];
}

// Output
interface DevisOutput {
  prix_ht: number;
  tva: number;             // always 10%
  prix_ttc: number;
  lignes: { libelle: string; montant: number }[];
  coefficients: { name: string; value: number }[];
  devise: 'EUR';
}
```

Full pricing rules are in `project/PRICING_ENGINE.md`.

---

## HITL Thresholds (Human-in-the-Loop)

Escalate to human salesperson when:
- Passenger count > 85
- Quote amount > €[DEFINE THIS AS TEAM]
- Completeness score < 70% after 2 clarification attempts
- Client explicitly mentions "contrat personnalisé" or special conditions
- Agent confidence is low (set a threshold in system prompt)

When escalating: save full context to CRM, update status to "Complex Case", send acknowledgment email to client.

---

## Prompt Injection Defense

- Separate untrusted user message from system instructions in prompts
- Client message goes into `{user_message}` variable — never concatenated into system prompt directly
- Tools follow least-privilege: agent cannot delete records, cannot read other clients' data

---

## GDPR Basics

- Document purpose for each data field collected ("used to generate your transport quote")
- Do not log real client names/emails in test data — use fake data
- Inform users their data is processed in the interface
- Retention: define a deletion period (e.g., "leads closed for 90+ days are anonymized")

---

## Budget Constraints

- All tools combined: < €1,000/month (client constraint)
- LLM API: €10–15 budget for the whole group project
- Use GPT-4o-mini or Claude Haiku — NOT GPT-4o, Claude Sonnet, or o3 for routine calls
- Do NOT use AI to calculate prices (wastes tokens + introduces errors)

---

## Deadlines

| | Deadline |
|-|---------|
| L1 — Dossier de cadrage | **June 24, 2026 at 23:59** |
| L2 + L3 — Prototype + Handoff | **June 29, 2026 at 23:59** |
| Slides | **June 30, 2026 at 23:59** |
| Presentation | **July 1, 2026** |

---

## When Claude Works on This Project

- **Always check `project/PROJECT_RULES.md`** before making architectural decisions
- **Always check `project/PRICING_ENGINE.md`** before working on quoting, pricing, or `calculer_devis()`
- **Default to the chosen stack** (update the stack decision above once agreed)
- **Never suggest letting the LLM calculate prices** — this is a hard project rule
- When generating code, use **TypeScript** unless otherwise specified
- Prefer **tool calling / function calling patterns** over generating free-form text for actions
- When writing the system prompt for the AI agent, include: role definition, guardrails (no price calc), tone (professional, warm, French), escalation conditions
