import React from 'react';
import { supabase } from '@/lib/supabase';
import CategoryDetailView from '@/components/CategoryDetailView';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { catSlug } = await params;
  
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catSlug);
  const { data: category } = await (isUUID
    ? supabase.from('categories').select('name, description').eq('id', catSlug)
    : supabase.from('categories').select('name, description').eq('slug', catSlug)
  ).single();

  if (!category) {
    return { title: 'Categoría No Encontrada | Banana Computer' };
  }

  const title = `${category.name} | Laptops y Accesorios en Ecuador`;
  const description = category.description || `Explora lo mejor en ${category.name} con garantía oficial en Ecuador. Equipos de alta gama seleccionados por expertos.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://bananacomputer.store/categoria/${catSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://bananacomputer.store/categoria/${catSlug}`,
    },
  };
}

export default async function Page({ params }) {
  const { catSlug } = await params;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catSlug);
  const { data: category } = await (isUUID
    ? supabase.from('categories').select('*').eq('id', catSlug)
    : supabase.from('categories').select('*').eq('slug', catSlug)
  ).single();

  if (!category) notFound();

  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', category.id)
    .order('name');

  return <CategoryDetailView category={category} subcategories={subcategories || []} />;
}
