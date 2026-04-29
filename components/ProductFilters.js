"use client";
import React, { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';

const formatPrice = (p) => `$${Math.round(p).toLocaleString()}`;

export default function ProductFilters({
  filters, setFilters, categories, priceRange, resultCount,
  // Desktop open state is controlled by the parent
  desktopOpen = false,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catExpanded, setCatExpanded] = useState(true);
  const [subExpanded, setSubExpanded] = useState(true);
  const [priceExpanded, setPriceExpanded] = useState(true);

  const selectedCat = categories.find(c => c.id === filters.categoryId);
  const availableSubs = selectedCat?.subcategories || [];

  const hasActiveFilters =
    filters.categoryId || filters.subcategoryId ||
    filters.priceMin > priceRange.min || filters.priceMax < priceRange.max;

  const clearAll = () => setFilters({
    categoryId: '',
    subcategoryId: '',
    priceMin: priceRange.min,
    priceMax: priceRange.max,
  });

  const panel = (
    <div className="flex flex-col gap-0 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-purple-brand" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Filtros</span>
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-purple-brand text-white text-[7px] font-black rounded-full tracking-widest">
              ACTIVOS
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-[8px] font-black uppercase tracking-widest text-raspberry hover:text-black transition-colors flex items-center gap-1"
          >
            <X size={10} /> Limpiar
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-[9px] font-bold text-gray-400 mb-6 -mt-2">
        {resultCount} {resultCount === 1 ? 'producto' : 'productos'}
      </p>

      {/* ── CATEGORÍA ── */}
      <div className="border-t border-black/5 pt-4 pb-2">
        <button
          className="flex items-center justify-between w-full mb-3 group"
          onClick={() => setCatExpanded(v => !v)}
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-black transition-colors">
            Categoría
          </span>
          {catExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </button>
        {catExpanded && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setFilters(f => ({ ...f, categoryId: '', subcategoryId: '' }))}
              className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
                !filters.categoryId
                  ? 'bg-purple-brand text-white shadow-md shadow-purple-brand/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-black'
              }`}
            >
              Todas las categorías
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilters(f => ({ ...f, categoryId: cat.id, subcategoryId: '' }))}
                className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  filters.categoryId === cat.id
                    ? 'bg-purple-brand text-white shadow-md shadow-purple-brand/20'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── SUBCATEGORÍA ── */}
      {availableSubs.length > 0 && (
        <div className="border-t border-black/5 pt-4 pb-2">
          <button
            className="flex items-center justify-between w-full mb-3 group"
            onClick={() => setSubExpanded(v => !v)}
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-black transition-colors">
              Subcategoría
            </span>
            {subExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
          </button>
          {subExpanded && (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setFilters(f => ({ ...f, subcategoryId: '' }))}
                className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  !filters.subcategoryId
                    ? 'bg-banana-yellow text-black shadow-md'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`}
              >
                Todas
              </button>
              {availableSubs.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setFilters(f => ({ ...f, subcategoryId: sub.id }))}
                  className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
                    filters.subcategoryId === sub.id
                      ? 'bg-banana-yellow text-black shadow-md'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PRECIO ── */}
      {priceRange.max > priceRange.min && (
        <div className="border-t border-black/5 pt-4 pb-2">
          <button
            className="flex items-center justify-between w-full mb-4 group"
            onClick={() => setPriceExpanded(v => !v)}
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-black transition-colors">
              Precio (Efectivo/Trans.)
            </span>
            {priceExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
          </button>
          {priceExpanded && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-purple-brand">{formatPrice(filters.priceMin)}</span>
                <span className="text-[8px] text-gray-300 font-bold">—</span>
                <span className="text-[10px] font-black text-purple-brand">{formatPrice(filters.priceMax)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Mínimo</label>
                <input
                  type="range" min={priceRange.min} max={priceRange.max} step={10}
                  value={filters.priceMin}
                  onChange={e => { const v = Number(e.target.value); if (v < filters.priceMax) setFilters(f => ({ ...f, priceMin: v })); }}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-brand"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Máximo</label>
                <input
                  type="range" min={priceRange.min} max={priceRange.max} step={10}
                  value={filters.priceMax}
                  onChange={e => { const v = Number(e.target.value); if (v > filters.priceMin) setFilters(f => ({ ...f, priceMax: v })); }}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-brand"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  { label: '< $500',   min: priceRange.min, max: 500 },
                  { label: '$500–$1k', min: 500,  max: 1000 },
                  { label: '$1k–$2k',  min: 1000, max: 2000 },
                  { label: '> $2k',    min: 2000, max: priceRange.max },
                ].filter(p => p.min <= priceRange.max).map(preset => {
                  const pMin = Math.max(preset.min, priceRange.min);
                  const pMax = Math.min(preset.max, priceRange.max);
                  const isActive = filters.priceMin === pMin && filters.priceMax === pMax;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setFilters(f => ({ ...f, priceMin: pMin, priceMax: pMax }))}
                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wide border transition-all ${
                        isActive
                          ? 'bg-purple-brand text-white border-transparent'
                          : 'bg-gray-50 text-gray-400 border-black/10 hover:border-purple-brand/30'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── MOBILE: Floating button + bottom sheet ── */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all ${
            hasActiveFilters
              ? 'bg-purple-brand text-white shadow-purple-brand/30'
              : 'bg-white text-gray-700 shadow-black/10 border border-black/5'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filtros {hasActiveFilters && <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[7px]">ON</span>}
        </button>

        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className={`
          fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2.5rem] p-6 pb-10 shadow-2xl
          transition-transform duration-400 ease-out max-h-[85vh] overflow-y-auto
          ${mobileOpen ? 'translate-y-0' : 'translate-y-full'}
        `}>
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-base">Filtrar productos</h3>
            <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-gray-50">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
          {panel}
          <button
            onClick={() => setMobileOpen(false)}
            className="w-full mt-6 py-3.5 bg-purple-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
          >
            Ver {resultCount} resultados
          </button>
        </div>
      </div>

      {/* ── DESKTOP: Collapsible sidebar (controlled by parent) ── */}
      <aside
        className={`
          hidden lg:block shrink-0 sticky top-28 self-start
          transition-all duration-300 ease-in-out overflow-hidden
          ${desktopOpen ? 'w-56 opacity-100' : 'w-0 opacity-0 pointer-events-none'}
        `}
      >
        <div className="w-56 bg-white border border-black/5 rounded-[2rem] p-5 shadow-sm">
          {panel}
        </div>
      </aside>
    </>
  );
}
