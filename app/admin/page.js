"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { updateAIBaselineInDB } from '@/lib/inventory';
import { useToast } from '@/context/ToastContext';
import { Package, Star, Tag, Users, Image, Sparkles, RefreshCw, CheckCircle2, ArrowRight, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState({ products: 0, categories: 0, customers: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [ollamaHost, setOllamaHost] = useState('');
  const [savingHost, setSavingHost] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: p } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: c } = await supabase.from('categories').select('*', { count: 'exact', head: true });
      const { count: cu } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { count: f } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_featured', true);
      
      setStats({
        products: p || 0,
        categories: c || 0,
        customers: cu || 0,
        featured: f || 0,
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

  const handleSaveOllamaHost = async () => {
    setSavingHost(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'ollama_host', value: ollamaHost }, { onConflict: 'key' });
      if (error) throw error;
      showToast('URL de AI actualizada con éxito', 'success');
    } catch (err) {
      console.error('Error saving Ollama host:', err);
      showToast('Error al guardar la URL de AI', 'error');
    } finally {
      setSavingHost(false);
    }
  };

  const STATS = [
    { label: 'Productos', value: stats.products, icon: <Package size={24} className="text-banana-yellow" /> },
    { label: 'Destacados', value: stats.featured, icon: <Star size={24} className="text-purple-brand" /> },
    { label: 'Categorías', value: stats.categories, icon: <Tag size={24} className="text-mint-success" /> },
    { label: 'Clientes', value: stats.customers, icon: <Users size={24} className="text-sunset" /> },
  ];

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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Dashboard General</h1>
        <p className="text-gray-500 text-sm font-medium">Resumen del estado actual de Banana Computer.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map(({ label, value, icon }) => (
          <div key={label} className="bg-white border border-black/10 rounded-3xl p-6 shadow-sm hover:translate-y-[-2px] transition-all group">
            <div className="mb-4 transform group-hover:scale-110 transition-transform duration-500">{icon}</div>
            <div className="text-3xl font-black mb-1 text-gray-900">{loading ? '—' : value}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Links */}
        <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-sm">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-gray-900">
            <LayoutDashboard size={20} className="text-purple-brand" />
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickLink href="/admin/hero" icon={<Image size={18} />} label="Editar Hero" />
            <QuickLink href="/admin/categories" icon={<Tag size={18} />} label="Categorías" />
            <QuickLink href="/admin/products" icon={<Package size={18} />} label="Productos" />
            <QuickLink href="/admin/promotions" icon={<Sparkles size={18} />} label="Banners Promo" />
            <QuickLink href="/admin/waitlist" icon={<Users size={18} />} label="Lista de Espera" />
          </div>
        </div>

        {/* AI Control */}
        <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-sm border-l-4 border-l-banana-yellow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-banana-yellow/5 blur-3xl -z-0"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-banana-yellow/10 rounded-xl text-banana-yellow border border-banana-yellow/20">
                <Sparkles size={24} />
              </div>
              <h2 className="text-lg font-black text-gray-900">Inteligencia Artificial</h2>
            </div>
            
            <p className="text-xs text-gray-600 font-medium mb-8 leading-relaxed">
              Sincroniza el catálogo actual con el cerebro de la IA para que pueda hacer recomendaciones precisas.
            </p>

            <div className="flex flex-col gap-4 mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Ollama Host URL</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-slate-50 border border-black/10 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-purple-brand/30 transition-all font-bold text-gray-900 shadow-inner"
                  value={ollamaHost}
                  onChange={e => setOllamaHost(e.target.value)}
                  placeholder="http://localhost:11434"
                />
                <button 
                  onClick={handleSaveOllamaHost}
                  disabled={savingHost}
                  className="px-6 py-3 bg-purple-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-brand/20"
                >
                  {savingHost ? '...' : 'Fijar'}
                </button>
              </div>
            </div>

            <button 
              onClick={handleSyncAI} 
              className={`
                w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl
                ${syncDone ? 'bg-mint-success text-white shadow-mint-success/20' : 'bg-banana-yellow text-black hover:scale-102 active:scale-95 shadow-banana-yellow/20'}
                ${syncing ? 'opacity-80' : ''}
              `}
              disabled={syncing}
            >
              {syncing ? <RefreshCw size={16} className="animate-spin" /> : syncDone ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
              {syncing ? 'Sincronizando Cerebro...' : syncDone ? 'Sincronización Exitosa' : 'Actualizar Conocimiento IA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label }) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-black/10 hover:border-purple-brand/20 hover:bg-white hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        <div className="text-gray-500 group-hover:text-purple-brand transition-colors">{icon}</div>
        <span className="text-sm font-black tracking-tight text-gray-900">{label}</span>
      </div>
      <ArrowRight size={16} className="text-gray-400 group-hover:text-purple-brand group-hover:translate-x-1 transition-all" />
    </Link>
  );
}
