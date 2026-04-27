import { supabase } from './supabase';

/**
 * Searches the inventory based on filters extracted by the AI.
 */
export async function searchInventoryForAI({ category, maxPrice, minPrice, tags }) {
  let query = supabase
    .from('products')
    .select('id, name, price, description, tagline, is_active, categories(name), product_attributes(value, attribute_definitions(name, unit))')
    .eq('is_active', true);

  if (category) {
    query = query.ilike('categories.name', `%${category}%`);
  }

  if (maxPrice) {
    query = query.lte('price', maxPrice);
  }

  if (minPrice) {
    query = query.gte('price', minPrice);
  }

  // Fix #5: Supabase PostgREST can't filter on related table columns in a simple .ilike().
  // Fetch all active products then filter by category in JS.
  const { data: allData, error } = await query.limit(50);

  if (error) {
    console.error('Error in AI inventory search:', error);
    return [];
  }

  let filtered = allData || [];

  if (category) {
    const catLower = category.toLowerCase();
    filtered = filtered.filter(p =>
      p.categories?.name?.toLowerCase().includes(catLower)
    );
  }

  // Respect maxPrice / minPrice (already applied on DB side via query above)
  return filtered.slice(0, 5).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    specs: p.product_attributes?.slice(0, 3).map(a =>
      `${a.attribute_definitions.name}: ${a.value}${a.attribute_definitions.unit || ''}`
    ).join(', ')
  }));
}

/**
 * Formats a list of products into a compact string for the AI context.
 */
export function formatInventoryForAI(products) {
  if (!products || products.length === 0) {
    return "No se encontraron productos que coincidan exactamente con esos criterios en este momento.";
  }

  return products.map(p =>
    `- ID: ${p.id} | ${p.name} | $${p.price} | Specs: ${p.specs}`
  ).join('\n');
}

/**
 * Filters a baseline string to only include requested IDs.
 */
export function filterInventoryByIds(baseline, ids) {
  if (!baseline || !ids || ids.length === 0) return baseline;
  const lines = baseline.split('\n');
  const filteredLines = lines.filter(line => {
    // Keep headers/metadata
    if (!line.startsWith('- [ID:')) return true;
    // Keep only specified IDs
    return ids.some(id => line.includes(id));
  });
  return filteredLines.join('\n');
}

/**
 * Generates a high-level baseline of the current catalog for the AI.
 */
export async function generateAIBaseline() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, model_number, is_active, categories(name), product_attributes(value, attribute_definitions(name))')
    .eq('is_active', true);

  if (error || !data) return "No hay información de inventario disponible.";

  const categories = [...new Set(data.map(p => p.categories?.name).filter(Boolean))];
  const validPrices = data.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
  const minPrice = validPrices.length ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length ? Math.max(...validPrices) : 0;

  let productsList = "";
  if (data.length <= 150) {
    productsList = "\n\n### CATÁLOGO (ID | NOMBRE | PRECIO | SPECS):\n" +
      data.map(p => {
        const specs = p.product_attributes || [];
        const ram = specs.find(s => s.attribute_definitions.name.toLowerCase().includes('ram'))?.value || 'n/a';
        const cpu = specs.find(s => s.attribute_definitions.name.toLowerCase().includes('procesador'))?.value || 'n/a';
        const storage = specs.find(s => s.attribute_definitions.name.toLowerCase().includes('almacenamiento'))?.value || 'n/a';
        const priceLabel = p.price !== null && p.price !== undefined && !isNaN(parseFloat(p.price)) ? parseFloat(p.price).toLocaleString() : '??';

        return `- [ID: ${p.id}] | ${p.name} | $${priceLabel} | CPU: ${cpu}, RAM: ${ram}GB, SSD: ${storage}GB`;
      }).join('\n');
  }

  return `### BANANA COMPUTER - STOCK PARA AI
Resumen: ${data.length} productos, Categorías: ${categories.join(', ')}, Precios: $${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}.${productsList}
### FIN DEL CATÁLOGO.`;
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

  if (error) return "";
  return data.content;
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
