"use client";
import React from 'react';
import { X, Upload, Sparkles, Save, Package, Tag, DollarSign, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import OllamaImportSection from './OllamaImportSection';

const ProductModal = ({
  modal,
  setModal,
  form,
  setForm,
  categories,
  attrDefs,
  attrValues,
  setAttrValues,
  datasheetRaw,
  setDatasheetRaw,
  handleDatasheetFile,
  handleImageUpload,
  handleSave,
  uploading,
  saving,
  ollama,
  onOllamaAnalyze,
  onGenerateReview,
  removeImage,
  errors = {}
}) => {
  if (modal === null) return null;

  const availableSubs = categories.find(c => c.id === form.category_id)?.subcategories || [];

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 md:p-10 animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-dark-nav border border-white/5 rounded-[3rem] shadow-2xl p-8 md:p-12 animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-brand/20 rounded-2xl text-purple-brand">
              <Package size={24} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-3xl font-black tracking-tight">{modal === 'new' ? 'Nuevo Producto' : 'Editar Producto'}</h2>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Gestión de Inventario y Contenido IA</p>
            </div>
          </div>
          <button 
            onClick={() => setModal(null)} 
            className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-gray-500 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* AI Import Section */}
        <OllamaImportSection 
          ollama={ollama}
          datasheetRaw={datasheetRaw}
          setDatasheetRaw={setDatasheetRaw}
          handleDatasheetFile={handleDatasheetFile}
          onAnalyzeComplete={onOllamaAnalyze}
        />

        <form onSubmit={handleSave} className="flex flex-col gap-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Core Data */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                  <Tag size={12} /> Categoría Principal
                </label>
                <select 
                  className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-purple-brand/50 appearance-none ${errors.category_id ? 'border-raspberry/50' : 'border-white/10'}`}
                  value={form.category_id} 
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value, subcategory_ids: [] }))}
                >
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.category_id && <span className="text-[10px] text-raspberry font-bold ml-1">{errors.category_id}</span>}
              </div>

               <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                  <Layers size={12} /> Subcategorías (Audiencias)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white/5 border border-white/10 rounded-2xl p-4 max-h-40 overflow-y-auto">
                  {availableSubs.length > 0 ? availableSubs.map(s => (
                    <label key={s.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-white/10 bg-black/40 text-purple-brand focus:ring-purple-brand"
                        checked={(form.subcategory_ids || []).includes(s.id)}
                        onChange={e => {
                          const ids = e.target.checked 
                            ? [...(form.subcategory_ids || []), s.id]
                            : (form.subcategory_ids || []).filter(id => id !== s.id);
                          setForm(f => ({ ...f, subcategory_ids: ids }));
                        }}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-tight opacity-70 group-hover:opacity-100">{s.name}</span>
                    </label>
                  )) : <div className="col-span-full py-4 text-center text-[10px] font-black uppercase tracking-widest opacity-20 italic">Selecciona una categoría primero</div>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">SKU Interno</label>
                <input className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-purple-brand/50 ${errors.sku ? 'border-raspberry/50' : 'border-white/10'}`} 
                  value={form.sku || ''} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Ej. BNN-001" />
                {errors.sku && <span className="text-[10px] text-raspberry font-bold ml-1">{errors.sku}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">N. Modelo</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-purple-brand/50" 
                  value={form.model_number || ''} onChange={e => setForm(f => ({ ...f, model_number: e.target.value }))} placeholder="Ej. M1502F" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Precio (USD)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-black">$</span>
                  <input type="number" step="0.01" className={`w-full bg-white/5 border rounded-2xl pl-10 pr-6 py-4 text-sm font-black focus:outline-none focus:border-purple-brand/50 ${errors.price ? 'border-raspberry/50' : 'border-white/10'}`} 
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                </div>
                {errors.price && <span className="text-[10px] text-raspberry font-bold ml-1">{errors.price}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Stock Actual</label>
                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black focus:outline-none focus:border-purple-brand/50" 
                  value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
              </div>
            </div>

            <div className="lg:col-span-12 flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nombre Comercial del Producto</label>
              <input className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-base font-bold focus:outline-none focus:border-purple-brand/50 ${errors.name ? 'border-raspberry/50' : 'border-white/10'}`} 
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {errors.name && <span className="text-[10px] text-raspberry font-bold ml-1">{errors.name}</span>}
            </div>

            {/* Images Gallery */}
            <div className="lg:col-span-12">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-4 flex items-center gap-2">
                <Upload size={12} /> Galería de Imágenes (Multi-upload)
              </label>
              <div className="flex flex-wrap gap-4 mt-2">
                {(form.images || []).map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-2xl bg-black/40 border border-white/5 overflow-hidden group/img animate-in zoom-in duration-300">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(url)} 
                      className="absolute top-1 right-1 p-1 bg-raspberry text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className={`
                  w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-purple-brand/40 hover:bg-purple-brand/5 transition-all
                  ${uploading ? 'opacity-50 animate-pulse' : ''}
                `}>
                  <Upload size={20} className="text-gray-500 mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">{uploading ? 'Subiendo' : 'Añadir'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Attributes Grid */}
            {attrDefs.length > 0 && (
              <div className="lg:col-span-12 bg-white/5 rounded-[2.5rem] p-8 border border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6 flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-brand" /> Especificaciones Técnicas (Catalogo)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {attrDefs.sort((a,b) => a.display_order - b.display_order).map(attr => (
                    <div key={attr.id} className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-tight opacity-50 ml-1 truncate">
                        {attr.name}{attr.unit ? ` (${attr.unit})` : ''}
                      </label>
                      <input 
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-brand/30"
                        value={attrValues[attr.id] || ''}
                        onChange={e => setAttrValues(v => ({ ...v, [attr.id]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Review Section */}
            <div className="lg:col-span-12 bg-[#0d0d12] border border-purple-brand/20 rounded-[3rem] p-10 relative overflow-hidden">
               {/* Glowing accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-brand/5 blur-[120px] rounded-full -z-0"></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-banana-yellow/10 rounded-2xl text-banana-yellow">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-banana-yellow">Banana Review Bot</h3>
                    <p className="text-xs font-medium text-gray-500 italic">Genera una reseña crítica y honesta basada en los specs actuales.</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={onGenerateReview}
                  disabled={ollama.analyzing || ollama.status !== 'online'}
                  className="px-8 py-4 bg-purple-brand/20 border border-purple-brand/30 text-white rounded-2xl font-black text-xs hover:bg-purple-brand hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-40 disabled:hover:scale-100"
                >
                  <Sparkles size={18} className="text-banana-yellow" />
                  {ollama.analyzing ? 'GENERANDO RESEÑA...' : 'RE-GENERAR ANÁLISIS IA'}
                </button>
              </div>

              {form.banana_review ? (
                <div className="flex flex-col gap-8 relative z-10 animate-in fade-in duration-500">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-purple-brand ml-1">Veredicto Final</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-banana-yellow focus:outline-none focus:border-banana-yellow/30"
                      value={form.banana_review.verdict || ''} 
                      onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, verdict: e.target.value } }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {['office', 'gaming', 'design', 'portability', 'value'].map(k => (
                      <div key={k} className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <label className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 text-center">{k}</label>
                        <input 
                          type="number" min="1" max="5" 
                          className="bg-transparent text-center font-black text-2xl text-white outline-none"
                          value={form.banana_review.scores?.[k] || 1}
                          onChange={e => setForm(f => ({ 
                            ...f, 
                            banana_review: { 
                              ...f.banana_review, 
                              scores: { ...(f.banana_review.scores || {}), [k]: parseInt(e.target.value) } 
                            } 
                          }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-mint-success ml-1">Pros (IA)</label>
                      <textarea 
                        className="w-full bg-mint-success/5 border border-mint-success/10 rounded-2xl px-6 py-4 text-xs font-medium text-gray-300 focus:outline-none" 
                        rows="4"
                        value={(form.banana_review.pros || []).join('\n')}
                        onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, pros: e.target.value.split('\n') } }))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-raspberry ml-1">Contras (IA)</label>
                      <textarea 
                        className="w-full bg-raspberry/5 border border-raspberry/10 rounded-2xl px-6 py-4 text-xs font-medium text-gray-300 focus:outline-none" 
                        rows="4"
                        value={(form.banana_review.cons || []).join('\n')}
                        onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, cons: e.target.value.split('\n') } }))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Análisis Detallado para el Cliente</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium leading-relaxed text-gray-400 focus:outline-none" 
                      rows="6"
                      value={form.banana_review.detailed_review || ''}
                      onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, detailed_review: e.target.value } }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
                  <AlertCircle size={40} className="mb-4" />
                  <span className="text-xs font-black uppercase tracking-[0.3em]">Reseña no generada aún</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-dark-nav pt-8 pb-4 flex items-center justify-between border-t border-white/5 gap-4">
             <div className="flex items-center gap-4">
               <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`
                    w-12 h-6 rounded-full transition-all relative
                    ${form.is_active ? 'bg-mint-success text-white' : 'bg-gray-800'}
                  `}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.is_active ? 'right-1' : 'left-1'}`}></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Producto Activo</span>
                  <input type="checkbox" className="hidden" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
               </label>
               <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`
                    w-12 h-6 rounded-full transition-all relative
                    ${form.is_featured ? 'bg-banana-yellow' : 'bg-gray-800'}
                  `}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.is_featured ? 'right-1' : 'left-1'}`}></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Destacado</span>
                  <input type="checkbox" className="hidden" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
               </label>
             </div>

             <div className="flex items-center gap-4">
                <button 
                  type="button" 
                  onClick={() => setModal(null)}
                  className="px-8 py-4 bg-white/5 text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-10 py-4 bg-banana-yellow text-black rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-banana-yellow/20 flex items-center gap-3 disabled:opacity-50"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <Save size={20} />}
                  GUARDAR PRODUCTO
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
