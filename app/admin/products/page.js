"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Package, Search, Filter, ArrowLeft, RefreshCw, ChevronDown, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useOllama } from '@/hooks/useOllama';
import { useProductForm } from '@/hooks/useProductForm';
import ProductTable from '../components/ProductTable';
import ProductModal from '../components/ProductModal';
import { useToast } from '@/context/ToastContext';
import BulkBadgeEditor from '../components/BulkBadgeEditor';
import { updateAIBaselineInDB } from '@/lib/inventory';

const BADGE_OPTIONS = [
  { value: '',             label: 'Todas las etiquetas' },
  { value: 'new',         label: '🆕 Nuevo' },
  { value: 'featured',    label: '🏆 Destacado' },
  { value: 'sale',        label: '🔥 Oferta' },
  { value: 'unavailable', label: '🚫 No Disponible' },
];

const STOCK_OPTIONS = [
  { value: '',    label: 'Todo el stock' },
  { value: 'in',  label: '✅ En stock' },
  { value: 'out', label: '❌ Sin stock' },
];

export default function ProductsAdminPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const ollama = useOllama();

  // ── Filter state ──
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [regeneratingAI, setRegeneratingAI] = useState(false);

  const handleRegenerateAI = async () => {
    setRegeneratingAI(true);
    try {
      await updateAIBaselineInDB();
      toast?.({ message: '✅ Catálogo AI actualizado — el asistente ya excluye los no disponibles', type: 'success' });
    } catch (e) {
      toast?.({ message: 'Error al regenerar: ' + e.message, type: 'error' });
    } finally {
      setRegeneratingAI(false);
    }
  };
  const [filterCat, setFilterCat] = useState('');
  const [filterSub, setFilterSub] = useState('');
  const [filterBadge, setFilterBadge] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from('products').select('*, categories(name), product_subcategories(subcategories(name, id))').order('created_at', { ascending: false }),
      supabase.from('categories').select('*, attribute_definitions(*), subcategories(*)').order('name'),
    ]);
    if (p.error || c.error) {
      showToast('Error al sincronizar catálogo', 'error');
    } else {
      setProducts(p.data || []);
      setCategories(c.data || []);
    }
    setLoading(false);
  };

  const productForm = useProductForm(categories, () => {
    showToast('Producto guardado correctamente', 'success');
    fetchAll();
  });

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (productForm.modal) {
      ollama.checkStatus();
    } else {
      ollama.setError('');
      ollama.setStreamingText('');
    }
  }, [productForm.modal]);

  const deleteProduct = async (id) => {
    const { count } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);
    const hasOrders = count > 0;
    const confirmed = confirm(
      hasOrders
        ? `Este producto tiene ${count} ítem(s) en pedidos existentes.\n¿Desactivarlo del catálogo? (El historial de pedidos se conserva)`
        : '¿Eliminar este producto permanentemente? No tiene pedidos asociados.'
    );
    if (!confirmed) return;
    if (hasOrders) {
      const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
      if (error) showToast('Error al desactivar producto', 'error');
      else { showToast('Producto desactivado del catálogo', 'success'); fetchAll(); }
    } else {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) showToast('Error al eliminar producto', 'error');
      else { showToast('Producto eliminado permanentemente', 'success'); fetchAll(); }
    }
  };

  const handleOllamaAnalyze = async () => {
    await ollama.analyze(
      productForm.datasheetRaw,
      productForm.attrDefs,
      (result) => { productForm.mapOllamaResult(result); showToast('IA analizó el datasheet con éxito', 'success'); },
      productForm.form.price
    );
  };

  const handleGenerateReview = async () => {
    const attrs = productForm.attrDefs.map(d => ({ name: d.name, value: productForm.attrValues[d.id] || '' }));
    await ollama.generateReview(productForm.form, attrs, (result) => {
      productForm.setForm(f => ({ ...f, banana_review: result }));
      showToast('Reseña generada por la IA', 'success');
    });
  };

  // Subcategories for selected category
  const availableSubs = useMemo(() => {
    const cat = categories.find(c => c.id === filterCat);
    return cat?.subcategories || [];
  }, [filterCat, categories]);

  const activeFilterCount = [filterCat, filterSub, filterBadge, filterStock, filterPriceMin, filterPriceMax]
    .filter(Boolean).length;

  const clearFilters = () => {
    setFilterCat(''); setFilterSub(''); setFilterBadge('');
    setFilterStock(''); setFilterPriceMin(''); setFilterPriceMax('');
  };

  // ── Apply all filters ──
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Text search
      const s = search.toLowerCase();
      if (s && !(
        p.name?.toLowerCase().includes(s) ||
        p.sku?.toLowerCase().includes(s) ||
        p.model_number?.toLowerCase().includes(s)
      )) return false;

      // Category
      if (filterCat && p.category_id !== filterCat) return false;

      // Subcategory
      if (filterSub) {
        const subIds = (p.product_subcategories || []).map(ps => ps.subcategories?.id).filter(Boolean);
        if (p.subcategory_id !== filterSub && !subIds.includes(filterSub)) return false;
      }

      // Badge type
      if (filterBadge && (p.badge_type || 'new') !== filterBadge) return false;

      // Stock
      if (filterStock === 'in'  && parseInt(p.stock) <= 0) return false;
      if (filterStock === 'out' && parseInt(p.stock) > 0)  return false;

      // Price
      const price = parseFloat(p.price) || 0;
      if (filterPriceMin !== '' && price < parseFloat(filterPriceMin)) return false;
      if (filterPriceMax !== '' && price > parseFloat(filterPriceMax)) return false;

      return true;
    });
  }, [products, search, filterCat, filterSub, filterBadge, filterStock, filterPriceMin, filterPriceMax]);

  if (productForm.modal !== null) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
        <ProductModal
          modal={productForm.modal}
          setModal={productForm.setModal}
          form={productForm.form}
          setForm={productForm.setForm}
          categories={categories}
          attrDefs={productForm.attrDefs}
          attrValues={productForm.attrValues}
          setAttrValues={productForm.setAttrValues}
          datasheetRaw={productForm.datasheetRaw}
          setDatasheetRaw={productForm.setDatasheetRaw}
          handleDatasheetFile={productForm.handleDatasheetFile}
          handleImageUpload={productForm.handleImageUpload}
          handleSave={productForm.handleSave}
          uploading={productForm.uploading}
          saving={productForm.saving}
          ollama={ollama}
          onOllamaAnalyze={handleOllamaAnalyze}
          onGenerateReview={handleGenerateReview}
          removeImage={productForm.removeImage}
          generateSlug={productForm.generateSlug}
          suggestSKU={productForm.suggestSKU}
          errors={productForm.errors}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors w-fit">
          <ArrowLeft size={12} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight">Catálogo de Productos</h1>
            <p className="text-gray-400 text-sm font-medium">
              {filteredProducts.length} de {products.length} productos
              {activeFilterCount > 0 && (
                <span className="ml-2 text-purple-brand font-black">
                  · {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} activo{activeFilterCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerateAI}
              disabled={regeneratingAI}
              title="Actualiza el catálogo del Banana AI excluó los no disponibles"
              className="px-4 py-3.5 bg-white border border-black/10 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 hover:border-purple-brand/30 hover:text-purple-brand shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={13} className={regeneratingAI ? 'animate-spin' : ''} />
              {regeneratingAI ? 'Actualizando...' : 'Regenerar AI'}
            </button>
            <button
              onClick={() => setShowBulkEditor(true)}
              className="px-5 py-3.5 bg-white border border-black/10 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 hover:border-purple-brand/30 hover:text-purple-brand shadow-sm"
            >
              <Zap size={14} /> Edición Masiva
            </button>
            <button
              onClick={productForm.openNew}
              className="px-6 py-3.5 bg-banana-yellow text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-banana-yellow/10 flex items-center gap-2"
            >
              <Plus size={18} /> NUEVO PRODUCTO
            </button>
          </div>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 bg-white border border-black/5 rounded-3xl p-3 shadow-sm">
        {/* Search + filter toggle row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input
              className="w-full bg-gray-50 border border-black/5 rounded-2xl pl-14 pr-6 py-3.5 text-sm font-bold focus:outline-none focus:border-purple-brand/30 transition-all"
              placeholder="Buscar por nombre, SKU o modelo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={fetchAll} className="p-3.5 bg-gray-50 border border-black/5 rounded-2xl text-gray-400 hover:text-black transition-all">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-purple-brand text-white border-transparent shadow-lg shadow-purple-brand/20'
                  : 'bg-gray-50 border-black/5 text-gray-400 hover:text-black'
              }`}
            >
              <Filter size={14} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-white/20 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Expandable filter panel ── */}
        {showFilters && (
          <div className="border-t border-black/5 pt-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Categoría</label>
                <select
                  value={filterCat}
                  onChange={e => { setFilterCat(e.target.value); setFilterSub(''); }}
                  className="bg-gray-50 border border-black/10 rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-purple-brand/30 appearance-none"
                >
                  <option value="">Todas</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Subcategory */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Subcategoría</label>
                <select
                  value={filterSub}
                  onChange={e => setFilterSub(e.target.value)}
                  disabled={availableSubs.length === 0}
                  className="bg-gray-50 border border-black/10 rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-purple-brand/30 appearance-none disabled:opacity-40"
                >
                  <option value="">Todas</option>
                  {availableSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Badge type */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Etiqueta</label>
                <select
                  value={filterBadge}
                  onChange={e => setFilterBadge(e.target.value)}
                  className="bg-gray-50 border border-black/10 rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-purple-brand/30 appearance-none"
                >
                  {BADGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Stock */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Stock</label>
                <select
                  value={filterStock}
                  onChange={e => setFilterStock(e.target.value)}
                  className="bg-gray-50 border border-black/10 rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-purple-brand/30 appearance-none"
                >
                  {STOCK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Price min */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Precio mín. ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filterPriceMin}
                  onChange={e => setFilterPriceMin(e.target.value)}
                  className="bg-gray-50 border border-black/10 rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-purple-brand/30"
                />
              </div>

              {/* Price max */}
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Precio máx. ($)</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={filterPriceMax}
                  onChange={e => setFilterPriceMax(e.target.value)}
                  className="bg-gray-50 border border-black/10 rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-purple-brand/30"
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-raspberry hover:text-black transition-colors"
                >
                  <X size={10} /> Limpiar {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && products.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-black/5 border-t-banana-yellow rounded-full animate-spin mb-4"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Sincronizando inventario...</span>
        </div>
      ) : (
        <ProductTable
          products={filteredProducts}
          onEdit={productForm.openEdit}
          onDelete={deleteProduct}
        />
      )}

      {/* Bulk Badge Editor */}
      {showBulkEditor && (
        <BulkBadgeEditor
          allProducts={products}
          onClose={() => setShowBulkEditor(false)}
          onDone={() => { setShowBulkEditor(false); fetchAll(); }}
        />
      )}
    </div>
  );
}
