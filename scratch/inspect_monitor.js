
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProduct() {
  const targetId = '7d9a16b8-0bc1-488d-a6c3-9dfdc8beef55';
  
  // 1. Get the target product
  const { data: product, error } = await supabase.from('products').select('*').eq('id', targetId).single();
  if (error) { console.error('Error fetching product:', error); return; }
  
  console.log('Target Product:', { id: product.id, name: product.name, slug: product.slug, sku: product.sku });

  // 2. Check for potential name/slug collisions
  const { data: allProducts, error: allErr } = await supabase.from('products').select('id, name, slug, sku');
  if (allErr) { console.error(allErr); return; }

  const generatedSlug = product.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  
  const collisions = allProducts.filter(p => p.id !== targetId && p.slug === generatedSlug);
  const nameMatches = allProducts.filter(p => p.id !== targetId && p.name.toLowerCase().trim() === product.name.toLowerCase().trim());

  console.log('\nGenerated Slug for this product:', generatedSlug);
  
  if (collisions.length > 0) {
    console.log('Collisions found with existing SLUGS:');
    collisions.forEach(c => console.log(`- ${c.name} (ID: ${c.id}, Slug: ${c.slug})`));
  } else {
    console.log('No direct slug collisions found.');
  }

  if (nameMatches.length > 0) {
    console.log('Other products with the same NAME:');
    nameMatches.forEach(m => console.log(`- ${m.name} (ID: ${m.id}, Slug: ${m.slug})`));
  } else {
    console.log('No other products with the same name found.');
  }
}

inspectProduct();
