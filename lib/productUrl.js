/**
 * Builds the canonical URL for a product page.
 *
 * Strategy (in order):
 *  1. /categoria/[catSlug]/[subSlug]/[productSlug]  — full SEO path
 *  2. /categoria/[catSlug]/[productSlug]             — no subcategory
 *  3. /categoria/[catId]/[productSlug]               — UUID fallback (still routable)
 *  4. /buscar?q=[productSlug]                        — last resort, never a dead link
 *
 * @param {object} product - A product object with joined categories/subcategories relations
 * @returns {string} absolute pathname
 */
export function productUrl(product) {
  if (!product) return '/';

  const catSlug = product.categories?.slug || null;
  const catId   = product.category_id || null;
  const subSlug = product.subcategories?.slug || null;
  const prodSlug = product.slug || product.id;

  // Prefer slug over UUID for category
  const cat = catSlug || catId;

  if (!cat) {
    // No category at all — fall back to search so it never 404s
    return `/buscar?q=${encodeURIComponent(product.name || prodSlug)}`;
  }

  if (subSlug) {
    return `/categoria/${cat}/${subSlug}/${prodSlug}`;
  }

  return `/categoria/${cat}/${prodSlug}`;
}
