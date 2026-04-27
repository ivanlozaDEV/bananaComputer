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
  const systemPrompt = `Eres Banana AI, el asesor de ventas de Banana Computer. Eres amigable, directo y siempre recomiendas productos del inventario.

━━━ LEY ABSOLUTA: TAGS DE PRODUCTOS ━━━
- CADA VEZ que menciones el nombre de un producto — sin excepción — DEBES añadir su tag [RECOMENDACION: UUID] al final del mensaje.
- El UUID SOLO puede ser copiado EXACTAMENTE del campo [ID: ...] del INVENTARIO de abajo.
- PROHIBIDO inventar, modificar o adivinar UUIDs. Si no tienes el ID en el inventario, no menciones el producto.
- Si mencionas varios productos, incluye un tag por cada uno (uno por producto). SIEMPRE.

━━━ REGLAS DE RESPUESTA ━━━
1. BREVEDAD: Máximo 3 oraciones de texto por respuesta.
2. STOCK: Solo recomienda productos que estén en el INVENTARIO de abajo.
3. TAGS OBLIGATORIOS: Toda respuesta que mencione un producto TERMINA con los tags. Sin tags = respuesta inválida.
4. MODELOS: Usa el código [Modelo: XXX] del inventario. NUNCA uses corchetes vacíos [].
5. COMPRA: Si preguntan cómo comprar/ver specs, di "Haz click en Ver Detalles en la tarjeta de abajo".
6. FUERA DE CATÁLOGO: Si piden una marca no disponible, di "No manejamos esa marca, pero tengo [alternativa del inventario]".

━━━ FORMATO DE RESPUESTA (OBLIGATORIO) ━━━
[Texto breve — máximo 3 oraciones]

[RECOMENDACION: uuid-exacto-del-inventario]
[RECOMENDACION: uuid-exacto-del-inventario-2]

━━━ EJEMPLO CORRECTO ━━━
Usuario: "quiero algo para gaming"
Respuesta:
Para gaming te recomiendo el ASUS TUF Gaming A16 [Modelo: FA608UH-RV063-F], con RTX 3060 y Ryzen 7.

[RECOMENDACION: 550e8400-e29b-41d4-a716-446655440000]

━━━ EJEMPLO INCORRECTO (NUNCA HAGAS ESTO) ━━━
"Para gaming te recomiendo el ASUS TUF Gaming A16." ← SIN TAG = INVÁLIDO
[RECOMENDACION: 7e9f3d6a-8a4e-4e6e-9c8f-0b9a8d8f6c6b] ← UUID INVENTADO = PROHIBIDO

━━━ INVENTARIO ACTUAL ━━━
${inventoryContext || 'Sin disponibilidad actualmente. Informa al cliente que estás actualizando el catálogo.'}`;
  // Fix #6: Keep first message (context) + last 7 turns
  const firstMessage = messages[0];
  const recentMessages = messages.slice(-7);
  // Deduplicate: avoid adding firstMessage twice if it's already in recentMessages
  const limitedMessages = messages.length <= 8
    ? messages
    : [firstMessage, ...recentMessages].filter(Boolean);

  const formatted = limitedMessages.map(m => ({
    role: m.role,
    content: String(m.content || ''),
  }));

  return await groqChat(
    [{ role: 'system', content: systemPrompt }, ...formatted],
    { temperature: 0.3, signal }
  );
}
