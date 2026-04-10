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
  const { heroContent, setHeroContent } = useStore();
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
      const { data: uploadData, error } = await supabase.storage.from('hero-images').upload(path, compressedFile, { upsert: true });
      
      if (error) {
        showToast('Error subiendo imagen. ¿Existe el bucket "hero-images"?', 'error');
      } else {
        const { data: { publicUrl } } = supabase.storage.from('hero-images').getPublicUrl(path);
        setForm(f => ({ ...f, image_url: publicUrl }));
        showToast('Imagen subida correctamente', 'success');
      }
    } catch (err) {
      showToast('Error al procesar la imagen', 'error');
    } finally {
      setUploading(false);
    }
  };

  const FIELDS = [
    { key: 'title', label: 'Título Principal', placeholder: 'Ej: Tu Tecnología Garantizada' },
    { key: 'subtitle', label: 'Subtítulo / Descripción', placeholder: 'Ej: Bienvenido a Banana Computer...' },
    { key: 'primary_cta', label: 'Texto Botón IA', placeholder: 'Ej: Explorar Sistemas' },
    { key: 'secondary_cta', label: 'Texto Botón Secundario', placeholder: 'Ej: Ver Catálogo' },
  ];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors w-fit">
          <ArrowLeft size={14} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight">Editor del Hero</h1>
            <p className="text-gray-500 font-medium">Gestiona el Banner principal y los llamados a la acción.</p>
          </div>
          <button 
            className={`
              px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl
              ${saved ? 'bg-mint-success text-white' : 'bg-banana-yellow text-black hover:scale-105 active:scale-95'}
            `}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <Save size={20} />}
            {saved ? 'GUARDADO' : saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
        {/* Form Panel */}
        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-brand/10 rounded-xl text-purple-brand">
              <ImageIcon size={20} />
            </div>
            <h2 className="text-xl font-black">Contenido Visual</h2>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSave}>
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{label}</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-purple-brand/50 focus:bg-white/10 transition-all"
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}

            <div className="flex flex-col gap-2 pt-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Imagen de Fondo (URL o Subida)</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-purple-brand/50 focus:bg-white/10 transition-all"
                  value={form.image_url}
                  placeholder="https://..."
                  onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                />
                <label className="shrink-0 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 cursor-pointer transition-all flex items-center justify-center text-gray-400 hover:text-white">
                  {uploading ? <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin"></div> : <Upload size={20} />}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="flex flex-col gap-6 sticky top-8">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <Monitor size={14} /> Vista Previa Directa
            </div>
            <span className="px-2 py-0.5 bg-mint-success/10 text-mint-success text-[8px] font-black rounded uppercase">Live</span>
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
          
          <div className="p-6 rounded-3xl bg-banana-yellow/10 border border-banana-yellow/20 flex gap-4 items-center">
            <div className="p-3 bg-banana-yellow text-black rounded-2xl">
              <Sparkles size={20} />
            </div>
            <p className="text-xs font-bold text-banana-yellow italic leading-relaxed">
              Recuerda: El logo y las animaciones de carga se aplican automáticamente según la configuración global de la marca.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
