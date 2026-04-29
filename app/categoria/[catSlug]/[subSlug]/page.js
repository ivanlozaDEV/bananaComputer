import React from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductGrid from '@/components/ProductGrid';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { catSlug, subSlug } = await params;
  
  const isCatUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catSlug);
  const isSubUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subSlug);

  try {
    const { data: category } = await (isCatUUID 
      ? supabase.from('categories').select('id, name').eq('id', catSlug)
      : supabase.from('categories').select('id, name').eq('slug', catSlug)
    ).single();

    if (!category) return { title: 'Categoría No Encontrada | Banana Computer' };

    const { data: subcategory } = await (isSubUUID
      ? supabase.from('subcategories').select('name, description').eq('id', subSlug).eq('category_id', category.id)
      : supabase.from('subcategories').select('name, description').eq('slug', subSlug).eq('category_id', category.id)
    ).single();

    if (subcategory) {
      return {
        title: `${subcategory.name} | ${category.name} Banana Computer`,
        description: subcategory.description || `Catálogo de ${subcategory.name} en Banana Computer Ecuador.`
      };
    }

    // Fallback: Si no es subcategoría, quizás es un producto huérfano de subcategoría
    const { data: product } = await supabase
      .from('products')
      .select('name, marketing_subtitle')
      .eq('slug', subSlug)
      .single();

    if (product) {
      return {
        title: `${product.name} | Banana Computer`,
        description: product.marketing_subtitle
      };
    }

    return { title: 'Catálogo | Banana Computer' };
  } catch (e) {
    return { title: 'Catálogo | Banana Computer' };
  }
}

export default async function Page({ params }) {
  const { catSlug, subSlug } = await params;

  const isCatUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catSlug);
  const isSubUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subSlug);

  const { data: category } = await (isCatUUID 
    ? supabase.from('categories').select('*').eq('id', catSlug)
    : supabase.from('categories').select('*').eq('slug', catSlug)
  ).single();

  if (!category) notFound();

  const { data: subcategory } = await (isSubUUID
    ? supabase.from('subcategories').select('*').eq('id', subSlug).eq('category_id', category.id)
    : supabase.from('subcategories').select('*').eq('slug', subSlug).eq('category_id', category.id)
  ).single();

  if (!subcategory) notFound();

  return (
    <div className="min-h-screen bg-cream-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 mb-12">
          <Link href="/" className="hover:text-purple-brand"><Home size={12} /></Link>
          <ChevronRight size={10} />
          <Link href={`/categoria/${catSlug}`} className="hover:text-purple-brand">{category.name}</Link>
          <ChevronRight size={10} />
          <span className="text-purple-brand opacity-100">{subcategory.name}</span>
        </nav>

        <header className="mb-20">
          <div className="flex flex-col gap-2">
            <span className="text-purple-brand font-black text-xs uppercase tracking-[0.3em]">// Vitrina Especializada</span>
            <h1 className="font-black tracking-tight">{subcategory.name}</h1>
          </div>
          <div className="h-1 bg-banana-yellow w-32 mt-6"></div>
        </header>

        {/* Filtered Product Grid */}
        <ProductGrid subcategoryId={subcategory.id} />
      </main>

      <Footer />
    </div>
  );
}
