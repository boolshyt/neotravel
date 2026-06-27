/**
 * POST /api/relance
 *
 * Déclenche manuellement WF2 — relances automatiques NeoTravel.
 * En production, WF2 tourne sur un schedule n8n (J+3 / J+7).
 * Cette route permet de le déclencher à la demande (test, admin).
 *
 * Body attendu :
 *   { lead_id: string }
 *
 * Idempotence garantie côté n8n via la clé (lead_id + relance_count).
 */

import { NextRequest, NextResponse } from "next/server";

const N8N_RELANCE_URL = process.env.N8N_RELANCE_URL;

export async function POST(req: NextRequest) {
  if (!N8N_RELANCE_URL) {
    console.error("N8N_RELANCE_URL not configured");
    return NextResponse.json(
      { error: "Service de relance non configuré." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  // Validation minimale
  const { lead_id } = body as Record<string, unknown>;
  if (!lead_id || typeof lead_id !== "string") {
    return NextResponse.json(
      { error: "lead_id manquant ou invalide." },
      { status: 422 }
    );
  }

  try {
    const n8nRes = await fetch(N8N_RELANCE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id }),
    });

    if (!n8nRes.ok && n8nRes.status !== 204) {
      const text = await n8nRes.text().catch(() => "");
      console.error("n8n relance error:", n8nRes.status, text);
      return NextResponse.json(
        { error: "Erreur lors du déclenchement de la relance." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: true, message: `Relance déclenchée pour le lead ${lead_id}.` },
      { status: 200 }
    );
  } catch (err) {
    console.error("fetch n8n relance failed:", err);
    return NextResponse.json(
      { error: "Impossible de joindre le serveur n8n." },
      { status: 502 }
    );
  }
}
