import { supabase } from './supabase';

let cachedHost = localStorage.getItem('OLLAMA_HOST_OVERRIDE') || import.meta.env.VITE_OLLAMA_HOST || 'http://localhost:11434';

export const getOllamaHost = async () => {
  // If we have a developer override, use it immediately
  const override = localStorage.getItem('OLLAMA_HOST_OVERRIDE');
  if (override) return override;

  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'ollama_host')
      .single();
    if (data?.value) {
      cachedHost = data.value;
      return data.value;
    }
  } catch (err) {
    console.warn('Could not fetch ollama_host from database, using fallback:', cachedHost);
  }
  return cachedHost;
};

export const OLLAMA_HOST = cachedHost; // Legacy export, will be updated by callers using getOllamaHost()
export const OLLAMA_MODEL = localStorage.getItem('OLLAMA_MODEL_OVERRIDE') || import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1:8b';

// ─── Check if Ollama is running ──────────────────────────────────
export async function pingOllama() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { 
      signal: AbortSignal.timeout(2000),
      mode: 'cors'
    });
    return res.ok;
  } catch (err) {
    console.error('Ollama Ping Error:', err);
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
  "model_number": "official model or part number (e.g. M1502, E1504F)",
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

// ─── Generate Banana Review (5 pillars) ────────────────────────
export async function generateBananaReview(product, specsText) {
  const prompt = `Critical tech review in Spanish for: ${product.name}.
Specs: ${specsText}

Provide an honest, expert assessment across 5 categories. Each score must be between 1 and 5 (integers).
Categories:
- Office: Suitability for heavy Excel/Docs and multitasking.
- Gaming: Ability to run modern heavy games.
- Design: Color accuracy, screen quality, GPU power for design.
- Portability: Weight and battery life for travel.
- Value: Cost-benefit ratio.

Return ONLY JSON:
{
  "verdict": "One short punchy sentence as a summary.",
  "scores": {
    "office": 3,
    "gaming": 3,
    "design": 3,
    "portability": 3,
    "value": 3
  },
  "pros": ["point 1", "point 2"],
  "cons": ["point 1", "point 2"],
  "detailed_review": "2-3 paragraphs of expert critical analysis in Spanish, mention the target user."
}

Rules:
- Be critical, don't just praise.
- DO NOT use the default '3' scores from the example; calculate them based on the hardware.
- High-end (i7/Ryzen 7, 16GB+) should score 4-5 in performance.
- Entry-level (Celeron/i3, 4GB) should score 1-2 in heavy categories.
- Mention specific specs from the list.
- Return ONLY the JSON object.`;

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      model: OLLAMA_MODEL, 
      prompt, 
      stream: false, 
      format: 'json',
      options: { temperature: 0.7 }
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return parseOllamaJson(data.response);
}
// ─── Conversational AI Assistant (Discovery + Router) ───────────
export async function chatWithOllama(messages, inventoryContext = '') {
  const systemPrompt = `Eres Banana AI, el Experto de Banana Computer. Ayuda al cliente a elegir una computadora.

### CONOCIMIENTO REAL (Stock Actual):
${inventoryContext || 'Cargando conocimiento base...'}

### REGLAS DE ORO (ESTRICTO):
1. **PRODUCTOS**: Solo recomienda lo que aparece en el CONOCIMIENTO REAL de arriba.
2. **VERACIDAD**: NO inventes mejoras técnicas (si el stock dice 8GB, NO digas 16GB).
3. **SIN SUPOSICIONES**: No asumas presupuestos o preferencias que el usuario no haya mencionado explícitamente. Evita frases como "considerando tu presupuesto" si el usuario no ha dado uno.
4. **RECOMENDACIÓN INLINE**: Deberás usar el tag [RECOMENDACION: UUID] inmediatamente después de la primera vez que menciones el nombre de una laptop.
5. **FLUJO DE COMPRA**: Indica al usuario que puede hacer clic en la tarjeta (card) para comprar de forma segura.
6. **BÚSQUEDA**: Si necesitas ver más opciones, emite [SEARCH: category=... max_price=...].

### PROHIBICIONES:
- PROHIBIDO solicitar datos de pago.
- NUNCA uses la palabra "undefined".
- NO incluyas textos meta como "(Remember rules)".`;

  const payload = {
    model: OLLAMA_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    stream: false,
    options: { temperature: 0.7 }
  };

  const host = await getOllamaHost();
  const res = await fetch(`${host}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Ollama Chat Error: ${res.status}`);
  const data = await res.json();
  return data.message.content;
}
