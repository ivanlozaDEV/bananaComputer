import React from 'react';
import { supabase } from '@/lib/supabase';
import ProductDetailView from '@/components/ProductDetailView';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { id } = await params;
  
  const { data: product } = await supabase
    .from('products')
    .select('name, description, image_url, images, marketing_subtitle, model_number, sku')
    .eq('id', id)
    .single();

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
    keywords: [product.name, product.model_number, 'ecuador', 'laptop', 'computadora'].filter(Boolean),
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : [],
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
  const { id } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('*, categories(id, name), subcategories:subcategory_id(id, name)')
    .eq('id', id)
    .single();

  if (!product) {
    notFound();
  }

  const { data: prodAttrs } = await supabase
    .from('product_attributes')
    .select('value, attribute_definitions(name, unit, icon, display_order)')
    .eq('product_id', id)
    .order('attribute_definitions(display_order)');

  return <ProductDetailView product={product} initialAttrs={prodAttrs || []} />;
}

