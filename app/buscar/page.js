"use client";
import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/context/SearchContext';
import { useCart } from '@/context/CartContext';
import Fuse from 'fuse.js';
import { Search, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

function SearchContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const { searchQuery, setSearchQuery, openSearch } = useSearch();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState(new Set());

  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 9999 });
  const [filters, setFilters] = useState({
    categoryId: '',
    subcategoryId: '',
    priceMin: 0,
    priceMax: 9999,
  });

  // Sync context with URL if needed
  useEffect(() => {
    if (urlQuery && !searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery, searchQuery, setSearchQuery]);

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

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name, id, slug), subcategories:subcategory_id(name, id, slug), product_attributes(value, attribute_definitions(name, unit, icon, show_in_card, display_order))')
          .eq('is_active', true)
          .neq('badge_type', 'unavailable')
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

  // Fetch categories for filter panel
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, slug, subcategories(id, name, slug)')
      .order('name')
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  // Dynamic price range from data
  useEffect(() => {
    if (allProducts.length === 0) return;
    const prices = allProducts
      .map(p => parseFloat(p.transfer_price) || parseFloat(p.price) / 1.06 || 0)
      .filter(p => p > 0);
    if (prices.length === 0) return;
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    setPriceRange({ min, max });
    setFilters(f => ({ ...f, priceMin: min, priceMax: max }));
  }, [allProducts]);

  // Fuzzy search
  const searchFiltered = useMemo(() => {
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

    return fuse.search(query).map(r => r.item);
  }, [allProducts, searchQuery, urlQuery]);

  // Apply sidebar filters
  const results = useMemo(() => {
    return searchFiltered
      .filter(p => {
        if (filters.categoryId && p.category_id !== filters.categoryId) return false;
        if (filters.subcategoryId) {
          const pSubIds = Array.isArray(p.subcategory_ids) ? p.subcategory_ids : [];
          if (p.subcategory_id !== filters.subcategoryId && !pSubIds.includes(filters.subcategoryId)) return false;
        }
        const price = parseFloat(p.transfer_price) || parseFloat(p.price) / 1.06 || 0;
        if (price < filters.priceMin || price > filters.priceMax) return false;
        return true;
      })
      .map(p => {
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
  }, [searchFiltered, filters]);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-purple-brand transition-colors mb-4 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Volver al Inicio
          </Link>
          <h1 className="!text-[12px] font-black tracking-[0.2em] uppercase flex items-center gap-3 flex-wrap">
            <span className="text-black">🍌 Resultados para</span>
            <span className="text-purple-brand font-black">"{searchQuery || urlQuery}"</span>
            <span className="text-[10px] font-black bg-purple-brand text-white px-2 py-0.5 rounded tracking-normal">
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
        <button
          onClick={() => setDesktopFiltersOpen(v => !v)}
          className={`hidden lg:flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest border transition-all ${
            desktopFiltersOpen
              ? 'bg-purple-brand text-white border-transparent shadow-lg shadow-purple-brand/20'
              : 'bg-white border-black/5 text-gray-500 hover:border-purple-brand/30 hover:text-black shadow-sm'
          }`}
        >
          <SlidersHorizontal size={18} className={desktopFiltersOpen ? 'text-white' : 'text-purple-brand'} />
          Filtrar
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-12 h-12 border-4 border-banana-yellow border-t-purple-brand rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Escaneando Inventario...</p>
        </div>
      ) : (
        <div className="flex gap-8 items-start">
          {/* Filter sidebar */}
          <ProductFilters
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            priceRange={priceRange}
            resultCount={results.length}
            desktopOpen={desktopFiltersOpen}
          />

          {/* Results */}
          <div className="flex-1 min-w-0">
            {results.length > 0 ? (
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
                  Intenta con otros términos o ajusta los filtros para ampliar la búsqueda.
                </p>
                <Link href="/" className="px-10 py-5 bg-purple-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-brand/20">
                  Explorar Todo el Catálogo
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-cream-bg flex flex-col pt-24">
      <Header />
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-12 h-12 border-4 border-banana-yellow border-t-purple-brand rounded-full animate-spin"></div>
        </div>
      }>
        <SearchContent />
      </Suspense>
      <Footer />
    </main>
  );
}
