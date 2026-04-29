"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import Fuse from 'fuse.js';
import { useSearch } from '@/context/SearchContext';
import { SlidersHorizontal, ArrowRight, X } from 'lucide-react';

const PREVIEW_LIMIT = 3; // cards shown per subcategory in default view

const ProductGrid = ({ subcategoryId }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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
    !!(filters.categoryId || filters.subcategoryId ||
    filters.priceMin > priceRange.min || filters.priceMax < priceRange.max);

  // True when the grid should show full filtered mode (not the default subcategory preview)
  const isFilteredMode = !!(hasActiveFilters || searchQuery.trim() || subcategoryId);

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

  // ── Fetch products ──
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
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
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

  // ── Fetch categories (with subcategories) for filter panel ──
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, slug, subcategories(id, name, slug)')
      .order('name')
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  // ── Dynamic price range ──
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
    return fuse.search(searchQuery).map(r => r.item);
  }, [allProducts, searchQuery]);

  // ── Apply sidebar filters ──
  const filteredProducts = useMemo(() => {
    return searchFiltered.filter(p => {
      if (filters.categoryId && p.category_id !== filters.categoryId) return false;
      if (filters.subcategoryId) {
        const pSubIds = Array.isArray(p.subcategory_ids) ? p.subcategory_ids : [];
        if (p.subcategory_id !== filters.subcategoryId && !pSubIds.includes(filters.subcategoryId)) return false;
      }
      const price = parseFloat(p.transfer_price) || parseFloat(p.price) / 1.06 || 0;
      if (price < filters.priceMin || price > filters.priceMax) return false;
      return true;
    });
  }, [searchFiltered, filters]);

  // ── Process a single product ──
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

  // ── DEFAULT VIEW: group by subcategory, 3 products each ──
  const subcategoryGroups = useMemo(() => {
    if (isFilteredMode) return [];

    const groups = {};
    const noSubKey = '__none__';

    allProducts.forEach(p => {
      const sub = p.subcategories;
      const key = sub?.id || noSubKey;
      if (!groups[key]) {
        const catName = p.categories?.name || '';
        const subName = sub?.name || '';
        const displayName = catName && subName
          ? `${catName} ${subName}`
          : subName || catName || 'Otros';
        groups[key] = {
          id: key,
          name: displayName,
          catName,           // for sorting
          subName,           // for sorting
          catSlug: p.categories?.slug || p.category_id,
          subSlug: sub?.slug || null,
          products: []
        };
      }
      groups[key].products.push(p);
    });

    return Object.values(groups)
      .filter(g => g.products.length > 0)
      // Sort by category name first, then by subcategory name within the same category
      .sort((a, b) => {
        const catCmp = (a.catName || '').localeCompare(b.catName || '', 'es', { sensitivity: 'base' });
        if (catCmp !== 0) return catCmp;
        return (a.subName || '').localeCompare(b.subName || '', 'es', { sensitivity: 'base' });
      })
      .map(g => ({
        ...g,
        // featured first, then by created_at (already sorted from DB)
        preview: g.products
          .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
          .slice(0, PREVIEW_LIMIT)
          .map(processProduct),
        total: g.products.length
      }));
  }, [allProducts, isFilteredMode]);

  // ── FILTERED VIEW: flat list grouped by category ──
  const filteredGroups = useMemo(() => {
    if (!isFilteredMode) return [];

    const groups = {};
    filteredProducts.forEach(p => {
      const catId = p.category_id || 'other';
      const catName = p.categories?.name || 'Otros';
      if (!groups[catId]) groups[catId] = { id: catId, name: catName, products: [] };
      groups[catId].products.push(p);
    });

    return Object.values(groups)
      .map(g => ({
        ...g,
        products: g.products
          .sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0))
          .map(processProduct)
      }))
      .filter(g => g.products.length > 0);
  }, [filteredProducts, isFilteredMode]);

  const totalFilteredResults = filteredGroups.reduce((acc, g) => acc + g.products.length, 0);

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-banana-yellow border-t-purple-brand rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sincronizando Inventario Real...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-0">

      {/* ── Catalog layout: sticky tab + sidebar + content ── */}
      <div className="relative flex gap-0 items-start">

        {/* ── STICKY PURPLE TAB (desktop only) ── */}
        <div className="hidden lg:block sticky top-36 self-start z-20 -mr-px">
          <button
            onClick={() => {
              setDesktopFiltersOpen(v => !v);
            }}
            title={desktopFiltersOpen ? 'Cerrar filtros' : 'Abrir filtros'}
            className={`
              relative flex flex-col items-center justify-center gap-2
              w-9 py-5 rounded-l-2xl
              transition-all duration-300 shadow-md
              ${desktopFiltersOpen || hasActiveFilters
                ? 'bg-purple-brand text-white shadow-purple-brand/30'
                : 'bg-purple-brand/90 text-white hover:bg-purple-brand shadow-purple-brand/20'}
            `}
          >
            <SlidersHorizontal size={15} />
            <span
              className="text-[7px] font-black uppercase tracking-[0.2em] leading-none whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
            >
              Filtros
            </span>
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
          resultCount={isFilteredMode ? totalFilteredResults : allProducts.length}
          desktopOpen={desktopFiltersOpen}
        />

        {/* ── CONTENT AREA ── */}
        <div className="flex-1 min-w-0 pl-4 lg:pl-6">

          {/* ════════════════════════════════════════════
              DEFAULT VIEW — subcategory preview strips
              ════════════════════════════════════════════ */}
          {!isFilteredMode && (
            <div className="flex flex-col gap-16">
              {subcategoryGroups.map(group => (
                <section key={group.id} className="animate-in fade-in duration-500">
                  {/* Section header */}
                  <div className="flex items-end justify-between mb-6">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-xl md:text-2xl font-black tracking-tight">
                        {group.name}
                      </h2>
                      <div className="h-0.5 bg-banana-yellow w-10" />
                    </div>

                    {group.total > PREVIEW_LIMIT && group.subSlug && (
                      <Link
                        href={`/categoria/${group.catSlug}/${group.subSlug}`}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-brand hover:text-black transition-colors group/link"
                      >
                        Ver todos ({group.total})
                        <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    )}
                  </div>

                  {/* 3-card preview grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    {group.preview.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        addedIds={addedIds}
                        handleAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {subcategoryGroups.length === 0 && (
                <div className="py-20 flex flex-col items-center opacity-30">
                  <p className="font-black uppercase tracking-widest text-sm">Sin productos en el catálogo</p>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════
              FILTERED VIEW — full catalog with active filters
              ════════════════════════════════════════════ */}
          {isFilteredMode && (
            <div className="flex flex-col gap-16">
              {/* Filter summary bar */}
              {(hasActiveFilters || searchQuery) && (
                <div className="flex items-center justify-between bg-purple-brand/5 border border-purple-brand/10 rounded-2xl px-5 py-3 animate-in fade-in duration-300">
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-brand">
                    {totalFilteredResults} resultado{totalFilteredResults !== 1 ? 's' : ''}
                    {searchQuery && <span className="ml-2 opacity-60">para "{searchQuery}"</span>}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => setFilters({ categoryId: '', subcategoryId: '', priceMin: priceRange.min, priceMax: priceRange.max })}
                      className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-raspberry hover:text-black transition-colors"
                    >
                      <X size={10} /> Limpiar filtros
                    </button>
                  )}
                </div>
              )}

              {filteredGroups.length > 0 ? (
                filteredGroups.map(group => (
                  <section key={group.id} className="animate-in fade-in duration-500">
                    {filteredGroups.length > 1 && (
                      <div className="flex flex-col gap-1 mb-6">
                        <h2 className="text-xl md:text-2xl font-black tracking-tight">{group.name}</h2>
                        <div className="h-0.5 bg-banana-yellow w-10" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                      {group.products.map(product => (
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
                  <p className="text-gray-400 font-medium max-w-sm mb-8">
                    No hay productos que coincidan con los filtros seleccionados.
                  </p>
                  <button
                    onClick={() => setFilters({ categoryId: '', subcategoryId: '', priceMin: priceRange.min, priceMax: priceRange.max })}
                    className="px-8 py-3 bg-purple-brand text-white rounded-xl font-black text-xs uppercase tracking-widest"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductGrid;
