"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User, Phone, MapPin, Package, CreditCard, Calendar, Globe, LogOut, ChevronRight, Plus, Trash2, Home, Briefcase, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '', phone: '', id_type: 1, id_number: '', street_main: '', street_secondary: '',
    house_number: '', province: '', canton: '', city: '', zip_code: '',
  });

  const [activeTab, setActiveTab] = useState('datos');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: '', full_name: '', email: '', phone: '',
    id_type: 1, id_number: '', street_main: '', street_secondary: '',
    house_number: '', province: '', canton: '', city: '',
    zip_code: '', is_default: false,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

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
              id_type: data.id_type || 1,
              id_number: data.id_number || '',
              street_main: data.street_main || data.address_line1 || '',
              street_secondary: data.street_secondary || data.address_line2 || '',
              house_number: data.house_number || '',
              province: data.province || '',
              canton: data.canton || '',
              city: data.city || '',
              zip_code: data.zip_code || '',
            });
          }
        });

      // Fetch orders
      setOrdersLoading(true);
      supabase.from('orders')
        .select(`
          *,
          order_items (
            *,
            products ( name, image_url )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setOrders(data || []);
          setOrdersLoading(false);
        });

      // Fetch addresses
      fetchAddresses();
    }
  }, [user, authLoading, router]);

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    const { data } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    setAddresses(data || []);
    setAddressesLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // 1. Update customers table
    const { error: profileError } = await supabase
      .from('customers')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (profileError) {
      showToast('Error al actualizar el perfil', 'error');
      setSaving(false);
      return;
    }

    // 2. Sync with Address Book (customer_addresses)
    try {
      // Check if user already has a default address
      const { data: existingDefault, error: fetchError } = await supabase
        .from('customer_addresses')
        .select('id')
        .eq('customer_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is just "no rows found" for maybeSingle in some versions
        console.error("Fetch error:", fetchError);
      }

      const addressPayload = {
        customer_id: user.id,
        full_name: form.full_name,
        phone: form.phone,
        street_main: form.street_main,
        street_secondary: form.street_secondary,
        house_number: form.house_number,
        province: form.province,
        canton: form.canton,
        city: form.city,
        zip_code: form.zip_code,
        id_number: form.id_number,
        id_type: form.id_type,
        address_line1: form.street_main, // Compatibility fallback
        label: 'Dirección Principal',
        is_default: true,
        email: user.email
      };

      if (existingDefault) {
        const { error: updateAddrError } = await supabase
          .from('customer_addresses')
          .update(addressPayload)
          .eq('id', existingDefault.id);
        if (updateAddrError) throw updateAddrError;
      } else {
        const { error: insertAddrError } = await supabase
          .from('customer_addresses')
          .insert(addressPayload);
        if (insertAddrError) throw insertAddrError;
      }

      showToast('Perfil y libreta de direcciones actualizados', 'success');
      fetchAddresses(); // Refresh the list in the next tab
    } catch (syncErr) {
      console.error("Sync error details:", syncErr);
      showToast(`Error al sincronizar libreta: ${syncErr.message || 'Error desconocido'}`, 'error');
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
      ...addressForm,
      customer_id: user.id
    };

    let error;
    if (editingAddress) {
      const { error: err } = await supabase.from('customer_addresses').update(payload).eq('id', editingAddress.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('customer_addresses').insert(payload);
      error = err;
    }

    if (error) {
      showToast('Error al guardar la dirección', 'error');
    } else {
      showToast('Dirección guardada con éxito', 'success');
      setShowAddressForm(false);
      setEditingAddress(null);
      fetchAddresses();
    }
    setSaving(false);
  };

  const deleteAddress = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;
    const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
    if (!error) {
      showToast('Dirección eliminada', 'info');
      fetchAddresses();
    }
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label,
      full_name: addr.full_name,
      email: addr.email || '',
      phone: addr.phone,
      id_type: addr.id_type,
      id_number: addr.id_number,
      street_main: addr.street_main || addr.address_line1 || '',
      street_secondary: addr.street_secondary || '',
      house_number: addr.house_number || '',
      province: addr.province || '',
      canton: addr.canton || '',
      city: addr.city || '',
      zip_code: addr.zip_code || '',
      is_default: addr.is_default
    });
    setShowAddressForm(true);
  };

  const openNewAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      label: '', full_name: profile?.full_name || '', email: user?.email || '', phone: profile?.phone || '+593',
      id_type: 1, id_number: '', street_main: '', street_secondary: '',
      house_number: '', province: '', canton: '', city: profile?.city || '',
      zip_code: profile?.zip_code || '', is_default: false,
    });
    setShowAddressForm(true);
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
            className={`px-8 py-3 rounded-[1.5rem] text-xs font-black transition-all ${activeTab === 'direcciones' ? 'bg-white text-purple-brand shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setActiveTab('direcciones')}
          >
            LIBRETA DIRECCIONES
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

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         🆔 Tipo de Identificación
                      </label>
                      <select 
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all appearance-none cursor-pointer"
                        value={form.id_type}
                        onChange={(e) => setForm(f => ({ ...f, id_type: parseInt(e.target.value) }))}
                      >
                        <option value={1}>Cédula</option>
                        <option value={2}>RUC</option>
                        <option value={3}>Pasaporte</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       🆔 Número de Identificación
                    </label>
                    <input
                      className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                      type="text"
                      value={form.id_number}
                      onChange={(e) => setForm(f => ({ ...f, id_number: e.target.value }))}
                      placeholder="Ej. 1712345678"
                    />
                  </div>
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

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Globe size={12} /> Provincia
                      </label>
                      <input
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                        type="text"
                        value={form.province}
                        onChange={(e) => setForm(f => ({ ...f, province: e.target.value }))}
                        placeholder="Ej. Guayas"
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
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Globe size={12} /> Cantón
                      </label>
                      <input
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                        type="text"
                        value={form.canton}
                        onChange={(e) => setForm(f => ({ ...f, canton: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <MapPin size={12} /> Calle Principal
                      </label>
                      <input
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                        type="text"
                        value={form.street_main}
                        onChange={(e) => setForm(f => ({ ...f, street_main: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <MapPin size={12} /> Calle Secundaria
                      </label>
                      <input
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                        type="text"
                        value={form.street_secondary}
                        onChange={(e) => setForm(f => ({ ...f, street_secondary: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 md:col-span-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         🏢 # Casa / Apto
                      </label>
                      <input
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                        type="text"
                        value={form.house_number}
                        onChange={(e) => setForm(f => ({ ...f, house_number: e.target.value }))}
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
          ) : activeTab === 'direcciones' ? (
            <div className="flex flex-col gap-8">
              {/* Address Header */}
              <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-black/5 shadow-xl shadow-black/5">
                <div>
                  <h3 className="font-black text-xl">Mis Direcciones</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Gana tiempo en tu próximo checkout</p>
                </div>
                <button 
                  onClick={openNewAddress}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-brand text-white rounded-2xl font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-brand/20"
                >
                  <Plus size={16} /> AGREGAR NUEVA
                </button>
              </div>

              {/* Address Form Modal/Section */}
              {showAddressForm && (
                <form onSubmit={handleAddressSave} className="bg-white rounded-[2.5rem] p-10 border-2 border-purple-brand/20 shadow-2xl relative animate-in fade-in slide-in-from-top-4 duration-300">
                  <header className="flex justify-between items-center mb-10">
                    <h4 className="text-2xl font-black text-purple-brand">{editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}</h4>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="text-gray-400 hover:text-black">&times; Cancelar</button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Etiqueta (ej: Casa, Oficina)</label>
                      <input
                        required
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                        type="text"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm(f => ({ ...f, label: e.target.value }))}
                        placeholder="Mi Casa"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre Completo de Contacto</label>
                      <input
                        required
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                        type="text"
                        value={addressForm.full_name}
                        onChange={(e) => setAddressForm(f => ({ ...f, full_name: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email (Opcional)</label>
                        <input
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                          type="email"
                          value={addressForm.email}
                          onChange={(e) => setAddressForm(f => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono</label>
                      <input
                        required
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo ID</label>
                      <select 
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-black outline-none appearance-none"
                        value={addressForm.id_type}
                        onChange={(e) => setAddressForm(f => ({ ...f, id_type: parseInt(e.target.value) }))}
                      >
                        <option value={1}>Cédula</option>
                        <option value={2}>RUC</option>
                        <option value={3}>Pasaporte</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Número ID / RUC</label>
                      <input
                        required
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                        type="text"
                        value={addressForm.id_number}
                        onChange={(e) => setAddressForm(f => ({ ...f, id_number: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Provincia</label>
                         <input
                           className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                           type="text"
                           value={addressForm.province}
                           onChange={(e) => setAddressForm(f => ({ ...f, province: e.target.value }))}
                           placeholder="Ej: Guayas"
                         />
                       </div>
                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciudad</label>
                         <input
                           className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                           type="text"
                           value={addressForm.city}
                           onChange={(e) => setAddressForm(f => ({ ...f, city: e.target.value }))}
                           placeholder="Ej: Guayaquil"
                         />
                       </div>
                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cantón</label>
                         <input
                           className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                           type="text"
                           value={addressForm.canton}
                           onChange={(e) => setAddressForm(f => ({ ...f, canton: e.target.value }))}
                         />
                       </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calle Principal</label>
                         <input
                           required
                           className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                           type="text"
                           value={addressForm.street_main}
                           onChange={(e) => setAddressForm(f => ({ ...f, street_main: e.target.value }))}
                         />
                       </div>
                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calle Secundaria</label>
                         <input
                           className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                           type="text"
                           value={addressForm.street_secondary}
                           onChange={(e) => setAddressForm(f => ({ ...f, street_secondary: e.target.value }))}
                         />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest"># Casa/Apto</label>
                         <input
                           className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                           type="text"
                           value={addressForm.house_number}
                           onChange={(e) => setAddressForm(f => ({ ...f, house_number: e.target.value }))}
                         />
                       </div>
                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Código Postal</label>
                         <input
                           className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                           type="text"
                           value={addressForm.zip_code}
                           onChange={(e) => setAddressForm(f => ({ ...f, zip_code: e.target.value }))}
                         />
                       </div>
                    </div>

                    <div className="flex flex-col items-start gap-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferencia</label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-12 h-6 rounded-full p-1 transition-all ${addressForm.is_default ? 'bg-mint-success' : 'bg-gray-200'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${addressForm.is_default ? 'translate-x-6' : ''}`}></div>
                        </div>
                        <input 
                           type="checkbox" 
                           className="hidden" 
                           checked={addressForm.is_default} 
                           onChange={(e) => setAddressForm(f => ({ ...f, is_default: e.target.checked }))}
                        />
                        <span className="text-xs font-black text-gray-500 group-hover:text-black">Dirección Predeterminada</span>
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-5 bg-purple-brand text-white rounded-2xl font-black text-lg hover:shadow-xl transition-all disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : editingAddress ? 'Guardar Cambios' : 'Registrar Dirección'}
                  </button>
                </form>
              )}

              {/* Address List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addressesLoading ? (
                  <div className="col-span-full py-20 text-center opacity-20">Cargando libreta...</div>
                ) : addresses.length === 0 ? (
                  <div className="col-span-full bg-white/50 border-2 border-dashed border-black/5 p-12 rounded-[2rem] text-center">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Tu libreta de direcciones está vacía</p>
                  </div>
                ) : (
                  addresses.map(addr => (
                    <div key={addr.id} className={`bg-white p-8 rounded-[2rem] border transition-all hover:shadow-2xl flex flex-col gap-4 ${addr.is_default ? 'border-purple-brand/30 ring-4 ring-purple-brand/5' : 'border-black/5'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                             {addr.label.toLowerCase().includes('casa') ? <Home size={14} className="text-purple-brand" /> : addr.label.toLowerCase().includes('oficina') ? <Briefcase size={14} className="text-purple-brand" /> : <MapPin size={14} className="text-purple-brand" />}
                             <h4 className="font-black text-base uppercase tracking-tight">{addr.label}</h4>
                          </div>
                          {addr.is_default && <span className="text-[8px] font-black bg-purple-brand text-white px-2 py-1 rounded-full uppercase tracking-widest">Predeterminada</span>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEditAddress(addr)} className="p-3 bg-gray-50 text-gray-400 hover:text-purple-brand hover:bg-purple-brand/5 rounded-xl transition-all">
                            <Plus className="rotate-45 scale-125" size={16} /> 
                          </button>
                          <button onClick={() => deleteAddress(addr.id)} className="p-3 bg-gray-50 text-gray-400 hover:text-raspberry hover:bg-raspberry/5 rounded-xl transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-800">{addr.full_name}</p>
                        <p className="text-xs font-medium text-gray-500">
                          {addr.street_main || addr.address_line1} {addr.house_number}, {addr.city}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mt-2">
                           <FileText size={12} /> {addr.id_number} | <Phone size={12} /> {addr.phone}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                           <h3 className="font-black">Pedido #{order.order_number || order.id.slice(0, 8)}</h3>
                           <span className="text-[10px] font-black opacity-30 tracking-widest uppercase">{new Date(order.created_at).toLocaleDateString()}</span>
                         </div>
                         <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                           order.status === 'paid' ? 'bg-mint-success/10 text-mint-success' :
                           order.status === 'shipped' ? 'bg-purple-brand/10 text-purple-brand' :
                           order.status === 'cancelled' ? 'bg-raspberry/10 text-raspberry' :
                           'bg-banana-yellow/10 text-banana-yellow'
                         }`}>
                            {
                              order.status === 'pending' ? 'Pendiente' :
                              order.status === 'verificando_pago' ? 'Verificando Pago' :
                              order.status === 'paid' ? 'Pagado' :
                              order.status === 'shipped' ? 'Enviado' :
                              order.status === 'cancelled' ? 'Cancelado' :
                              order.status
                            }
                         </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><CreditCard size={12} /> ${order.total.toLocaleString()}</span>
                          <span className="flex items-center gap-1.5"><Package size={12} /> {order.order_items?.length || 0} Items</span>
                        </div>
                        <p className="text-[10px] text-gray-300 font-medium truncate max-w-[300px]">
                          {order.order_items?.map(i => i.products?.name).filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetail(true);
                      }}
                      className="flex items-center gap-2 text-[10px] font-black text-purple-brand tracking-widest uppercase group-hover:translate-x-1 transition-transform"
                    >
                      Detalles <ChevronRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowOrderDetail(false)}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              <header className="p-8 border-b border-black/5 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-black">Detalle del Pedido</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ref: #{selectedOrder.order_number || selectedOrder.id}</p>
                </div>
                <button onClick={() => setShowOrderDetail(false)} className="p-4 hover:bg-black/5 rounded-full transition-all">&times;</button>
              </header>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Status & Total */}
                <div className="flex items-center justify-between bg-purple-brand/5 p-6 rounded-3xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl text-purple-brand shadow-sm">
                      <Package size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-brand/50">Estado</span>
                      <p className="font-black text-purple-brand">
                        {
                          selectedOrder.status === 'pending' ? 'PENDIENTE' :
                          selectedOrder.status === 'verificando_pago' ? 'VERIFICANDO PAGO' :
                          selectedOrder.status === 'paid' ? 'PAGADO' :
                          selectedOrder.status === 'shipped' ? 'ENVIADO' :
                          selectedOrder.status === 'cancelled' ? 'CANCELADO' :
                          selectedOrder.status.toUpperCase()
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-brand/50">Total</span>
                    <p className="text-2xl font-black text-purple-brand">${selectedOrder.total.toLocaleString()}</p>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Productos</h4>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-black/5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-800">{item.products?.name || 'Producto'}</span>
                          <span className="text-[10px] text-gray-400 font-medium">Cant: {item.quantity}</span>
                        </div>
                        <span className="text-xs font-black">${(item.unit_price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Facturación</h4>
                    <div className="text-[11px] font-medium text-gray-600 leading-relaxed">
                      <p className="font-black text-gray-800 mb-1">{selectedOrder.billing_address?.full_name}</p>
                      <p>{selectedOrder.billing_address?.street_main} {selectedOrder.billing_address?.house_number}</p>
                      <p>{selectedOrder.billing_address?.city}, {selectedOrder.billing_address?.province}</p>
                      <p className="text-[9px] font-black text-gray-400 mt-1 uppercase tracking-widest">ID: {selectedOrder.billing_address?.id_number}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Envío</h4>
                    <div className="text-[11px] font-medium text-gray-600 leading-relaxed">
                      <p className="font-black text-gray-800 mb-1">{selectedOrder.shipping_address?.full_name}</p>
                      <p>{selectedOrder.shipping_address?.street_main} {selectedOrder.shipping_address?.house_number}</p>
                      <p>{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.province}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <footer className="p-8 bg-gray-50/50 border-t border-black/5 flex justify-end">
                <button 
                  onClick={() => setShowOrderDetail(false)}
                  className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs hover:scale-105 active:scale-95 transition-all"
                >
                  CERRAR
                </button>
              </footer>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
