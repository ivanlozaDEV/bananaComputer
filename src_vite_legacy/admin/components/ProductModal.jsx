import React from 'react';
import { X, Upload, Sparkles } from 'lucide-react';
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
  onGenerateReview
}) => {
  if (modal === null) return null;

  const availableSubs = categories.find(c => c.id === form.category_id)?.subcategories || [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', zIndex: 1000, padding: '2rem' }}>
      <div style={{ background: '#161616', borderRadius: '20px', width: '100%', maxWidth: '760px', padding: '2rem', border: '1px solid #272727', position: 'relative' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900 }}>{modal === 'new' ? 'Nuevo producto' : 'Editar producto'}</h2>
          <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <OllamaImportSection 
          ollama={ollama}
          datasheetRaw={datasheetRaw}
          setDatasheetRaw={setDatasheetRaw}
          handleDatasheetFile={handleDatasheetFile}
          onAnalyzeComplete={onOllamaAnalyze}
        />

        <form onSubmit={handleSave}>
          {/* Category & Multi-Subcategory selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="admin-form-group">
              <label>Categoría Principal</label>
              <select className="admin-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value, subcategory_ids: [] }))}>
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Subcategorías / Audiencias (Selección múltiple)</label>
              <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '0.75rem', maxHeight: '120px', overflowY: 'auto' }}>
                {availableSubs.length > 0 ? availableSubs.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={(form.subcategory_ids || []).includes(s.id)}
                      onChange={e => {
                        const ids = e.target.checked 
                          ? [...(form.subcategory_ids || []), s.id]
                          : (form.subcategory_ids || []).filter(id => id !== s.id);
                        setForm(f => ({ ...f, subcategory_ids: ids }));
                      }}
                      style={{ width: '14px', height: '14px', accentColor: '#4B467B' }}
                    />
                    {s.name}
                  </label>
                )) : <p style={{ color: '#555', fontSize: '0.8rem', margin: 0 }}>Selecciona una categoría primero</p>}
              </div>
            </div>
          </div>

          {/* SKU & Model Number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="admin-form-group">
              <label>SKU (Interno)</label>
              <input 
                className="admin-input" 
                value={form.sku || ''} 
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="Ej. BNN-001"
              />
            </div>
            <div className="admin-form-group">
              <label>Número de Modelo (Ej. M1502)</label>
              <input 
                className="admin-input" 
                value={form.model_number || ''} 
                onChange={e => setForm(f => ({ ...f, model_number: e.target.value }))}
                placeholder="Ej. E1504F"
              />
            </div>
          </div>

          <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Nombre del Producto</label>
            <input className="admin-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          {/* Price & Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="admin-form-group">
              <label>Precio (USD)</label>
              <input
                className="admin-input"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="admin-form-group">
              <label>Stock</label>
              <input
                className="admin-input"
                type="number"
                min="0"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Multiple Images Management */}
          <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Galería de Imágenes</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '0.75rem', marginBottom: '1rem' }}>
              {(form.images || []).map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #333' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    type="button"
                    onClick={() => removeImage(url)}
                    style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(209, 59, 83, 0.9)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label 
                style={{ 
                  width: '100px', height: '100px', borderRadius: '10px', border: '2px dashed #333', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', color: '#555', transition: '0.2s' 
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#4B467B'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#333'}
              >
                <Upload size={20} />
                <span style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>{uploading ? '...' : 'Añadir'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Spec card attributes */}
          {attrDefs.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#555', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Especificaciones destacadas</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {attrDefs.sort((a,b) => a.display_order - b.display_order).map(attr => (
                  <div key={attr.id} className="admin-form-group">
                    <label>{attr.name}{attr.unit ? ` (${attr.unit})` : ''}</label>
                    <input className="admin-input" value={attrValues[attr.id] || ''}
                      onChange={e => setAttrValues(v => ({ ...v, [attr.id]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Banana Review AI Section */}
          <div style={{ padding: '2rem', background: '#0d0d12', borderRadius: '16px', margin: '2rem 0', border: '1px solid #1f1f2e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ color: '#FBDD33', fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Sparkles size={18} /> Banana Review Bot
                </h3>
                <p style={{ color: '#666', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>Genera una reseña crítica basada en las especificaciones.</p>
              </div>
              <button 
                type="button" 
                className="admin-btn admin-btn-ghost"
                onClick={onGenerateReview}
                disabled={ollama.analyzing || ollama.status !== 'online'}
                style={{ background: 'rgba(75, 70, 123, 0.2)', color: '#fff', borderColor: '#4B467B' }}
              >
                {ollama.analyzing ? 'Generando...' : 'Generar IA Review'}
              </button>
            </div>

            {form.banana_review && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label>Veredicto / Sentencia (Corta)</label>
                  <input 
                    className="admin-input" 
                    value={form.banana_review.verdict || ''} 
                    onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, verdict: e.target.value } }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  {['office', 'gaming', 'design', 'portability', 'value'].map(k => (
                    <div key={k} className="admin-form-group">
                      <label style={{ fontSize: '0.65rem' }}>{k.toUpperCase()}</label>
                      <input 
                        type="number" min="1" max="5" className="admin-input"
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div className="admin-form-group">
                    <label>Pros (Uno por línea)</label>
                    <textarea 
                      className="admin-input" rows="3"
                      value={(form.banana_review.pros || []).join('\n')}
                      onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, pros: e.target.value.split('\n') } }))}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Contras (Uno por línea)</label>
                    <textarea 
                      className="admin-input" rows="3"
                      value={(form.banana_review.cons || []).join('\n')}
                      onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, cons: e.target.value.split('\n') } }))}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Análisis Detallado</label>
                  <textarea 
                    className="admin-input" rows="5"
                    value={form.banana_review.detailed_review || ''}
                    onChange={e => setForm(f => ({ ...f, banana_review: { ...f.banana_review, detailed_review: e.target.value } }))}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
