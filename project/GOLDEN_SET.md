# Golden Set — Jeux de test de référence `calculer_devis()`

> **Objectif :** Valider que le moteur de tarification produit des résultats déterministes et conformes à la spécification NeoTravel.
> Tous les outputs ont été générés et vérifiés par exécution réelle de `calculer_devis()` en TypeScript.
>
> Pour relancer les tests : `npx jest lib/__tests__/calculer-devis.test.ts`

---

## Règle d'or

> Même input → même output, sans exception, sans appel réseau, sans état.
> L'IA ne calcule jamais les prix. Ce fichier prouve que le code seul suffit.

---

## Cas 1 — Groupe standard, aller simple, saison normale

**Scénario :** Association sportive de 40 personnes, Lyon → Marseille (100 km), départ mi-septembre, demande faite 2 mois à l'avance, sans option.

### Input

```json
{
  "nb_passagers": 40,
  "date_depart": "2026-09-15",
  "date_demande": "2026-07-01",
  "distance_km": 100,
  "aller_retour": false,
  "options": []
}
```

### Calcul détaillé

| Étape | Valeur | Détail |
|---|---|---|
| Prix de base | 580 € | Barème ≤180km, palier 100km |
| Aller simple | 580 € | ×1 |
| Coeff. saisonnalité | ×1.00 | Septembre = saison Moyenne |
| Coeff. urgence | ×0.95 | 1 824h gap = DD_NORMAL (72h–2160h) |
| Coeff. capacité | ×1.00 | 40 pax → tranche 20–53 pax |
| Sous-total coeff. | 551.00 € | 580 × 1.00 × 0.95 × 1.00 |
| Options | +0 € | Aucune |
| Sous-total | 551.00 € | |
| Marge (×1.15) | 551.00 × 1.15 = **633.65 €** | |
| TVA 10% | **63.37 €** | |
| **TOTAL TTC** | **697.02 €** | |

### Output attendu

```json
{
  "prix_ht": 633.65,
  "tva": 63.37,
  "prix_ttc": 697.02,
  "devise": "EUR",
  "manual_required": false,
  "coefficients": [
    { "name": "saisonnalité", "value": 1 },
    { "name": "urgence (DD_NORMAL)", "value": 0.95 },
    { "name": "capacité", "value": 1 },
    { "name": "marge", "value": 1.15 }
  ]
}
```

---

## Cas 2 — Groupe moyen, aller-retour, très haute saison + guide

**Scénario :** Groupe scolaire de 30 personnes, Paris → Bordeaux (150 km), aller-retour en juin (très haute saison), avec guide/accompagnateur, demande faite 2,5 mois à l'avance.

### Input

```json
{
  "nb_passagers": 30,
  "date_depart": "2026-06-20",
  "date_demande": "2026-04-01",
  "distance_km": 150,
  "aller_retour": true,
  "options": ["guide"]
}
```

### Calcul détaillé

| Étape | Valeur | Détail |
|---|---|---|
| Prix de base | 780 € | Barème ≤180km, palier 150km |
| Aller-retour | 1 560 € | ×2 |
| Coeff. saisonnalité | ×1.15 | Juin = Très Haute saison |
| Coeff. urgence | ×0.95 | 1 920h gap = DD_NORMAL |
| Coeff. capacité | ×1.00 | 30 pax → tranche 20–53 pax |
| Sous-total coeff. | 1 704.30 € | 1 560 × 1.15 × 0.95 × 1.00 |
| Option guide | +80 € | Forfait guide/accompagnateur |
| Sous-total | 1 784.30 € | |
| Marge (×1.15) | 1 784.30 × 1.15 = **2 051.94 €** | |
| TVA 10% | **205.19 €** | |
| **TOTAL TTC** | **2 257.13 €** | |

### Output attendu

```json
{
  "prix_ht": 2051.94,
  "tva": 205.19,
  "prix_ttc": 2257.13,
  "devise": "EUR",
  "manual_required": false,
  "coefficients": [
    { "name": "saisonnalité", "value": 1.15 },
    { "name": "urgence (DD_NORMAL)", "value": 0.95 },
    { "name": "capacité", "value": 1 },
    { "name": "marge", "value": 1.15 }
  ]
}
```

---

## Cas 3 — Escalade HITL (plus de 85 passagers)

**Scénario :** Entreprise demandant un transport pour 86 personnes. Déclenche systématiquement l'escalade vers un commercial humain.

### Input

```json
{
  "nb_passagers": 86,
  "date_depart": "2026-09-15",
  "date_demande": "2026-07-01",
  "distance_km": 100,
  "aller_retour": false,
  "options": []
}
```

### Règle appliquée

`nb_passagers > 85` → `manual_required = true`, aucun calcul de prix effectué.

Le statut du lead passe automatiquement en "Cas Complexe" dans le CRM Airtable. Un commercial est alerté.

### Output attendu

```json
{
  "prix_ht": 0,
  "tva": 0,
  "prix_ttc": 0,
  "lignes": [],
  "coefficients": [],
  "devise": "EUR",
  "manual_required": true
}
```

---

## Cas 4 — Grand groupe urgent, longue distance, toutes options

**Scénario :** Comité d'entreprise de 70 personnes, départ demain (urgence DD_URGENT), Paris → Nice (250 km, >180 km → formule directe), haute saison juillet, guide + hébergement chauffeur + péages inclus.

### Input

```json
{
  "nb_passagers": 70,
  "date_depart": "2026-07-15",
  "date_demande": "2026-07-14",
  "distance_km": 250,
  "aller_retour": false,
  "options": ["guide", "chauffeur_nuit", "peages"],
  "peages_flat_rate": 35
}
```

### Calcul détaillé

| Étape | Valeur | Détail |
|---|---|---|
| Prix de base | 1 250 € | >180km → 250 × 2 × 2.5 |
| Aller simple | 1 250 € | ×1 |
| Coeff. saisonnalité | ×1.10 | Juillet = Haute saison |
| Coeff. urgence | ×1.05 | 24h gap = DD_URGENT (24–72h) |
| Coeff. capacité | ×1.40 | 70 pax → tranche 68–85 pax |
| Sous-total coeff. | 2 021.25 € | 1 250 × 1.10 × 1.05 × 1.40 |
| Option guide | +80 € | |
| Option chauffeur nuit | +120 € | |
| Option péages (forfait) | +35 € | |
| Sous-total | 2 256.25 € | |
| Marge (×1.15) | 2 256.25 × 1.15 = **2 594.69 €** | |
| TVA 10% | **259.47 €** | |
| **TOTAL TTC** | **2 854.16 €** | |

### Output attendu

```json
{
  "prix_ht": 2594.69,
  "tva": 259.47,
  "prix_ttc": 2854.16,
  "devise": "EUR",
  "manual_required": false,
  "coefficients": [
    { "name": "saisonnalité", "value": 1.1 },
    { "name": "urgence (DD_URGENT)", "value": 1.05 },
    { "name": "capacité", "value": 1.4 },
    { "name": "marge", "value": 1.15 }
  ]
}
```

---

## Cas 5 — Petit groupe, longue distance, basse saison, réservation très anticipée

**Scénario :** Famille élargie de 15 personnes, Paris → Grenoble aller-retour (300 km), départ janvier (basse saison), demande faite 3,5 mois à l'avance (remise anticipation).

### Input

```json
{
  "nb_passagers": 15,
  "date_depart": "2027-01-20",
  "date_demande": "2026-10-01",
  "distance_km": 300,
  "aller_retour": true,
  "options": []
}
```

### Calcul détaillé

| Étape | Valeur | Détail |
|---|---|---|
| Prix de base | 1 500 € | >180km → 300 × 2 × 2.5 |
| Aller-retour | 3 000 € | ×2 |
| Coeff. saisonnalité | ×0.93 | Janvier = Basse saison |
| Coeff. urgence | ×0.90 | 2 664h gap = DD_3MOISETPLUS (>2160h) |
| Coeff. capacité | ×0.95 | 15 pax → tranche ≤19 pax |
| Sous-total coeff. | 2 385.45 € | 3 000 × 0.93 × 0.90 × 0.95 |
| Options | +0 € | Aucune |
| Sous-total | 2 385.45 € | |
| Marge (×1.15) | 2 385.45 × 1.15 = **2 743.27 €** | |
| TVA 10% | **274.33 €** | |
| **TOTAL TTC** | **3 017.60 €** | |

### Output attendu

```json
{
  "prix_ht": 2743.27,
  "tva": 274.33,
  "prix_ttc": 3017.60,
  "devise": "EUR",
  "manual_required": false,
  "coefficients": [
    { "name": "saisonnalité", "value": 0.93 },
    { "name": "urgence (DD_3MOISETPLUS)", "value": 0.9 },
    { "name": "capacité", "value": 0.95 },
    { "name": "marge", "value": 1.15 }
  ]
}
```

---

## Récapitulatif des 5 cas

| # | Passagers | Distance | AR | Saison | Urgence | Options | Prix HT | Prix TTC | HITL |
|---|---|---|---|---|---|---|---|---|---|
| Cas 1 | 40 | 100 km | Non | Moyenne (1.00) | DD_NORMAL (0.95) | Aucune | 633.65 € | 697.02 € | Non |
| Cas 2 | 30 | 150 km | **Oui** | **Très Haute (1.15)** | DD_NORMAL (0.95) | Guide | 2 051.94 € | 2 257.13 € | Non |
| Cas 3 | **86** | 100 km | Non | — | — | — | 0 € | 0 € | **OUI** |
| Cas 4 | **70** | **250 km** | Non | Haute (1.10) | **DD_URGENT (1.05)** | Guide + Chauf. + Péages | 2 594.69 € | 2 854.16 € | Non |
| Cas 5 | 15 | **300 km** | **Oui** | **Basse (0.93)** | **DD_3M+ (0.90)** | Aucune | 2 743.27 € | 3 017.60 € | Non |

---

*Outputs vérifiés par exécution de `calculer_devis()` en Node.js — 30 juin 2026*
