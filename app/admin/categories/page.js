"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { Plus, Trash2, ChevronDown, ChevronUp, Tag, Layers, Settings, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

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

export default function CategoriesAdminPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '' });
  const [newSub, setNewSub] = useState({});
  const [attrForms, setAttrForms] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*, subcategories(*), attribute_definitions(*)')
      .order('name');
    
    if (error) {
      showToast('Error al cargar categorías', 'error');
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async () => {
    if (!newCat.name) return;
    const slug = newCat.slug || newCat.name.toLowerCase().replace(/\s+/g, '-');
    const { error } = await supabase.from('categories').insert({ ...newCat, slug });
    if (error) showToast('Error al crear categoría', 'error');
    else {
      showToast('Categoría creada', 'success');
      setNewCat({ name: '', slug: '', description: '' });
      fetchCategories();
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('¿Eliminar esta categoría y todo su contenido?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) showToast('Error al eliminar', 'error');
    else {
      showToast('Categoría eliminada', 'success');
      fetchCategories();
    }
  };

  const addSubcategory = async (categoryId) => {
    const sub = newSub[categoryId] || {};
    if (!sub.name) return;
    const slug = sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-');
    const { error } = await supabase.from('subcategories').insert({ category_id: categoryId, name: sub.name, slug });
    if (error) showToast('Error al crear subcategoría', 'error');
    else {
      showToast('Subcategoría creada', 'success');
      setNewSub(s => ({ ...s, [categoryId]: {} }));
      fetchCategories();
    }
  };

  const deleteSub = async (id) => {
    if (!confirm('¿Eliminar esta subcategoría?')) return;
    const { error } = await supabase.from('subcategories').delete().eq('id', id);
    if (error) showToast('Error al eliminar', 'error');
    else {
      showToast('Subcategoría eliminada', 'success');
      fetchCategories();
    }
  };

  const addAttribute = async (categoryId) => {
    const a = attrForms[categoryId] || {};
    if (!a.name) return;
    const { error } = await supabase.from('attribute_definitions').insert({
      category_id: categoryId,
      name: a.name,
      unit: a.unit || null,
      icon: a.icon || null,
      data_type: a.data_type || 'text',
      display_order: parseInt(a.display_order) || 0,
    });
    if (error) showToast('Error al crear atributo', 'error');
    else {
      showToast('Atributo añadido', 'success');
      setAttrForms(f => ({ ...f, [categoryId]: {} }));
      fetchCategories();
    }
  };

  const deleteAttr = async (id) => {
    const { error } = await supabase.from('attribute_definitions').delete().eq('id', id);
    if (error) showToast('Error al eliminar atributo', 'error');
    else {
      showToast('Atributo eliminado', 'success');
      fetchCategories();
    }
  };

  const setAttr = (catId, key, value) =>
    setAttrForms(f => ({ ...f, [catId]: { ...f[catId], [key]: value } }));

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors w-fit">
          <ArrowLeft size={14} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight">Estructura del Catálogo</h1>
            <p className="text-gray-500 font-medium">Gestiona categorías, subcategorías y definiciones de specs.</p>
          </div>
        </div>
      </header>

      {/* Add Category Section */}
      <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-10">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-banana-yellow mb-8 flex items-center gap-2">
          <Plus size={14} /> Nueva Categoría Raíz
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nombre</label>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-banana-yellow/30"
              placeholder="Ej: Laptops"
              value={newCat.name}
              onChange={(e) => setNewCat(c => ({ ...c, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Slug (Ruta)</label>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-banana-yellow/30"
              placeholder="Ej: laptops"
              value={newCat.slug}
              onChange={(e) => setNewCat(c => ({ ...c, slug: e.target.value }))}
            />
          </div>
          <button 
            onClick={addCategory}
            className="px-8 py-4 bg-banana-yellow text-black rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> CREAR CATEGORÍA
          </button>
        </div>
      </section>

      {/* Categories Accordion */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-20 opacity-40 font-black uppercase tracking-widest text-xs">Cargando árbol de categorías...</div>
        ) : categories.map(cat => (
          <div key={cat.id} className="bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden group">
            <div 
              className={`flex items-center justify-between p-6 px-10 cursor-pointer transition-colors ${expanded === cat.id ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
              onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-brand/10 rounded-2xl text-purple-brand group-hover:bg-purple-brand/20 transition-colors">
                  <Tag size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tight">{cat.name}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">/{cat.slug} • {cat.subcategories?.length || 0} Subcategorías</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                  className="p-2 text-gray-600 hover:text-raspberry transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                {expanded === cat.id ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
              </div>
            </div>

            {expanded === cat.id && (
              <div className="p-10 pt-4 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                {/* Subcategories Grid */}
                <div className="mb-12">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6 flex items-center gap-2">
                    <Layers size={14} /> Subcategorías
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {cat.subcategories?.map(sub => (
                      <div key={sub.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 relative group/sub">
                         <button 
                          onClick={() => deleteSub(sub.id)}
                          className="absolute top-4 right-4 text-gray-700 hover:text-raspberry transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="aspect-video rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden relative">
                          {sub.image_url ? (
                            <img src={sub.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={24} className="opacity-10" />
                          )}
                           <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/sub:opacity-100 transition-opacity cursor-pointer text-[10px] font-black tracking-widest uppercase">
                            <Upload size={14} className="mr-2" /> Subir
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                               const file = e.target.files[0];
                               if (!file) return;
                               const path = `subcategories/${Date.now()}-${file.name}`;
                               const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
                               try {
                                 const compressedFile = await imageCompression(file, options);
                                 const { data: uploadData, error } = await supabase.storage.from('product-images').upload(path, compressedFile);
                                 if (error) showToast('Error al subir imagen', 'error');
                                 else {
                                   const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
                                   await supabase.from('subcategories').update({ image_url: publicUrl }).eq('id', sub.id);
                                   fetchCategories();
                                   showToast('Imagen actualizada', 'success');
                                 }
                               } catch (err) { showToast('Error al procesar imagen', 'error'); }
                            }} />
                          </label>
                        </div>
                        <span className="font-bold text-sm text-center">{sub.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 max-w-md">
                    <input 
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-purple-brand/30"
                      placeholder="Nueva subcategoría..."
                      value={newSub[cat.id]?.name || ''}
                      onChange={(e) => setNewSub(s => ({ ...s, [cat.id]: { ...s[cat.id], name: e.target.value } }))}
                    />
                    <button 
                      onClick={() => addSubcategory(cat.id)}
                      className="px-6 py-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Attributes Definition */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6 flex items-center gap-2">
                    <Settings size={14} /> Atributos de Especificaciones Técnicas
                  </h4>
                  <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/5 mb-8">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                          <th className="px-6 py-4 font-black uppercase tracking-widest opacity-40">Nombre</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest opacity-40">Unidad</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest opacity-40">Ícono</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest opacity-40">Tipo</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest opacity-40">Orden</th>
                          <th className="px-6 py-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.attribute_definitions?.sort((a,b) => a.display_order - b.display_order).map(attr => (
                          <tr key={attr.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-bold">{attr.name}</td>
                            <td className="px-6 py-4 text-gray-500 font-bold">{attr.unit || '—'}</td>
                            <td className="px-6 py-4 text-gray-500 italic">
                              {ICON_OPTIONS.find(o => o.value === attr.icon)?.label || attr.icon || '—'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] uppercase font-black opacity-60">
                                {attr.data_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-black text-purple-brand">{attr.display_order}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => deleteAttr(attr.id)} className="p-2 text-gray-700 hover:text-raspberry transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Attr Form */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-6 bg-white/5 rounded-3xl border border-white/5">
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nombre</label>
                       <input className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none" placeholder="RAM"
                         value={attrForms[cat.id]?.name || ''} onChange={e => setAttr(cat.id, 'name', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Unidad</label>
                       <input className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none" placeholder="GB"
                         value={attrForms[cat.id]?.unit || ''} onChange={e => setAttr(cat.id, 'unit', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Ícono</label>
                       <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none"
                         value={attrForms[cat.id]?.icon || ''} onChange={e => setAttr(cat.id, 'icon', e.target.value)}>
                         <option value="">Ninguno</option>
                         {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Tipo de Dato</label>
                       <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none"
                         value={attrForms[cat.id]?.data_type || 'text'} onChange={e => setAttr(cat.id, 'data_type', e.target.value)}>
                         {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Orden</label>
                       <input type="number" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none" placeholder="0"
                         value={attrForms[cat.id]?.display_order || ''} onChange={e => setAttr(cat.id, 'display_order', e.target.value)} />
                    </div>
                    <button 
                      onClick={() => addAttribute(cat.id)}
                      className="w-full py-3 bg-white text-black rounded-xl font-black text-xs hover:bg-banana-yellow transition-all"
                    >
                      AÑADIR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
