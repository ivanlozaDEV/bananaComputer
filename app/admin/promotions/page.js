"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import imageCompression from 'browser-image-compression';
import {
  Plus, Trash2, ArrowLeft, Upload, Link2, ToggleLeft,
  ToggleRight, GripVertical, Save, X, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function PromotionsAdminPage() {
  const { showToast } = useToast();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | <promotion object>
  const [form, setForm] = useState({ image_url: '', link_url: '', is_active: true, display_order: 0 });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('promotions').select('*').order('display_order', { ascending: true });
    if (!error) setPromotions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => {
    setForm({ image_url: '', link_url: '', is_active: true, display_order: promotions.length });
    setModal('new');
  };

  const openEdit = (promo) => {
    setForm({ ...promo });
    setModal(promo);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 2400, useWebWorker: true });
      const path = `banners/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, compressed, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setForm(f => ({ ...f, image_url: publicUrl }));
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Error al subir imagen', 'error');
    }
    setUploading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.image_url) { showToast('Sube una imagen primero', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        image_url: form.image_url,
        link_url: form.link_url || null,
        is_active: form.is_active,
        display_order: parseInt(form.display_order) || 0,
      };
      if (modal === 'new') {
        const { error } = await supabase.from('promotions').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('promotions').update(payload).eq('id', modal.id);
        if (error) throw error;
      }
      showToast('Promoción guardada', 'success');
      setModal(null);
      fetchAll();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Error al guardar', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) { showToast('Error al eliminar', 'error'); return; }
    showToast('Promoción eliminada', 'success');
    fetchAll();
  };

  const toggleActive = async (promo) => {
    await supabase.from('promotions').update({ is_active: !promo.is_active }).eq('id', promo.id);
    fetchAll();
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors w-fit">
          <ArrowLeft size={12} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Banners Promocionales</h1>
            <p className="text-gray-400 text-sm font-medium">Gestiona los banners que aparecen en el hero de la tienda.</p>
          </div>
          <button
            onClick={openNew}
            className="px-6 py-3.5 bg-banana-yellow text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-banana-yellow/10 flex items-center gap-2"
          >
            <Plus size={18} /> NUEVO BANNER
          </button>
        </div>
      </header>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-black/5 border-t-banana-yellow rounded-full animate-spin" />
        </div>
      ) : promotions.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">🍌📸</span>
          <h3 className="text-xl font-black">No hay banners aún</h3>
          <p className="text-gray-400 text-sm max-w-sm">Crea tu primer banner promocional para que aparezca en el hero de la tienda.</p>
          <button onClick={openNew} className="mt-4 px-6 py-3 bg-purple-brand text-white rounded-xl font-black text-xs uppercase tracking-widest">
            Crear Banner
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {promotions.map((promo) => (
            <div key={promo.id} className="bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-stretch gap-0">
                {/* Banner preview */}
                <div className="w-48 md:w-64 shrink-0 bg-gray-50 overflow-hidden">
                  {promo.image_url ? (
                    <img src={promo.image_url} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🍌</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-5 flex flex-col justify-between gap-3 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Orden #{promo.display_order + 1}</span>
                      {promo.link_url ? (
                        <a href={promo.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-black text-purple-brand hover:underline truncate">
                          <Link2 size={12} /> {promo.link_url}
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400 italic font-medium">Sin enlace</span>
                      )}
                    </div>

                    {/* Active toggle */}
                    <button
                      onClick={() => toggleActive(promo)}
                      className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${promo.is_active ? 'bg-mint-success/10 text-mint-success' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {promo.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {promo.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(promo)}
                      className="px-4 py-2 bg-purple-brand/5 text-purple-brand rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-brand/10 transition-all"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="px-4 py-2 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {modal !== null && (
        <div className="fixed inset-0 z-[1000] bg-white/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white border border-black/5 rounded-[2.5rem] shadow-2xl p-8 flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{modal === 'new' ? 'Nuevo Banner' : 'Editar Banner'}</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              {/* Image upload */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Upload size={10} className="text-purple-brand" /> Imagen del Banner
                </label>
                {form.image_url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-black/10">
                    <img src={form.image_url} alt="Preview" className="w-full max-h-40 object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className={`w-full h-32 rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:border-purple-brand/30 hover:bg-slate-50 transition-all ${uploading ? 'opacity-50 animate-pulse' : ''}`}>
                    <Upload size={24} className="text-gray-300 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{uploading ? 'Subiendo...' : 'Clic para subir'}</span>
                    <span className="text-[9px] text-gray-300 mt-1">PNG, JPG, WebP — recomendado 1200×400px</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>

              {/* Link URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Link2 size={10} className="text-purple-brand" /> URL de Destino (opcional)
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-black/10 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-purple-brand/30"
                  placeholder="/categoria/laptops  ó  https://..."
                  value={form.link_url}
                  onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                />
              </div>

              {/* Display order */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <GripVertical size={10} className="text-purple-brand" /> Orden de aparición
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-slate-50 border border-black/10 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-purple-brand/30"
                  value={form.display_order}
                  onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))}
                />
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-10 h-5 rounded-full transition-all relative ${form.is_active ? 'bg-mint-success' : 'bg-gray-300'}`}
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.is_active ? 'right-0.5' : 'left-0.5'}`} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Activo</span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex-1 py-3 bg-purple-brand text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-brand/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
