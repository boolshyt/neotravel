/**
 * POST /api/devis
 *
 * Calcule un devis en temps réel :
 *   1. Charge les matrices tarifaires depuis Airtable
 *   2. Appelle calculer_devis() — moteur déterministe, zéro IA
 *   3. Retourne le devis structuré
 *
 * Règle absolue : aucune IA ne calcule les prix.
 * Même input → même output, garanti.
 *
 * Auteur : Inde Hadoui
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculer_devis, type DevisInput } from '@/lib/calculer-devis';
import { fetchMatrices } from '@/lib/airtable';

// ── Validation basique du body ─────────────────────────────────────────────

function validateBody(body: unknown): body is DevisInput {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;

  if (typeof b.nb_passagers !== 'number' || b.nb_passagers < 1) return false;
  if (typeof b.distance_km !== 'number' || b.distance_km <= 0) return false;
  if (typeof b.date_depart !== 'string' || !b.date_depart) return false;
  if (typeof b.date_demande !== 'string' || !b.date_demande) return false;
  if (typeof b.aller_retour !== 'boolean') return false;
  if (!Array.isArray(b.options)) return false;

  // Vérification limite NeoTravel : 8–85 passagers
  if (b.nb_passagers < 8) return false;

  return true;
}

// ── Handler principal ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parsing
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide (JSON attendu).' },
      { status: 400 }
    );
  }

  // 2. Validation
  if (!validateBody(body)) {
    return NextResponse.json(
      {
        error: 'Paramètres manquants ou invalides.',
        requis: [
          'nb_passagers (number, 8–85)',
          'distance_km (number, > 0)',
          'date_depart (string ISO 8601)',
          'date_demande (string ISO 8601)',
          'aller_retour (boolean)',
          'options (array)',
        ],
      },
      { status: 422 }
    );
  }

  const input: DevisInput = body;

  // 3. Escalade immédiate si > 85 passagers (HITL — avant tout calcul)
  if (input.nb_passagers > 85) {
    return NextResponse.json(
      {
        manual_required: true,
        message:
          'Groupe de plus de 85 personnes : demande transmise à un conseiller spécialisé.',
      },
      { status: 200 }
    );
  }

  // 4. Chargement des matrices Airtable (avec fallback silencieux si DB indisponible)
  let matrices;
  try {
    matrices = await fetchMatrices();
  } catch (err) {
    // En cas d'erreur Airtable, on continue avec les valeurs codées en dur
    // (garantit la disponibilité du service même sans connexion DB)
    console.warn('[/api/devis] Airtable indisponible — fallback codé en dur :', err);
    matrices = undefined;
  }

  // 5. Calcul déterministe
  const devis = calculer_devis(input, matrices);

  // 6. Réponse
  return NextResponse.json(devis, { status: 200 });
}

// ── GET — healthcheck ──────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json(
    {
      endpoint: 'POST /api/devis',
      description: 'Calcul de devis NeoTravel (8–85 passagers)',
      exemple: {
        nb_passagers: 40,
        distance_km: 120,
        date_depart: '2026-08-15',
        date_demande: new Date().toISOString().split('T')[0],
        aller_retour: true,
        options: ['guide'],
        peages_flat_rate: 35,
      },
    },
    { status: 200 }
  );
}
