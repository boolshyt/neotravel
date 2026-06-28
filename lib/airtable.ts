/**
 * lib/airtable.ts
 * Couche d'accès aux matrices de tarification stockées dans Airtable.
 * Fetche les coefficients en temps réel et les passe à calculer_devis().
 *
 * Auteur : Inde Hadoui
 * Tables lues : Matrice_Saison, Matrice_Urgence, Matrice_Capacite,
 *               Matrice_Options, Parametres_Globaux
 */

import type { ExternalMatrices } from './calculer-devis';

const BASE_URL = 'https://api.airtable.com/v0';
const BASE_ID  = process.env.AIRTABLE_BASE_ID ?? 'apphcmnoff5FWbIX4';
const TOKEN    = process.env.AIRTABLE_API_KEY!; // same key as /api/calculer-devis

// Table IDs (stable — résistent aux renommages dans Airtable)
const TABLE_SAISON   = 'tblCbxzPXuZyYUe6x';
const TABLE_URGENCE  = 'tblD7zzVlj9ryOXCk';
const TABLE_CAPACITE = 'tbl2esvrFXZw4scLb';
const TABLE_OPTIONS  = 'tblUg6GETOz04KWj1';
const TABLE_PARAMS   = 'tblzng0gNx54Jl2qR';
const TABLE_DEMANDES = 'tbl8ucaqSrDODAFNg';
const TABLE_DEVIS    = 'tblSFo4ABzf4NI6X0';

// ── Helpers ──────────────────────────────────────────────────────────────────

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function fetchTable<T>(tableId: string): Promise<T[]> {
  const url  = `${BASE_URL}/${BASE_ID}/${tableId}?pageSize=100`;
  const res  = await fetch(url, { headers: headers(), next: { revalidate: 60 } }); // cache 60 s
  if (!res.ok) throw new Error(`Airtable ${tableId}: HTTP ${res.status}`);
  const json = await res.json();
  return (json.records as { fields: T }[]).map((r) => r.fields);
}

// ── Types internes (champs Airtable) ─────────────────────────────────────────

interface SaisonRow   { mois: string; coefficient: number }
interface UrgenceRow  { delai_min_heures: number; delai_max_heures: number; coefficient: number; delai_label: string }
interface CapaciteRow { pax_min: number; pax_max: number; coefficient: number }
interface OptionRow   { option_code: string; montant_fixe: number }
interface ParamRow    { cle: string; valeur: string }

// Mapping mois français → numéro (Airtable stocke le nom du mois en select)
const MOIS_MAP: Record<string, number> = {
  Janvier: 1, Février: 2, Mars: 3, Avril: 4, Mai: 5, Juin: 6,
  Juillet: 7, Août: 8, Septembre: 9, Octobre: 10, Novembre: 11, Décembre: 12,
};

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Charge toutes les matrices depuis Airtable et retourne un objet
 * compatible avec le paramètre `matrices` de calculer_devis().
 */
export async function fetchMatrices(): Promise<ExternalMatrices> {
  const [saisonRows, urgenceRows, capaciteRows, optionRows, paramRows] =
    await Promise.all([
      fetchTable<SaisonRow>(TABLE_SAISON),
      fetchTable<UrgenceRow>(TABLE_URGENCE),
      fetchTable<CapaciteRow>(TABLE_CAPACITE),
      fetchTable<OptionRow>(TABLE_OPTIONS),
      fetchTable<ParamRow>(TABLE_PARAMS),
    ]);

  // Saisonnalité : { mois: number, coefficient: number }[]
  const saison = saisonRows
    .filter((r) => r.mois && MOIS_MAP[r.mois] !== undefined)
    .map((r) => ({ mois: MOIS_MAP[r.mois], coefficient: r.coefficient }));

  // Urgence : { min_h, max_h, coefficient, code }[]
  const urgence = urgenceRows.map((r) => ({
    min_h: r.delai_min_heures ?? 0,
    max_h: r.delai_max_heures ?? 999999,
    coefficient: r.coefficient,
    code: r.delai_label,
  }));

  // Capacité : { pax_min, pax_max, coefficient }[]
  const capacite = capaciteRows.map((r) => ({
    pax_min: r.pax_min,
    pax_max: r.pax_max,
    coefficient: r.coefficient,
  }));

  // Options : guide et chauffeur_nuit
  const guideRow   = optionRows.find((r) => r.option_code === 'guide');
  const nuitRow    = optionRows.find((r) => r.option_code === 'chauffeur_nuit');
  const options = {
    guide:          guideRow?.montant_fixe  ?? 80,
    chauffeur_nuit: nuitRow?.montant_fixe   ?? 120,
  };

  // Marge depuis Parametres_Globaux — supporte "marge_pct":"15" et "marge":"1.15"
  let marge = 1.15;
  const margePctParam = paramRows.find((r) => r.cle === 'marge_pct');
  const margeParam    = paramRows.find((r) => r.cle === 'marge');
  if (margePctParam) marge = 1 + parseFloat(margePctParam.valeur) / 100; // "15" → 1.15
  else if (margeParam) marge = parseFloat(margeParam.valeur);             // "1.15" → 1.15

  return { saison, urgence, capacite, options, marge };
}

// ── Sauvegarde d'un lead dans Airtable ───────────────────────────────────────

export interface LeadData {
  nom_prospect:   string;
  email:          string;
  telephone?:     string;
  ville_depart:   string;
  ville_arrivee:  string;
  date_depart:    string;
  nb_passagers:   number;
  distance_km:    number;
  aller_retour:   boolean;
  options:        string[];
  message_libre?: string;
}

export async function saveLead(lead: LeadData): Promise<string> {
  const url = `${BASE_URL}/${BASE_ID}/${TABLE_DEMANDES}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      fields: {
        nom_prospect:  lead.nom_prospect,
        email:         lead.email,
        telephone:     lead.telephone ?? '',
        ville_depart:  lead.ville_depart,
        ville_arrivee: lead.ville_arrivee,
        date_depart:   lead.date_depart,
        nb_passagers:  lead.nb_passagers,
        distance_km:   lead.distance_km,
        aller_retour:  lead.aller_retour,
        options:       lead.options,
        message_libre: lead.message_libre ?? '',
        statut:        'Nouveau',
        date_demande:  new Date().toISOString(),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Airtable saveLead: HTTP ${res.status} — ${err}`);
  }

  const json = await res.json();
  return json.id as string; // recordId Airtable
}

// ── Sauvegarde d'un devis dans Airtable ──────────────────────────────────────

export interface DevisData {
  lead_record_id: string;
  prix_ht:        number;
  tva:            number;
  prix_ttc:       number;
  lignes_calcul:  string;
  coefficients:   string;
}

export async function saveDevis(devis: DevisData): Promise<string> {
  const url = `${BASE_URL}/${BASE_ID}/${TABLE_DEVIS}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      fields: {
        lead:          [devis.lead_record_id],
        prix_ht:       devis.prix_ht,
        tva:           devis.tva,
        prix_ttc:      devis.prix_ttc,
        lignes_calcul: devis.lignes_calcul,
        coefficients:  devis.coefficients,
        statut:        'Envoyé',
        sent_date:     new Date().toISOString(),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Airtable saveDevis: HTTP ${res.status} — ${err}`);
  }

  const json = await res.json();
  return json.id as string;
}
