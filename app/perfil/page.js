"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User, Phone, MapPin, Package, CreditCard, Calendar, Globe, LogOut, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', zip_code: '',
  });

  const [activeTab, setActiveTab] = useState('datos');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Fetch profile
      supabase.from('customers').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setProfile(data);
            setForm({
              full_name: data.full_name || '',
              phone: data.phone || '+593',
              address_line1: data.address_line1 || '',
              address_line2: data.address_line2 || '',
              city: data.city || '',
              zip_code: data.zip_code || '',
            });
          }
        });

      // Fetch orders
      setOrdersLoading(true);
      supabase.from('orders').select('*, order_items(*)').eq('customer_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => {
          setOrders(data || []);
          setOrdersLoading(false);
        });
    }
  }, [user, authLoading, router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('customers').update({ ...form, updated_at: new Date().toISOString() }).eq('id', user.id);
    setSaving(false);
    showToast('Perfil actualizado con éxito', 'success');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-brand/10 border-t-purple-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 pt-32 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-purple-brand">Mi Cuenta</h1>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-black/5 self-start">
              <span className="w-2 h-2 rounded-full bg-mint-success"></span>
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={handleSignOut} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-raspberry hover:opacity-70 transition-opacity"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </header>

        {/* Tabs */}
        <div className="inline-flex p-1.5 bg-gray-100 rounded-[2rem] border border-black/5 mb-12">
          <button 
            className={`px-8 py-3 rounded-[1.5rem] text-xs font-black transition-all ${activeTab === 'datos' ? 'bg-white text-purple-brand shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('datos')}
          >
            MIS DATOS
          </button>
          <button 
            className={`px-8 py-3 rounded-[1.5rem] text-xs font-black transition-all ${activeTab === 'pedidos' ? 'bg-white text-purple-brand shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('pedidos')}
          >
            MIS PEDIDOS
          </button>
        </div>

        <section className="min-h-[500px]">
          {activeTab === 'datos' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <form onSubmit={handleSave} className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-black/5 shadow-2xl shadow-black/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <User size={12} /> Nombre Completo
                    </label>
                    <input
                      className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Phone size={12} /> Teléfono (Ecuador)
                    </label>
                    <input
                      className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+593 9 0000 0000"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Globe size={12} /> Ciudad
                    </label>
                    <input
                      className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Ej. Guayaquil"
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <MapPin size={12} /> Dirección Principal
                    </label>
                    <input
                      className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                      type="text"
                      value={form.address_line1}
                      onChange={(e) => setForm(f => ({ ...f, address_line1: e.target.value }))}
                      placeholder="Calle, número, conjunto"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       🏢 Depto / Referencia
                    </label>
                    <input
                      className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                      type="text"
                      value={form.address_line2}
                      onChange={(e) => setForm(f => ({ ...f, address_line2: e.target.value }))}
                      placeholder="Ej. Apto 402, junto a..."
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       📮 Código Postal
                    </label>
                    <input
                      className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                      type="text"
                      value={form.zip_code}
                      onChange={(e) => setForm(f => ({ ...f, zip_code: e.target.value }))}
                      placeholder="000000"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-5 bg-purple-brand text-white rounded-2xl font-black text-lg hover:scale-102 active:scale-95 transition-all shadow-xl shadow-purple-brand/20 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Actualizar Perfil'}
                </button>
              </form>

              <aside className="flex flex-col gap-6">
                <div className="bg-white/50 backdrop-blur-sm border border-black/5 p-8 rounded-[2rem] border-l-4 border-l-mint-success">
                  <h4 className="text-[10px] font-black text-mint-success uppercase tracking-widest mb-4">Privacidad</h4>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed">Tus datos están protegidos y solo se utilizan para gestionar tus pedidos y envíos oficiales.</p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm border border-black/5 p-8 rounded-[2rem] border-l-4 border-l-banana-yellow">
                  <h4 className="text-[10px] font-black text-banana-yellow uppercase tracking-widest mb-4">Soporte</h4>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed">¿Necesitas ayuda? Contáctanos vía soporte oficial para asistencia inmediata.</p>
                </div>
              </aside>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {ordersLoading ? (
                <div className="flex flex-col items-center py-20 gap-4 opacity-20">
                  <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Recuperando Historial...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center border border-black/5 shadow-2xl shadow-black/5">
                  <span className="text-6xl mb-6 block">🍌</span>
                  <h3 className="text-2xl font-black mb-2">Aún no hay pedidos</h3>
                  <p className="text-gray-400 font-medium mb-10">Explora nuestra vitrina y encuentra tu próximo equipo de alto rendimiento.</p>
                  <Link href="/" className="inline-flex bg-purple-brand text-white px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all">
                    Ver Catálogo
                  </Link>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="group bg-white p-8 rounded-[2rem] border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-purple-brand/20 transition-all hover:shadow-xl">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-purple-brand group-hover:bg-purple-brand/5 transition-all">
                           <Package size={24} />
                         </div>
                         <div>
                           <h3 className="font-black">Pedido #{order.id.slice(0, 8)}</h3>
                           <span className="text-[10px] font-black opacity-30 tracking-widest uppercase">{new Date(order.created_at).toLocaleDateString()}</span>
                         </div>
                         <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${order.status === 'pending' ? 'bg-banana-yellow/10 text-banana-yellow' : 'bg-mint-success/10 text-mint-success'}`}>
                            {order.status === 'pending' ? 'Pendiente' : order.status}
                         </span>
                      </div>
                      <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><CreditCard size={12} /> ${order.total.toLocaleString()}</span>
                        <span className="flex items-center gap-1.5"><Package size={12} /> {order.order_items?.length || 0} Items</span>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black text-purple-brand tracking-widest uppercase group-hover:translate-x-1 transition-transform">
                      Detalles <ChevronRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
