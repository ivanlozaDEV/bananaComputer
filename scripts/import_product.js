#!/usr/bin/env node
/**
 * BananaComputer — Smart Product Importer
 * 
 * Uses Ollama (local AI) to parse raw datasheet text and generate:
 *  - Structured spec card values (mapped to attribute_definitions)
 *  - Full JSONB datasheet
 *  - Marketing copy in Spanish (tagline, subtitle, body)
 *
 * Usage:
 *   node scripts/import_product.js --file datasheet.txt --category laptops --sub laptops-basicas
 *   node scripts/import_product.js --text "RAM 8GB\nCPU i5..." --category laptops --sub laptops-gaming-fuerte
 *   cat datasheet.txt | node scripts/import_product.js --category laptops
 *
 * Options:
 *   --file <path>      Path to datasheet text file
 *   --text <string>    Inline datasheet text
 *   --category <slug>  Category slug (e.g. 'laptops')
 *   --sub <slug>       Subcategory slug (e.g. 'laptops-basicas')
 *   --model <name>     Ollama model (default: llama3)
 *   --sku <string>     Product SKU (auto-generated if not provided)
 *   --price <number>   Price in USD
 *   --stock <number>   Stock quantity (default: 10)
 *   --dry-run          Print result without inserting to DB
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { argv } from 'process';

// ── Config ────────────────────────────────────────────────────────────
const SUPABASE_URL     = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY     = process.env.VITE_SUPABASE_ANON_KEY || '';
const OLLAMA_BASE      = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL    = 'llama3.1';

// ── Parse CLI Args ────────────────────────────────────────────────────
const args = argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const has = (flag) => args.includes(flag);

const opts = {
  file:     get('--file'),
  text:     get('--text'),
  category: get('--category') || 'laptops',
  sub:      get('--sub'),
  model:    get('--model')    || DEFAULT_MODEL,
  sku:      get('--sku'),
  price:    parseFloat(get('--price') || '0'),
  stock:    parseInt(get('--stock')   || '10'),
  dryRun:   has('--dry-run'),
};

// ── Supabase Client ───────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Ollama Call ───────────────────────────────────────────────────────
async function callOllama(prompt, model = opts.model) {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, format: 'json' }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  try {
    return JSON.parse(json.response);
  } catch {
    // Try to extract JSON from the response text
    const match = json.response.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`Ollama returned non-JSON: ${json.response}`);
  }
}

// ── Read Datasheet Input ──────────────────────────────────────────────
function readDatasheet() {
  if (opts.file) return readFileSync(opts.file, 'utf-8');
  if (opts.text) return opts.text;
  // Read from stdin
  try {
    return readFileSync('/dev/stdin', 'utf-8');
  } catch {
    console.error('❌ Provide --file, --text, or pipe text via stdin');
    process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('🍌 BananaComputer Smart Product Importer');
  console.log(`   Model: ${opts.model} | Category: ${opts.category} | Dry run: ${opts.dryRun}`);
  console.log('');

  // 1. Read datasheet text
  const rawText = readDatasheet().trim();
  if (!rawText) { console.error('❌ Empty datasheet'); process.exit(1); }
  console.log(`📄 Datasheet leído: ${rawText.split('\n').length} líneas`);

  // 2. Fetch attribute definitions from Supabase
  console.log('📡 Consultando Supabase — attribute_definitions...');
  const { data: catData, error: catErr } = await supabase
    .from('categories')
    .select('id, name, attribute_definitions(*), subcategories(id, slug, name)')
    .eq('slug', opts.category)
    .single();

  if (catErr || !catData) {
    console.error('❌ Categoría no encontrada:', opts.category, catErr?.message);
    process.exit(1);
  }

  const subData = opts.sub
    ? catData.subcategories?.find(s => s.slug === opts.sub)
    : null;

  if (opts.sub && !subData) {
    console.error(`❌ Subcategoría "${opts.sub}" no encontrada`);
    process.exit(1);
  }

  // Simplificación: Todos los atributos son de la categoría
  const allAttrs   = (catData.attribute_definitions || []).sort((a, b) => a.display_order - b.display_order);

  const attrSchema = allAttrs.map(a => ({
    id:   a.id,
    name: a.name,
    unit: a.unit,
    type: a.data_type,
  }));

  console.log(`✅ ${allAttrs.length} atributos cargados (${baseAttrs.length} base + ${extraAttrs.length} extras)`);

  // 3. Ask Ollama to parse and structure everything
  console.log(`🤖 Enviando a Ollama (${opts.model})...`);

  const prompt = `Eres un asistente experto en tecnología. Analiza el siguiente datasheet de un producto y devuelve un objeto JSON con EXACTAMENTE estas claves:

{
  "product_name": "Nombre comercial completo del producto",
  "featured_specs": {
    "<attr_id>": "<valor>"
  },
  "datasheet": {
    "<Campo original>": "<Valor original>"
  },
  "marketing": {
    "tagline": "Frase corta impactante en español (máx 8 palabras)",
    "marketing_subtitle": "Subtítulo descriptivo en español (máx 15 palabras)",
    "marketing_body": "Párrafo(s) de descripción atractiva en español para el comprador casual (3-5 oraciones). Menciona los puntos más fuertes del producto."
  }
}

ESQUEMA DE ATRIBUTOS DESTACADOS (featured_specs):
Mapea cada atributo al valor correspondiente del datasheet. Usa el "id" como clave y el valor numérico o texto como valor.
Si el datasheet no tiene ese atributo, omite esa clave en featured_specs.
Solo incluye el valor en las unidades indicadas, sin incluir las unidades en el valor.

${attrSchema.map(a => `- id: "${a.id}" | nombre: "${a.name}" | unidad: "${a.unit || 'texto'}" | tipo: ${a.type}`).join('\n')}

DATASHEET COMPLETO (datasheet):
Incluye TODOS los campos del texto raw tal como están, incluyendo los que no tienen atributo destinado.

TEXTO DEL DATASHEET:
---
${rawText}
---

Devuelve SOLO el JSON, sin texto adicional ni markdown.`;

  const result = await callOllama(prompt);
  console.log('✅ Ollama respondió exitosamente');

  // 4. Show preview
  console.log('\n─── RESULTADO ───────────────────────────────────────');
  console.log(`📦 Producto:       ${result.product_name}`);
  console.log(`💬 Tagline:        ${result.marketing?.tagline}`);
  console.log(`📝 Subtítulo:      ${result.marketing?.marketing_subtitle}`);
  console.log(`🏷️  Featured specs: ${Object.keys(result.featured_specs || {}).length} atributos mapeados`);
  console.log(`📋 Datasheet:      ${Object.keys(result.datasheet || {}).length} campos`);
  console.log('────────────────────────────────────────────────────\n');

  if (opts.dryRun) {
    console.log('🔍 DRY RUN — JSON completo:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ No se insertó nada en la base de datos (--dry-run)');
    return;
  }

  if (!opts.price) {
    console.error('❌ Especifica el precio con --price <valor>');
    process.exit(1);
  }

  // 5. Insert into Supabase
  console.log('💾 Insertando en Supabase...');

  const sku = opts.sku || `${opts.category.toUpperCase()}-${Date.now()}`;

  const { data: product, error: insertErr } = await supabase
    .from('products')
    .insert({
      sku,
      name:               result.product_name,
      tagline:            result.marketing?.tagline,
      marketing_subtitle: result.marketing?.marketing_subtitle,
      marketing_body:     result.marketing?.marketing_body,
      description:        result.marketing?.marketing_subtitle,
      price:              opts.price,
      stock:              opts.stock,
      category_id:        catData.id,
      subcategory_id:     subData?.id || null,
      datasheet:          result.datasheet || null,
      is_featured:        false,
      is_active:          true,
    })
    .select()
    .single();

  if (insertErr) {
    console.error('❌ Error al insertar producto:', insertErr.message);
    process.exit(1);
  }

  // 6. Insert attribute values
  const attrRows = Object.entries(result.featured_specs || {})
    .filter(([id, val]) => val !== null && val !== undefined && String(val).trim())
    .map(([attribute_id, value]) => ({
      product_id:   product.id,
      attribute_id,
      value:        String(value),
    }));

  if (attrRows.length) {
    const { error: attrErr } = await supabase.from('product_attributes').insert(attrRows);
    if (attrErr) console.warn('⚠️  Error en atributos:', attrErr.message);
  }

  console.log(`\n✅ Producto creado exitosamente!`);
  console.log(`   ID:  ${product.id}`);
  console.log(`   SKU: ${product.sku}`);
  console.log(`   Atributos guardados: ${attrRows.length}`);
  console.log(`\n👉 Edita en el admin: http://localhost:5173/admin/products`);
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
