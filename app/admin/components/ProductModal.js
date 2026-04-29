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
  generateSlug,
  errors = {}
}) => {
  if (modal === null) return null;

  const availableSubs = categories.find(c => c.id === form.category_id)?.subcategories || [];

  return (
    <div className="animate-in fade-in duration-300">
      <div className="w-full bg-white border border-black/5 rounded-[2.5rem] p-6 md:p-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-brand/5 rounded-xl text-purple-brand border border-purple-brand/10">
              <Package size={20} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-black tracking-tight text-gray-900">{modal === 'new' ? 'Nuevo Producto' : 'Editar Producto'}</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Gestión de Inventario y Contenido IA</p>
            </div>
          </div>
          <button 
            onClick={() => setModal(null)} 
            className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-black border border-transparent hover:border-black/10"
          >
            <X size={20} />
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

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Core Data */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                  <Tag size={10} className="text-purple-brand" /> Categoría Principal
                </label>
                <select 
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-brand/30 appearance-none ${errors.category_id ? 'border-raspberry/50' : 'border-black/10'}`}
                  value={form.category_id} 
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value, subcategory_ids: [] }))}
                >
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.category_id && <span className="text-[9px] text-raspberry font-bold ml-1">{errors.category_id}</span>}
              </div>

               <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                  <Layers size={10} className="text-purple-brand" /> Subcategorías (Audiencias)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 border border-black/10 rounded-xl p-3 max-h-32 overflow-y-auto">
                  {availableSubs.length > 0 ? availableSubs.map(s => (
                    <label key={s.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors group border border-transparent hover:border-black/5 shadow-sm">
                      <input 
                        type="checkbox" 
                        className="w-3.5 h-3.5 rounded border-black/20 bg-white text-purple-brand focus:ring-purple-brand"
                        checked={(form.subcategory_ids || []).includes(s.id)}
                        onChange={e => {
                          const ids = e.target.checked 
                            ? [...(form.subcategory_ids || []), s.id]
                            : (form.subcategory_ids || []).filter(id => id !== s.id);
                          setForm(f => ({ ...f, subcategory_ids: ids }));
                        }}
                      />
                      <span className="text-[9px] font-bold uppercase tracking-tight text-gray-400 group-hover:text-black">{s.name}</span>
                    </label>
                  )) : <div className="col-span-full py-2 text-center text-[9px] font-black uppercase tracking-widest text-gray-300 italic">Selecciona una categoría primero</div>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">SKU Interno</label>
                <input className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-brand/30 ${errors.sku ? 'border-raspberry/50' : 'border-black/10'}`} 
                  value={form.sku || ''} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="BNN-001" />
                {errors.sku && <span className="text-[9px] text-raspberry font-bold ml-1">{errors.sku}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">N. Modelo</label>
                <input className="w-full bg-slate-50 border border-black/10 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-brand/30" 
                  value={form.model_number || ''} 
                  onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({ ...f, model_number: val, slug: generateSlug(f.name, val) }));
                  }} 
                  placeholder="M1502F" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Normal (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">$</span>
                  <input type="number" step="0.01" className={`w-full bg-slate-50 border rounded-xl pl-7 pr-3 py-2.5 text-xs font-black focus:outline-none focus:border-purple-brand/30 ${errors.price ? 'border-raspberry/50' : 'border-black/10'}`} 
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                </div>
                {errors.price && <span className="text-[9px] text-raspberry font-bold ml-1">{errors.price}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Efectivo (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">$</span>
                  <input type="number" step="0.01" className={`w-full bg-slate-50 border rounded-xl pl-7 pr-3 py-2.5 text-xs font-black focus:outline-none focus:border-purple-brand/30 ${errors.transfer_price ? 'border-raspberry/50' : 'border-black/10'}`} 
                    value={form.transfer_price || ''} onChange={e => setForm(f => ({ ...f, transfer_price: e.target.value }))} placeholder="0.00" />
                </div>
                {errors.transfer_price && <span className="text-[9px] text-raspberry font-bold ml-1">{errors.transfer_price}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Stock Actual</label>
                <input type="number" className="w-full bg-slate-50 border border-black/10 rounded-xl px-4 py-2.5 text-xs font-black focus:outline-none focus:border-purple-brand/30" 
                  value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
              </div>
            </div>

            <div className="lg:col-span-12 flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Nombre Comercial del Producto</label>
              <input className={`w-full bg-slate-50 border rounded-xl px-5 py-3 text-sm font-black text-gray-900 focus:outline-none focus:border-purple-brand/30 ${errors.name ? 'border-raspberry/50' : 'border-black/10'}`} 
                value={form.name} 
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ 
                    ...f, 
                    name: val,
                    slug: generateSlug(val, f.model_number)
                  }));
                }} 
              />
              {errors.name && <span className="text-[9px] text-raspberry font-bold ml-1">{errors.name}</span>}
            </div>

            <div className="lg:col-span-12 flex flex-col gap-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Slug / Ruta URL (Automático)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-[10px]">/categoria/.../</span>
                <input 
                  className="w-full bg-slate-50 border border-black/10 rounded-xl pl-24 pr-5 py-2.5 text-[10px] font-bold text-gray-500 focus:outline-none focus:border-purple-brand/30 transition-all shadow-inner" 
                  value={form.slug} 
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="url-del-producto"
                />
              </div>
              {errors.slug && <span className="text-[9px] text-raspberry font-bold ml-1">{errors.slug}</span>}
            </div>

            {/* Images Gallery */}
            <div className="lg:col-span-12">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2.5 flex items-center gap-2">
                <Upload size={10} className="text-purple-brand" /> Galería de Imágenes
              </label>
              <div className="flex flex-wrap gap-3 mt-1.5">
                {(form.images || []).map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl bg-white border border-black/10 overflow-hidden group/img animate-in zoom-in duration-300 shadow-sm">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(url)} 
                      className="absolute top-1 right-1 p-1 bg-raspberry text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <label className={`
                  w-20 h-20 rounded-xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:border-purple-brand/30 hover:bg-white transition-all
                  ${uploading ? 'opacity-50 animate-pulse' : ''}
                `}>
                  <Upload size={16} className="text-gray-300 mb-1" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-gray-400">{uploading ? 'Subiendo' : 'Añadir'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Attributes Grid */}
            {attrDefs.length > 0 && (
              <div className="lg:col-span-12 bg-slate-50 rounded-[2rem] p-6 border border-black/10">
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-5 flex items-center gap-2">
                  <Sparkles size={12} className="text-purple-brand" /> Especificaciones Técnicas (Catálogo)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {attrDefs.filter(a => a.show_in_card).sort((a,b) => a.display_order - b.display_order).map(attr => (
                    <div key={attr.id} className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-tight text-gray-500 ml-1 truncate">
                        {attr.name}{attr.unit ? ` (${attr.unit})` : ''}
                      </label>
                      <input 
                        className="w-full bg-white border border-black/10 rounded-xl px-4 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-purple-brand/30 transition-all shadow-sm"
                        value={attrValues[attr.id] || ''}
                        onChange={e => setAttrValues(v => ({ ...v, [attr.id]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Review Section */}
            <div className="lg:col-span-12 bg-slate-50 border border-black/10 rounded-[2.5rem] p-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-banana-yellow/10 rounded-xl text-banana-yellow border border-banana-yellow/20">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">Banana Review Bot</h3>
                    <p className="text-[10px] font-bold text-gray-500 italic uppercase tracking-widest">Análisis crítico de hardware</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={onGenerateReview}
                  disabled={ollama.analyzing || ollama.status !== 'online'}
                  className="px-5 py-2.5 bg-purple-brand text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 shadow-lg shadow-purple-brand/20"
                >
                  <Sparkles size={14} className="text-banana-yellow" />
                  {ollama.analyzing ? 'Generando...' : 'Re-generar Análisis IA'}
                </button>
              </div>

              {form.banana_review ? (
                <div className="flex flex-col gap-5 relative z-10 animate-in fade-in duration-500">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-purple-brand ml-1">Veredicto Final</label>
                    <input 
                      className="w-full bg-white border border-purple-brand/10 rounded-xl px-4 py-3 text-xs font-black text-gray-900 focus:outline-none focus:border-banana-yellow/30 shadow-sm"
                      value={form.banana_review.verdict || ''} 
                      onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, verdict: e.target.value } }))}
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    {['office', 'gaming', 'design', 'portability', 'value'].map(k => (
                      <div key={k} className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-black/10 shadow-sm">
                        <label className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">{k}</label>
                        <input 
                          type="number" min="1" max="5" 
                          className="bg-transparent text-center font-black text-xl text-purple-brand outline-none"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-mint-success ml-1">Pros (IA)</label>
                      <textarea 
                        className="w-full bg-white border border-mint-success/20 rounded-xl px-4 py-3 text-[10px] font-bold text-mint-success focus:outline-none shadow-sm" 
                        rows="3"
                        value={(form.banana_review.pros || []).join('\n')}
                        onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, pros: e.target.value.split('\n') } }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-raspberry ml-1">Contras (IA)</label>
                      <textarea 
                        className="w-full bg-white border border-raspberry/20 rounded-xl px-4 py-3 text-[10px] font-bold text-raspberry focus:outline-none shadow-sm" 
                        rows="3"
                        value={(form.banana_review.cons || []).join('\n')}
                        onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, cons: e.target.value.split('\n') } }))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 ml-1">Análisis Detallado para el Cliente</label>
                    <textarea 
                      className="w-full bg-white border border-black/10 rounded-xl px-5 py-3 text-xs font-black leading-relaxed text-gray-700 focus:outline-none shadow-sm" 
                      rows="4"
                      value={form.banana_review.detailed_review || ''}
                      onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, detailed_review: e.target.value } }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-black/10 rounded-[2rem] text-gray-200">
                  <AlertCircle size={30} className="mb-2" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Reseña no generada aún</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white pt-4 pb-1 flex flex-col sm:flex-row items-center justify-between border-t border-black/10 gap-4 z-20">
             <div className="flex items-center gap-4">
               <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className={`
                    w-8 h-4 rounded-full transition-all relative
                    ${form.is_active ? 'bg-mint-success shadow-lg shadow-mint-success/20' : 'bg-gray-300'}
                  `}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${form.is_active ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">Activo</span>
                  <input type="checkbox" className="hidden" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
               </label>
               <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className={`
                    w-8 h-4 rounded-full transition-all relative
                    ${form.is_featured ? 'bg-banana-yellow shadow-lg shadow-banana-yellow/20' : 'bg-gray-300'}
                  `}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${form.is_featured ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">Destacado</span>
                  <input type="checkbox" className="hidden" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
               </label>
             </div>

             <div className="flex items-center gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-200 transition-all border border-black/5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-2.5 bg-purple-brand text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-brand/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={14} />}
                  Guardar Cambios
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
