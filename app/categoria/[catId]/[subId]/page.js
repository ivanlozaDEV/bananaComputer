import React from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductGrid from '@/components/ProductGrid';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { subId } = await params;
  
  const { data: subcategory } = await supabase
    .from('subcategories')
    .select('name, description')
    .eq('id', subId)
    .single();

  if (!subcategory) {
    return { title: 'Subcategoría No Encontrada | Banana Computer' };
  }

  const title = `${subcategory.name} | Expertos en Hardware Ecuador`;
  const description = subcategory.description || `Equipos especializados ${subcategory.name} con garantía real y soporte técnico en Ecuador.`;

  return {
    title,
    description,
  };
}

export default async function Page({ params }) {
  const { catId, subId } = await params;

  const [catRes, subRes] = await Promise.all([
    supabase.from('categories').select('*').eq('id', catId).single(),
    supabase.from('subcategories').select('*').eq('id', subId).single()
  ]);

  if (!catRes.data || !subRes.data) {
    notFound();
  }

  const category = catRes.data;
  const subcategory = subRes.data;

  return (
    <div className="min-h-screen bg-cream-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 mb-12">
          <Link href="/" className="hover:text-purple-brand"><Home size={12} /></Link>
          <ChevronRight size={10} />
          <Link href={`/categoria/${catId}`} className="hover:text-purple-brand">{category.name}</Link>
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
        <ProductGrid subcategoryId={subId} />
      </main>

      <Footer />
    </div>
  );
}
