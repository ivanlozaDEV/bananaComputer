"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/context/SearchContext';
import { useCart } from '@/context/CartContext';
import Fuse from 'fuse.js';
import {
  Search, X, ArrowRight, ShoppingCart,
  Zap, Tag, Package
} from 'lucide-react';
import { productUrl } from '@/lib/productUrl';

const RESULT_LIMIT = 6;

export default function SearchOverlay() {
  const { isSearchOpen, closeSearch, searchQuery, setSearchQuery } = useSearch();
  const { addToCart } = useCart();
  const router = useRouter();
  const inputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [addedId, setAddedId] = useState(null);

  // Load all products once (lazy — only when overlay opens for the first time)
  useEffect(() => {
    if (!loaded) {
      supabase
        .from('products')
        .select('id, name, tagline, model_number, sku, slug, price, transfer_price, stock, image_url, badge_type, is_featured, categories(name, slug), subcategories:subcategory_id(name, slug), product_attributes(value, attribute_definitions(name, unit, show_in_card))')
        .eq('is_active', true)
        .neq('badge_type', 'unavailable')
        .then(({ data }) => {
          setProducts(data || []);
          setLoaded(true);
        });
    }
  }, [loaded]);

  // Focus input when overlay opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isSearchOpen]);

  // ESC closes overlay
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleClose = useCallback(() => {
    setSearchQuery(''); // always clear on close
    closeSearch();
  }, [closeSearch, setSearchQuery]);

  // Fuse.js — rich multi-field fuzzy search
  const fuse = useMemo(() => new Fuse(products, {
    keys: [
      { name: 'name',            weight: 3 },
      { name: 'model_number',    weight: 2.5 },
      { name: 'sku',             weight: 2 },
      { name: 'tagline',         weight: 1.5 },
      { name: 'categories.name', weight: 1.5 },
      { name: 'subcategories.name', weight: 1.2 },
      { name: 'product_attributes.value', weight: 1 },
    ],
    threshold: 0.35,
    distance: 200,
    includeScore: true,
    ignoreLocation: true,
  }), [products]);

  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return fuse.search(searchQuery).slice(0, RESULT_LIMIT).map(r => r.item);
  }, [fuse, searchQuery]);

  const handleNavigate = (product) => {
    handleClose();
    router.push(productUrl(product));
  };

  const handleViewAll = () => {
    const q = searchQuery;
    handleClose(); // clears query from context
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const formatPrice = (p) => {
    const val = parseFloat(p.transfer_price) || parseFloat(p.price) / 1.06 || 0;
    return val > 0 ? `$${Math.round(val).toLocaleString()}` : null;
  };

  if (!isSearchOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* ── Search Modal ── */}
      <div className="fixed top-0 left-0 right-0 z-[201] flex justify-center px-4 pt-6 md:pt-16 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl shadow-black/30 overflow-hidden flex flex-col">

          {/* Input row */}
          <div className="flex items-center gap-4 px-6 py-5 border-b border-black/5">
            <Search size={20} className="text-purple-brand shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Busca por nombre, modelo, SKU, procesador..."
              className="flex-1 text-base md:text-lg font-bold focus:outline-none placeholder:text-gray-300 text-gray-900 bg-transparent"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) handleViewAll();
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-black">
                <X size={16} />
              </button>
            )}
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-300 hover:text-black">
              <X size={20} />
            </button>
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-[60vh]">

            {/* Loading state (products not loaded yet) */}
            {!loaded && (
              <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
                <div className="w-5 h-5 border-2 border-purple-brand border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold">Cargando catálogo...</span>
              </div>
            )}

            {/* Empty state — no query */}
            {loaded && !searchQuery.trim() && (
              <div className="flex flex-col gap-2 px-6 py-6">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Sugerencias rápidas</p>
                {['Laptop', 'Gaming', 'RTX', 'Apple', 'Lenovo', 'Proyector'].map(hint => (
                  <button
                    key={hint}
                    onClick={() => setSearchQuery(hint)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-all group"
                  >
                    <Zap size={13} className="text-purple-brand/40 group-hover:text-purple-brand transition-colors" />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-black transition-colors">{hint}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Results list */}
            {loaded && searchQuery.trim() && results.length > 0 && (
              <div className="flex flex-col divide-y divide-black/5">
                {results.map(product => {
                  const price = formatPrice(product);
                  const inStock = parseInt(product.stock) > 0;
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleNavigate(product)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleNavigate(product)}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-all text-left group cursor-pointer"
                    >
                      {/* Image */}
                      <div className="shrink-0 w-14 h-14 rounded-2xl bg-gray-50 border border-black/5 flex items-center justify-center overflow-hidden">
                        {product.image_url
                          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                          : <Package size={20} className="text-gray-200" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-gray-900 group-hover:text-purple-brand transition-colors leading-tight truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {product.model_number && (
                            <span className="text-[9px] font-bold text-purple-brand bg-purple-brand/5 px-2 py-0.5 rounded-lg border border-purple-brand/10">
                              {product.model_number}
                            </span>
                          )}
                          {product.categories?.name && (
                            <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                              <Tag size={9} /> {product.categories.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price + cart */}
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        {price && (
                          <span className="font-black text-sm text-gray-900">{price}</span>
                        )}
                        <div className="flex items-center gap-1.5">
                          {!inStock && (
                            <span className="text-[7px] font-black uppercase tracking-widest text-raspberry bg-raspberry/5 px-2 py-0.5 rounded-full">
                              Agotado
                            </span>
                          )}
                          {inStock && (
                            <button
                              onClick={e => handleAddToCart(e, product)}
                              className={`p-1.5 rounded-xl transition-all ${
                                addedId === product.id
                                  ? 'bg-mint-success text-white scale-90'
                                  : 'bg-gray-100 text-gray-400 hover:bg-purple-brand hover:text-white'
                              }`}
                            >
                              <ShoppingCart size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Ver todos */}
                <button
                  onClick={handleViewAll}
                  className="flex items-center justify-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-purple-brand hover:bg-purple-brand hover:text-white transition-all"
                >
                  Ver todos los resultados para "{searchQuery}"
                  <ArrowRight size={13} />
                </button>
              </div>
            )}

            {/* No results */}
            {loaded && searchQuery.trim() && results.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="text-4xl">🍌🔍</span>
                <p className="font-black text-gray-700">Sin resultados para "{searchQuery}"</p>
                <p className="text-sm text-gray-400 font-medium max-w-xs">
                  Prueba con el nombre del procesador, marca o modelo exacto.
                </p>
                <button
                  onClick={handleViewAll}
                  className="mt-2 px-6 py-2.5 bg-purple-brand text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Buscar igualmente
                </button>
              </div>
            )}
          </div>

          {/* Footer hint */}
          {loaded && (
            <div className="flex items-center gap-4 px-6 py-3 bg-gray-50/80 border-t border-black/5">
              <span className="text-[8px] font-bold text-gray-400 flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border border-black/10 rounded text-[8px] font-mono">Enter</kbd>
                ver todos
              </span>
              <span className="text-[8px] font-bold text-gray-400 flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border border-black/10 rounded text-[8px] font-mono">Esc</kbd>
                cerrar
              </span>
              <span className="ml-auto text-[8px] font-bold text-gray-300">{products.length} productos en catálogo</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
