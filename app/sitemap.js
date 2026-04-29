import { supabase } from '@/lib/supabase';

export default async function sitemap() {
  const baseUrl = 'https://bananacomputer.store';

  // Fetch all active products with their categories and subcategories
  const { data: products } = await supabase
    .from('products')
    .select('id, created_at, slug, categories(slug), subcategories:subcategory_id(slug)')
    .eq('is_active', true);

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, created_at, slug');

  // Fetch all subcategories
  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('id, category_id, created_at, slug, categories:category_id(slug)');

  const productUrls = (products || []).map((p) => ({
    url: `${baseUrl}/categoria/${p.categories?.slug || 'c'}/${p.subcategories?.slug || 's'}/${p.slug || p.id}`,
    lastModified: p.created_at || new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryUrls = (categories || []).map((c) => ({
    url: `${baseUrl}/categoria/${c.slug || c.id}`,
    lastModified: c.created_at || new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const subcategoryUrls = (subcategories || []).map((s) => ({
    url: `${baseUrl}/categoria/${s.categories?.slug || s.category_id}/${s.slug || s.id}`,
    lastModified: s.created_at || new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...productUrls,
    ...categoryUrls,
    ...subcategoryUrls,
  ];
}
