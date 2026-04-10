import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../lib/supabase';
import { Save, Upload } from 'lucide-react';

const HeroEditorPage = () => {
  const { heroContent, setHeroContent } = useStore();
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
    e.preventDefault();
    setSaving(true);
    await setHeroContent(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `hero-${Date.now()}.${ext}`;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1800, // Hero images can be wider
      useWebWorker: true
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const { data: uploadData, error } = await supabase.storage.from('hero-images').upload(path, compressedFile, { upsert: true });
      
      if (error) {
        console.error('Error subiendo imagen de hero:', error);
        alert('Error al subir la imagen. Asegúrate de que el bucket "hero-images" existe.');
      } else {
        const { data: { publicUrl } } = supabase.storage.from('hero-images').getPublicUrl(path);
        setForm(f => ({ ...f, image_url: publicUrl }));
      }
    } catch (compressionError) {
      console.error('Error comprimiendo imagen de hero:', compressionError);
      alert('Error al procesar la imagen.');
    }
    setUploading(false);
  };

  const FIELDS = [
    { key: 'title', label: 'Título principal' },
    { key: 'subtitle', label: 'Subtítulo' },
    { key: 'primary_cta', label: 'Botón primario' },
    { key: 'secondary_cta', label: 'Botón secundario' },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Editor del Hero</h1>
        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Form */}
        <form className="admin-form" onSubmit={handleSave}>
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="admin-form-group">
              <label>{label}</label>
              <input
                className="admin-input"
                value={form[key]}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}

          <div className="admin-form-group">
            <label>Imagen del Hero (opcional)</label>
            <input
              className="admin-input"
              value={form.image_url}
              onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
              placeholder="URL de imagen o sube un archivo"
            />
            <label className="admin-btn admin-btn-ghost" style={{ cursor: 'pointer', marginTop: '0.5rem' }}>
              <Upload size={16} />
              {uploading ? 'Subiendo...' : 'Subir imagen'}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </form>

        {/* Preview */}
        <div>
          <p style={{ color: '#555', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Vista previa</p>
          <div style={{ background: '#f5f5f3', borderRadius: '16px', padding: '2rem', textAlign: 'center', color: '#1a1a1a' }}>
            {form.image_url && (
              <img src={form.image_url} alt="Hero preview" style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', objectFit: 'cover', maxHeight: '160px' }} />
            )}
            <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-1px' }}>{form.title}</div>
            <div style={{ color: '#888', fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>{form.subtitle}</div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <span style={{ background: '#1a1a1a', color: '#fff', padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>{form.primary_cta}</span>
              <span style={{ border: '1.5px solid #1a1a1a', padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>{form.secondary_cta}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroEditorPage;
