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
  onOllamaAnalyze
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
          {/* Category selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="admin-form-group">
              <label>Categoría</label>
              <select className="admin-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value, subcategory_id: '' }))}>
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Audiencia / Subcategoría</label>
              <select className="admin-input" value={form.subcategory_id} onChange={e => setForm(f => ({ ...f, subcategory_id: e.target.value }))}>
                <option value="">Sin subcategoría</option>
                {availableSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Basic info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {[['SKU', 'sku'], ['Nombre', 'name'], ['Precio ($)', 'price'], ['Stock', 'stock']].map(([label, key]) => (
              <div key={key} className="admin-form-group">
                <label>{label}</label>
                <input className="admin-input" value={form[key]} required={key === 'sku' || key === 'name' || key === 'price'}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          {/* Marketing copy */}
          {[['Tagline (marketing)', 'tagline'], ['Subtítulo marketing', 'marketing_subtitle'], ['Descripción corta (card)', 'description']].map(([label, key]) => (
            <div key={key} className="admin-form-group" style={{ marginBottom: '0.85rem' }}>
              <label>{label}</label>
              <input className="admin-input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
            <label>Texto marketing largo</label>
            <textarea className="admin-input admin-textarea" value={form.marketing_body} onChange={e => setForm(f => ({ ...f, marketing_body: e.target.value }))} />
          </div>

          {/* Image */}
          <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
            <label>Imagen principal</label>
            <input className="admin-input" value={form.image_url} placeholder="URL o sube un archivo"
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
            <label className="admin-btn admin-btn-ghost" style={{ cursor: 'pointer', marginTop: '0.5rem', display: 'inline-flex' }}>
              <Upload size={14} />{uploading ? 'Subiendo...' : 'Subir imagen'}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            {form.image_url && <img src={form.image_url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginTop: '0.5rem' }} />}
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

          {/* Toggles */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {[['Destacado (Novedades)', 'is_featured'], ['Activo en tienda', 'is_active']].map(([label, key]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#888', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#fff' }}
                />
                {label}
              </label>
            ))}
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
