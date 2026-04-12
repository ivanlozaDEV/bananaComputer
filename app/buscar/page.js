"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/context/SearchContext';
import { useCart } from '@/context/CartContext';
import Fuse from 'fuse.js';
import { Search, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const { searchQuery, setSearchQuery, openSearch } = useSearch();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState(new Set());

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync context with URL if needed
  useEffect(() => {
    if (urlQuery && !searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    addToCart(product);
    setAddedIds(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name, id), product_attributes(value, attribute_definitions(name, unit, icon, show_in_card, display_order))')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAllProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const results = useMemo(() => {
    const query = searchQuery || urlQuery;
    if (!query.trim()) return allProducts;

    const fuse = new Fuse(allProducts, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'tagline', weight: 1 },
        { name: 'description', weight: 1 },
        { name: 'categories.name', weight: 1.5 },
        { name: 'product_attributes.value', weight: 1 }
      ],
      threshold: 0.35,
    });

    return fuse.search(query).map(r => {
      const p = r.item;
      const year = new Date(p.created_at).getFullYear().toString();
      let specs = (p.product_attributes || [])
        .filter(a => a.attribute_definitions?.show_in_card)
        .map(a => ({
          label: a.attribute_definitions?.name,
          value: a.value,
          unit: a.attribute_definitions?.unit || '',
          icon: a.attribute_definitions?.icon || '•',
          order: a.attribute_definitions?.display_order || 0
        }))
        .sort((a, b) => a.order - b.order)
        .slice(0, 6);

      if (specs.length === 0) {
        specs = (p.product_attributes || []).slice(0, 3).map(a => ({
          label: a.attribute_definitions?.name,
          value: a.value,
          unit: a.attribute_definitions?.unit || '',
          icon: a.attribute_definitions?.icon || '•'
        }));
      }

      return { ...p, year, specs };
    });
  }, [allProducts, searchQuery, urlQuery]);

  return (
    <main className="min-h-screen bg-cream-bg flex flex-col pt-24">
      <Header />

      <div className="max-w-5xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-purple-brand transition-colors mb-4 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Volver al Inicio
            </Link>
            <h1 className="!text-[12px] font-black tracking-[0.2em] uppercase flex items-center gap-3">
              <span className="text-black">🍌 Resultados para</span>
              <span className="text-purple-brand font-black">"{searchQuery || urlQuery}"</span>
              <span className="text-[10px] font-black bg-purple-brand text-white px-2 py-0.5 rounded tracking-normal block">
                {results.length} coincidencias
              </span>
            </h1>
          </div>

          <button
            onClick={openSearch}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-black/5 rounded-2xl shadow-sm hover:shadow-md transition-all text-sm font-black uppercase tracking-widest"
          >
            <Search size={18} className="text-purple-brand" />
            Nueva Búsqueda
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <div className="w-12 h-12 border-4 border-banana-yellow border-t-purple-brand rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Escaneando Inventario...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {results.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                variant="list"
                addedIds={addedIds}
                handleAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <span className="text-8xl mb-8">🔍🍌</span>
            <h2 className="text-3xl font-black mb-4">No encontramos lo que buscas</h2>
            <p className="text-gray-400 font-medium max-w-sm mb-10 leading-relaxed">
              Intenta con otros términos o explora nuestras categorías principales para encontrar tu equipo ideal.
            </p>
            <Link href="/" className="px-10 py-5 bg-purple-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-brand/20">
              Explorar Todo el Catálogo
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
