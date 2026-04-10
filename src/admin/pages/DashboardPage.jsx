import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { updateAIBaselineInDB } from '../../lib/inventory';
import { useToast } from '../../context/ToastContext';
import { Package, Star, Tag, Users, Image, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

const DashboardPage = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState({ products: 0, categories: 0, customers: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [ollamaHost, setOllamaHost] = useState('');
  const [savingHost, setSavingHost] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const [p, c, cu, f] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_featured', true),
      ]);
      setStats({
        products: p.count || 0,
        categories: c.count || 0,
        customers: cu.count || 0,
        featured: f.count || 0,
      });
      setLoading(false);
    };
    const fetchOllamaHost = async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'ollama_host').single();
      if (data) setOllamaHost(data.value);
    };
    fetchStats();
    fetchOllamaHost();
  }, []);

  const STATS = [
    { label: 'Productos', value: stats.products, icon: <Package size={24} color="var(--banana)" /> },
    { label: 'Destacados', value: stats.featured, icon: <Star size={24} color="#FFD700" /> },
    { label: 'Categorías', value: stats.categories, icon: <Tag size={24} color="var(--mint)" /> },
    { label: 'Clientes', value: stats.customers, icon: <Users size={24} color="var(--sunset)" /> },
  ];

  const handleSaveOllamaHost = async () => {
    setSavingHost(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: ollamaHost })
        .eq('key', 'ollama_host');
      if (error) throw error;
      showToast('URL de AI actualizada para todos los usuarios', 'success');
    } catch (err) {
      console.error('Error saving Ollama host:', err);
      showToast('Error al guardar la URL de AI', 'error');
    } finally {
      setSavingHost(false);
    }
  };

  const handleSyncAI = async () => {
    setSyncing(true);
    setSyncDone(false);
    try {
      await updateAIBaselineInDB();
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
      showToast('Conocimiento IA actualizado con éxito', 'success');
    } catch (err) {
      console.error('Error syncing AI:', err);
      showToast('Error en la sincronización de IA', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
      </div>

      <div className="admin-stat-grid">
        {STATS.map(({ label, value, icon }) => (
          <div key={label} className="admin-stat-card">
            <div style={{ marginBottom: '0.5rem' }}>{icon}</div>
            <div className="admin-stat-value">{loading ? '—' : value}</div>
            <div className="admin-stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '1.5rem', border: '1px solid #272727', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Accesos rápidos</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="/admin/hero" className="admin-btn admin-btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Image size={16} /> Editar Hero
            </a>
            <a href="/admin/categories" className="admin-btn admin-btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={16} /> Categorías
            </a>
            <a href="/admin/products" className="admin-btn admin-btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={16} /> Productos
            </a>
            <a href="/admin/waitlist" className="admin-btn admin-btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} /> Lista de Espera
            </a>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #272727', paddingTop: '1.5rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Inteligencia Artificial (Ollama)</h2>
          <button 
            onClick={handleSyncAI} 
            className={`admin-btn ${syncDone ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            disabled={syncing}
          >
            {syncing ? <RefreshCw size={16} className="spin" /> : syncDone ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
            {syncing ? 'Sincronizando catálogo...' : syncDone ? 'Conocimiento IA actualizado' : 'Sincronizar conocimiento IA'}
          </button>
          <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Envía un resumen de precios y productos actuales a la IA para mejorar sus recomendaciones.
          </p>
        </div>

        <div style={{ borderTop: '1px solid #272727', paddingTop: '1.5rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Configuración de Servidor AI</h2>
          <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '500px' }}>
            <input 
              type="text" 
              value={ollamaHost} 
              onChange={e => setOllamaHost(e.target.value)}
              placeholder="http://localhost:11434"
              style={{ 
                flex: 1, 
                background: '#0a0a0a', 
                border: '1px solid #333', 
                borderRadius: '8px', 
                padding: '0.5rem 1rem', 
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />
            <button 
              onClick={handleSaveOllamaHost} 
              className="admin-btn admin-btn-primary"
              disabled={savingHost}
            >
              {savingHost ? 'Guardando...' : 'Guardar URL Global'}
            </button>
          </div>
          <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Esta URL será utilizada por <strong>todos los asistentes</strong> de la página. 
            Usa una URL de Ngrok o tu servidor permanente.
          </p>

          <details style={{ marginTop: '1.5rem', background: '#222', padding: '1rem', borderRadius: '8px' }}>
            <summary style={{ color: '#aaa', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
              🔧 Opciones de Desarrollador (Solo este navegador)
            </summary>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ color: '#888', fontSize: '0.75rem' }}>
                Si quieres probar un enlace de Ngrok sin afectar a otros usuarios, puedes sobreescribirlo aquí localmente.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  defaultValue={localStorage.getItem('OLLAMA_HOST_OVERRIDE') || ''} 
                  id="local-ollama-override"
                  placeholder="https://su-ngrok.ngrok-free.app"
                  style={{ 
                    flex: 1, 
                    background: '#111', 
                    border: '1px solid #444', 
                    borderRadius: '6px', 
                    padding: '0.4rem 0.8rem', 
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
                <button 
                  onClick={() => {
                    const val = document.getElementById('local-ollama-override').value;
                    if (val) localStorage.setItem('OLLAMA_HOST_OVERRIDE', val);
                    else localStorage.removeItem('OLLAMA_HOST_OVERRIDE');
                    window.location.reload();
                  }}
                  className="admin-btn admin-btn-ghost"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  Aplicar Localmente
                </button>
              </div>
              <p style={{ color: 'var(--banana)', fontSize: '0.7rem' }}>
                * Al aplicar se recargará la página para tomar el nuevo host.
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
