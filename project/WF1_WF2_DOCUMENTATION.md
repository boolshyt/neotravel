# NeoTravel — Documentation technique des workflows n8n

> Source : exports JSON `livrables/WF1_Agent_Chat.json` et `livrables/WF2_Relances_Automatiques.json`
> WF1 ID : `WOuZ7XmuDifc3USN` | WF2 ID : `U4yS1Fpm6qJlGKBl`

---

## WF1 — Agent Chat (Neotravel — Agent Chat FIXED)

### Rôle

Reçoit les messages du chat frontend, les passe à l'agent Emma (Gemini 2.5 Flash), puis déclenche le calcul de prix, l'enregistrement CRM et l'envoi du devis par email dès que toutes les informations sont collectées.

### Flux complet

```
Chat Webhook
    → Normaliser Payload
        → Agent Neotravel ← Vercel AI Gateway Chat Model (ai_languageModel)
                          ← Session Memory (ai_memory)
            → Parse Output
                → Respond to Webhook  ← réponse immédiate au frontend
                    → Devis pret ? [IF status == "ready"]
                        ├── OUI → Calculer Distance + Devis (Code)
                        │           → Create a record in Airtable (Demandes)
                        │               → Envoyer Email (Resend)
                        └── NON → Manque Info [IF status == "incomplet"]
                                    ├── OUI → Préparer Email Clarification (Code)
                                    │           → Create a record (Airtable — Demandes partiel)
                                    │               → Envoyer Email Clarification (Resend)
                                    └── NON → fin (phase collecte, aucune action)
```

### Détail des nœuds

#### 1. Chat Webhook
- **Type** : `n8n-nodes-base.webhook` (POST)
- **Path** : `/neotravel-chat`
- **Webhook ID** : `d342dc15-d8ed-46de-87dd-024015226299`
- **Corps attendu** : `{ sessionId, message }`

#### 2. Normaliser Payload
- **Type** : `n8n-nodes-base.set`
- Extrait `sessionId` et `message` depuis le corps de la requête
- Gère plusieurs noms de champ possibles : `chatInput`, `message`, `$json.body?.chatInput`, etc.
- `sessionId` defaults à `"anon"` si absent

#### 3. Agent Neotravel (Emma)
- **Type** : `@n8n/n8n-nodes-langchain.agent` v3.1
- **Modèle** : Gemini 2.5 Flash via Vercel AI Gateway (`Vercel AI Gateway Chat Model`)
- **Mémoire** : Session buffer window, 20 messages de contexte, clé = `sessionId`
- **Iterations max** : 15
- **Directives absolues du system prompt** :
  - Collecte dans l'ordre : villeDepart, villeArrivee, dateDepart, nbPassagers, allerRetour, prenom, nom, email, telephone
  - Une seule question par message, vouvoiement, toujours en français
  - **Ne calcule jamais les prix** — appelle toujours l'outil `calculer_devis`
  - Appelle `calculer_distance` dès que les deux villes sont connues
- **Format de sortie JSON** :
  ```json
  {
    "reply": "message affiché au client",
    "status": "collecting | ready | incomplet",
    "villeDepart": "...", "villeArrivee": "...", "dateDepart": "YYYY-MM-DD",
    "nbPassagers": 0, "allerRetour": false,
    "prenom": "...", "nom": "...", "email": "...", "telephone": "..."
  }
  ```
- `status: "ready"` quand les 7 champs obligatoires sont présents (villeDepart, villeArrivee, dateDepart, nbPassagers, prenom, nom, email)
- `status: "incomplet"` quand des informations manquent après plusieurs échanges

#### 4. Parse Output
- **Type** : `n8n-nodes-base.code`
- Nettoie les balises markdown du LLM (` ```json `...)
- Extrait le premier objet JSON `{ ... }` de la réponse brute
- Fallback : `{ reply: texte_brut, status: 'collecting' }` en cas d'erreur de parsing

#### 5. Respond to Webhook
- **Type** : `n8n-nodes-base.respondToWebhook`
- Renvoie `{ reply }` au frontend **immédiatement** (non-bloquant)
- Le reste du pipeline s'exécute en arrière-plan après cet envoi

#### 6. Devis pret ?
- **Type** : `n8n-nodes-base.if`
- **Condition** : `$json.status == "ready"` (string strict, case-sensitive)
- Branche TRUE → calcul du devis (nœud 7)
- Branche FALSE → vérification incomplétude (nœud 10)

#### 7. Calculer Distance + Devis
- **Type** : `n8n-nodes-base.code` (branche TRUE de Devis pret ?)
- **Étape 1 — Géocodage + Distance** :
  - Géocode `villeDepart` et `villeArrivee` via API Nominatim (OpenStreetMap)
  - Calcule la distance routière via OSRM (project-osrm.org)
  - Output : `km` (entier arrondi)
- **Étape 2 — HITL** : si `nbPassagers > 85` → `escalade = true`, aucun calcul de prix
- **Étape 3 — Calcul déterministe** (mêmes règles que `lib/calculer-devis.ts`) :
  - ≤ 180 km : grille forfaitaire par paliers de 10 km (250 € à 900 €)
  - > 180 km : `km × 2 × 2,5 €`
  - Aller-retour : prix de base × 2
  - Coefficients cumulatifs : saisonnalité × urgence × capacité
  - Marge commerciale 15% fixe
  - TVA 10%

#### 8. Create a record in Airtable
- **Type** : `n8n-nodes-base.airtable` (operation: create)
- **Base** : `apphcmnoff5FWbIX4` | **Table** : `tbl8ucaqSrDODAFNg` (Demandes)
- Enregistre le lead complet avec le devis calculé

#### 9. Envoyer Email (Resend)
- **Type** : `n8n-nodes-base.httpRequest` (POST `https://api.resend.com/emails`)
- Envoie le devis complet par email au client

#### 10. Manque Info
- **Type** : `n8n-nodes-base.if` (branche FALSE de Devis pret ?)
- **Condition** : `$json.status == "incomplet"`
- Branche TRUE → envoi d'un email de clarification (nœud 11)
- Branche FALSE → fin du traitement (phase collecte normale, aucune action supplémentaire)

#### 11. Préparer Email Clarification
- **Type** : `n8n-nodes-base.code`
- Identifie les champs manquants et génère un email HTML demandant les informations manquantes
- Output : `{ email, emailHtml }` utilisé par le nœud suivant

#### 12. Create a record (partiel)
- **Type** : `n8n-nodes-base.airtable` (operation: create)
- **Base** : `apphcmnoff5FWbIX4` | **Table** : `tbl8ucaqSrDODAFNg` (Demandes)
- Sauvegarde partielle du lead incomplet (`aller_retour: false`, `urgence: false`)

#### 13. Envoyer Email Clarification
- **Type** : `n8n-nodes-base.httpRequest` (POST `https://api.resend.com/emails`)
- Envoie l'email de demande de clarification au client
- **Sujet** : `NeoTravel — Complétez votre demande de devis`

#### 14. Vercel AI Gateway Chat Model (sous-nœud)
- **Type** : `@n8n/n8n-nodes-langchain.lmChatVercelAiGateway`
- Connecté à Agent Neotravel via `ai_languageModel`
- Fournit l'accès à Gemini 2.5 Flash

#### 15. Session Memory (sous-nœud)
- **Type** : `@n8n/n8n-nodes-langchain.memoryBufferWindow`
- Connecté à Agent Neotravel via `ai_memory`
- Fenêtre de 20 messages, clé = `sessionId`

---

## WF2 — Relances Automatiques

### Rôle

Déclenché toutes les 2 minutes par un scheduleTrigger. Récupère les leads en attente dans Airtable, envoie des emails de relance à J+3 puis J+7, et clôture automatiquement les dossiers sans réponse après 2 relances.

### Flux complet

```
Relance emailing (Schedule — toutes les 2 min)
    → Leads à Relancer (Airtable — recherche leads éligibles)
        → Un par Un (SplitInBatches)
            → relance_count < 2 ? [IF]
                ├── OUI → Préparer Email Relance (Code)
                │           → Send a new email (Resend natif)
                │               → Airtable — Statut Relance (update Demandes)
                │                   → Airtable — MAJ Devis Relance (update Devis)
                │                       → Un par Un (loop suivant)
                └── NON → Airtable — Clôturer Sans Réponse (update Demandes)
                                → Un par Un (loop suivant)
```

### Détail des nœuds

#### 1. Relance emailing
- **Type** : `n8n-nodes-base.scheduleTrigger`
- **Cadence** : toutes les 2 minutes
- Déclenche l'ensemble du workflow de relance

#### 2. Leads à Relancer
- **Type** : `n8n-nodes-base.airtable` (operation: search)
- **Base** : `apphcmnoff5FWbIX4` | **Table** : `tbl8ucaqSrDODAFNg` (Demandes)
- Récupère les leads avec statut `Devis envoyé` ou `Relance 1` dont la date de relance est dépassée

#### 3. Un par Un
- **Type** : `n8n-nodes-base.splitInBatches`
- Traite les leads un par un pour éviter les conflits d'écriture Airtable
- Boucle sur chaque lead jusqu'à épuisement de la liste

#### 4. relance_count < 2 ?
- **Type** : `n8n-nodes-base.if` (typeValidation: loose)
- **Condition** : `relance_count < 2`
- Branche TRUE (moins de 2 relances envoyées) → envoyer une relance
- Branche FALSE (2 relances épuisées) → clôturer le dossier

#### 5. Préparer Email Relance
- **Type** : `n8n-nodes-base.code`
- Génère le contenu de l'email selon le numéro de relance (1ère ou 2ème)
- Calcule la prochaine date de relance (J+3 pour Relance 1, J+7 pour Relance 2)

#### 6. Send a new email
- **Type** : `n8n-nodes-resend.resend` (intégration native Resend)
- **Sujet** : `Votre relance de devis Neotravel`
- Envoie l'email de relance au client

#### 7. Airtable — Statut Relance
- **Type** : `n8n-nodes-base.airtable` (operation: update)
- **Table** : `tbl8ucaqSrDODAFNg` (Demandes)
- Met à jour le statut : `Relance 1` ou `Relance 2`, incrémente `relance_count`

#### 8. Airtable — MAJ Devis Relance
- **Type** : `n8n-nodes-base.airtable` (operation: update)
- **Table** : `tblSFo4ABzf4NI6X0` (Devis)
- Met à jour la date et le compteur de relance dans la table Devis

#### 9. Airtable — Clôturer Sans Réponse
- **Type** : `n8n-nodes-base.airtable` (operation: update)
- **Table** : `tbl8ucaqSrDODAFNg` (Demandes)
- Passe le statut à `Refusé` après 2 relances sans réponse

---

## Conformité avec les règles métier NeoTravel (Document de passation L3)

| Règle métier | WF1 | WF2 |
|---|---|---|
| L'IA ne calcule jamais les prix | ✅ Code node uniquement (`Calculer Distance + Devis`) | — |
| HITL si > 85 passagers | ✅ `escalade = true` dans le Code node | — |
| HITL si départ < 48h | ✅ Géré dans le system prompt Emma | — |
| Enregistrement CRM Airtable | ✅ `Create a record in Airtable` + `Create a record` (partiel) | ✅ `Statut Relance` + `MAJ Devis Relance` |
| Envoi devis par email (Resend) | ✅ `Envoyer Email` | — |
| Email clarification si incomplet | ✅ `Envoyer Email Clarification` | — |
| Relances J+3 / J+7 | — | ✅ `Préparer Email Relance` |
| Max 2 relances puis clôture | — | ✅ `relance_count < 2` → `Clôturer Sans Réponse` |
