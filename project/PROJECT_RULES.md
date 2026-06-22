# NeoTravel — Project Rules & Checklist

> Reference before every coding session and every architectural decision.
> These rules are derived from the full project brief, FAQ, technical booklet, and kickoff transcript.

---

## 🔴 Non-Negotiable Rules (Breaking These Fails the Project)

### Rule 1: The LLM Never Calculates Prices
- `calculer_devis()` is pure deterministic code
- The agent only calls this function as a tool and passes the result
- The agent NEVER estimates, approximates, or calculates prices in natural language
- This is explicitly graded under "Reliability & Guardrails" (10 pts)

**How to verify:** If you remove the LLM and call `calculer_devis()` directly, the output must be identical. If the price changes based on how the client phrases their request, you have a bug.

### Rule 2: Pick ONE Orchestrator
- Either n8n AI Agent (brain) OR Vercel AI SDK (brain)
- Not both
- n8n can still be used in Option B for scheduling and CRM writes — but it is not the AI brain in that case
- Dual-agent setups create broken state and are impossible to debug in a week

### Rule 3: The Demo Must Be Live
- The jury expects a real, functioning system during the demo
- Screenshots, Loom recordings, or "this is what it would look like" are not acceptable
- n8n must be accessible from the internet during demo (ngrok/cloudflare tunnel or n8n cloud)
- Test the full demo path at least twice the day before

### Rule 4: All Three Team Members Must Speak
- Block C oral (25 pts) requires all members to present
- Plan speaking assignments NOW
- Those who don't speak cannot be graded on the oral block

### Rule 5: No Late Submissions
- The system does not accept late work
- Submit L1 before June 24 at 23:59 even if incomplete
- Submit L2+L3 before June 29 at 23:59 even if incomplete

### Rule 6: Conversational UI Is the Central Interface
- The chat/form IS the main page — not a widget in the corner
- Inspiration: Mindtrip.ai (look it up)
- Standard landing page + floating chatbot bubble = wrong interpretation of the brief

### Rule 7: Handle >85 Passengers
- Passenger count >85 must route to "Complex Case" status
- Show a message explaining the lead will be handled by a salesperson
- Do not generate a quote for groups >85

### Rule 8: Pricing Coefficients Must Be Editable in the Database
- Seasonality, urgency, capacity coefficients live in the Matrices table
- Client must be able to update them without touching code
- This is explicitly stated in the pricing rules document

---

## 🟡 Architecture Checklist

### Agent Design
- [ ] System prompt defines: role, guardrails (no price calc), tone, escalation conditions
- [ ] Temperature is LOW (0.0–0.2) for data extraction steps
- [ ] Tool list is defined and minimal (least privilege)
- [ ] Agent extracts structured data (JSON/Zod schema) BEFORE calling any tool
- [ ] Session memory is maintained within a conversation (messages array passed to LLM)
- [ ] HITL triggers: >85 pax, high amount, low completeness, complex request

### Data Model
- [ ] Demandes table: all required fields (see list in CLAUDE.md)
- [ ] Matrices table: seasonality, urgency, capacity, margin, options — all editable
- [ ] Devis table: prix_ht, tva, prix_ttc, lignes, status, pdf_url, sent_date, relance_count
- [ ] Clients table: identity + history
- [ ] Status is updated at every pipeline transition

### Pricing Engine
- [ ] `calculer_devis()` is implemented in pure TS/JS with zero LLM dependency
- [ ] Flat rate table (0–180km) is implemented correctly
- [ ] >180km formula: `(km × 2) × 2.50` is implemented
- [ ] Round trip: simple transfer × 2
- [ ] All coefficients applied: seasonality, urgency, capacity, +15% margin, 10% VAT
- [ ] At least 5 unit tests with known inputs and expected outputs
- [ ] Function passes all tests before connecting to AI

### Follow-up System
- [ ] n8n Schedule Trigger configured (daily or 2-minute demo mode)
- [ ] Query: leads with status "Quote Sent" + no response + passed follow-up date
- [ ] Idempotency check: relance_count < 2 before sending
- [ ] After 2nd follow-up: status → "Closed"
- [ ] Emails are logged (relance_count incremented, next_relance_date updated)

### Security & Compliance
- [ ] Client message separated from system instructions in prompts
- [ ] No PII in test data (use fake names, fake emails)
- [ ] Data purpose documented for each field
- [ ] .env.local never committed to Git
- [ ] Webhook has basic auth or secret token

---

## 🟢 Quality Checklist (Affects Code Quality Score)

### Git & Repository
- [ ] Repository initialized on Day 1
- [ ] Commit messages are descriptive: `feat: implement calculer_devis() with capacity coefficient`
- [ ] At least one commit per working session (show progression)
- [ ] README.md exists with: project description, architecture diagram, setup steps
- [ ] .gitignore includes: .env.local, node_modules/, .next/

### Tests
- [ ] `calculer_devis()` unit tests written (minimum 5 cases)
- [ ] Edge case tests: 85 passengers (boundary), <30km, >300km
- [ ] Test for round trip vs one-way

### Documentation
- [ ] L3 technical procedure: how to run the system from scratch
- [ ] L3 team procedure: step-by-step for a salesperson
- [ ] Architecture diagram in README (can be ASCII or Mermaid)

---

## Demo Scenarios to Prepare

Test these paths before July 1:

1. **Happy path** — Standard lead, complete data, quote sent within session
2. **Incomplete lead** — Agent asks for missing information (e.g., destination city missing)
3. **Urgency handling** — "I need a bus for tomorrow" → urgency coefficient applied, fast follow-up
4. **>85 passengers** → Complex Case → human escalation message
5. **Follow-up trigger** — Set to 2-minute delay for demo, show automated email being sent
6. **Round trip** — Apply × 2 to base price, show calculation breakdown
7. **HITL scenario** — High value quote or very complex request → agent says "a salesperson will contact you"

---

## Common Mistakes to Avoid

| Mistake | Consequence |
|---------|------------|
| LLM generating price estimates | Hallucination risk, graded under reliability |
| Implementing both n8n and Vercel AI SDK as brain | Two agents fighting, broken state |
| Building a corner chatbot instead of central UI | Misunderstands the brief |
| Hardcoding pricing coefficients | Client cannot update them, breaks the brief requirement |
| Forgetting idempotency on follow-ups | Same lead gets 6 follow-up emails during demo |
| Not testing with n8n accessible publicly | Demo fails if localhost not tunneled |
| Only one person speaks at defense | 25 pts lost for silent members |
| Missing the L1 deadline | 15 pts gone, no recovery |
| Committing .env.local | API keys exposed, security issue |
| Testing with expensive LLM models | Burns the €10-15 budget before demo day |
