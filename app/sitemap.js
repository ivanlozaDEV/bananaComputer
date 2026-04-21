import { supabase } from '@/lib/supabase';

export default async function sitemap() {
  const baseUrl = 'https://bananacomputer.store';

  // Fetch all active products
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('is_active', true);

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id');

  // Fetch all subcategories
  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('id, category_id');

  const productUrls = (products || []).map((p) => ({
    url: `${baseUrl}/producto/${p.id}`,
    lastModified: p.updated_at || new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryUrls = (categories || []).map((c) => ({
    url: `${baseUrl}/categoria/${c.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const subcategoryUrls = (subcategories || []).map((s) => ({
    url: `${baseUrl}/categoria/${s.category_id}/${s.id}`,
    lastModified: new Date(),
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
