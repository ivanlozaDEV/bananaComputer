"use client";
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductGrid from '@/components/ProductGrid';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function SubcategoryPage({ params }) {
  const { catId, subId } = use(params);
  const router = useRouter();
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParamsData = async () => {
      try {
        setLoading(true);
        const [catRes, subRes] = await Promise.all([
          supabase.from('categories').select('*').eq('id', catId).single(),
          supabase.from('subcategories').select('*').eq('id', subId).single()
        ]);

        if (catRes.error) throw catRes.error;
        if (subRes.error) throw subRes.error;

        setCategory(catRes.data);
        setSubcategory(subRes.data);
      } catch (err) {
        console.error('Error fetching subcategory context:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchParamsData();
  }, [catId, subId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center gap-4">
        <span className="text-4xl animate-bounce">🍌</span>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Filtrando Inventario...</span>
      </div>
    );
  }

  if (!category || !subcategory) return null;

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
