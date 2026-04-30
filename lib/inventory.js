import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABLE ONLY — products with badge_type != 'unavailable' AND is_active
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base query guard: always excludes unavailable & inactive products.
 */
function availableProductsQuery() {
  return supabase
    .from('products')
    .select('id, slug, name, price, transfer_price, model_number, stock, is_active, badge_type, categories(name, slug), subcategories:subcategory_id(name, slug), product_attributes(value, attribute_definitions(name, unit))')
    .eq('is_active', true)
    .neq('badge_type', 'unavailable');
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN-EFFICIENT CATALOG FORMAT
//
// Strategy:
//  • Baseline (index) = ultra-compact one-liner per product (~15 tokens)
//  • Detail (for top-3) = full specs block (~60 tokens per product)
//
// This keeps the Selection Call within ~1 500 tokens for 100 products,
// and the final Answer Call within ~3 000 tokens total.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a single product as a compact index line.
 * e.g.:  asus-rog-strix-g16 | ROG Strix G16 | $1299 | i7-13650HX 16GB 512GB
 */
function formatCompact(p) {
  const attrs = p.product_attributes || [];
  const get = (keywords) => {
    for (const kw of keywords) {
      const a = attrs.find(a => a.attribute_definitions?.name?.toLowerCase().includes(kw));
      if (a) return `${a.value}${a.attribute_definitions.unit || ''}`.trim();
    }
    return null;
  };

  const cpu     = get(['procesador', 'cpu', 'processor']) || '';
  const ram     = get(['ram', 'memoria']) || '';
  const storage = get(['almacenamiento', 'ssd', 'disco']) || '';
  const cardPrice     = parseFloat(p.price) || 0;
  const transferPrice = p.transfer_price ? parseFloat(p.transfer_price) : Math.round(cardPrice / 1.06);
  const specStr = [cpu, ram && `${ram}RAM`, storage && `${storage}SSD`].filter(Boolean).join(' ');

  return `${p.slug} | ${p.name}${p.model_number ? ` (${p.model_number})` : ''} | Efectivo:$${Math.round(transferPrice)} Tarjeta:$${Math.round(cardPrice)} | ${specStr}`.trim();
}

/**
 * Formats a single product as a detailed block (used for final answer context).
 */
function formatDetailed(p) {
  const attrs = p.product_attributes || [];
  const specLines = attrs
    .slice(0, 6)
    .map(a => `  ${a.attribute_definitions?.name}: ${a.value}${a.attribute_definitions?.unit || ''}`)
    .join('\n');
  const cardPrice     = parseFloat(p.price) || 0;
  const transferPrice = p.transfer_price ? parseFloat(p.transfer_price) : Math.round(cardPrice / 1.06);

  return [
    `[PRODUCTO] ${p.slug}`,
    `  Nombre: ${p.name}${p.model_number ? ` — Modelo: ${p.model_number}` : ''}`,
    `  Precio Efectivo/Transferencia: $${Math.round(transferPrice)}`,
    `  Precio Tarjeta/Normal: $${Math.round(cardPrice)}`,
    `  Stock: ${parseInt(p.stock) > 0 ? `✓ ${p.stock} unidades` : '✗ Sin stock'}`,
    specLines || '  Sin especificaciones',
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a compact baseline index for the AI Selection Call.
 * ~15 tokens/product → safe for 100+ products on Groq.
 */
export async function generateAIBaseline() {
  const { data, error } = await availableProductsQuery()
    .order('price', { ascending: true });

  if (error || !data || data.length === 0) {
    return 'No hay productos disponibles en este momento.';
  }

  const categories = [...new Set(data.map(p => p.categories?.name).filter(Boolean))];
  const prices = data.map(p => parseFloat(p.transfer_price || p.price)).filter(Boolean);
  const minPrice = Math.round(Math.min(...prices));
  const maxPrice = Math.round(Math.max(...prices));

  const index = data.map(formatCompact).join('\n');

  return [
    `### BANANA COMPUTER — CATÁLOGO DISPONIBLE (${data.length} productos)`,
    `Categorías: ${categories.join(', ')} | Rango de precios: $${minPrice}–$${maxPrice}`,
    `### ÍNDICE (slug | nombre | precio | specs):`,
    index,
    `### FIN DEL CATÁLOGO`,
  ].join('\n');
}

/**
 * Fetches full detail for a specific list of slugs (for the final answer context).
 * Only returns available products.
 */
export async function fetchProductDetailsBySlug(slugs) {
  if (!slugs || slugs.length === 0) return '';

  const { data, error } = await availableProductsQuery()
    .in('slug', slugs);

  if (error || !data || data.length === 0) return '';

  return data.map(formatDetailed).join('\n\n');
}

/**
 * Saves or updates the AI baseline in the database.
 */
export async function updateAIBaselineInDB() {
  const content = await generateAIBaseline();
  const { error } = await supabase
    .from('ai_baseline_knowledge')
    .upsert({ id: '00000000-0000-0000-0000-000000000001', content, updated_at: new Date() });

  if (error) throw error;
  return content;
}

/**
 * Fetches the current AI baseline from the database.
 */
export async function fetchAIBaseline() {
  const { data, error } = await supabase
    .from('ai_baseline_knowledge')
    .select('content')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  if (error || !data?.content) {
    // Fallback: regenerate on the fly if DB is empty
    return generateAIBaseline();
  }
  return data.content;
}

/**
 * Filters a baseline string to only include requested slugs.
 * (Kept for backward compat but now less critical since we use fetchProductDetailsBySlug)
 */
export function filterInventoryByIds(baseline, slugs) {
  if (!baseline || !slugs || slugs.length === 0) return baseline;
  const lines = baseline.split('\n');
  return lines.filter(line => {
    if (!line.match(/^\S+\s*\|/)) return true; // keep header lines
    return slugs.some(slug => line.startsWith(slug));
  }).join('\n');
}

/**
 * Searches the inventory for the AI [SEARCH:] tag handler.
 */
export async function searchInventoryForAI({ category, maxPrice, minPrice } = {}) {
  let query = availableProductsQuery();

  if (maxPrice) query = query.lte('price', maxPrice);
  if (minPrice) query = query.gte('price', minPrice);

  const { data: allData, error } = await query.limit(40);
  if (error) return [];

  let filtered = allData || [];
  if (category) {
    const catLower = category.toLowerCase();
    filtered = filtered.filter(p =>
      p.categories?.name?.toLowerCase().includes(catLower)
    );
  }

  return filtered.slice(0, 6).map(p => ({
    id: p.id,
    slug: p.slug,
    category_slug: p.categories?.slug,
    subcategory_slug: p.subcategories?.slug,
    name: p.name,
    price: p.price,
    specs: (p.product_attributes || []).slice(0, 3)
      .map(a => `${a.attribute_definitions.name}: ${a.value}${a.attribute_definitions.unit || ''}`)
      .join(', ')
  }));
}

/**
 * Formats a list of products into a compact string (used by [SEARCH:] handler).
 */
export function formatInventoryForAI(products) {
  if (!products || products.length === 0) {
    return 'No se encontraron productos disponibles para esos criterios.';
  }
  return products.map(p =>
    `- SLUG: ${p.slug} | ${p.name} | $${p.price} | ${p.specs}`
  ).join('\n');
}

/**
 * Joins the waitlist
 */
export async function addToWaitlist(email, interest) {
  const { error } = await supabase
    .from('waitlist')
    .insert([{ email, interest }]);

  if (error) throw error;
  return true;
}
