# NeoTravel — Automatisation des processus commerciaux

Prototype développé dans le cadre du Hackathon MBA1 · Epitech Interstellabs · Juillet 2026.

**Équipe :** Gendell Janssens · Yahia Baakili · Inde Hadoui

---

## Présentation

NeoTravel est un intermédiaire spécialisé dans le transport de groupe (8 à 85 personnes).
Ce prototype automatise le traitement des leads entrants : qualification, calcul de devis, relances.

**Stack :** Next.js · n8n · Airtable · Gemini 2.0 Flash · Resend

**Démo live :** https://neotravel-seven.vercel.app

---

## Architecture

```
Formulaire Next.js
      ↓
/api/submit-lead  →  n8n WF1 (Qualification)
                          ↓
                    Agent IA (Gemini)
                    évalue complétude
                          ↓
                  score ≥ 70% ?
                  ├── Oui → calculer_devis() → PDF → Resend
                  └── Non → email /clarification → re-trigger WF1

n8n WF2 (Schedule J+3/J+7)
      ↓
/api/relance  →  Relance automatique avec idempotence (lead_id + relance_count)

> 85 passagers → Escalade HITL → commercial alerté dans l'heure
```

---

## Structure du projet

```
app/
├── api/
│   ├── submit-lead/route.ts   → Proxy formulaire → n8n WF1
│   └── relance/route.ts       → Déclenchement WF2 relances
├── chat/page.tsx              → Interface Emma (chat conversationnel)
└── page.tsx                   → Formulaire 12 étapes
lib/
└── calculer-devis.ts          → Moteur de tarification déterministe
docs/
└── PRICING_ENGINE.md          → Règles de calcul officielles NeoTravel
```

---

## Installation

```bash
git clone https://github.com/boolshyt/neotravel.git
cd neotravel
npm install
```

Créer un fichier `.env.local` à la racine :

```env
N8N_WEBHOOK_URL=https://gendellepitech.app.n8n.cloud/webhook/neotravel
N8N_RELANCE_URL=https://gendellepitech.app.n8n.cloud/webhook/neotravel-relance
```

Lancer en local :

```bash
npm run dev
```

Ouvrir : http://localhost:3000

---

## Règle d'or

> L'IA ne calcule jamais les prix. `calculer_devis()` est déterministe : même input → même output, sans exception. Gemini qualifie uniquement la complétude textuelle.

---

## Déploiement

Push sur `main` → déploiement automatique sur Vercel.
