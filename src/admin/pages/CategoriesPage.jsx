import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

// ─── Predefined options ──────────────────────────────────────────
const ICON_OPTIONS = [
  { value: 'memory-stick',  label: '🧠 RAM / Memoria' },
  { value: 'hard-drive',    label: '💾 Almacenamiento' },
  { value: 'cpu',           label: '⚡ Procesador / CPU' },
  { value: 'monitor',       label: '🖥️ Pantalla' },
  { value: 'battery',       label: '🔋 Batería' },
  { value: 'bluetooth',     label: '📡 Bluetooth' },
  { value: 'wifi',          label: '📶 WiFi' },
  { value: 'scale',         label: '⚖️ Peso' },
  { value: 'plug',          label: '🔌 Puertos' },
  { value: 'gamepad-2',     label: '🎮 Compatibilidad' },
  { value: 'zap',           label: '⚡ Frecuencia / Hz' },
  { value: 'thermometer',   label: '🌡️ Temperatura' },
  { value: 'scan',          label: '🔍 Resolución' },
  { value: 'layers',        label: '📚 Modelo / Serie' },
  { value: 'globe',         label: '🌐 Conectividad' },
  { value: 'volume-2',      label: '🔊 Audio' },
  { value: 'camera',        label: '📷 Cámara' },
  { value: 'shield',        label: '🔒 Seguridad' },
  { value: 'rotate-cw',     label: '🔄 RPM / Velocidad' },
  { value: 'package',       label: '📦 Dimensiones' },
];

const TYPE_OPTIONS = [
  { value: 'text',    label: 'Texto (ej: Intel Core i5)' },
  { value: 'number',  label: 'Número (ej: 16)' },
  { value: 'boolean', label: 'Sí / No (ej: Touch Screen)' },
];

const selectStyle = {
  padding: '0.8rem 1rem', background: '#1a1a1a', border: '1px solid #333',
  borderRadius: '10px', color: '#f0f0f0', fontFamily: 'inherit',
  fontSize: '0.85rem', outline: 'none', flex: '1', minWidth: '140px',
};

// ─── Component ───────────────────────────────────────────────────
const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '' });
  const [newSub, setNewSub] = useState({});
  const [attrForms, setAttrForms] = useState({});

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*, subcategories(*), attribute_definitions(*)')
      .order('name');
    setCategories(data || []);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async () => {
    if (!newCat.name) return;
    const slug = newCat.slug || newCat.name.toLowerCase().replace(/\s+/g, '-');
    await supabase.from('categories').insert({ ...newCat, slug });
    setNewCat({ name: '', slug: '', description: '' });
    fetchCategories();
  };

  const deleteCategory = async (id) => {
    if (!confirm('¿Eliminar esta categoría y todo su contenido?')) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  };

  const addSubcategory = async (categoryId) => {
    const sub = newSub[categoryId] || {};
    if (!sub.name) return;
    const slug = sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-');
    await supabase.from('subcategories').insert({ category_id: categoryId, name: sub.name, slug });
    setNewSub(s => ({ ...s, [categoryId]: {} }));
    fetchCategories();
  };

  const deleteSub = async (id) => {
    await supabase.from('subcategories').delete().eq('id', id);
    fetchCategories();
  };

  const addAttribute = async (categoryId) => {
    const a = attrForms[categoryId] || {};
    if (!a.name) return;
    await supabase.from('attribute_definitions').insert({
      category_id: categoryId,
      name: a.name,
      unit: a.unit || null,
      icon: a.icon || null,
      data_type: a.data_type || 'text',
      display_order: parseInt(a.display_order) || 0,
    });
    setAttrForms(f => ({ ...f, [categoryId]: {} }));
    fetchCategories();
  };

  const deleteAttr = async (id) => {
    await supabase.from('attribute_definitions').delete().eq('id', id);
    fetchCategories();
  };

  const setAttr = (catId, key, value) =>
    setAttrForms(f => ({ ...f, [catId]: { ...f[catId], [key]: value } }));

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Categorías</h1>
      </div>

      {/* Add Category */}
      <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #272727' }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 700 }}>Nueva categoría</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[['Nombre', 'name'], ['Slug (auto)', 'slug'], ['Descripción', 'description']].map(([ph, key]) => (
            <input key={key} className="admin-input" placeholder={ph}
              value={newCat[key]} onChange={(e) => setNewCat(c => ({ ...c, [key]: e.target.value }))}
              style={{ flex: '1', minWidth: '140px' }}
            />
          ))}
          <button className="admin-btn admin-btn-primary" onClick={addCategory}><Plus size={16} /> Añadir</button>
        </div>
      </div>

      {/* Categories List */}
      {categories.map(cat => (
        <div key={cat.id} style={{ background: '#1a1a1a', borderRadius: '16px', marginBottom: '1rem', border: '1px solid #272727', overflow: 'hidden' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
          >
            <div>
              <span style={{ color: '#fff', fontWeight: 700 }}>{cat.name}</span>
              <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: '0.75rem' }}>/{cat.slug}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="admin-btn admin-btn-danger" onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}><Trash2 size={14} /></button>
              <ChevronDown size={16} style={{ color: '#555', transform: expanded === cat.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </div>
          </div>

          {expanded === cat.id && (
            <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid #272727' }}>

              {/* Subcategories */}
              <h4 style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '1rem 0 0.5rem' }}>Subcategorías</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {(cat.subcategories || []).map(sub => (
                  <div key={sub.id} style={{ background: '#222', borderRadius: '12px', padding: '0.75rem', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 600 }}>{sub.name}</span>
                      <button onClick={() => deleteSub(sub.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><Trash2 size={12} /></button>
                    </div>
                    <div style={{ position: 'relative', width: '100%', height: '80px', background: '#111', borderRadius: '8px', overflow: 'hidden', border: '1px dashed #444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sub.image_url ? (
                        <img src={sub.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem', opacity: 0.2 }}>🖼️</span>
                      )}
                      <label style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Plus size={12} color="#fff" />
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const path = `subcategories/${Date.now()}-${file.name}`;
                          await supabase.storage.from('product-images').upload(path, file);
                          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
                          await supabase.from('subcategories').update({ image_url: publicUrl }).eq('id', sub.id);
                          fetchCategories();
                        }} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="admin-input" placeholder="Nueva subcategoría" style={{ flex: 1 }}
                  value={newSub[cat.id]?.name || ''} onChange={(e) => setNewSub(s => ({ ...s, [cat.id]: { ...s[cat.id], name: e.target.value } }))} />
                <button className="admin-btn admin-btn-ghost" onClick={() => addSubcategory(cat.id)}><Plus size={14} /></button>
              </div>

              {/* Attribute Definitions */}
              <h4 style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '1.25rem 0 0.5rem' }}>Atributos de specs</h4>
              <table className="admin-table" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                <thead><tr><th>Nombre</th><th>Unidad</th><th>Ícono</th><th>Tipo</th><th>Orden</th><th></th></tr></thead>
                <tbody>
                  {(cat.attribute_definitions || []).sort((a,b) => a.display_order - b.display_order).map(attr => {
                    const iconLabel = ICON_OPTIONS.find(i => i.value === attr.icon)?.label || attr.icon || '—';
                    return (
                      <tr key={attr.id}>
                        <td style={{ color: '#fff' }}>{attr.name}</td>
                        <td>{attr.unit || '—'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{iconLabel}</td>
                        <td>{attr.data_type}</td>
                        <td>{attr.display_order}</td>
                        <td><button className="admin-btn admin-btn-danger" style={{ padding: '0.3rem 0.5rem' }} onClick={() => deleteAttr(attr.id)}><Trash2 size={12} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add Attribute Form — with dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 1.5fr 1.2fr 0.5fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input className="admin-input" placeholder="Nombre (ej: RAM)"
                  value={attrForms[cat.id]?.name || ''}
                  onChange={e => setAttr(cat.id, 'name', e.target.value)} />

                <input className="admin-input" placeholder="Unidad"
                  value={attrForms[cat.id]?.unit || ''}
                  onChange={e => setAttr(cat.id, 'unit', e.target.value)} />

                <select style={selectStyle}
                  value={attrForms[cat.id]?.icon || ''}
                  onChange={e => setAttr(cat.id, 'icon', e.target.value)}>
                  <option value="">— Ícono —</option>
                  {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                <select style={selectStyle}
                  value={attrForms[cat.id]?.data_type || 'text'}
                  onChange={e => setAttr(cat.id, 'data_type', e.target.value)}>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                <input className="admin-input" placeholder="Orden" type="number" style={{ width: '60px' }}
                  value={attrForms[cat.id]?.display_order || ''}
                  onChange={e => setAttr(cat.id, 'display_order', e.target.value)} />

                <button className="admin-btn admin-btn-ghost" onClick={() => addAttribute(cat.id)} style={{ whiteSpace: 'nowrap' }}>
                  <Plus size={14} /> Añadir
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CategoriesPage;
