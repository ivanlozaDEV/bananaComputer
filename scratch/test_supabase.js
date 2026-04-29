import { supabase } from './lib/supabase.js';

async function testFetch() {
  console.log('Testing product fetch...');
  const { data, error } = await supabase
    .from('products')
    .select('id, name, is_active')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching products:', error);
  } else {
    console.log(`Found ${data?.length || 0} active products.`);
    if (data?.length > 0) {
      console.log('First product sample:', data[0]);
    }
  }
}

testFetch();
