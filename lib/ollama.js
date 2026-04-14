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
export async function analyzeWithOllama(rawText, attrDefs, onToken, signal = null, price = null) {
  const attrNames = attrDefs.map(a => a.unit ? `${a.name} (${a.unit})` : a.name).join(', ');

  const prompt = `Extract product info from this datasheet. Return ONLY valid JSON.
  
PRECIO DEL PRODUCTO: ${price ? `$${price} USD` : 'Desconocido'}

JSON schema:
{
  "product_name": "full commercial name",
  "model_number": "official model or part number",
  "sku_suggestion": "SHORT-CODE",
  "specs": { "AttributeName": "value without units" },
  "tagline": "short catchy phrase in Spanish",
  "marketing_subtitle": "subtitle",
  "marketing_body": "3-4 sentence description",
  "description": "20-word summary",
  "banana_review": {
    "verdict": "phrase",
    "scores": { "office": 1-5, "gaming": 1-5, "design": 1-5, "portability": 1-5, "value": 1-5 },
    "pros": ["3 points"],
    "cons": ["1-2 considerations"],
    "detailed_review": "2 paragraphs"
  }
}

Rules:
- If price is ${price ? `$${price}` : 'Desconocido'}, use it for the "value" score.
- Review must be enthusiastic but objective.
- **PANTALLA**: Extrae solo el número decimal de pulgadas (ej: 14, 15.6, 17.3). 
  - ERROR COMÚN A EVITAR: No confundas "1920x1080" con el tamaño. Si ves 1920 o 1080, busca el tamaño real (usualmente 14" a 17").
- **ALMACENAMIENTO**: Convierte SIEMPRE a GB.
  - 1TB -> 1024
  - 512GB -> 512
  - 256GB -> 256
  - ERROR COMÚN A EVITAR: NUNCA pongas "1" o "2" si el datasheet dice TB. Multiplícalo por 1024.
- **RAM**: Solo el número (ej: 8, 16, 32).

Ejemplos de extracción Correcta:
- "Display 15.6 inch FHD (1920x1080)" -> Pantalla: 15.6
- "Storage 1TB PCIe NVMe SSD" -> Almacenamiento: 1024
- "Memory 16GB DDR4" -> RAM: 16

- Specs: extract ONLY these fields: ${attrNames || 'RAM, Procesador, Almacenamiento, Pantalla'}
- Return ONLY the JSON object.

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
  const prompt = `Actúa como un Experto en Computación y Vendedor de Banana Computer. Tu objetivo es realizar un análisis técnico pero PERSUASIVO del producto: ${product.name}.

Precio actual: $${product.price} USD
Specs: ${specsText}

Instrucciones Pro:
1. **BALANCE**: Sé honesto pero resalta lo positivo. No hables mal del producto sin necesidad. Si algo es estándar (ej. 16GB RAM), es un PUNTO FUERTE, no una limitación.
2. **UMBRALES TÉCNICOS**:
   - RAM: 8GB es sólido para oficina. 16GB es EXCELENTE para multitarea. 32GB+ es Pro.
   - Almacenamiento: 512GB es estándar. 1TB (1000GB) es MUCHO espacio, no digas que es insuficiente.
   - CPU: i5/Ryzen 5 son excelentes para el 90% de usuarios.
3. **CATEGORÍAS DE BANANAS (1-5):**
   - Office: Ideal para multitarea y oficina.
   - Gaming: Capacidad para ejecutar juegos modernos (valora la GPU).
   - Design: Calidad de pantalla (OLED/IPS) y potencia gráfica.
   - Portability: Peso (menos de 1.8kg es 5 bananas) y batería.
   - Value: Relación costo-beneficio CONSIDERANDO el precio de $${product.price}. ¿Es una buena oferta por este hardware?

Estructura de respuesta (JSON estrictamente):
{
  "verdict": "Una frase corta, vendedora y potente (ej: 'El aliado perfecto para tu carrera profesional').",
  "scores": {
    "office": 5,
    "gaming": 2,
    "design": 4,
    "portability": 5,
    "value": 4
  },
  "pros": ["3-4 puntos fuertes resaltando beneficios reales"],
  "cons": ["1-2 puntos a CONSIDERAR (presentados de forma constructiva, ej: 'Gráficos básicos para gaming pesado')"],
  "detailed_review": "2 párrafos de análisis experto. El primero enfocado en la potencia y versatilidad. El segundo en la experiencia de uso (pantalla, diseño, peso). El tono debe ser entusiasta y conocedor."
}

Reglas:
- NUNCA uses la palabra 'insuficiente' para 16GB de RAM o 1TB de SSD.
- Mantén el entusiasmo de un asesor de tecnología premium.
- Retorna ÚNICAMENTE el objeto JSON.`;

  const result = await groqChat(
    [{ role: 'user', content: prompt }],
    { json: true, temperature: 0.7, signal }
  );
  return parseOllamaJson(result);
}

// ─── Conversational AI Assistant ─────────────────────────────────
export async function chatWithOllama(messages, inventoryContext = '') {
  const systemPrompt = `Eres Banana AI, Asesor de Banana Computer.
### REGLA DE ORO #1: CATEGORÍAS Y TAGS
SIEMPRE debes poner los tags [RECOMENDACION: UUID] al final de tu mensaje para cada producto que menciones. Sin esto, el cliente no verá las tarjetas.

### REGLAS DE RESPUESTA:
1. BREVEDAD: Máximo 2 oraciones por respuesta.
2. STOCK: Solo recomienda lo que veas en el INVENTARIO abajo.
3. BAN: No hables de Apple/MacBook si no están en el inventario. Di "Solo manejamos las marcas del inventario" y ofrece una alternativa.
4. MODELOS: Usa el código [Modelo: XXX] que acompaña al nombre en el inventario. NUNCA pongas corchetes vacíos [].
5. COMPRA: Si preguntan cómo comprar, di "Haz click en Ver Detalles en la tarjeta de abajo".

### FORMATO OBLIGATORIO:
Texto de respuesta breve e informativo.

[RECOMENDACION: UUID_1]
[RECOMENDACION: UUID_2]

### INVENTARIO ACTUAL:
${inventoryContext || 'Sin disponibilidad actualmente.'}`;

  // Limit history to 8 turns
  const historyLimit = 8;
  const limitedMessages = messages.slice(-historyLimit).map(m => ({
    role: m.role,
    content: String(m.content || '')
  }));

  return await groqChat(
    [{ role: 'system', content: systemPrompt }, ...limitedMessages],
    { temperature: 0.3 }
  );
}
