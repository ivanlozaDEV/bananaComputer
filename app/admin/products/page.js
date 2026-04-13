"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Package, Search, Filter, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useOllama } from '@/hooks/useOllama';
import { useProductForm } from '@/hooks/useProductForm';
import ProductTable from '../components/ProductTable';
import ProductModal from '../components/ProductModal';
import { useToast } from '@/context/ToastContext';

export default function ProductsAdminPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const ollama = useOllama();

  const fetchAll = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*, attribute_definitions(*), subcategories(*, attribute_definitions(*))').order('name'),
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

  // Sync Ollama status when modal opens
  useEffect(() => {
    if (productForm.modal) {
      ollama.checkStatus();
    } else {
      ollama.setError('');
      ollama.setStreamingText('');
    }
  }, [productForm.modal]);

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto permanentemente?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) showToast('Error al eliminar producto', 'error');
    else {
      showToast('Producto eliminado', 'success');
      fetchAll();
    }
  };

  const handleOllamaAnalyze = async () => {
    await ollama.analyze(
      productForm.datasheetRaw, 
      productForm.attrDefs, 
      (result) => {
        productForm.mapOllamaResult(result);
        showToast('IA analizó el datasheet con éxito', 'success');
      },
      productForm.form.price
    );
  };

  const handleGenerateReview = async () => {
    const attrs = productForm.attrDefs.map(d => ({ name: d.name, value: productForm.attrValues[d.id] || '' }));
    await ollama.generateReview(
      productForm.form,
      attrs,
      (result) => {
        productForm.setForm(f => ({ ...f, banana_review: result }));
        showToast('Reseña generada por la IA', 'success');
      }
    );
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors w-fit">
          <ArrowLeft size={12} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight">Catálogo de Productos</h1>
            <p className="text-gray-400 text-sm font-medium">Gestiona el inventario, precios y especificaciones IA.</p>
          </div>
          <button 
            onClick={productForm.openNew}
            className="px-6 py-3.5 bg-banana-yellow text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-banana-yellow/10 flex items-center gap-2"
          >
            <Plus size={18} /> NUEVO PRODUCTO
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-black/5 rounded-3xl p-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
          <input 
            className="w-full bg-gray-50 border border-black/5 rounded-2xl pl-14 pr-6 py-3.5 text-sm font-bold focus:outline-none focus:border-purple-brand/30 transition-all"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={fetchAll} className="p-3.5 bg-gray-50 border border-black/5 rounded-2xl text-gray-400 hover:text-black transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-2 px-5 py-3.5 bg-gray-50 border border-black/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400">
            <Filter size={14} /> Filtros
          </div>
        </div>
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
        errors={productForm.errors}
      />
    </div>
  );
}
