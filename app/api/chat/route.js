import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY; // Server-only, NOT NEXT_PUBLIC_
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant';

export async function POST(request) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const { messages, temperature = 0.3, json = false } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const body = {
      model: GROQ_MODEL,
      messages,
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    };

    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Groq HTTP ${res.status}:`, errText);
      return NextResponse.json({ error: `Groq error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'Empty response from Groq' }, { status: 500 });
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error('Chat API Route Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  // Ping endpoint — checks if the API key is configured (doesn't expose it)
  if (!GROQ_API_KEY) {
    return NextResponse.json({ ok: false, reason: 'no_key' }, { status: 500 });
  }
  try {
    const res = await fetch(`${GROQ_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json({ ok: res.ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
