export const OLLAMA_HOST = 'http://localhost:11434';
export const OLLAMA_MODEL = 'llama3.1:8b';

// ─── Check if Ollama is running ──────────────────────────────────
export async function pingOllama() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Sanitize LLM JSON (fixes trailing commas, smart quotes, etc.) ─
export function sanitizeJson(text) {
  return text
    .replace(/[\u2018\u2019\u201C\u201D]/g, '"') // smart quotes → regular
    .replace(/,\s*([}\]])/g, '$1')               // trailing commas
    .replace(/\/\/.*$/gm, '')                    // JS-style comments
    .replace(/\t/g, ' ')                          // tabs → spaces
    .trim();
}

export function parseOllamaJson(text) {
  try { return JSON.parse(text); } catch { }
  const clean = sanitizeJson(text);
  try { return JSON.parse(clean); } catch { }
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { }
    try { return JSON.parse(sanitizeJson(match[0])); } catch { }
  }
  throw new Error('Ollama no devolvió JSON válido');
}

// ─── Ollama analyze datasheet (streaming) ──────────────────────
export async function analyzeWithOllama(rawText, attrDefs, onToken) {
  const attrNames = attrDefs.map(a => a.unit ? `${a.name} (${a.unit})` : a.name).join(', ');

  const prompt = `Extract product info from this datasheet. Return ONLY valid JSON, no markdown.

JSON schema:
{
  "product_name": "full commercial name",
  "sku_suggestion": "SHORT-CODE-UPPERCASE",
  "specs": { "AttributeName": "value without units" },
  "datasheet": { "FieldName": "value" },
  "tagline": "short catchy phrase in Spanish (max 8 words)",
  "marketing_subtitle": "descriptive subtitle in Spanish (max 15 words)",
  "marketing_body": "3-4 sentence product description in Spanish for casual buyers, highlight strengths",
  "description": "20-word max product summary in Spanish"
}

Rules:
- specs: extract ONLY these fields (use same key names): ${attrNames || 'RAM, Procesador, Almacenamiento, Pantalla, Batería, Peso'}
- datasheet: include ALL fields from the text, preserve original field names
- Values in specs must NOT include units, just the value (e.g. "8" not "8GB")
- Return ONLY the JSON object

DATASHEET:
${rawText}`;

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: true, format: 'json' }),
  });

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n').filter(Boolean)) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) {
          accumulated += parsed.response;
          onToken?.(accumulated);
        }
        if (parsed.done) break;
      } catch { /* partial line, ignore */ }
    }
  }

  return parseOllamaJson(accumulated);
}
