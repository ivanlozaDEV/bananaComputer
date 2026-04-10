import { supabase } from './supabase';

// ─── Groq Configuration ──────────────────────────────────────────
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant';

// ─── Legacy Ollama exports (kept for compatibility) ──────────────
export const OLLAMA_HOST = 'https://api.groq.com';
export const OLLAMA_MODEL = GROQ_MODEL;

export const getOllamaHost = async () => GROQ_BASE_URL;

// ─── Check if Groq is reachable ──────────────────────────────────
export async function pingOllama() {
  try {
    if (!GROQ_API_KEY) {
      console.warn('No GROQ_API_KEY set');
      return false;
    }
    const res = await fetch(`${GROQ_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch (err) {
    console.error('Groq Ping Error:', err);
    return false;
  }
}

// ─── Sanitize LLM JSON ───────────────────────────────────────────
export function sanitizeJson(text) {
  return text
    .replace(/[\u2018\u2019\u201C\u201D]/g, '"')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/\/\/.*$/gm, '')
    .replace(/\t/g, ' ')
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
  throw new Error('Groq no devolvió JSON válido');
}

// ─── Internal Groq chat helper ───────────────────────────────────
async function groqChat(messages, { json = false, temperature = 0.7, signal = null } = {}) {
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
    signal
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── Analyze datasheet ────────────────────────────────────────────
export async function analyzeWithOllama(rawText, attrDefs, onToken, signal = null) {
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

  const result = await groqChat(
    [{ role: 'user', content: prompt }],
    { json: true, signal }
  );
  onToken?.(result);
  return parseOllamaJson(result);
}

// ─── Generate Banana Review ───────────────────────────────────────
export async function generateBananaReview(product, specsText, signal = null) {
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

  const result = await groqChat(
    [{ role: 'user', content: prompt }],
    { json: true, temperature: 0.7, signal }
  );
  return parseOllamaJson(result);
}

// ─── Conversational AI Assistant ─────────────────────────────────
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
7. **WAITLIST**: Si el usuario pregunta por un producto que NO está en el CONOCIMIENTO REAL o está AGOTADO, emite [WAITLIST_PROMPT: nombre_del_producto] para capturar su interés.

### PROHIBICIONES:
- PROHIBIDO solicitar datos de pago.
- NUNCA uses la palabra "undefined".
- NO incluyas textos meta como "(Remember rules)".`;

  const sanitizedMessages = messages.map(m => ({
    role: m.role,
    content: String(m.content || '')
  }));

  return await groqChat(
    [{ role: 'system', content: systemPrompt }, ...sanitizedMessages],
    { temperature: 0.7 }
  );
}
