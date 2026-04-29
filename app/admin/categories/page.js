"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { Plus, Trash2, ChevronDown, ChevronUp, Tag, Layers, Settings, ArrowLeft, Image as ImageIcon, Upload, Zap, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

// Force rebuild - verified clean syntax
const ICON_OPTIONS = [
  { value: 'Cpu', label: 'CPU (Procesador)' },
  { value: 'MemoryStick', label: 'RAM' },
  { value: 'HardDrive', label: 'Almacenamiento' },
  { value: 'Monitor', label: 'Pantalla' },
  { value: 'Battery', label: 'Batería' },
  { value: 'Zap', label: 'Cargador' },
  { value: 'Keyboard', label: 'Teclado' },
  { value: 'Mouse', label: 'Mouse' },
  { value: 'Languages', label: 'Idioma' },
  { value: 'Shield', label: 'Garantía' },
];

const TYPE_OPTIONS = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'boolean', label: 'Booleano (Sí/No)' },
];

export default function CategoriesAdminPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', slug: '' });
  const [newSub, setNewSub] = useState({});
  const [attrForms, setAttrForms] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories (*),
        attribute_definitions (*)
      `)
      .order('name');
    
    if (error) showToast('Error al cargar categorías', 'error');
    else setCategories(data);
    setLoading(false);
  };

  const addCategory = async () => {
    if (!newCat.name || !newCat.slug) return showToast('Completa los campos', 'error');
    const { error } = await supabase.from('categories').insert([newCat]);
    if (error) showToast('Error al crear categoría', 'error');
    else {
      showToast('Categoría creada', 'success');
      setNewCat({ name: '', slug: '' });
      fetchCategories(true);
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('¿Eliminar categoría y todo su contenido?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) showToast('Error al eliminar', 'error');
    else {
      showToast('Categoría eliminada', 'success');
      fetchCategories(true);
    }
  };

  const addSubcategory = async (catId) => {
    const sub = newSub[catId];
    if (!sub?.name) return showToast('Escribe un nombre', 'error');
    
    // Generate slug
    const slug = sub.name.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { error } = await supabase.from('subcategories').insert([{
      name: sub.name,
      slug: slug,
      category_id: catId
    }]);
    if (error) showToast('Error al crear subcategoría', 'error');
    else {
      showToast('Subcategoría creada', 'success');
      setNewSub(s => ({ ...s, [catId]: { name: '' } }));
      fetchCategories(true);
    }
  };

  const updateSub = async (id, newName) => {
    // Generate new slug
    const newSlug = newName.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { error } = await supabase
      .from('subcategories')
      .update({ 
        name: newName,
        slug: newSlug
      })
      .eq('id', id);
    
    if (error) showToast('Error al actualizar', 'error');
    else {
      showToast('Subcategoría actualizada', 'success');
      setEditingSub(null);
      fetchCategories(true);
    }
  };

  const updateCategory = async (id, newName, newSlug) => {
    const { error } = await supabase
      .from('categories')
      .update({ 
        name: newName,
        slug: newSlug
      })
      .eq('id', id);
    
    if (error) {
      if (error.code === '23505') showToast('El slug o nombre ya existe', 'error');
      else showToast('Error al actualizar categoría', 'error');
    } else {
      showToast('Categoría actualizada', 'success');
      setEditingCat(null);
      fetchCategories(true);
    }
  };

  const deleteSub = async (id) => {
    if (!confirm('¿Eliminar subcategoría?')) return;
    const { error } = await supabase.from('subcategories').delete().eq('id', id);
    if (error) showToast('Error al eliminar', 'error');
    else {
      showToast('Subcategoría eliminada', 'success');
      fetchCategories(true);
    }
  };

  const setAttr = (catId, field, value) => {
    setAttrForms(prev => ({
      ...prev,
      [catId]: { ...prev[catId], [field]: value }
    }));
  };

  const addAttribute = async (catId) => {
    const form = attrForms[catId];
    if (!form?.name) return showToast('Escribe un nombre', 'error');
    const { error } = await supabase.from('attribute_definitions').insert([{
      ...form,
      category_id: catId,
      display_order: parseInt(form.display_order) || 0
    }]);
    if (error) showToast('Error al añadir atributo', 'error');
    else {
      showToast('Atributo añadido', 'success');
      setAttrForms(prev => ({ ...prev, [catId]: {} }));
      fetchCategories(true);
    }
  };

  const deleteAttr = async (id) => {
    const { error } = await supabase.from('attribute_definitions').delete().eq('id', id);
    if (error) showToast('Error al eliminar', 'error');
    else {
      showToast('Atributo eliminado', 'success');
      fetchCategories(true);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors w-fit">
          <ArrowLeft size={12} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Estructura del Catálogo</h1>
            <p className="text-gray-500 text-sm font-medium">Gestiona categorías, subcategorías y definiciones de specs.</p>
          </div>
        </div>
      </header>

      {/* Add Category Section */}
      <section className="bg-white border border-black/10 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-brand mb-8 flex items-center gap-2">
          <Plus size={14} /> Nueva Categoría Raíz
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nombre</label>
            <input 
              className="w-full bg-slate-50 border border-black/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-purple-brand/30 transition-all font-bold text-gray-900 shadow-inner"
              placeholder="Ej: Laptops"
              value={newCat.name}
              onChange={(e) => setNewCat(c => ({ ...c, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Slug (Ruta)</label>
            <input 
              className="w-full bg-slate-50 border border-black/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-purple-brand/30 transition-all font-bold text-gray-900 shadow-inner"
              placeholder="Ej: laptops"
              value={newCat.slug}
              onChange={(e) => setNewCat(c => ({ ...c, slug: e.target.value }))}
            />
          </div>
          <button 
            onClick={addCategory}
            className="px-8 py-3.5 bg-banana-yellow text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-banana-yellow/20"
          >
            <Plus size={18} /> CREAR CATEGORÍA
          </button>
        </div>
      </section>

      {/* Categories Accordion */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-black/10 border-t-banana-yellow rounded-full animate-spin"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando árbol de categorías...</span>
          </div>
        ) : categories.map(cat => (
          <div key={cat.id} className="bg-white border border-black/10 rounded-[2rem] overflow-hidden group shadow-sm transition-shadow hover:shadow-md">
            <div 
              className={`flex items-center justify-between p-5 px-8 cursor-pointer transition-colors ${expanded === cat.id ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
              onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-brand/10 rounded-2xl text-purple-brand group-hover:bg-purple-brand transition-all border border-purple-brand/10">
                  <Tag size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-lg tracking-tight text-gray-900">{cat.name}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">/{cat.slug} • {cat.subcategories?.length || 0} Subcategorías</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingCat({ id: cat.id, name: cat.name, slug: cat.slug }); }}
                  className="p-2 text-gray-400 hover:text-purple-brand transition-colors"
                  title="Editar Categoría"
                >
                  <Settings size={18} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                  className="p-2 text-gray-400 hover:text-raspberry transition-colors"
                  title="Eliminar Categoría"
                >
                  <Trash2 size={18} />
                </button>
                {expanded === cat.id ? <ChevronUp size={20} className="text-gray-900" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </div>

            {expanded === cat.id && (
              <div className="p-8 pt-4 border-t border-black/10 animate-in slide-in-from-top-4 duration-300">
                {/* Subcategories Grid */}
                <div className="mb-10">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-6 flex items-center gap-2 ml-1">
                    <Layers size={14} className="text-purple-brand" /> Subcategorías (Audiencias)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                    {cat.subcategories?.map(sub => (
                      <div key={sub.id} className="bg-slate-50 border border-black/10 rounded-3xl p-4 flex flex-col gap-3 relative group/sub hover:bg-white hover:shadow-md transition-all">
                        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover/sub:opacity-100 transition-opacity z-20">
                          <button 
                            onClick={() => setEditingSub({ id: sub.id, name: sub.name })}
                            className="p-1.5 bg-white/90 backdrop-blur-md text-gray-500 hover:text-purple-brand rounded-lg shadow-sm transition-all"
                            title="Renombrar"
                          >
                            <Settings size={14} />
                          </button>
                          <button 
                            onClick={() => deleteSub(sub.id)}
                            className="p-1.5 bg-white/90 backdrop-blur-md text-gray-500 hover:text-raspberry rounded-lg shadow-sm transition-all"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="aspect-video rounded-2xl bg-white border border-black/10 flex items-center justify-center overflow-hidden relative shadow-inner">
                          {sub.image_url ? (
                            <img src={sub.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-gray-200" />
                          )}
                           <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/sub:opacity-100 transition-opacity cursor-pointer text-[9px] font-black tracking-widest uppercase text-white backdrop-blur-[2px] z-10">
                            <Upload size={12} className="mr-2" /> Subir Arte
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                               const file = e.target.files[0];
                               if (!file) return;
                               const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                               const path = `subcategories/${Date.now()}-${cleanFileName}`;
                               const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
                               try {
                                 console.log('Starting subcategory image compression...');
                                 const compressedFile = await imageCompression(file, options);
                                 console.log('Compression complete, uploading to supabase...');
                                 const { data: uploadData, error } = await supabase.storage.from('product-images').upload(path, compressedFile);
                                 
                                 if (error) {
                                   console.error('Supabase upload error:', error);
                                   showToast('Error al subir imagen: ' + error.message, 'error');
                                 } else {
                                   console.log('Upload successful, updating subcategory record...');
                                   const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
                                   const { error: updateError } = await supabase.from('subcategories').update({ image_url: publicUrl }).eq('id', sub.id);
                                   
                                   if (updateError) {
                                     console.error('Subcategory update error:', updateError);
                                     showToast('Error al actualizar base de datos', 'error');
                                   } else {
                                     fetchCategories();
                                     showToast('Imagen actualizada', 'success');
                                   }
                                 }
                               } catch (err) { 
                                 console.error('Image processing exception:', err);
                                 showToast('Error al procesar imagen', 'error'); 
                               }
                            }} />
                          </label>
                        </div>
                        <span className="font-bold text-[11px] text-center text-gray-900 uppercase tracking-tight">{sub.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input 
                      className="flex-1 bg-slate-50 border border-black/10 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-purple-brand/30 transition-all text-gray-900 shadow-inner"
                      placeholder="Nueva subcategoría..."
                      value={newSub[cat.id]?.name || ''}
                      onChange={(e) => setNewSub(s => ({ ...s, [cat.id]: { ...s[cat.id], name: e.target.value } }))}
                    />
                    <button 
                      onClick={() => addSubcategory(cat.id)}
                      className="px-5 py-3 bg-purple-brand text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-brand/20"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Attributes Definition */}
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-6 flex items-center gap-2 ml-1">
                    <Settings size={14} className="text-purple-brand" /> Especificaciones Técnicas (Atributos)
                  </h4>
                  <div className="overflow-hidden rounded-3xl border border-black/10 bg-white mb-6 shadow-sm">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-black/10 bg-gray-50/50">
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-gray-500">Orden</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-gray-500 text-center">En Card</th>
                          <th className="px-6 py-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.attribute_definitions?.sort((a,b) => a.display_order - b.display_order).map(attr => (
                          <tr key={attr.id} className="border-b border-black/10 last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3.5 font-bold text-gray-900">{attr.name}</td>
                            <td className="px-6 py-3.5 text-gray-500">{attr.unit || '—'}</td>
                            <td className="px-6 py-3.5 text-gray-500">{attr.icon || '—'}</td>
                            <td className="px-6 py-3.5">
                              <span className="px-2 py-1 bg-gray-100 rounded-lg text-[9px] uppercase font-black text-gray-500 border border-black/5">
                                {attr.data_type}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 font-black text-purple-brand">{attr.display_order}</td>
                            <td className="px-6 py-3.5 text-center">
                              <button 
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('attribute_definitions')
                                    .update({ show_in_card: !attr.show_in_card })
                                    .eq('id', attr.id);
                                  if (error) showToast('Error al actualizar', 'error');
                                  else fetchCategories();
                                }}
                                className={`p-2 rounded-lg transition-colors ${attr.show_in_card ? 'bg-banana-yellow text-black' : 'bg-gray-100 text-gray-300'}`}
                                title="Mostrar en el Card de producto"
                              >
                                <Zap size={14} fill={attr.show_in_card ? "currentColor" : "none"} />
                              </button>
                            </td>
                            <td className="px-6 py-3.5 text-right pr-8">
                              <button onClick={() => deleteAttr(attr.id)} className="p-2 text-gray-400 hover:text-raspberry transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Attr Form */}
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end p-5 bg-slate-50 rounded-[2rem] border border-black/10">
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nombre</label>
                       <input className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none font-bold text-gray-900 shadow-sm" placeholder="RAM"
                         value={attrForms[cat.id]?.name || ''} onChange={e => setAttr(cat.id, 'name', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Unidad</label>
                       <input className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none font-bold text-gray-900 shadow-sm" placeholder="GB"
                         value={attrForms[cat.id]?.unit || ''} onChange={e => setAttr(cat.id, 'unit', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Ícono</label>
                       <input className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none font-bold text-gray-900 shadow-sm" placeholder="🚀"
                         value={attrForms[cat.id]?.icon || ''} onChange={e => setAttr(cat.id, 'icon', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Tipo</label>
                       <select className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none appearance-none font-bold text-gray-900 shadow-sm"
                         value={attrForms[cat.id]?.data_type || 'text'} onChange={e => setAttr(cat.id, 'data_type', e.target.value)}>
                         <option value="text">Texto</option>
                         <option value="number">Número</option>
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Orden</label>
                       <input type="number" className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none font-bold text-gray-900 shadow-sm" placeholder="0"
                         value={attrForms[cat.id]?.display_order || ''} onChange={e => setAttr(cat.id, 'display_order', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Featured</label>
                       <button 
                          onClick={() => setAttr(cat.id, 'show_in_card', !attrForms[cat.id]?.show_in_card)}
                          className={`w-full py-2.5 rounded-xl border transition-all ${attrForms[cat.id]?.show_in_card ? 'bg-banana-yellow border-banana-yellow text-black' : 'bg-white border-black/10 text-gray-300'}`}
                       >
                         <Zap size={16} className="mx-auto" fill={attrForms[cat.id]?.show_in_card ? "currentColor" : "none"} />
                       </button>
                    </div>
                    <button 
                      onClick={() => addAttribute(cat.id)}
                      className="w-full py-2.5 bg-purple-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-purple-brand/20"
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

      {/* Rename Category Modal */}
      {editingCat && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black mb-2 tracking-tight">Editar Categoría</h3>
            <p className="text-gray-500 text-xs font-medium mb-8 uppercase tracking-widest">Afectará las URLs de todos los productos y subcategorías.</p>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nuevo Nombre</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-50 border border-black/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-brand/30 transition-all text-gray-900 shadow-inner"
                  value={editingCat.name}
                  onChange={e => {
                    const newName = e.target.value;
                    const newSlug = newName.toLowerCase()
                      .trim()
                      .replace(/[^\w\s-]/g, '')
                      .replace(/[\s_-]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setEditingCat(s => ({ ...s, name: newName, slug: newSlug }));
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Slug (Personalizado)</label>
                <input 
                  className="w-full bg-slate-50 border border-black/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-brand/30 transition-all text-gray-900 shadow-inner"
                  value={editingCat.slug}
                  onChange={e => setEditingCat(s => ({ ...s, slug: e.target.value }))}
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingCat(null)}
                  className="flex-1 py-4 border border-black/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={() => updateCategory(editingCat.id, editingCat.name, editingCat.slug)}
                  className="flex-1 py-4 bg-purple-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-brand/20"
                >
                  GUARDAR CAMBIOS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Subcategory Modal */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black mb-2 tracking-tight">Renombrar Subcategoría</h3>
            <p className="text-gray-500 text-xs font-medium mb-8 uppercase tracking-widest">Afectará las URLs de los productos vinculados.</p>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nuevo Nombre</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-50 border border-black/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-brand/30 transition-all text-gray-900 shadow-inner"
                  value={editingSub.name}
                  onChange={e => setEditingSub(s => ({ ...s, name: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') updateSub(editingSub.id, editingSub.name);
                    if (e.key === 'Escape') setEditingSub(null);
                  }}
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingSub(null)}
                  className="flex-1 py-4 border border-black/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={() => updateSub(editingSub.id, editingSub.name)}
                  className="flex-1 py-4 bg-purple-brand text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-brand/20"
                >
                  GUARDAR CAMBIOS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
