"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Search, Plus, Trash2, Save, User, 
  ShoppingCart, Building2, MapPin, Hash, Phone, Mail
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { getOrderBreakdown } from '@/lib/pricing';
import Link from 'next/link';

export default function NewQuotePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // --- CUSTOMER STATE ---
  const [customerSearch, setCustomerSearch] = useState('');
  const [foundCustomers, setFoundCustomers] = useState([]);
  const [customerData, setCustomerData] = useState({
    full_name: '', email: '', phone: '', id_number: '', id_type: 1, company: '',
    address: { street_main: '', street_secondary: '', house_number: '', city: '', province: '', canton: '', zip_code: '' }
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedProspectId, setSelectedProspectId] = useState(null);

  // --- PRODUCT STATE ---
  const [productSearch, setProductSearch] = useState('');
  const [foundProducts, setFoundProducts] = useState([]);
  const [quoteItems, setQuoteItems] = useState([]);
  const [paymentMode, setPaymentMode] = useState('transfer'); // 'transfer' | 'card'

  // --- SEARCH LOGIC ---
  useEffect(() => {
    if (customerSearch.length > 2) {
      const search = async () => {
        // Buscamos en ambas tablas en paralelo
        const [resReg, resPros] = await Promise.all([
          supabase.from('customers').select('*').or(`full_name.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%,id_number.ilike.%${customerSearch}%`).limit(5),
          supabase.from('quotation_customers').select('*').or(`full_name.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%,id_number.ilike.%${customerSearch}%`).limit(5)
        ]);

        const merged = [
          ...(resReg.data || []).map(c => ({ ...c, isRegistered: true })),
          ...(resPros.data || []).map(c => ({ ...c, isRegistered: false }))
        ];
        setFoundCustomers(merged);
      };
      search();
    } else {
      setFoundCustomers([]);
    }
  }, [customerSearch]);

  // --- PRODUCT SEARCH LOGIC ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (productSearch.length > 1) {
        // Buscamos directamente en la tabla para asegurar funcionamiento sin RPC
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${productSearch}%,sku.ilike.%${productSearch}%,model_number.ilike.%${productSearch}%`)
          .eq('is_active', true)
          .limit(10);
        
        if (!error) setFoundProducts(data || []);
      } else {
        setFoundProducts([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [productSearch]);

  // --- ACTIONS ---
  const selectCustomer = (c) => {
    setSelectedCustomerId(c.isRegistered ? c.id : null);
    setSelectedProspectId(c.isRegistered ? null : c.id);
    
    setCustomerData({
      full_name: c.full_name || '',
      email: c.email || '',
      phone: c.phone || '',
      id_number: c.id_number || '',
      id_type: c.id_type || 1,
      company: c.company || '',
      address: c.isRegistered 
        ? {
            street_main: c.street_main || '',
            street_secondary: c.street_secondary || '',
            house_number: c.house_number || '',
            city: c.city || '',
            province: c.province || '',
            canton: c.canton || '',
            zip_code: c.zip_code || ''
          }
        : (c.address_data || { street_main: '', street_secondary: '', house_number: '', city: '', province: '', canton: '', zip_code: '' })
    });
    setCustomerSearch('');
    setFoundCustomers([]);
  };

  const addProduct = (p) => {
    const exists = quoteItems.find(item => item.id === p.id);
    if (exists) {
      setQuoteItems(quoteItems.map(item => 
        item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setQuoteItems([...quoteItems, { 
        id: p.id, 
        name: p.name, 
        price: p.price, 
        transfer_price: p.transfer_price,
        image_url: p.image_url,
        quantity: 1 
      }]);
    }
    setProductSearch('');
    setFoundProducts([]);
  };

  const removeProduct = (id) => {
    setQuoteItems(quoteItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setQuoteItems(quoteItems.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  // --- CALCULATIONS ---
  const totals = getOrderBreakdown(quoteItems, paymentMode);

  const handleSave = async () => {
    if (quoteItems.length === 0) return showToast('Agrega al menos un producto', 'error');
    if (!customerData.full_name) return showToast('Ingresa el nombre del cliente', 'error');

    setLoading(true);
    const slug = `BC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      let finalProspectId = selectedProspectId;

      // Si no hay un cliente seleccionado, creamos o actualizamos un prospecto
      if (!selectedCustomerId && !selectedProspectId) {
        const { data: newProspect, error: pError } = await supabase
          .from('quotation_customers')
          .insert({
            full_name: customerData.full_name,
            email: customerData.email,
            phone: customerData.phone,
            id_number: customerData.id_number,
            id_type: customerData.id_type,
            company: customerData.company,
            address_data: customerData.address
          })
          .select()
          .single();
        
        if (pError) throw pError;
        finalProspectId = newProspect.id;
      }

      const { error } = await supabase.from('quotes').insert({
        slug,
        customer_id: selectedCustomerId,
        prospect_id: finalProspectId,
        customer_data: customerData,
        items: quoteItems,
        totals: {
          subtotal: totals.baseTotalSinIva,
          tax: totals.iva,
          discount: totals.discountConIva,
          total: totals.cartTotalConIva,
          paymentMode: paymentMode // Guardamos el modo
        },
        status: 'sent',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (error) throw error;
      showToast('Cotización creada con éxito', 'success');
      router.push('/admin/quotes');
    } catch (err) {
      console.error(err);
      showToast('Error al guardar la cotización', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-5xl mx-auto">
      <header className="flex flex-col gap-4">
        <Link href="/admin/quotes" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
          <ArrowLeft size={12} /> Volver a Cotizaciones
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Nueva Cotización</h1>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-4 bg-purple-brand text-white rounded-2xl font-black text-sm shadow-xl shadow-purple-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'GUARDANDO...' : <><Save size={18} /> GUARDAR COTIZACIÓN</>}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* --- COLUMNA IZQUIERDA: CLIENTE --- */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-sm">
            <h2 className="text-lg font-black flex items-center gap-2 mb-6 uppercase tracking-tight">
              <User size={20} className="text-purple-brand" /> Datos del Cliente
            </h2>

            {/* Buscador de clientes */}
            <div className="relative mb-8">
              <div className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-black/5 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 ring-purple-brand/5 transition-all"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {foundCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-2xl shadow-xl z-20 overflow-hidden">
                  {foundCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full p-4 text-left hover:bg-gray-50 border-b border-black/5 last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{c.full_name}</p>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${c.isRegistered ? 'bg-purple-brand/10 text-purple-brand' : 'bg-orange-500/10 text-orange-500'}`}>
                            {c.isRegistered ? 'REGISTRADO' : 'PROSPECTO'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">{c.email}</p>
                      </div>
                      <Plus size={14} className="text-purple-brand" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Formulario Manual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Nombre Completo</label>
                <input
                  className="bg-gray-50/50 border border-black/5 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white transition-all"
                  value={customerData.full_name}
                  onChange={(e) => setCustomerData({...customerData, full_name: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Email</label>
                <input
                  className="bg-gray-50/50 border border-black/5 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white transition-all"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Teléfono</label>
                <input
                  className="bg-gray-50/50 border border-black/5 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white transition-all"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Identificación</label>
                <div className="flex gap-2">
                  <select
                    className="bg-gray-50/50 border border-black/5 rounded-xl px-2 py-3 text-xs font-black outline-none"
                    value={customerData.id_type}
                    onChange={(e) => setCustomerData({...customerData, id_type: parseInt(e.target.value)})}
                  >
                    <option value={1}>CÉD</option>
                    <option value={2}>RUC</option>
                    <option value={3}>PAS</option>
                  </select>
                  <input
                    className="flex-1 bg-gray-50/50 border border-black/5 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white transition-all"
                    value={customerData.id_number}
                    onChange={(e) => setCustomerData({...customerData, id_number: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Empresa (Opcional)</label>
                <input
                  className="bg-gray-50/50 border border-black/5 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white transition-all"
                  value={customerData.company}
                  onChange={(e) => setCustomerData({...customerData, company: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-black/5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <MapPin size={12} /> Dirección de Referencia
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black uppercase text-gray-300 ml-1">Provincia</label>
                  <input 
                    placeholder="Provincia" 
                    className="bg-gray-50 border border-black/5 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-purple-brand/30 outline-none transition-all"
                    value={customerData.address.province}
                    onChange={(e) => setCustomerData({...customerData, address: {...customerData.address, province: e.target.value}})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black uppercase text-gray-300 ml-1">Cantón</label>
                  <input 
                    placeholder="Cantón" 
                    className="bg-gray-50 border border-black/5 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-purple-brand/30 outline-none transition-all"
                    value={customerData.address.canton}
                    onChange={(e) => setCustomerData({...customerData, address: {...customerData.address, canton: e.target.value}})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black uppercase text-gray-300 ml-1">Ciudad</label>
                  <input 
                    placeholder="Ciudad" 
                    className="bg-gray-50 border border-black/5 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-purple-brand/30 outline-none transition-all"
                    value={customerData.address.city}
                    onChange={(e) => setCustomerData({...customerData, address: {...customerData.address, city: e.target.value}})}
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[8px] font-black uppercase text-gray-300 ml-1">Calle Principal</label>
                  <input 
                    placeholder="Calle Principal" 
                    className="bg-gray-50 border border-black/5 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-purple-brand/30 outline-none transition-all"
                    value={customerData.address.street_main}
                    onChange={(e) => setCustomerData({...customerData, address: {...customerData.address, street_main: e.target.value}})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black uppercase text-gray-300 ml-1">Num. Casa / Dpto</label>
                  <input 
                    placeholder="N° Casa" 
                    className="bg-gray-50 border border-black/5 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-purple-brand/30 outline-none transition-all"
                    value={customerData.address.house_number}
                    onChange={(e) => setCustomerData({...customerData, address: {...customerData.address, house_number: e.target.value}})}
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[8px] font-black uppercase text-gray-300 ml-1">Calle Secundaria / Transversal</label>
                  <input 
                    placeholder="Calle Secundaria" 
                    className="bg-gray-50 border border-black/5 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-purple-brand/30 outline-none transition-all"
                    value={customerData.address.street_secondary}
                    onChange={(e) => setCustomerData({...customerData, address: {...customerData.address, street_secondary: e.target.value}})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black uppercase text-gray-300 ml-1">Código Postal</label>
                  <input 
                    placeholder="ZIP Code" 
                    className="bg-gray-50 border border-black/5 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-purple-brand/30 outline-none transition-all"
                    value={customerData.address.zip_code}
                    onChange={(e) => setCustomerData({...customerData, address: {...customerData.address, zip_code: e.target.value}})}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Buscador de Productos */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-sm">
            <h2 className="text-lg font-black flex items-center gap-2 mb-6 uppercase tracking-tight">
              <ShoppingCart size={20} className="text-purple-brand" /> Agregar Productos
            </h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o modelo..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-black/5 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 ring-purple-brand/5 transition-all"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              {foundProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-2xl shadow-xl z-20 overflow-hidden">
                  {foundProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="w-full p-4 text-left hover:bg-gray-50 border-b border-black/5 last:border-0 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{p.name}</p>
                        <p className="text-[10px] text-gray-400">${p.price}</p>
                      </div>
                      <Plus size={14} className="text-purple-brand" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* --- COLUMNA DERECHA: ITEMS Y TOTALES --- */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-sm sticky top-8">
            <h2 className="text-lg font-black flex items-center gap-2 mb-6 uppercase tracking-tight">
              <Hash size={20} className="text-purple-brand" /> Resumen y Pago
            </h2>

            {/* Selector de Modo de Pago */}
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-black/5 mb-8">
              <button
                onClick={() => setPaymentMode('transfer')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMode === 'transfer' ? 'bg-white text-purple-brand shadow-sm border border-black/5' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Transferencia (-6%)
              </button>
              <button
                onClick={() => setPaymentMode('card')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMode === 'card' ? 'bg-white text-purple-brand shadow-sm border border-black/5' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Tarjeta (PVP)
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {quoteItems.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-black/5 rounded-3xl text-gray-300 text-sm italic">
                  Agrega productos para cotizar
                </div>
              ) : (
                quoteItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-black/5 group">
                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-black/5">
                      {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black line-clamp-1">{item.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">${item.price} c/u</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-black/5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-purple-brand transition-colors"><MinusIcon size={12} /></button>
                      <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-purple-brand transition-colors"><PlusIcon size={12} /></button>
                    </div>
                    <button 
                      onClick={() => removeProduct(item.id)}
                      className="p-2 text-gray-300 hover:text-raspberry transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 pt-6 border-t border-black/5">
              <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <span>Subtotal (PVP)</span>
                <span>${totals.baseTotalConIva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black text-purple-brand uppercase tracking-widest">
                <span>Descuento Transferencia</span>
                <span>-${totals.discountConIva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <span>IVA (15%)</span>
                <span>${totals.iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-4 border-t border-black/10">
                <span className="text-sm font-black text-black uppercase tracking-tighter">Total a Pagar</span>
                <span className="text-3xl font-black text-purple-brand">${totals.cartTotalConIva.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-purple-brand/5 rounded-2xl border border-purple-brand/10">
              <p className="text-[9px] font-black text-purple-brand uppercase tracking-[0.15em] leading-relaxed">
                * Esta cotización aplicará automáticamente el descuento por transferencia al momento de finalizar el pago.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const MinusIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const PlusIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
