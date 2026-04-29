"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import Fuse from 'fuse.js';
import { useSearch } from '@/context/SearchContext';
import { SlidersHorizontal, X } from 'lucide-react';

const ProductGrid = ({ subcategoryId }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery } = useSearch();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState(new Set());

  // ── Filters state ──
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 9999 });
  const [filters, setFilters] = useState({
    categoryId: '',
    subcategoryId: '',
    priceMin: 0,
    priceMax: 9999,
  });

  const hasActiveFilters =
    filters.categoryId || filters.subcategoryId ||
    filters.priceMin > priceRange.min || filters.priceMax < priceRange.max;

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
      try {
        let query = supabase
          .from('products')
          .select('*, slug, categories(name, id, slug), subcategories:subcategory_id(name, id, slug), product_attributes(value, attribute_definitions(name, unit, icon, show_in_card, display_order))')
          .eq('is_active', true);

        if (subcategoryId) {
          query = query.or(`subcategory_id.eq.${subcategoryId},subcategory_ids.cs.{${subcategoryId}}`);
        }

        const { data, error } = await query
          .neq('badge_type', 'unavailable')
          .order('created_at', { ascending: false });


        if (error) {
          // Fallback if array contains operator fails (older supabase versions or schema mismatch)
          const fallbackQuery = supabase
            .from('products')
            .select('*, slug, categories(name, id, slug), subcategories:subcategory_id(name, id, slug), product_attributes(value, attribute_definitions(name, unit, icon, show_in_card, display_order))')
            .eq('is_active', true);
          const finalQuery = subcategoryId ? fallbackQuery.eq('subcategory_id', subcategoryId) : fallbackQuery;
          const { data: fbData, error: fbError } = await finalQuery
            .neq('badge_type', 'unavailable')
            .order('created_at', { ascending: false });

          if (fbError) throw fbError;
          setAllProducts(fbData || []);
        } else {
          setAllProducts(data || []);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [subcategoryId]);

  // ── Fetch categories (with subcategories) for the filter panel ──
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, slug, subcategories(id, name, slug)')
      .order('name')
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  // ── Compute dynamic price range from loaded products ──
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

  // ── Fuzzy search ──
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;

    const fuse = new Fuse(allProducts, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'tagline', weight: 1 },
        { name: 'description', weight: 1 },
        { name: 'categories.name', weight: 1.5 },
        { name: 'product_attributes.value', weight: 1 }
      ],
      threshold: 0.4,
      distance: 100,
    });

    return fuse.search(searchQuery).map(result => result.item);
  }, [allProducts, searchQuery]);

  // ── Apply sidebar filters (category, subcategory, price) ──
  const filteredProducts = useMemo(() => {
    return searchFiltered.filter(p => {
      // Category filter
      if (filters.categoryId && p.category_id !== filters.categoryId) return false;

      // Subcategory filter
      if (filters.subcategoryId) {
        const pSubIds = Array.isArray(p.subcategory_ids) ? p.subcategory_ids : [];
        const mainSub = p.subcategory_id;
        if (mainSub !== filters.subcategoryId && !pSubIds.includes(filters.subcategoryId)) return false;
      }

      // Price filter (use transfer_price if available)
      const price = parseFloat(p.transfer_price) || parseFloat(p.price) / 1.06 || 0;
      if (price < filters.priceMin || price > filters.priceMax) return false;

      return true;
    });
  }, [searchFiltered, filters]);

  // ── Process groups for display ──
  const processProduct = (p) => {
    const year = new Date(p.created_at).getFullYear().toString();
    let specs = (p.product_attributes || [])
      .filter(pa => pa.attribute_definitions?.show_in_card && pa.value && String(pa.value).trim() !== '')
      .map(pa => ({
        label: pa.attribute_definitions?.name,
        value: pa.value,
        unit: pa.attribute_definitions?.unit || '',
        icon: pa.attribute_definitions?.icon || '•',
        order: pa.attribute_definitions?.display_order || 0
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
    return { ...p, year, specs, badgeType: p.badge_type || (p.is_featured ? 'featured' : 'new') };
  };

  useEffect(() => {
    const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);
    const hasFilters = filters.categoryId || filters.subcategoryId;

    if (!subcategoryId && !searchQuery.trim() && !hasFilters) {
      // SMART HOME SELECTION LOGIC
      const featured = allProducts.filter(p => p.is_featured);
      const remaining = allProducts.filter(p => !p.is_featured);

      const byCategory = {};
      remaining.forEach(p => {
        const catName = p.categories?.name || 'Otros';
        if (!byCategory[catName]) byCategory[catName] = [];
        byCategory[catName].push(p);
      });

      Object.keys(byCategory).forEach(cat => {
        byCategory[cat] = shuffle(byCategory[cat]);
      });

      const mixed = [...featured];
      const cats = Object.keys(byCategory);
      let hasMore = true;

      while (mixed.length < 9 && hasMore) {
        hasMore = false;
        for (let i = 0; i < cats.length; i++) {
          const cat = cats[i];
          if (byCategory[cat].length > 0) {
            mixed.push(byCategory[cat].shift());
            hasMore = true;
          }
          if (mixed.length >= 24) break;
        }
      }

      const stockPrioritized = [...mixed].sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0));

      setCategoryGroups([{
        id: 'smart-selection',
        name: 'Equipos Destacados y Recomendados',
        products: stockPrioritized.map(processProduct),
        showTitle: true
      }]);
    } else {
      // FILTERED / SEARCH GROUPING
      const groups = {};
      filteredProducts.forEach(p => {
        const catId = p.category_id || 'other';
        const catName = p.categories?.name || 'Otros';
        if (!groups[catId]) groups[catId] = { id: catId, name: catName, products: [] };
        groups[catId].products.push(p);
      });

      const processedGroups = Object.keys(groups).map(key => {
        const group = groups[key];
        const combined = group.products.map(p => ({
          ...p,
          badgeType: p.badge_type || (p.is_featured ? 'featured' : 'new')
        }));
        const stockPrioritized = combined.sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0));

        return {
          id: group.id,
          name: group.name,
          products: stockPrioritized.map(processProduct),
          showTitle: !subcategoryId
        };
      }).filter(g => g.products.length > 0);

      setCategoryGroups(processedGroups);
    }
  }, [filteredProducts, allProducts, subcategoryId, searchQuery, filters]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-banana-yellow border-t-purple-brand rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sincronizando Inventario Real...</p>
      </div>
    );
  }

  const totalResults = categoryGroups.reduce((acc, g) => acc + g.products.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-0">

      {/* ── Catalog section: tab + sidebar + grid ── */}
      <div className="relative flex gap-0 items-start">

        {/* ── STICKY PURPLE TAB (desktop only) ── */}
        <div className="hidden lg:block sticky top-36 self-start z-20 -mr-px">
          <button
            onClick={() => setDesktopFiltersOpen(v => !v)}
            title={desktopFiltersOpen ? 'Cerrar filtros' : 'Abrir filtros'}
            className={`
              flex flex-col items-center justify-center gap-2
              w-9 py-5 rounded-l-2xl
              transition-all duration-300 shadow-md
              ${desktopFiltersOpen || hasActiveFilters
                ? 'bg-purple-brand text-white shadow-purple-brand/30'
                : 'bg-purple-brand/90 text-white hover:bg-purple-brand shadow-purple-brand/20'}
            `}
          >
            <SlidersHorizontal size={15} />
            {/* Vertical text label */}
            <span
              className="text-[7px] font-black uppercase tracking-[0.2em] leading-none whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
            >
              Filtros
            </span>
            {/* Active indicator dot */}
            {hasActiveFilters && (
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-banana-yellow rounded-full border-2 border-white shadow" />
            )}
          </button>
        </div>

        {/* ── FILTER SIDEBAR ── */}
        <ProductFilters
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          priceRange={priceRange}
          resultCount={totalResults}
          desktopOpen={desktopFiltersOpen}
        />

        {/* ── PRODUCT AREA ── */}
        <div className="flex-1 min-w-0 pl-4 lg:pl-6">
          {categoryGroups.length > 0 ? (
            categoryGroups.map((group) => (
              <section key={group.name} id={group.name.toLowerCase()} className="mb-20 last:mb-0 animate-in fade-in duration-700">
                {group.showTitle && (
                  <div className="mb-10 flex flex-col items-center">
                    <Link href={`/categoria/${group.id}`} className="group inline-flex flex-col items-center">
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center group-hover:text-purple-brand transition-colors">
                        {group.name}
                      </h2>
                      <div className="h-1 bg-banana-yellow w-16 group-hover:w-full transition-all duration-500 mt-2"></div>
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                  {group.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      addedIds={addedIds}
                      handleAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4">
              <span className="text-6xl mb-6">🍌🔍</span>
              <h3 className="text-2xl font-black mb-2">Sin resultados</h3>
              <p className="text-gray-400 font-medium max-w-sm">
                No hay productos que coincidan con los filtros seleccionados.
              </p>
              <button
                onClick={() => {
                  setFilters({ categoryId: '', subcategoryId: '', priceMin: priceRange.min, priceMax: priceRange.max });
                }}
                className="mt-8 px-8 py-3 bg-purple-brand text-white rounded-xl font-black text-xs uppercase tracking-widest"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProductGrid;
