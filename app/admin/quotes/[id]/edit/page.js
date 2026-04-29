"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { 
  Search, Plus, Trash2, Save, ArrowLeft, 
  User, Mail, Phone, CreditCard, ShoppingBag, 
  FileText, LayoutGrid, ShieldCheck, Gift
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { getOrderBreakdown } from '@/lib/pricing';

export default function EditQuotePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quote State
  const [quoteType, setQuoteType] = useState('standard');
  const [paymentMode, setPaymentMode] = useState('transfer');
  const [quoteItems, setQuoteItems] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [foundCustomers, setFoundCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isNewProspect, setIsNewProspect] = useState(false);
  const [prospectId, setProspectId] = useState(null);

  // Form State for Customer Data
  const [customerData, setCustomerData] = useState({
    full_name: '',
    email: '',
    phone: '',
    id_number: '',
    address: {
      street_main: '',
      street_secondary: '',
      house_number: '',
      city: 'Quito',
      province: 'Pichincha'
    }
  });

  // Product Search State
  const [productSearch, setProductSearch] = useState('');
  const [foundProducts, setFoundProducts] = useState([]);

  // Load existing quote
  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true);
      const { data: quote, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !quote) {
        showToast('No se pudo encontrar la cotización', 'error');
        router.push('/admin/quotes');
        return;
      }

      setQuoteType(quote.quote_type || 'standard');
      setPaymentMode(quote.totals?.paymentMode || 'transfer');
      setQuoteItems(quote.items || []);
      setCustomerData(quote.customer_data || {});
      setSelectedCustomerId(quote.customer_id);
      setProspectId(quote.prospect_id);
      setIsNewProspect(!!quote.prospect_id);
      setLoading(false);
    };

    fetchQuote();
  }, [id]);

  // Search Customers
  useEffect(() => {
    if (customerSearch.length < 3) {
      setFoundCustomers([]);
      return;
    }

    const search = async () => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .or(`full_name.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%,id_number.ilike.%${customerSearch}%`)
        .limit(5);
      setFoundCustomers(data || []);
    };
    search();
  }, [customerSearch]);

  // Search Products
  useEffect(() => {
    if (productSearch.length < 2) {
      setFoundProducts([]);
      return;
    }

    const search = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${productSearch}%,sku.ilike.%${productSearch}%`)
        .eq('is_active', true)
        .limit(8);
      setFoundProducts(data || []);
    };
    search();
  }, [productSearch]);

  const selectCustomer = (c) => {
    setSelectedCustomerId(c.id);
    setIsNewProspect(false);
    setCustomerData({
      full_name: c.full_name,
      email: c.email,
      phone: c.phone,
      id_number: c.id_number || '',
      address: c.address_data || customerData.address
    });
    setCustomerSearch('');
    setFoundCustomers([]);
  };

  const addProduct = async (p) => {
    const exists = quoteItems.find(item => item.id === p.id);
    if (exists) {
      setQuoteItems(quoteItems.map(item => 
        item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      let pills = [];
      try {
        const { data: attrs } = await supabase
          .from('product_attributes')
          .select('value, attribute_definitions(name, icon)')
          .eq('product_id', p.id);
        
        if (attrs) {
          pills = attrs
            .filter(a => a.attribute_definitions && ['RAM', 'SSD', 'Procesador', 'Disco Duro', 'Tarjeta de Video', 'Pantalla'].includes(a.attribute_definitions.name))
            .map(a => ({
              label: a.attribute_definitions.name,
              value: a.value,
              icon: a.attribute_definitions.icon
            }));
        }
      } catch (err) { console.warn(err); }

      // Fetch slugs for linking
      const { data: pData } = await supabase
        .from('products')
        .select('slug, categories(slug), subcategories(slug)')
        .eq('id', p.id)
        .single();

      setQuoteItems([...quoteItems, { 
        id: p.id, 
        name: p.name, 
        slug: pData?.slug || p.slug,
        category_slug: pData?.categories?.slug || 'c',
        subcategory_slug: pData?.subcategories?.slug || 's',
        price: p.price, 
        transfer_price: p.transfer_price,
        image_url: p.image_url,
        quantity: 1,
        warranty: p.warranty || '1 Año',
        gifts: p.gifts || '',
        pills: pills
      }]);
    }
    setProductSearch('');
    setFoundProducts([]);
  };

  const updateItemField = (id, field, value) => {
    setQuoteItems(quoteItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeProduct = (id) => {
    setQuoteItems(quoteItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setQuoteItems(quoteItems.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const totals = getOrderBreakdown(quoteItems, paymentMode);

  const handleUpdate = async () => {
    if (!customerData.full_name) {
      showToast('Por favor ingresa el nombre del cliente', 'error');
      return;
    }
    if (quoteItems.length === 0) {
      showToast('Por favor añade al menos un producto', 'error');
      return;
    }

    setSaving(true);
    try {
      let finalProspectId = prospectId;

      // Si es un prospecto nuevo o modificado, actualizarlo
      if (isNewProspect) {
        if (prospectId) {
          await supabase.from('quotation_customers').update({
            full_name: customerData.full_name,
            email: customerData.email,
            phone: customerData.phone,
            id_number: customerData.id_number,
            address_data: customerData.address
          }).eq('id', prospectId);
        } else {
          const { data: newProspect } = await supabase.from('quotation_customers').insert({
            full_name: customerData.full_name,
            email: customerData.email,
            phone: customerData.phone,
            id_number: customerData.id_number,
            address_data: customerData.address
          }).select().single();
          finalProspectId = newProspect.id;
        }
      }

      const { error } = await supabase.from('quotes').update({
        customer_id: selectedCustomerId,
        prospect_id: finalProspectId,
        customer_data: customerData,
        items: quoteItems,
        quote_type: quoteType,
        totals: {
          subtotal: totals.baseTotalSinIva,
          tax: totals.iva,
          discount: totals.discountConIva,
          total: totals.cartTotalConIva,
          paymentMode: paymentMode
        },
        updated_at: new Date().toISOString()
      }).eq('id', id);

      if (error) throw error;

      showToast('Cotización actualizada con éxito', 'success');
      router.push(`/admin/quotes/${id}/view`);
    } catch (error) {
      console.error(error);
      showToast('Error al actualizar la cotización', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">CARGANDO COTIZACIÓN...</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">EDITAR COTIZACIÓN</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Modificando proforma registrada</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="bg-white p-1 rounded-2xl border border-black/5 flex shadow-sm">
                <button 
                  onClick={() => setQuoteType('standard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${quoteType === 'standard' ? 'bg-purple-brand text-white' : 'text-gray-400 hover:text-black'}`}
                >
                  <FileText size={14} /> Estándar
                </button>
                <button 
                  onClick={() => setQuoteType('options')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${quoteType === 'options' ? 'bg-purple-brand text-white' : 'text-gray-400 hover:text-black'}`}
                >
                  <LayoutGrid size={14} /> Opciones
                </button>
             </div>

             <button
              onClick={handleUpdate}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              {saving ? 'Guardando...' : 'Actualizar Cambios'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer & Products */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Customer Section */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <User size={16} className="text-purple-brand" /> Datos del Cliente
                </h2>
                {!selectedCustomerId && !isNewProspect && (
                   <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search size={14} className="text-gray-400" />
                      </div>
                      <input 
                        type="text"
                        placeholder="Buscar cliente..."
                        className="bg-slate-50 border border-black/5 rounded-xl pl-10 pr-4 py-2 text-xs font-bold focus:outline-none focus:border-purple-brand/30 w-64"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                      {foundCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-2xl shadow-2xl z-50 overflow-hidden">
                          {foundCustomers.map(c => (
                            <button 
                              key={c.id}
                              onClick={() => selectCustomer(c)}
                              className="w-full p-4 text-left hover:bg-slate-50 transition-all border-b border-black/5 last:border-0"
                            >
                              <p className="text-xs font-black text-gray-900">{c.full_name}</p>
                              <p className="text-[10px] font-bold text-gray-400">{c.email} • {c.id_number}</p>
                            </button>
                          ))}
                        </div>
                      )}
                   </div>
                )}
                {(selectedCustomerId || isNewProspect) && (
                  <button 
                    onClick={() => {
                      setSelectedCustomerId(null);
                      setIsNewProspect(false);
                      setProspectId(null);
                      setCustomerData({
                        full_name: '', email: '', phone: '', id_number: '',
                        address: { street_main: '', street_secondary: '', house_number: '', city: 'Quito', province: 'Pichincha' }
                      });
                    }}
                    className="text-[10px] font-black text-raspberry uppercase tracking-widest hover:underline"
                  >
                    Cambiar Cliente
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Nombre Completo</label>
                    <input 
                      className="w-full bg-slate-50 border border-black/5 rounded-xl px-4 py-3 text-xs font-black focus:outline-none focus:border-purple-brand/30"
                      value={customerData.full_name}
                      onChange={(e) => {
                        setCustomerData({...customerData, full_name: e.target.value});
                        if (!selectedCustomerId) setIsNewProspect(true);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
                      <input 
                        className="w-full bg-slate-50 border border-black/5 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-purple-brand/30"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Teléfono</label>
                      <input 
                        className="w-full bg-slate-50 border border-black/5 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-purple-brand/30"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Cédula / RUC</label>
                    <input 
                      className="w-full bg-slate-50 border border-black/5 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-purple-brand/30"
                      value={customerData.id_number}
                      onChange={(e) => setCustomerData({...customerData, id_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Dirección de Entrega</label>
                    <input 
                      className="w-full bg-slate-50 border border-black/5 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-purple-brand/30"
                      value={customerData.address?.street_main}
                      placeholder="Calle Principal y Secundaria"
                      onChange={(e) => setCustomerData({
                        ...customerData, 
                        address: { ...customerData.address, street_main: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Products Selection */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-banana-yellow" /> Ítems de la Proforma
                </h2>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Buscar producto por nombre o SKU..."
                    className="bg-slate-50 border border-black/5 rounded-2xl pl-12 pr-6 py-3 text-xs font-black focus:outline-none focus:border-purple-brand/30 w-96 shadow-inner"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  {foundProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-black/5 rounded-[2rem] shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto p-2">
                      {foundProducts.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => addProduct(p)}
                          className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-all rounded-2xl text-left group"
                        >
                          <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden border border-black/5 flex-shrink-0">
                            {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-contain p-1" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-black text-gray-900 group-hover:text-purple-brand transition-colors">{p.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.sku} • Stock: {p.stock}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black text-purple-brand">${p.transfer_price || p.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {quoteItems.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-black/5 rounded-[2rem]">
                   <p className="text-xs font-bold text-gray-300 uppercase tracking-widest italic">No has añadido productos aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quoteItems.map((item, idx) => (
                    <div key={item.id} className="group relative bg-white border border-black/5 rounded-[2rem] p-6 hover:shadow-xl hover:scale-[1.01] transition-all">
                      <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border border-black/5 p-2 flex-shrink-0">
                          {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-contain" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                               <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.name}</h3>
                               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Opción {idx + 1}</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="flex items-center bg-slate-50 border border-black/5 rounded-xl p-1">
                                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-white rounded-lg transition-all"><Trash2 size={12} className="text-gray-400" /></button>
                                  <span className="px-3 text-xs font-black">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-white rounded-lg transition-all text-purple-brand"><Plus size={12} /></button>
                               </div>
                               <button onClick={() => removeProduct(item.id)} className="p-2.5 text-gray-300 hover:text-raspberry transition-all">
                                 <Trash2 size={18} />
                               </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1 block ml-1">Garantía Personalizada</label>
                                <div className="relative">
                                   <ShieldCheck size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-mint-success" />
                                   <input 
                                     className="w-full bg-slate-50 border border-black/5 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold focus:outline-none focus:border-purple-brand/30"
                                     value={item.warranty || ''}
                                     placeholder="Ej: 2 Años"
                                     onChange={(e) => updateItemField(item.id, 'warranty', e.target.value)}
                                   />
                                </div>
                             </div>
                             <div>
                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1 block ml-1">Obsequios / Plus</label>
                                <div className="relative">
                                   <Gift size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-brand" />
                                   <input 
                                     className="w-full bg-slate-50 border border-black/5 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold focus:outline-none focus:border-purple-brand/30"
                                     value={item.gifts || ''}
                                     placeholder="Ej: Mouse + Mochila"
                                     onChange={(e) => updateItemField(item.id, 'gifts', e.target.value)}
                                   />
                                </div>
                             </div>
                          </div>

                          {/* Pills Técnicas */}
                          {item.pills && item.pills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                               {item.pills.map((pill, pidx) => (
                                 <span key={pidx} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-black/5 rounded-lg text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                    <span>{pill.icon}</span> {pill.value}
                                 </span>
                               ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-xl sticky top-8">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8 flex items-center gap-2">
                <FileText size={16} className="text-purple-brand" /> Resumen de Totales
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/5">
                   <div className="flex items-center gap-3">
                      <CreditCard size={18} className="text-purple-brand" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Modo de Pago</span>
                   </div>
                   <select 
                    className="bg-white border border-black/10 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest focus:outline-none"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                   >
                     <option value="transfer">Transferencia (-6%)</option>
                     <option value="pvp">Tarjeta (PVP)</option>
                   </select>
                </div>

                <div className="space-y-3 pt-4 border-t border-black/5">
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Subtotal s/ IVA</span>
                    <span>${totals.baseTotalSinIva.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>IVA (15%)</span>
                    <span>${totals.iva.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {totals.discountConIva > 0 && (
                    <div className="flex justify-between text-[11px] font-black text-mint-success uppercase tracking-widest">
                      <span>Ahorro Transferencia</span>
                      <span>-${totals.discountConIva.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  <div className="pt-6 border-t-2 border-black/5 mt-4 flex flex-col gap-1">
                    <div className="flex justify-between items-end">
                       <span className="text-xs font-black uppercase tracking-tighter text-gray-900">Total Proforma</span>
                       <span className="text-4xl font-black text-gray-900 tracking-tighter">
                         ${totals.cartTotalConIva.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </span>
                    </div>
                    <p className="text-[8px] font-bold text-gray-400 text-right uppercase tracking-widest">Incluye IVA del 15%</p>
                  </div>
                </div>

                <div className="pt-8">
                  <p className="text-[9px] font-bold text-gray-400 leading-relaxed text-center italic">
                    "Esta cotización tiene una validez de 7 días. Los precios incluyen impuestos de ley y entrega en la ciudad de Quito."
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
