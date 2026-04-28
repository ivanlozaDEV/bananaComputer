"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';
import { Save, Upload, ArrowLeft, Image as ImageIcon, Sparkles, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

export default function HeroEditorPage() {
  const { heroContent, setHeroContent, brandLogos, addBrandLogo, deleteBrandLogo } = useStore();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: '', subtitle: '', primary_cta: '', secondary_cta: '', image_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (heroContent) {
      setForm({
        title: heroContent.title || '',
        subtitle: heroContent.subtitle || '',
        primary_cta: heroContent.primary_cta || '',
        secondary_cta: heroContent.secondary_cta || '',
        image_url: heroContent.image_url || '',
      });
    }
  }, [heroContent]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await setHeroContent(form);
      setSaved(true);
      showToast('Hero actualizado con éxito', 'success');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      showToast('Error al guardar cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `hero-${Date.now()}.${ext}`;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1800,
      useWebWorker: true
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const { data: uploadData, error } = await supabase.storage.from('product-images').upload(path, compressedFile, { upsert: true });
      
      if (error) {
        showToast('Error subiendo imagen. ¿Existe el bucket "product-images"?', 'error');
      } else {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
        setForm(f => ({ ...f, image_url: publicUrl }));
        showToast('Imagen subida correctamente', 'success');
      }
    } catch (err) {
      showToast('Error al procesar la imagen', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleBrandLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (brandLogos.length >= 8) {
      showToast('Máximo 8 logos permitidos', 'error');
      return;
    }
    
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `brand-${Date.now()}.${ext}`;

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const { data: uploadData, error } = await supabase.storage.from('product-images').upload(path, compressedFile, { upsert: true });
      
      if (error) {
        showToast('Error subiendo logo. ¿Existe el bucket "product-images"?', 'error');
      } else {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
        await addBrandLogo({ url: publicUrl, name: file.name.split('.')[0] });
        showToast('Logo agregado correctamente', 'success');
      }
    } catch (err) {
      showToast('Error al procesar el logo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBrandLogo = async (id) => {
    const success = await deleteBrandLogo(id);
    if (success) {
      showToast('Logo eliminado', 'success');
    } else {
      showToast('Error al eliminar logo', 'error');
    }
  };

  const FIELDS = [
    { key: 'title', label: 'Título Principal', placeholder: 'Ej: Tu Tecnología Garantizada' },
    { key: 'subtitle', label: 'Subtítulo / Descripción', placeholder: 'Ej: Bienvenido a Banana Computer...' },
    { key: 'primary_cta', label: 'Texto Botón IA', placeholder: 'Ej: Explorar Sistemas' },
    { key: 'secondary_cta', label: 'Texto Botón Secundario', placeholder: 'Ej: Ver Catálogo' },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors w-fit">
          <ArrowLeft size={12} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight">Editor del Hero</h1>
            <p className="text-gray-400 text-sm font-medium">Gestiona el Banner principal y los llamados a la acción.</p>
          </div>
          <button 
            className={`
              px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl
              ${saved ? 'bg-mint-success text-white shadow-mint-success/20' : 'bg-banana-yellow text-black hover:scale-105 active:scale-95 shadow-banana-yellow/20'}
            `}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <Save size={16} />}
            {saved ? 'GUARDADO' : saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
        {/* Form Panel */}
        <div className="bg-white border border-black/5 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-brand/5 rounded-xl text-purple-brand">
              <ImageIcon size={18} />
            </div>
            <h2 className="text-xl font-black text-gray-800">Contenido Visual</h2>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSave}>
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{label}</label>
                <input
                  className="w-full bg-gray-50 border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-purple-brand/30 transition-all text-gray-700"
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}

            <div className="flex flex-col gap-2 pt-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Imagen de Fondo (URL o Subida)</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-gray-50 border border-black/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-purple-brand/30 transition-all text-gray-700"
                  value={form.image_url}
                  placeholder="https://..."
                  onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                />
                <label className="shrink-0 p-4 bg-gray-50 border border-black/5 rounded-2xl hover:bg-gray-100 cursor-pointer transition-all flex items-center justify-center text-gray-400 hover:text-black shadow-sm">
                  {uploading ? <div className="w-5 h-5 border-2 border-black/10 border-t-purple-brand rounded-full animate-spin"></div> : <Upload size={20} />}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Brand Logos Panel */}
        <div className="bg-white border border-black/5 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-banana-yellow/10 rounded-xl text-black">
                <Sparkles size={18} />
              </div>
              <h2 className="text-xl font-black text-gray-800">Logos Flotantes</h2>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {brandLogos.length}/8 Logos
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {brandLogos.map((logo) => (
              <div key={logo.id} className="relative group aspect-square bg-gray-50 border border-black/5 rounded-2xl p-4 flex items-center justify-center overflow-hidden">
                <img src={logo.url} alt="" className="max-w-full max-h-full object-contain" />
                <button 
                  onClick={() => handleDeleteBrandLogo(logo.id)}
                  className="absolute inset-0 bg-raspberry/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[10px] uppercase tracking-widest"
                >
                  Eliminar
                </button>
              </div>
            ))}
            
            {brandLogos.length < 8 && (
              <label className="aspect-square border-2 border-dashed border-black/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-purple-brand/30 hover:bg-purple-brand/5 cursor-pointer transition-all text-gray-400 hover:text-purple-brand">
                <Upload size={20} />
                <span className="text-[8px] font-black uppercase tracking-widest">Subir PNG</span>
                <input type="file" accept="image/png" onChange={handleBrandLogoUpload} className="hidden" />
              </label>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-black/5">
            <p className="text-[9px] font-medium text-gray-400 leading-relaxed">
              Sugerencia: Usa logos con fondo transparente (PNG) para un efecto premium. Los logos flotarán automáticamente en el home.
            </p>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex flex-col gap-6 sticky top-8">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <Monitor size={14} /> Vista Previa Directa
            </div>
            <span className="px-2 py-0.5 bg-mint-success/5 text-mint-success text-[8px] font-black rounded uppercase border border-mint-success/10">Live</span>
          </div>

          <div className="relative aspect-video rounded-[2.5rem] bg-cream-bg overflow-hidden border border-black/5 shadow-2xl flex flex-col items-center justify-center p-8 text-center text-black">
             {/* Background Gradients (Mini version) */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-banana-yellow/10 blur-[60px] rounded-full"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-brand/5 blur-[60px] rounded-full"></div>
            </div>

            {form.image_url && (
              <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
            )}

            <div className="scale-75 origin-center flex flex-col items-center">
              <h1 className="text-4xl font-black tracking-tight mb-4">
                {form.title?.split(' ')[0] || 'Tu'} 
                <span className="text-purple-brand"> {form.title?.split(' ').slice(1).join(' ') || 'Tecnología'}</span>
              </h1>
              <p className="text-sm text-gray-500 font-medium max-w-sm mb-8 leading-relaxed line-clamp-2">
                {form.subtitle || 'Bienvenido a Banana Computer...'}
              </p>
              <div className="flex gap-4">
                <div className="px-6 py-3 bg-purple-brand text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-brand/20">
                  <Sparkles size={14} className="text-banana-yellow" /> {form.primary_cta || 'Botón AI'}
                </div>
                <div className="px-6 py-3 bg-white border border-black/5 rounded-xl font-black text-xs">
                  {form.secondary_cta || 'Botón Sec.'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-3xl bg-purple-brand/5 border border-purple-brand/10 flex gap-4 items-center">
            <div className="p-3 bg-purple-brand text-white rounded-2xl shadow-lg shadow-purple-brand/10">
              <Sparkles size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-brand/40 italic leading-relaxed">
              Recuerda: El logo y las animaciones de carga se aplican automáticamente según la configuración global de la marca.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
