"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import ProductCard from './ProductCard';

const ProductGrid = ({ subcategoryId }) => {
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
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
          .select('*, categories(name, id), product_attributes(value, attribute_definitions(name, unit, icon))')
          .eq('is_active', true);

        if (subcategoryId) {
          query = query.or(`subcategory_id.eq.${subcategoryId},subcategory_ids.cs.{${subcategoryId}}`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          // Fallback if array contains operator fails (older supabase versions or schema mismatch)
          const fallbackQuery = supabase
            .from('products')
            .select('*, categories(name, id), product_attributes(value, attribute_definitions(name, unit, icon))')
            .eq('is_active', true);
          const finalQuery = subcategoryId ? fallbackQuery.eq('subcategory_id', subcategoryId) : fallbackQuery;
          const { data: fbData, error: fbError } = await finalQuery.order('created_at', { ascending: false });
          if (fbError) throw fbError;
          processData(fbData);
        } else {
          processData(data);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    const processData = (data) => {
      const groups = {};
      (data || []).forEach(p => {
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
        
        // If we are in a subcategory view, show EVERYTHING. 
        // If on home, keep the 3+3 "preview" logic.
        const combined = subcategoryId 
          ? [...featured.map(p => ({ ...p, badgeType: 'featured' })), ...latest.map(p => ({ ...p, badgeType: 'new' }))]
          : [...featured.slice(0, 3).map(p => ({ ...p, badgeType: 'featured' })), ...latest.slice(0, 3).map(p => ({ ...p, badgeType: 'new' }))];

        return {
          id: group.id,
          name: group.name,
          products: combined.map(p => {
            const year = new Date(p.created_at).getFullYear().toString();
            const specs = (p.product_attributes || []).slice(0, 3).map(a => ({
              label: a.attribute_definitions?.name,
              value: a.value,
              unit: a.attribute_definitions?.unit || '',
              icon: a.attribute_definitions?.icon || '•'
            }));
            return { ...p, year, specs };
          }),
          showTitle: !subcategoryId
        };
      }).filter(g => g.products.length > 0);

      setCategoryGroups(processedGroups);
    };

    fetchProducts();
  }, [subcategoryId]);

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
      {categoryGroups.map((group) => (
        <section key={group.name} id={group.name.toLowerCase()} className="mb-20 last:mb-0">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
      ))}
    </div>
  );
};

export default ProductGrid;
