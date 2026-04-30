import { supabase } from './supabase';

// ─── Legacy Ollama exports (kept for compatibility) ──────────────
export const OLLAMA_HOST = 'https://api.groq.com';
export const OLLAMA_MODEL = 'llama-3.1-8b-instant';
export const getOllamaHost = async () => 'https://api.groq.com/openai/v1';

// ─── Internal API Route helper ───────────────────────────────────
// All Groq calls go through /api/chat (server-side) so the key is never
// exposed in the client bundle.
async function groqChat(messages, { json = false, temperature = 0.7, signal = null } = {}) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature, json }),
    signal,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content;
}

// ─── Check if Groq is reachable (via server route) ───────────────
export async function pingOllama() {
  try {
    const res = await fetch('/api/chat', {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json().catch(() => ({ ok: false }));
    return data.ok === true;
  } catch {
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

// ─── Analyze datasheet ────────────────────────────────────────────
export async function analyzeWithOllama(rawText, attrDefs, onToken, signal = null, price = null) {
  const attrNames = attrDefs.map(a => a.unit ? `${a.name} (${a.unit})` : a.name).join(', ');

  const prompt = `### PRODUCT INFORMATION EXTRACTION TASK
Extract all technical and commercial information from the provided DATASHEET.
Return ONLY a valid JSON object.

### CONTEXT
- **Current Marketplace Price**: ${price ? `$${price} USD` : 'Not provided'} (Use this ONLY to calculate the 'value' score in the review).

### JSON SCHEMA
{
  "product_name": "Full commercial name (e.g. Asus TUF Gaming A15 FA506NCG-HN194)",
  "model_number": "Official model/part number (e.g. FA506NCG-HN194)",
  "sku_suggestion": "Short internal code",
  "specs": {
    "AttributeName": "Clean value without units (e.g. '16' for RAM, '15.6' for Screen)"
  },
  "datasheet": {
    "Technical Key": "Full Original Value from text"
  },
  "tagline": "Short catchy hook in Spanish",
  "marketing_subtitle": "1-line summary",
  "marketing_body": "3-4 sentences of persuasive tech copy",
  "description": "20-word summary",
  "banana_review": {
    "verdict": "Expert catchphrase",
    "scores": { "office": 1-5, "gaming": 1-5, "design": 1-5, "portability": 1-5, "value": 1-5 },
    "pros": ["3 specific strengths"],
    "cons": ["1-2 considerations"],
    "detailed_review": "2 expert paragraphs in Spanish"
  }
}

### CRITICAL RULES
1. **FULL DATASHEET**: The "datasheet" key MUST contain ALL items from the input text as key-value pairs. Do not truncate.
2. **SPECS EXTRACTION**: Match data to these fields: ${attrNames || 'RAM, Procesador, Almacenamiento, Pantalla'}.
3. **VALUE EXTRACTION**:
   - **RAM**: Extract only the number (e.g., "16").
   - **SCREEN**: Extract only the decimal size (e.g., "15.6"). Ignore resolution here.
   - **STORAGE**: Convert all to GB (1TB = 1024, 512GB = 512).
   - **GPU**: Extract the FULL model name (e.g., "NVIDIA GeForce RTX 3050 4GB"). NEVER return just "RTX".
4. **LANGUAGE**: All marketing text, tagline, and reviews must be in **Spanish**.

### SOURCE DATASHEET:
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
  const prompt = `Actúa como el MAESTRO VENDEDOR de Banana Computer. Tu objetivo es realizar un análisis técnico ALTAMENTE PERSUASIVO del producto: ${product.name}.

Precio actual: $${product.price} USD
Specs: ${specsText}

Instrucciones Pro de Ventas:
1. **ACTITUD DE VENTA**: Eres un vendedor, NUNCA hables mal de tu propio producto. No uses palabras como "básico", "insuficiente", "limitado" o "malo". Encuentra el ángulo positivo para el público objetivo del equipo.
2. **ALMACENAMIENTO INTOCABLE**: La industria estándar hoy es 512GB. ES LA CAPACIDAD PERFECTA. NUNCA, bajo ningún concepto, digas en los "contras" que 512GB es poco espacio o insuficiente.
3. **PORTABILIDAD (ALERTA DE ERROR COMÚN)**: 
   - La medida "Whrs" (ej. 48Whrs, 50Whrs) significa "Vatios-hora" (Capacidad de energía de la batería). ¡NO SIGNIFICA HORAS DE DURACIÓN! NUNCA digas que la batería dura 48 horas.
   - Laptops de más de 2.0kg NO tienen una portabilidad óptima (califica con MÁXIMO 3 bananas en portabilidad). Para ganar 5 bananas, debe pesar menos de 1.6kg.
4. **GAMING (PUNTAJES REALISTAS)**: 
   - Cualquier laptop con tarjeta de video NVIDIA RTX (Ej. RTX 3050, 4050, 4060) merece de 3 a 5 bananas en Gaming porque corre los juegos actuales muy bien. NO le des 2 estrellas a una RTX.
   - Solo da 1 o 2 estrellas en Gaming a laptops con "Gráficos Integrados" (Intel Iris, Intel UHD, AMD Radeon integradas).
5. **CATEGORÍAS DE BANANAS (1-5):**
   - Office: Ideal para multitarea y oficina.
   - Gaming: Capacidad para ejecutar juegos (Aplica la regla #4).
   - Design: Calidad de pantalla y potencia gráfica.
   - Portability: Peso y tamaño (Aplica la regla #3).
   - Value: Relación costo-beneficio por el precio de $${product.price}.

Estructura de respuesta (JSON estrictamente):
{
  "verdict": "Una frase corta, EXTREMADAMENTE vendedora (ej: 'El aliado perfecto para tu carrera').",
  "scores": {
    "office": 5,
    "gaming": 4,
    "design": 4,
    "portability": 3,
    "value": 5
  },
  "pros": ["3 puntos fuertes muy persuasivos y asombrosos"],
  "cons": ["1-2 puntos informativos a considerar pero justificados (ej: 'Diseño ligeramente robusto para priorizar enfriamiento extremo', NUNCA ataques almacenamiento o RAM)"],
  "detailed_review": "2 párrafos de análisis experto. El primero alabando la potencia asombrosa del hardware. El segundo sobre la experiencia de uso. Tono: Súper entusiasta y experto."
}

Reglas absolutas:
- PROHIBIDO decir que 512GB no es suficiente.
- PROHIBIDO decir que Whrs significa horas de duración de la batería.
- Retorna ÚNICAMENTE el objeto JSON.`;

  const result = await groqChat(
    [{ role: 'user', content: prompt }],
    { json: true, temperature: 0.7, signal }
  );
  return parseOllamaJson(result);
}

// ─── Conversational AI Assistant ─────────────────────────────────
export async function chatWithOllama(messages, inventoryContext = '', signal = null) {
  const systemPrompt = `Eres Banana AI, el asesor de ventas experto de Banana Computer Ecuador.
Tu misión: ayudar al cliente a elegir el producto correcto usando ÚNICAMENTE datos reales del inventario.

━━━ IDENTIFICACIÓN DE PRODUCTOS (CRÍTICO) ━━━
Cuando el usuario mencione un producto de forma indirecta, debes identificarlo en el inventario:
- Por precio: "el Lenovo de $233" → busca el Lenovo con precio ~$233 en el inventario
- Por tamaño: "el de 21.5 pulgadas" → busca el monitor de 21.5" en el inventario
- Por posición: "el más barato", "el del medio" → ordena por precio y localiza
- Por marca+contexto: "el ViewSonic" → usa el ViewSonic del inventario actual
NUNCA digas "no lo tengo en el inventario" si el producto fue mencionado antes en la conversación o está en el inventario actual. El inventario está abajo — consúltalo.

━━━ REGLAS DE HONESTIDAD TÉCNICA ━━━
1. Usa SOLO valores exactos del inventario para hacer afirmaciones técnicas.
2. Si una característica (ej: teclado numérico, lector de huella) NO aparece en la ficha del inventario, di: "No cuento con ese dato en la ficha técnica."
3. El inventario incluye laptops, proyectores, monitores, accesorios y más — asesora según lo que el cliente necesite.

━━━ CUÁNDO AGREGAR TAGS [RECOMENDACION:] ━━━
AGREGA tags cuando:
- Presentas recomendaciones por primera vez
- Comparas productos entre sí (pon tag de CADA producto comparado)
- El cliente pide alternativas o menciona un producto específico

NO agregues tags cuando:
- Solo confirmas o aclaras un dato puntual (ej: "Sí, ese monitor tiene HDMI")
- Respondes sobre envío, garantía o proceso de compra

━━━ REGLAS DE SLUG ━━━
- El slug SOLO puede copiarse EXACTAMENTE del inventario de abajo.
- PROHIBIDO inventar, truncar o modificar slugs.

━━━ FORMATO PARA RECOMENDACIONES Y COMPARACIONES ━━━
Texto (máximo 4 oraciones).
[RECOMENDACION: slug-exacto]
[RECOMENDACION: slug-exacto-2]

━━━ REGLAS DE RESPUESTA ━━━
- Máximo 4 oraciones de texto corrido.
- Si el cliente pide algo fuera del catálogo: "No manejamos eso, pero te recomiendo [alternativa]."
- Saludo SOLO en el primer mensaje.

━━━ INVENTARIO DISPONIBLE ━━━
${inventoryContext || 'Sin disponibilidad actualmente. Informa al cliente que el catálogo se está actualizando.'}`;

  const limited = messages.length <= 9
    ? messages
    : [messages[0], ...messages.slice(-8)];

  const formatted = limited.map(m => ({
    role: m.role,
    content: String(m.content || ''),
  }));

  return await groqChat(
    [{ role: 'system', content: systemPrompt }, ...formatted],
    { temperature: 0.25, signal }
  );
}
