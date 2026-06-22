# NeoTravel — Pricing Engine Reference

> Source: "REGLES DE CALCUL COTATION DEVIS NEOTRAVEL" (official pricing document)
> This is the authoritative reference for implementing `calculer_devis()`.
> All coefficients must also be stored in the Matrices table in the database.

---

## The Golden Rule

```
AGENT READS RULES → CODE RUNS CALCULER_DEVIS() → CODE RETURNS PRICE
THE LLM NEVER SEES INTERMEDIATE MATH. IT ONLY RECEIVES THE FINAL RESULT.
```

---

## Formula 1 — Simple Transfer (One-Way)

### Step 1: Get Base Price

**Up to 180km — use flat rate table:**

| Distance | Base Price (€ HT) |
|----------|-------------------|
| ≤ 10 km | €250 |
| 20 km | €250 |
| 30 km | €250 |
| 40 km | €320 |
| 50 km | €350 |
| 60 km | €390 |
| 70 km | €430 |
| 80 km | €500 |
| 90 km | €540 |
| 100 km | €580 |
| 110 km | €620 |
| 120 km | €660 |
| 130 km | €700 |
| 140 km | €740 |
| 150 km | €780 |
| 160 km | €820 |
| 170 km | €860 |
| 180 km | €900 |

> For distances between steps (e.g., 45km), use the next step up or interpolate. Confirm approach with team.

**Beyond 180km — calculate directly:**
```
base_price = (distance_km × 2) × 2.50
```

Example: 250km → (250 × 2) × 2.50 = 500 × 2.50 = **€1,250 HT**

---

## Formula 2 — Round Trip (Aller-Retour)

```
round_trip_price = simple_transfer_price × 2
```

This applies BEFORE adding option costs.

---

## Step 2: Apply Coefficients (in order)

### Coefficient 1 — Seasonality (based on `date_depart` month)

| Season | Months | Coefficient |
|--------|--------|-------------|
| Low | November, January, February, August | −7% (× 0.93) |
| Medium | December, October, September | 0% (× 1.00) |
| High | March, April, July | +10% (× 1.10) |
| Very High | May, June | +15% (× 1.15) |

### Coefficient 2 — Urgency (based on gap between `date_demande` and `date_depart`)

| Category | Gap | Coefficient |
|----------|-----|-------------|
| DD_PRIORITAIRE | < 24 hours | +10% (× 1.10) |
| DD_URGENT | 1–3 days | +5% (× 1.05) |
| DD_NORMAL | 4 days – 3 months | −5% (× 0.95) |
| DD_3MOISETPLUS | > 3 months | −10% (× 0.90) |

### Coefficient 3 — Capacity (based on `nb_passagers`)

| Passenger Count | Coefficient |
|----------------|-------------|
| ≤ 19 | −5% (× 0.95) |
| 20 – 53 | 0% (× 1.00) |
| 54 – 63 | +15% (× 1.15) |
| 64 – 67 | +20% (× 1.20) |
| 68 – 85 | +40% (× 1.40) |
| > 85 | **STOP — route to manual commercial** |

### Coefficient 4 — Margin

Always apply:
```
× 1.15  (+15% commercial margin)
```

### Step 3: Add Options (flat amounts per option)

| Option | Cost |
|--------|------|
| Guide or traveling companion | +€80 / day |
| Driver overnight accommodation | +€120 / night |
| Tolls | Flat rate by route (lookup in DB) |

### Step 4: Apply VAT

```
TVA = 10%
prix_ttc = prix_ht × 1.10
```

---

## Complete Calculation Formula

```
base_price = flat_rate_lookup(distance_km)   // or (km × 2) × 2.50 if > 180km
            × (2 if aller_retour else 1)
            × seasonality_coeff
            × urgency_coeff
            × capacity_coeff
            × 1.15                           // margin

options_total = sum(option_costs)

prix_ht = base_price + options_total
tva = prix_ht × 0.10
prix_ttc = prix_ht + tva
```

---

## TypeScript Implementation Skeleton

```typescript
// project/lib/calculer-devis.ts

interface DevisInput {
  nb_passagers: number;
  date_depart: Date;
  date_demande: Date;
  distance_km: number;
  aller_retour: boolean;
  options: Array<'guide' | 'chauffeur_nuit' | 'peages'>;
  peages_flat_rate?: number;  // from DB lookup if peages option selected
}

interface DevisLine {
  libelle: string;
  montant: number;
}

interface DevisOutput {
  prix_ht: number;
  tva: number;
  prix_ttc: number;
  lignes: DevisLine[];
  coefficients: Array<{ name: string; value: number }>;
  devise: 'EUR';
  manual_required: boolean;  // true if nb_passagers > 85
}

// Flat rate table (up to 180km)
const FLAT_RATE_TABLE: [number, number][] = [
  [10, 250], [20, 250], [30, 250], [40, 320], [50, 350],
  [60, 390], [70, 430], [80, 500], [90, 540], [100, 580],
  [110, 620], [120, 660], [130, 700], [140, 740], [150, 780],
  [160, 820], [170, 860], [180, 900],
];

function getBasePrice(distance_km: number): number {
  if (distance_km <= 180) {
    // Find the nearest step (round up)
    const entry = FLAT_RATE_TABLE.find(([km]) => km >= distance_km);
    if (entry) return entry[1];
    return 900; // max flat rate
  }
  // Beyond 180km
  return (distance_km * 2) * 2.50;
}

function getSeasonalityCoeff(date: Date): number {
  const month = date.getMonth() + 1; // 1-12
  if ([11, 1, 2, 8].includes(month)) return 0.93;  // Low
  if ([12, 10, 9].includes(month)) return 1.00;    // Medium
  if ([3, 4, 7].includes(month)) return 1.10;      // High
  if ([5, 6].includes(month)) return 1.15;          // Very High
  return 1.00;
}

function getUrgencyCoeff(date_demande: Date, date_depart: Date): number {
  const gapDays = Math.floor((date_depart.getTime() - date_demande.getTime()) / (1000 * 60 * 60 * 24));
  if (gapDays < 1) return 1.10;    // DD_PRIORITAIRE
  if (gapDays <= 3) return 1.05;   // DD_URGENT
  if (gapDays <= 90) return 0.95;  // DD_NORMAL
  return 0.90;                      // DD_3MOISETPLUS
}

function getCapacityCoeff(nb_passagers: number): number | null {
  if (nb_passagers > 85) return null; // signals manual routing
  if (nb_passagers <= 19) return 0.95;
  if (nb_passagers <= 53) return 1.00;
  if (nb_passagers <= 63) return 1.15;
  if (nb_passagers <= 67) return 1.20;
  return 1.40; // 68-85
}

export function calculer_devis(input: DevisInput): DevisOutput {
  const capacityCoeff = getCapacityCoeff(input.nb_passagers);
  
  // >85 passengers → manual
  if (capacityCoeff === null) {
    return {
      prix_ht: 0, tva: 0, prix_ttc: 0,
      lignes: [], coefficients: [],
      devise: 'EUR', manual_required: true,
    };
  }

  const lignes: DevisLine[] = [];
  const coefficients = [];

  // Step 1: Base price
  let base = getBasePrice(input.distance_km);
  lignes.push({ libelle: `Transport ${input.distance_km}km (${input.aller_retour ? 'aller-retour' : 'aller simple'})`, montant: base });

  // Step 2: Round trip
  if (input.aller_retour) {
    base *= 2;
  }

  // Step 3: Coefficients
  const seasonCoeff = getSeasonalityCoeff(input.date_depart);
  const urgencyCoeff = getUrgencyCoeff(input.date_demande, input.date_depart);

  coefficients.push({ name: 'seasonalité', value: seasonCoeff });
  coefficients.push({ name: 'urgence', value: urgencyCoeff });
  coefficients.push({ name: 'capacité', value: capacityCoeff });
  coefficients.push({ name: 'marge', value: 1.15 });

  let prix_ht = base * seasonCoeff * urgencyCoeff * capacityCoeff * 1.15;

  // Step 4: Options
  if (input.options.includes('guide')) {
    prix_ht += 80; // per day — caller must multiply by nb_days
    lignes.push({ libelle: 'Guide/accompagnateur', montant: 80 });
  }
  if (input.options.includes('chauffeur_nuit')) {
    prix_ht += 120; // per night — caller must multiply by nb_nights
    lignes.push({ libelle: 'Hébergement chauffeur nuit', montant: 120 });
  }
  if (input.options.includes('peages') && input.peages_flat_rate) {
    prix_ht += input.peages_flat_rate;
    lignes.push({ libelle: 'Péages (forfait route)', montant: input.peages_flat_rate });
  }

  // Step 5: VAT
  const tva = prix_ht * 0.10;
  const prix_ttc = prix_ht + tva;

  return {
    prix_ht: Math.round(prix_ht * 100) / 100,
    tva: Math.round(tva * 100) / 100,
    prix_ttc: Math.round(prix_ttc * 100) / 100,
    lignes,
    coefficients,
    devise: 'EUR',
    manual_required: false,
  };
}
```

---

## Unit Test Cases

Write these tests FIRST, before connecting anything to AI.

```typescript
// project/lib/__tests__/calculer-devis.test.ts

import { calculer_devis } from '../calculer-devis';

describe('calculer_devis()', () => {
  const BASE_INPUT = {
    date_depart: new Date('2026-10-15'),  // October = Medium season (×1.00)
    date_demande: new Date('2026-07-15'), // 92 days before → DD_3MOISETPLUS (×0.90)
    aller_retour: false,
    options: [],
  };

  test('50km, 30 passengers, one-way, medium season, >3 months = base × coefficients', () => {
    const result = calculer_devis({ ...BASE_INPUT, distance_km: 50, nb_passagers: 30 });
    // base = 350, season 1.00, urgency 0.90, capacity 1.00, margin 1.15
    // 350 × 1.00 × 0.90 × 1.00 × 1.15 = 362.25
    expect(result.manual_required).toBe(false);
    expect(result.prix_ht).toBeCloseTo(362.25, 1);
    expect(result.tva).toBeCloseTo(36.23, 1);
    expect(result.prix_ttc).toBeCloseTo(398.48, 1);
  });

  test('round trip doubles the base price', () => {
    const one_way = calculer_devis({ ...BASE_INPUT, distance_km: 100, nb_passagers: 30, aller_retour: false });
    const round_trip = calculer_devis({ ...BASE_INPUT, distance_km: 100, nb_passagers: 30, aller_retour: true });
    expect(round_trip.prix_ht).toBeCloseTo(one_way.prix_ht * 2, 1);
  });

  test('>85 passengers returns manual_required: true', () => {
    const result = calculer_devis({ ...BASE_INPUT, distance_km: 100, nb_passagers: 100 });
    expect(result.manual_required).toBe(true);
    expect(result.prix_ttc).toBe(0);
  });

  test('200km uses (km×2)×2.50 formula', () => {
    const result = calculer_devis({ ...BASE_INPUT, distance_km: 200, nb_passagers: 30 });
    // base = (200×2)×2.50 = 1000, ×0.90×1.00×1.15 = 1035
    expect(result.prix_ht).toBeCloseTo(1035, 0);
  });

  test('Very High season (June) applies +15%', () => {
    const june_input = { ...BASE_INPUT, date_depart: new Date('2026-06-15'), date_demande: new Date('2026-01-01') };
    const result = calculer_devis({ ...june_input, distance_km: 50, nb_passagers: 30 });
    // 350 × 1.15 (season) × 0.90 (urgency) × 1.00 × 1.15 (margin)
    expect(result.prix_ht).toBeCloseTo(416.99, 0);
  });

  test('≤19 passengers applies -5% capacity coefficient', () => {
    const result = calculer_devis({ ...BASE_INPUT, distance_km: 50, nb_passagers: 15 });
    const result_20 = calculer_devis({ ...BASE_INPUT, distance_km: 50, nb_passagers: 20 });
    // ≤19 gets ×0.95 vs 20-53 gets ×1.00
    expect(result.prix_ht).toBeLessThan(result_20.prix_ht);
  });
});
```

---

## Matrices Table Schema (Database)

Store these so the client can update them without touching code:

```sql
-- Supabase / PostgreSQL
CREATE TABLE matrices_saisonnalite (
  id SERIAL PRIMARY KEY,
  mois INTEGER NOT NULL,           -- 1-12
  libelle TEXT NOT NULL,           -- 'Low', 'Medium', 'High', 'Very High'
  coefficient DECIMAL(4,3) NOT NULL -- 0.930, 1.000, 1.100, 1.150
);

CREATE TABLE matrices_urgence (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,              -- 'DD_PRIORITAIRE', 'DD_URGENT', etc.
  gap_jours_min INTEGER,           -- null = no lower bound
  gap_jours_max INTEGER,           -- null = no upper bound
  coefficient DECIMAL(4,3) NOT NULL
);

CREATE TABLE matrices_capacite (
  id SERIAL PRIMARY KEY,
  pax_min INTEGER NOT NULL,
  pax_max INTEGER,                 -- null = >85 (manual)
  coefficient DECIMAL(4,3),        -- null = manual routing
  is_manual BOOLEAN DEFAULT FALSE
);

CREATE TABLE matrices_options (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,              -- 'guide', 'chauffeur_nuit', 'peages_[route]'
  libelle TEXT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  unite TEXT NOT NULL              -- 'par_jour', 'par_nuit', 'forfait'
);
```

For Airtable: create one table per matrix type (Saisonnalité, Urgence, Capacité, Options) with the same fields.

---

*Source: Official NeoTravel pricing rules document | Last verified: June 22, 2026*
