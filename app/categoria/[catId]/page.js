"use client";
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function CategoryPage({ params }) {
  const { catId } = use(params);
  const router = useRouter();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', catId)
          .single();

        if (catError) throw catError;
        setCategory(catData);

        const { data: subData, error: subError } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', catId)
          .order('name');

        if (subError) throw subError;
        setSubcategories(subData || []);
      } catch (err) {
        console.error('Error fetching category:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [catId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-brand text-white flex flex-col items-center justify-center gap-4">
        <span className="text-4xl animate-bounce">🍌</span>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Localizando Categoría...</span>
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="min-h-screen bg-cream-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 mb-12">
          <Link href="/" className="hover:text-purple-brand"><Home size={12} /></Link>
          <ChevronRight size={10} />
          <span className="text-purple-brand opacity-100">{category.name}</span>
        </nav>

        <header className="mb-16 flex flex-col items-center text-center">
          <h1 className="mb-4">{category.name}</h1>
          <p className="text-gray-500 font-medium max-w-2xl">
            Explora nuestra selección premium de {category.name.toLowerCase()} con garantía oficial en Ecuador.
          </p>
          <div className="h-1 bg-banana-yellow w-24 mt-8"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subcategories.map(sub => (
            <Link 
              key={sub.id} 
              href={`/categoria/${catId}/${sub.id}`} 
              className="group bg-white rounded-[2.5rem] p-8 border border-black/5 hover:border-purple-brand/20 transition-all hover:shadow-2xl hover:-translate-y-2 flex flex-col gap-6"
            >
              <div className="aspect-video bg-gray-50 rounded-3xl flex items-center justify-center p-6 transition-colors group-hover:bg-purple-brand/5 overflow-hidden">
                {sub.image_url ? (
                  <img src={sub.image_url} alt={sub.name} className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <span className="text-4xl opacity-10 group-hover:opacity-100 group-hover:scale-125 transition-all">🍌</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black group-hover:text-purple-brand transition-colors">{sub.name}</h3>
                <p className="text-sm text-gray-400 font-medium line-clamp-2">
                  {sub.description || `Equipos de alto rendimiento en la línea ${sub.name}.`}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-purple-brand tracking-widest uppercase">
                  Explorar catálogo <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {subcategories.length === 0 && (
          <div className="flex flex-col items-center py-20 opacity-30 italic font-medium">
            No se encontraron subcategorías para esta sección todavía.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
