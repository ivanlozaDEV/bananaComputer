import React from 'react';
import { supabase } from '@/lib/supabase';
import CategoryDetailView from '@/components/CategoryDetailView';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { catId } = await params;
  
  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('id', catId)
    .single();

  if (!category) {
    return { title: 'Categoría No Encontrada | Banana Computer' };
  }

  const title = `${category.name} | Laptops y Accesorios en Ecuador`;
  const description = category.description || `Explora lo mejor en ${category.name} con garantía oficial en Ecuador. Equipos de alta gama seleccionados por expertos.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function Page({ params }) {
  const { catId } = await params;

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', catId)
    .single();

  if (!category) notFound();

  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', catId)
    .order('name');

  return <CategoryDetailView category={category} subcategories={subcategories || []} />;
}
