## Automatisation de la Chaîne Commerciale — NeoTravel

|                           |                                   |
| ------------------------- | --------------------------------- |
| **Formation**             | MBA1 — Epitech                    |
| **Groupe**                | Gendell Friolanita · Inde · Yahia |
| **Date de rendu**         | 24 juin 2026                      |
| **Entreprise partenaire** | NeoTravel (autocar-location.com)  |

---

## 1. Présentation de l'entreprise

NeoTravel est un intermédiaire spécialisé dans le transport de groupe, fondé en 2010 et basé à Levallois-Perret (92). L'entreprise ne possède aucun véhicule propre : elle coordonne un réseau de prestataires pour répondre aux demandes de particuliers, d'entreprises et d'organismes publics sur 647 villes et 98 départements. L'équipe commerciale reçoit les demandes, qualifie les prospects et élabore les devis. Une équipe de réservation prend ensuite le relais pour identifier les transporteurs disponibles.

---

## 2. Problématique Métier

### 2.1 Situation actuelle

NeoTravel reçoit environ **60 demandes par jour** via ses canaux digitaux. Ces demandes sont traitées manuellement par des commerciaux rémunérés à la commission, qui privilégient les leads à fort potentiel et laissent les autres de côté. Une partie significative des leads issus des campagnes publicitaires payantes ne sont donc jamais traités — de l'argent perdu deux fois.

### 2.2 Problèmes identifiés

| # | Problème | Impact direct |
|---|---|---|
| 1 | Leads non traités par les commerciaux | Perte de CA sur des leads déjà payés |
| 2 | Délais de réponse trop longs (24-48h) | Perte de clients au profit de concurrents plus réactifs |
| 3 | Absence de relances systématiques | Opportunités abandonnées faute de suivi |
| 4 | Qualification manuelle chronophage | Temps commercial gaspillé |
| 5 | Aucune traçabilité du pipeline | Direction sans visibilité |
| 6 | Tarification calculée manuellement | Risque d'erreur, incohérence entre commerciaux |

### 2.3 Enjeu

NeoTravel a suffisamment de leads. Ce qui manque, c'est la capacité à tous les traiter. Automatiser le traitement, c'est augmenter le rendement sans toucher aux effectifs.

---

## 3. Analyse Concurrentielle

NeoTravel s'adresse aux entreprises, CE, associations et organisateurs d'événements qui déplacent entre 8 et 85 personnes en France ou en Europe. Sur ce segment, deux types d'acteurs coexistent sans vraiment se recouper.

GetTransfer et Mozio fonctionnent pour le transfert ponctuel ou les API B2B, pas pour les groupes complexes (>20 personnes, logistique multi-étapes, nuits chauffeur). Autocars.com n'a aucun suivi automatisé — le devis part manuellement. Les agences locales ont l'expertise mais répondent en 24 à 72h.

Sur le segment transport de groupe en France, aucun acteur ne combine aujourd'hui qualification IA, devis en temps réel et relances automatiques. Les plateformes ont automatisé la réservation standard, pas les leads complexes. Les acteurs humains n'ont aucune couche IA. C'est ce vide que le prototype adresse directement.

NeoTravel tient son avantage de trois choses que les concurrents ne combinent pas : connaissance fine des prestataires locaux (véhicules, réglementation, saisonnalité), traitement humain dédié pour les cas complexes plutôt qu'un formulaire générique, et réactivité automatisée qui livre un premier devis en moins de 5 minutes pour les cas standards, là où la concurrence prend 24 à 72h.

> **[ INSÉRER — Diagramme 1 : Matrice de positionnement concurrentiel 2×2 ]**
> *Axes : Vitesse de réponse (lente → rapide) × Profondeur de service (générique → sur-mesure). Concurrents placés spatialement : GetTransfer/Mozio (rapide, générique), Autocars.com (rapide, générique), Agences locales / Autocaristes (lent, expert). NeoTravel ★ en haut à droite avec zone "Gap stratégique" surlignée.*

---

## 4. Cartographie As-Is / To-Be

| Étape                 | Avant                     | Après                                          |
| --------------------- | ------------------------- | ---------------------------------------------- |
| Réception lead        | Email non centralisé      | Sauvegarde auto dans Airtable (< 1 sec)        |
| Sélection commerciale | Subjective, ~40 % traités | 100 % des leads captés sans exception          |
| Qualification         | Manuelle, 1-4h            | IF node (passagers) + Gemini (texte), < 30 sec |
| Calcul devis          | Manuel, 1-2h              | `calculer_devis()` déterministe, < 1 sec       |
| Envoi email           | +24h en moyenne           | Email + PDF via Resend, < 5 min                |
| Relances              | Aléatoires, ~30 %         | Automatiques J+3/J+7, 100 % dans les délais    |
| Visibilité pipeline   | Inexistante               | Dashboard Airtable en temps réel               |

**Flux To-Be — 11 étapes :**

1. Prospect remplit le formulaire Next.js — une question par écran.
2. Les données sont envoyées en JSON au webhook n8n WF1.
3. Sauvegarde immédiate dans Airtable (statut : Nouveau Lead).
4. Nœud IF déterministe : si `passagers > 85` → Cas Complexe, aucun appel IA.
5. Si ≤ 85 passagers → Gemini évalue la complétude textuelle. Output : `{ completeness_score, missing_fields }`.
6. Si score < 70 % → email avec lien `/clarification?id=...` → statut Incomplet.
7. Si score ≥ 70 % → `calculer_devis()` est appelé.
8. PDF de devis généré et attaché.
9. Email envoyé via Resend. Délai total < 5 min.
10. Airtable mis à jour (statut : Devis envoyé, `next_followup_at` calculé).
11. WF2 (schedule trigger) surveille les relances dues et envoie les emails J+3/J+7.

Ce qui change : la capture, la qualification, le calcul et les relances sont entièrement automatisés. Ce qui ne change pas : la négociation et les cas complexes (>85 passagers) restent assurés par un commercial — automatiser l'opérationnel, pas la relation.

> **[ INSÉRER — Diagramme 2 : Pipeline commercial — flux des statuts ]**
> *Flux vertical coloré montrant la progression d'un lead : Nouveau Lead → Incomplet → Qualifié → Devis envoyé → Relance 1 → Relance 2 → Accepté / Refusé / Clôturé. Branche séparée depuis "Nouveau Lead" vers "Cas Complexe" (nœud IF, passagers > 85). Délais J+3 et J+7 indiqués sur les flèches. Légende couleurs et statuts.*

---

## 5. Matrices de Priorisation

### Problématiques — notation 1-3 (3 = fort ; Complexité : 3 = facile à résoudre)

| # | Friction | Impact CA | Impact Client | Urgence | Complexité | Score |
|:---:|---|:---:|:---:|:---:|:---:|:---:|
| **1** | **Leads non traités** | **3** | **3** | **3** | **2** | **11** |
| 2 | Délais de réponse > 24h | 3 | 3 | 3 | 2 | 11 |
| 3 | Absence de relances | 3 | 2 | 2 | 3 | 10 |
| 4 | Tarification manuelle | 2 | 2 | 2 | 3 | 9 |
| 5 | Pipeline sans visibilité | 2 | 1 | 2 | 3 | 8 |
| 6 | Qualification chronophage | 2 | 1 | 2 | 2 | 7 |

Chaque lead ignoré représente un budget publicitaire dépensé sans retour. C'est la perte la plus directement chiffrable.

### Solutions — notation 1-3 (3 = fort ; Coût : 3 = peu coûteux)

| # | Fonction | Valeur métier | Faisabilité | Coût | Score | Priorité |
|:---:|---|:---:|:---:|:---:|:---:|---|
| 1 | **CRM Airtable** | 3 | 3 | 3 | **9** | P1 — MVP absolu |
| 2 | **`calculer_devis()`** | 3 | 3 | 3 | **9** | P1 — MVP absolu |
| 3 | Formulaire capture | 3 | 3 | 3 | **9** | P1 — MVP absolu |
| 4 | Envoi email (Resend) | 3 | 3 | 3 | **9** | P1 — MVP absolu |
| 5 | Escalade HITL | 3 | 3 | 3 | **9** | P1 |
| 6 | Relances auto (WF2) | 3 | 2 | 3 | 8 | P1 |
| 7 | Qualification IA (Gemini) | 3 | 2 | 3 | 8 | P1 |
| 8 | Dashboard Airtable | 2 | 3 | 3 | 8 | P1 |
| 9 | Génération PDF | 2 | 2 | 3 | 7 | P2 |
| 10 | Traçabilité horodatée | 1 | 3 | 3 | 7 | P2 |

Airtable et `calculer_devis()` sont les deux fondations sur lesquelles tout repose. Sans CRM, les leads restent invisibles. Sans fonction déterministe, les devis varient d'un commercial à l'autre.

---

## 6. Solution Proposée

Le prototype couvre la chaîne commerciale complète, du formulaire jusqu'aux relances. Ce qui sort du cadre (grands groupes, conditions atypiques) continue d'aller vers un commercial.

| # | Fonction | Description |
|:---:|---|---|
| 1 | Capture de la demande | Formulaire conversationnel multi-étapes (Next.js) |
| 2 | Centralisation CRM | Chaque lead enregistré automatiquement, sans exception |
| 3 | Contrôle métier (HITL) | Nœud IF déterministe : `passagers > 85` → escalade immédiate, sans IA |
| 4 | Qualification IA | Gemini évalue la complétude textuelle des champs |
| 5 | Calcul de devis | `calculer_devis()` — tarification déterministe, traçable |
| 6 | Envoi devis | Génération PDF + email Resend en < 5 min |
| 7 | Relances automatiques | WF2 : J+2 (urgent) ou J+3/J+7 (standard) |
| 8 | Tableau de bord | Pipeline en temps réel via Airtable Interface |

Les commerciaux restent responsables des cas complexes, des contrats et de la coordination avec les transporteurs. Aucun prix n'est estimé : tout passe par `calculer_devis()`. L'IA ne touche à aucune valeur numérique métier.

---

## 7. Architecture Technique

### Stack technologique

| Composant | Outil | Justification |
|---|---|---|
| Frontend | Next.js (React) | Déployable sur Vercel, gratuit |
| Orchestrateur | n8n (self-hosted) | Workflows visuels, connexions API, scheduling — gratuit en local |
| Modèle de langage | Gemini 2.0 Flash | Gratuit (1 500 req/jour), JSON natif, suffisant pour la qualification textuelle |
| CRM + Dashboard | Airtable | Gratuit, interface no-code, dashboard sans développement |
| Envoi d'emails | Resend | Gratuit (3 000 emails/mois), supporte les pièces jointes PDF |
| Déploiement | Vercel + GitHub | Gratuit, CI/CD automatique |

Coût total : 0 €/mois. Gemini retenu pour deux raisons : 1 500 requêtes/jour gratuites (60 leads × 1 appel = 60 req/jour, le quota ne sera jamais atteint) et ~0,03 $/1K tokens pour GPT-4o que l'on évite. La tâche — évaluer la complétude de champs texte — ne nécessite pas un modèle frontier.

Qui fait quoi :

| Couche | Outil | Rôle |
|---|---|---|
| Frontend | Next.js | Formulaire, validation côté client, envoi JSON au webhook |
| Orchestrateur | n8n | Coordination, branches IF, retries, scheduling |
| LLM | Gemini 2.0 Flash | Complétude textuelle uniquement. Pas de calcul, pas de règle chiffrée |
| Outils déterministes | IF node + `calculer_devis()` + Resend | Même input → même output, sans exception |
| Données | Airtable | Source de vérité unique : leads, devis, matrices, logs |

> **[ INSÉRER — Diagramme 3 : Schéma d'architecture WF1 + WF2 ]**
> *Flowchart vertical. WF1 : Formulaire Next.js → Webhook → Airtable (New Lead) → IF node passagers > 85 [branche rouge : Cas Complexe] → Gemini complétude [branche orange : Incomplet /clarification] → calculer_devis() → PDF → Resend → Devis envoyé. WF2 : Déclencheur planifié → Fetch Airtable → Idempotence [branche grise : doublon ignoré] → Relances < 2 [branche rouge : Clôturé] → Envoi relance. Tous les états finaux → cylindre Airtable CRM. Légende formes et couleurs.*

### Règles métier

**Qualification — contrôles déterministes avant l'IA**

| Condition | Évalué par | Action |
|---|---|---|
| `passagers > 85` | Nœud IF n8n | Cas Complexe + alerte commerciale. Aucun appel IA |
| Champs texte incomplets (score < 70 %) | Gemini (textuel) | Incomplet + lien `/clarification` |
| Mention contrat personnalisé | Gemini (textuel) | Escalade immédiate |

**Relances et idempotence**

| Cas | Relance 1 | Relance 2 | Clôture |
|---|---|---|---|
| Urgent (départ < 72h) | J+2 | — | Si pas de réponse |
| Standard | J+3 | J+7 (J+3 + 4 jours) | Après Relance 2 |

Chaque envoi est protégé par une clé d'idempotence (`lead_id + relance_count`). Un même email ne peut pas partir deux fois, même si le workflow redémarre.

**Tarification — règle principale**

L'IA ne calcule pas de prix et n'évalue pas le nombre de passagers. Toute tarification passe par `calculer_devis()` : les mêmes données en entrée donnent toujours le même résultat en sortie.

---

## 8. Scénarios Fonctionnels

### Scénario 1 — Parcours nominal

Chargé de communication PME — 45 personnes, Paris → Lyon, dans 3 semaines

| Étape | Action |
|---|---|
| Soumission | Formulaire complet : 45 passagers, 465 km, aller simple, standard |
| Contrôle métier | IF node : 45 ≤ 85 → continue |
| Qualification IA | Gemini : score 100 %, tous les champs renseignés |
| Calcul | `calculer_devis()` : 465 km × coeff. juin × coeff. standard × marge × TVA |
| Envoi | PDF + email Resend. Délai total : < 5 minutes |

> **Résultat :** Devis reçu en moins de 5 minutes, sans intervention humaine.

### Scénario 2 — Escalade humaine (> 85 passagers)

Responsable événementiel — 120 personnes

| Étape | Action |
|---|---|
| Soumission | 120 passagers reçus via webhook |
| Contrôle métier | IF node : 120 > 85 → branche Cas Complexe. Aucun appel IA |
| Notification client | Email : "Un conseiller vous contactera sous 24h" |
| Alerte | Lead créé dans Airtable, statut Cas Complexe, alerte commerciale |

> **Résultat :** Le client reçoit un accusé de réception en moins d'une minute. L'IA n'intervient pas.

---

## 9. Modèle de Données

### Tables principales

**`Demandes`** — un enregistrement par lead entrant

| Champ | Type | Description |
|---|---|---|
| ID | Auto | Identifiant unique |
| Name / Email / Phone | Texte | Coordonnées du contact |
| Departure / Destination | Texte | Villes de départ et d'arrivée |
| Date | Date | Date de départ souhaitée |
| Passengers | Nombre | Nombre de passagers |
| TripType | Choix | Aller simple / Aller-retour |
| Urgency | Choix | Urgent (<72h) / Standard / Planifié |
| DistanceKm | Nombre | Saisi par le client (km approximatifs) |
| Status | Choix | Nouveau / Incomplet / Qualifié / Devis envoyé / Relance 1 / Relance 2 / Accepté / Refusé / Cas Complexe / Clôturé |
| CompletenessScore | Nombre | Score 0-100 Gemini (champs texte uniquement) |

**`Devis`** — un enregistrement par devis généré

| Champ | Type | Description |
|---|---|---|
| LeadID | Lien | Référence vers Demandes |
| PrixHT / TVA / PrixTTC | Nombre | Calculés par `calculer_devis()` |
| PDFUrl / SentAt | URL / Date | Lien PDF et date d'envoi |
| RelanceCount | Nombre | 0, 1 ou 2 |
| IdempotencyKey | Texte | `lead_id + relance_count` |
| NextRelanceAt | Date | Date de la prochaine relance |

### Tables Matrices — dénormalisées par type

Cinq tables dans Airtable, toutes modifiables sans code par NeoTravel. Les étapes 4 et 5 de `calculer_devis()` lisent directement `Matrice_Options` et `Parametres_Globaux` — changer la marge ou le prix d'une option ne nécessite aucune modification de code.

| Table | Variable | Exemple |
|---|---|---|
| `Matrice_Saison` | Coefficient selon le mois | Juin-Août : ×1,15 |
| `Matrice_Urgence` | Coefficient selon le délai départ-demande | < 24h : ×1,10 |
| `Matrice_Capacite` | Coefficient selon le nombre de passagers | 20-53 pax : ×1,00 · > 85 : Cas Complexe |
| `Matrice_Options` | Prix unitaire par option | Guide : 80 € · Nuit chauffeur : 120 € · Péages : forfait |
| `Parametres_Globaux` | Paramètres de calcul | Marge commerciale : 15 % · Taux TVA : 10 % |

### `calculer_devis()` — 6 étapes ordonnées

> La marge s'applique sur le sous-total complet (coefficients + options), pas sur le prix de base seul.

| Étape | Opération |
|:---:|---|
| 1 | Prix de base : barème forfaitaire ≤ 180 km · ou `(km × 2) × 2,50` si > 180 km |
| 2 | Aller-retour : × 2 si applicable |
| 3 | Coefficients : × coeff_saison × coeff_urgence × coeff_capacite |
| 4 | Options : + Guide (+80 €) · Nuit chauffeur (+120 €) · Péages (forfait) |
| 5 | Marge : `(étape 3 + étape 4) × 1,15` |
| 6 | TVA : × 1,10 → prix TTC |

---

## 10. KPIs et Risques

### KPIs de succès

| KPI | Avant | Cible | Mesure |
|---|---|---|---|
| Taux de leads traités | ~40 % | **100 %** | Enregistrements Airtable / leads reçus |
| Délai premier devis | 24-48h | **< 5 min** | Timestamp soumission → email Resend |
| Relances dans les délais | ~30 % | **100 %** | Relances envoyées / relances dues |
| Erreurs de tarification | Non mesuré | **0 %** | Déterministe par construction |
| Leads auto sans humain | Non mesuré | **> 85 %** | Leads qualifiés / total |
| Taux d'ouverture emails | Non mesuré | **> 60 %** | Stats Resend |

### Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| n8n instable en démo | Élevé | Test la veille, instance locale, ngrok stable |
| Gemini rate limit | Moyen | 60 req/jour utilisées sur 1 500 de quota |
| Données mal formatées | Élevé | Validation obligatoire côté Next.js |
| Distance saisie manuellement (limitation MVP) | Faible | Choix conscient pour maintenir le budget à 0 €. Phase 2 : OpenRouteService ou Mappy |

### RGPD

Chaque champ collecté a une finalité documentée. Les tests utilisent des données fictives. Les leads clôturés depuis plus de 90 jours sont anonymisés dans Airtable.

---

## 11. Roadmap Produit

> **[ INSÉRER — Diagramme 4 : Roadmap produit — 3 phases ]**
> *Timeline verticale A4 portrait, axe J1 → J8. Phase 1 (J1-J3, bleu) — Structurer : Airtable tables+matrices, Next.js init, Vercel+Resend. Phase 2 (J3-J6, orange) — Automatiser : Formulaire 13 questions, IF node + calculer_devis(), WF2 relances + idempotence, tests bout en bout. Phase 3 (J6-J8, vert) — IA + Démo : Gemini WF1, page /clarification, stabilité démo, L3 + slides. Drapeau à J8 : "Présentation — 1er juillet 2026". Légende couleurs par phase.*

---

## 12. Conclusion

NeoTravel a suffisamment de leads. Le problème est la capacité à les traiter tous. Le prototype automatise le traitement standard pour que les commerciaux s'occupent des cas complexes et des contrats.

La stack (n8n + Next.js + Airtable + Gemini + Resend) tourne à 0 €/mois. Tous les outils sont bien documentés et le système sera démontrable le 1er juillet.

Le fil conducteur de chaque choix technique : "Digitaliser sans déshumaniser." Automatiser ce qui peut l'être, et laisser le reste au commercial.
