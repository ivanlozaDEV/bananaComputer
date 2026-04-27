"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import ProductCard from './ProductCard';
import Fuse from 'fuse.js';
import { useSearch } from '@/context/SearchContext';

const ProductGrid = ({ subcategoryId }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery } = useSearch();
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState(new Set());

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
          .select('*, categories(name, id), product_attributes(value, attribute_definitions(name, unit, icon, show_in_card, display_order))')
          .eq('is_active', true);

        if (subcategoryId) {
          query = query.or(`subcategory_id.eq.${subcategoryId},subcategory_ids.cs.{${subcategoryId}}`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          // Fallback if array contains operator fails (older supabase versions or schema mismatch)
          const fallbackQuery = supabase
            .from('products')
            .select('*, categories(name, id), product_attributes(value, attribute_definitions(name, unit, icon, show_in_card, display_order))')
            .eq('is_active', true);
          const finalQuery = subcategoryId ? fallbackQuery.eq('subcategory_id', subcategoryId) : fallbackQuery;
          const { data: fbData, error: fbError } = await finalQuery.order('created_at', { ascending: false });
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

  // Memoized fuzzy search logic
  const filteredProducts = useMemo(() => {
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

  // Process data for grouping and mapping
  useEffect(() => {
    // Helper to shuffle an array
    const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

    if (!subcategoryId && !searchQuery.trim()) {
      // SMART HOME SELECTION LOGIC
      const featured = allProducts.filter(p => p.is_featured);
      const remaining = allProducts.filter(p => !p.is_featured);

      // Group remaining by category
      const byCategory = {};
      remaining.forEach(p => {
        const catName = p.categories?.name || 'Otros';
        if (!byCategory[catName]) byCategory[catName] = [];
        byCategory[catName].push(p);
      });

      // Shuffle products within each category
      Object.keys(byCategory).forEach(cat => {
        byCategory[cat] = shuffle(byCategory[cat]);
      });

      const mixed = [...featured];
      const categories = Object.keys(byCategory);
      let catIndex = 0;
      let hasMore = true;

      // Round-robin selection until at least 9 or exhausted
      while (mixed.length < 9 && hasMore) {
        hasMore = false;
        for (let i = 0; i < categories.length; i++) {
          const cat = categories[i];
          if (byCategory[cat].length > 0) {
            mixed.push(byCategory[cat].shift());
            hasMore = true;
          }
          if (mixed.length >= 24) break; // Hard limit for home performance
        }
      }

      // Final sort to prioritize stock
      const stockPrioritized = [...mixed].sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0));

      // Final processing for the smart group
      const processedProducts = stockPrioritized.map(p => {
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
        return { ...p, year, specs, badgeType: p.is_featured ? 'featured' : 'new' };
      });

      setCategoryGroups([{
        id: 'smart-selection',
        name: 'Equipos Destacados y Recomendados',
        products: processedProducts,
        showTitle: true
      }]);
    } else {
      // LEGACY GROUPING LOGIC (For search or subcategory)
      const groups = {};
      (filteredProducts || []).forEach(p => {
        const catId = p.category_id || 'other';
        const catName = p.categories?.name || 'Otros';
        if (!groups[catId]) groups[catId] = { id: catId, name: catName, products: [] };
        groups[catId].products.push(p);
      });

      const processedGroups = Object.keys(groups).map(key => {
        const group = groups[key];
        const items = group.products;
        const featured = items.filter(p => p.is_featured);
        const latest = items.filter(p => !p.is_featured);
        const combined = [...featured.map(p => ({ ...p, badgeType: 'featured' })), ...latest.map(p => ({ ...p, badgeType: 'new' }))];

        // Sort within group by stock priority
        const stockPrioritized = combined.sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0));

        return {
          id: group.id,
          name: group.name,
          products: stockPrioritized.map(p => {
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
          }),
          showTitle: !subcategoryId
        };
      }).filter(g => g.products.length > 0);

      setCategoryGroups(processedGroups);
    }
  }, [filteredProducts, allProducts, subcategoryId, searchQuery]);

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

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
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
      ) : searchQuery && (
        <div className="py-20 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4">
          <span className="text-6xl mb-6">🍌🔍</span>
          <h3 className="text-2xl font-black mb-2">No encontramos coincidencias</h3>
          <p className="text-gray-400 font-medium max-w-sm">No hay productos que coincidan con "<span className="text-purple-brand">{searchQuery}</span>". Intenta con otros términos.</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-8 px-8 py-3 bg-purple-brand text-white rounded-xl font-black text-xs uppercase tracking-widest"
          >
            Ver Todo el Catálogo
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
