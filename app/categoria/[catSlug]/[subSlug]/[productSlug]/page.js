import React from 'react';
import { supabase } from '@/lib/supabase';
import ProductDetailView from '@/components/ProductDetailView';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { catSlug, subSlug, productSlug } = await params;
  
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productSlug);
  const query = supabase
    .from('products')
    .select('name, description, image_url, images, marketing_subtitle, model_number, sku');
  
  if (isUUID) query.eq('id', productSlug);
  else query.eq('slug', productSlug);

  const { data: product } = await query.single();

  if (!product) {
    return {
      title: 'Producto No Encontrado | Banana Computer',
    };
  }

  // Optimize title for Model Searches
  const title = `${product.name}${product.model_number ? ` (${product.model_number})` : ''} | Banana Computer Ecuador`;
  const description = product.marketing_subtitle || product.description?.substring(0, 160);
  const image = product.images?.[0] || product.image_url;

  return {
    title,
    description,
    keywords: [product.name, product.model_number, 'ecuador', 'laptop', 'computadora', 'gamer', 'gaming', 'guayaquil', 'quito'].filter(Boolean),
    alternates: {
      canonical: `https://bananacomputer.store/categoria/${catSlug}/${subSlug}/${productSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://bananacomputer.store/categoria/${catSlug}/${subSlug}/${productSlug}`,
      images: image ? [{ url: image, width: 800, height: 800, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function Page({ params }) {
  const { catSlug, subSlug, productSlug } = await params;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productSlug);
  const query = supabase
    .from('products')
    .select('*, categories(id, name, slug), subcategories:subcategory_id(id, name, slug)');

  if (isUUID) query.eq('id', productSlug);
  else query.eq('slug', productSlug);

  const { data: product } = await query.single();

  if (!product) {
    notFound();
  }

  const { data: prodAttrs } = await supabase
    .from('product_attributes')
    .select('value, attribute_definitions(name, unit, icon, display_order)')
    .eq('product_id', product.id)
    .order('attribute_definitions(display_order)');

  return <ProductDetailView product={product} initialAttrs={prodAttrs || []} />;
}

