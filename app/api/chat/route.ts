/**
 * POST /api/chat
 *
 * Proxy entre l'UI chat Next.js et le webhook Emma (n8n cloud).
 * Garde l'URL du webhook côté serveur — jamais exposée au navigateur.
 *
 * Body attendu : { sessionId: string, message: string }
 * Body transmis à n8n : { sessionId, message }
 * Réponse de n8n : { reply: string, status: string } (Formater Reponse node)
 */

import { NextRequest, NextResponse } from 'next/server';

const EMMA_WEBHOOK_URL =
  process.env.EMMA_WEBHOOK_URL ||
  'https://gendellepitech.app.n8n.cloud/webhook/neotravel-chat';

export async function POST(req: NextRequest) {
  let body: { sessionId?: string; message?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'Message vide.' }, { status: 400 });
  }

  try {
    const n8nRes = await fetch(EMMA_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: body.sessionId || 'default-session',
        message: body.message,
      }),
    });

    if (!n8nRes.ok) {
      const text = await n8nRes.text().catch(() => '');
      console.error('Emma webhook error:', n8nRes.status, text);

      // Gemini free-tier rate limit — return 200 with friendly retry message
      // so the UI shows it as a chat bubble, not a hard error
      const isRateLimit = n8nRes.status === 429 ||
        text.toLowerCase().includes('too many') ||
        text.toLowerCase().includes('rate') ||
        text.toLowerCase().includes('quota');

      if (isRateLimit) {
        return NextResponse.json(
          { reply: "Je suis momentanément surchargée. Réessayez dans 30 secondes 🙏" },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: "Emma n'est pas disponible pour le moment." },
        { status: 502 }
      );
    }

    // n8n peut répondre avec du JSON { output: "..." } ou du texte brut
    const contentType = n8nRes.headers.get('content-type') || '';
    let reply: string;

    if (contentType.includes('application/json')) {
      const data = await n8nRes.json();
      // Formater Reponse node renvoie { reply: "...", status: "..." }
      // Fallbacks pour compatibilité avec d'autres formats n8n
      reply = data.reply || data.output || data.message || data.text || JSON.stringify(data);
    } else {
      reply = await n8nRes.text();
    }

    return NextResponse.json({ reply }, { status: 200 });
  } catch (err) {
    console.error('fetch Emma failed:', err);
    return NextResponse.json(
      { error: 'Impossible de joindre Emma.' },
      { status: 502 }
    );
  }
}
