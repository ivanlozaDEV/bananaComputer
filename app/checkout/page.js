"use client";
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ShieldCheck, ArrowLeft, Truck, FileText, CreditCard, 
  MapPin, Phone, User, Mail, ChevronRight, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const { cartItems, cartTotal, cartSubtotal, cartTax, cartCount } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Params from PayPhone Redirect
  const payphoneId = searchParams.get('id');
  const clientTxId = searchParams.get('clientTransactionId');

  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [billingInfo, setBillingInfo] = useState({
    full_name: '', email: '', phone: '', address: '', city: '', id_number: '', id_type: 1
  });
  const [shippingInfo, setShippingInfo] = useState({
    full_name: '', phone: '', address: '', city: '', id_number: '', id_type: 1
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Address Management State
  const [selectedBillingId, setSelectedBillingId] = useState(null);
  const [selectedShippingId, setSelectedShippingId] = useState(null);
  const [billingModified, setBillingModified] = useState(false);
  const [shippingModified, setShippingModified] = useState(false);
  const [saveAsNewBilling, setSaveAsNewBilling] = useState(false);
  const [saveAsNewShipping, setSaveAsNewShipping] = useState(false);

  // Load user data if present
  useEffect(() => {
    if (user) {
      const fetchProfileAndAddresses = async () => {
        const { data: profile } = await supabase.from('customers').select('*').eq('id', user.id).single();
        if (profile) {
          setBillingInfo(prev => ({
            ...prev,
            full_name: profile.full_name || '',
            phone: profile.phone || '+593',
            email: user.email,
            address: profile.address_line1 || '',
            city: profile.city || '',
          }));
        }

        const { data: addrs } = await supabase.from('customer_addresses').select('*').eq('customer_id', user.id);
        setSavedAddresses(addrs || []);
        
        const defaultAddr = addrs?.find(a => a.is_default);
        if (defaultAddr) {
          selectBillingAddress(defaultAddr);
        }
      };
      fetchProfileAndAddresses();
    }
  }, [user]);

  // Handle PayPhone Confirmation on redirect
  useEffect(() => {
    if (payphoneId && clientTxId && !isProcessingPayment) {
      confirmPayment(payphoneId, clientTxId);
    }
  }, [payphoneId, clientTxId]);

  const selectBillingAddress = (addr) => {
    setSelectedBillingId(addr.id);
    setBillingModified(false);
    const data = {
      full_name: addr.full_name,
      email: addr.email || user?.email || '',
      phone: addr.phone,
      address: addr.address_line1,
      city: addr.city,
      id_number: addr.id_number,
      id_type: addr.id_type
    };
    setBillingInfo(data);
    if (sameAsBilling) setShippingInfo(data);
  };

  const selectShippingAddress = (addr) => {
    setSelectedShippingId(addr.id);
    setShippingModified(false);
    setShippingInfo({
      full_name: addr.full_name,
      phone: addr.phone,
      address: addr.address_line1,
      city: addr.city,
      id_number: addr.id_number,
      id_type: addr.id_type
    });
  };

  const updateBilling = (update) => {
    setBillingInfo(prev => ({ ...prev, ...update }));
    if (selectedBillingId) setBillingModified(true);
  };

  const updateShipping = (update) => {
    setShippingInfo(prev => ({ ...prev, ...update }));
    if (selectedShippingId) setShippingModified(true);
  };

  const handleUpsertAddress = async (type) => {
    if (!user) return;
    setLoading(true);
    const info = type === 'billing' ? billingInfo : shippingInfo;
    const id = type === 'billing' ? selectedBillingId : selectedShippingId;
    const asNew = type === 'billing' ? saveAsNewBilling : saveAsNewShipping;

    try {
      const addressData = {
        customer_id: user.id,
        label: asNew ? `Dirección ${savedAddresses.length + 1}` : savedAddresses.find(a => a.id === id)?.label || 'Dirección',
        full_name: info.full_name,
        phone: info.phone,
        address_line1: info.address,
        city: info.city,
        id_number: info.id_number,
        id_type: info.id_type,
        email: user.email
      };

      if (asNew || !id) {
        const { data, error } = await supabase.from('customer_addresses').insert(addressData).select().single();
        if (error) throw error;
        setSavedAddresses(prev => [...prev, data]);
        showToast('Dirección guardada con éxito', 'success');
        if (type === 'billing') {
          setSelectedBillingId(data.id);
          setSaveAsNewBilling(false);
        } else {
          setSelectedShippingId(data.id);
          setSaveAsNewShipping(false);
        }
      } else {
        const { error } = await supabase.from('customer_addresses').update(addressData).eq('id', id);
        if (error) throw error;
        setSavedAddresses(prev => prev.map(a => a.id === id ? { ...a, ...addressData } : a));
        showToast('Dirección actualizada con éxito', 'success');
        if (type === 'billing') setBillingModified(false);
        else setShippingModified(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al guardar la dirección', 'error');
    }
    setLoading(false);
  };

  const initPayPhone = () => {
    setStep(2);
  };

  // Render PayPhone button when entering Step 2
  useEffect(() => {
    if (step === 2 && window.PPaymentButtonBox) {
      // Small timeout to ensure DOM is fully painted
      const timer = setTimeout(() => {
        const amountCents = Math.round(cartTotal * 100);
        const taxCents   = Math.round(cartTax * 100);
        const subCents   = amountCents - taxCents;

        const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || 'MISSING_TOKEN';
        const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || 'MISSING_STORE_ID';

        const ppb = new window.PPaymentButtonBox({
          token: token,
          storeId: storeId,
          clientTransactionId: `BANANA-${Date.now()}`,
          amount: amountCents,
          amountWithTax: subCents,
          tax: taxCents,
          currency: "USD",
          reference: `Compra Banana Computer - ${cartCount} items`,
          phoneNumber: billingInfo.phone.replace(/\s/g, ''),
          email: billingInfo.email,
          documentId: billingInfo.id_number,
          identificationType: billingInfo.id_type,
        });

        ppb.render('pp-button');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, cartTotal, cartTax, cartCount, billingInfo]);

  const confirmPayment = async (id, txId) => {
    setIsProcessingPayment(true);
    setLoading(true);
    
    try {
      const res = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, clientTxId: txId })
      });

      const data = await res.json();

      if (data.transactionStatus === 'Approved' || data.statusCode === 3) {
        // Create Order in Supabase
        const orderData = {
          customer_id: user?.id || null,
          total: cartTotal,
          status: 'paid',
          shipping_address: sameAsBilling ? billingInfo : shippingInfo,
          billing_address: billingInfo,
          client_transaction_id: txId
        };

        const { data: order, error } = await supabase.from('orders').insert(orderData).select().single();
        
        if (!error) {
          // Add items
          const items = cartItems.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: 1,
            unit_price: item.price
          }));
          await supabase.from('order_items').insert(items);
          
          showToast('¡Pago exitoso! Gracias por tu compra.', 'success');
          setStep(3);
          // Here we should clear cart, but let's assume CartContext handles persistence
        }
      } else {
        showToast('El pago no pudo ser procesado.', 'error');
        setStep(1);
      }
    } catch (err) {
      console.error(err);
      showToast('Error confirmando el pago.', 'error');
    }
    setLoading(false);
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-xl mx-auto px-4 pt-40 pb-20 text-center">
          <div className="inline-flex p-4 bg-mint-success/10 text-mint-success rounded-full mb-8 animate-bounce">
            <CheckCircle2 size={64} />
          </div>
          <h1 className="text-4xl font-black text-purple-brand mb-4">¡Orden Confirmada!</h1>
          <p className="text-gray-500 font-medium mb-12 leading-relaxed">
            Hemos recibido tu pago y estamos preparando tu envío. Recibirás un correo con el detalle de tu factura y seguimiento.
          </p>
          <div className="flex flex-col gap-4">
            <Link href="/perfil" className="w-full py-4 bg-purple-brand text-white rounded-2xl font-black shadow-xl shadow-purple-brand/20">VER MIS PEDIDOS</Link>
            <Link href="/" className="w-full py-4 text-purple-brand font-black hover:bg-purple-brand/5 rounded-2xl transition-all">VOLVER A LA TIENDA</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <Header />
      <Script 
        src="https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js" 
        type="module"
        onLoad={() => console.log('PayPhone SDK loaded')}
      />
      <link rel="stylesheet" href="https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.css" />

      <main className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Form Area */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            <header className="flex flex-col gap-2">
               <Link href="/" className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-purple-brand transition-colors mb-4">
                 <ArrowLeft size={14} /> Volver
               </Link>
               <h1 className="text-5xl font-black text-purple-brand">Finalizar Compra</h1>
               <div className="flex items-center gap-2 text-mint-success">
                 <ShieldCheck size={18} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Checkout Seguro con PayPhone</span>
               </div>
            </header>

            {step === 1 ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Billing Section */}
                <section className="bg-white rounded-[2.5rem] p-10 border border-black/5 shadow-2xl shadow-black/5">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black flex items-center gap-3">
                      <FileText className="text-purple-brand" size={24} /> Datos de Facturación
                    </h2>
                  </div>

                  {user && savedAddresses.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                       {savedAddresses.map(addr => (
                         <button 
                           key={addr.id}
                           onClick={() => selectBillingAddress(addr)}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${billingInfo.address === addr.address_line1 ? 'bg-purple-brand text-white border-purple-brand shadow-lg' : 'bg-gray-50 border-black/5 text-gray-400 hover:border-purple-brand/30'}`}
                         >
                           {addr.label}
                         </button>
                       ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                      <input 
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                        value={billingInfo.full_name}
                        onChange={(e) => setBillingInfo(p => ({...p, full_name: e.target.value}))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                        <input 
                          type="email"
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                          value={billingInfo.email}
                          onChange={(e) => setBillingInfo(p => ({...p, email: e.target.value}))}
                        />
                      </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono</label>
                        <input 
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                          value={billingInfo.phone}
                          onChange={(e) => updateBilling({ phone: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identificación</label>
                        <div className="flex flex-col md:flex-row gap-4">
                          <select 
                             className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-black outline-none appearance-none min-w-[140px]"
                             value={billingInfo.id_type}
                             onChange={(e) => updateBilling({ id_type: parseInt(e.target.value) })}
                          >
                            <option value={1}>Cédula</option>
                            <option value={2}>RUC</option>
                            <option value={3}>Pasaporte</option>
                          </select>
                          <input 
                            className="flex-1 bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                            value={billingInfo.id_number}
                            onChange={(e) => updateBilling({ id_number: e.target.value })}
                            placeholder="Número de Identificación"
                          />
                        </div>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dirección de Facturación</label>
                        <input 
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                          value={billingInfo.address}
                          onChange={(e) => updateBilling({ address: e.target.value })}
                        />
                    </div>
                  </div>

                  {user && (
                    <div className="mt-8 pt-8 border-t border-black/5 flex items-center justify-between">
                      {selectedBillingId && billingModified ? (
                        <button 
                          onClick={() => handleUpsertAddress('billing')}
                          className="text-[10px] font-black uppercase tracking-widest text-purple-brand hover:underline"
                        >
                          Actualizar dirección en mi perfil
                        </button>
                      ) : !selectedBillingId ? (
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={saveAsNewBilling}
                            onChange={(e) => setSaveAsNewBilling(e.target.checked)}
                            className="w-4 h-4 rounded-lg border-black/10 text-purple-brand focus:ring-purple-brand"
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-purple-brand transition-colors">Guardar en mi libreta de direcciones</span>
                        </label>
                      ) : <span className="text-[10px] font-black uppercase tracking-widest text-mint-success">Dirección seleccionada correctamente</span>}
                      
                      {!selectedBillingId && billingInfo.address && (
                         <button 
                           onClick={() => handleUpsertAddress('billing')}
                           className="px-4 py-2 bg-purple-brand/5 text-purple-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-brand hover:text-white transition-all"
                         >
                           Guardar Ahora
                         </button>
                      )}
                    </div>
                  )}
                </section>

                {/* Shipping Section */}
                <section className="bg-white rounded-[2.5rem] p-10 border border-black/5 shadow-2xl shadow-black/5">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black flex items-center gap-3">
                      <Truck className="text-purple-brand" size={24} /> Datos de Envío
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         checked={sameAsBilling} 
                         onChange={(e) => {
                            setSameAsBilling(e.target.checked);
                            if (e.target.checked) setShippingInfo(billingInfo);
                         }}
                         className="w-4 h-4 rounded-lg border-black/10 text-purple-brand focus:ring-purple-brand" 
                       />
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-purple-brand transition-colors">Igual que Facturación</span>
                    </label>
                  </div>

                  {!sameAsBilling && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {user && savedAddresses.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                          {savedAddresses.map(addr => (
                            <button 
                              key={addr.id}
                              onClick={() => selectShippingAddress(addr)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${shippingInfo.address === addr.address_line1 ? 'bg-purple-brand text-white border-purple-brand shadow-lg' : 'bg-gray-50 border-black/5 text-gray-400 hover:border-purple-brand/30'}`}
                            >
                              {addr.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                          <input 
                            className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                            value={shippingInfo.full_name}
                            onChange={(e) => updateShipping({ full_name: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono de Entrega</label>
                          <input 
                            className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                            value={shippingInfo.phone}
                            onChange={(e) => updateShipping({ phone: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dirección Exacta (con referencias)</label>
                          <input 
                            className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                            value={shippingInfo.address}
                            onChange={(e) => updateShipping({ address: e.target.value })}
                            placeholder="Calle, #, Apto, junto a..."
                          />
                        </div>
                      </div>

                      {user && (
                        <div className="mt-8 pt-8 border-t border-black/5 flex items-center justify-between">
                          {selectedShippingId && shippingModified ? (
                            <button 
                              onClick={() => handleUpsertAddress('shipping')}
                              className="text-[10px] font-black uppercase tracking-widest text-purple-brand hover:underline"
                            >
                              Actualizar dirección de envío en mi perfil
                            </button>
                          ) : !selectedShippingId ? (
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={saveAsNewShipping}
                                onChange={(e) => setSaveAsNewShipping(e.target.checked)}
                                className="w-4 h-4 rounded-lg border-black/10 text-purple-brand focus:ring-purple-brand"
                              />
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-purple-brand transition-colors">Guardar en mi libreta de direcciones</span>
                            </label>
                          ) : <span className="text-[10px] font-black uppercase tracking-widest text-mint-success">Dirección de envío seleccionada correctamente</span>}
                          
                          {!selectedShippingId && shippingInfo.address && (
                             <button 
                               onClick={() => handleUpsertAddress('shipping')}
                               className="px-4 py-2 bg-purple-brand/5 text-purple-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-brand hover:text-white transition-all"
                             >
                               Guardar Ahora
                             </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <button 
                  onClick={initPayPhone}
                  className="w-full py-6 bg-banana-yellow text-black rounded-[2rem] font-black text-xl hover:scale-102 hover:shadow-2xl transition-all flex items-center justify-center gap-4 group"
                >
                  PROCEDER AL PAGO <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-12 border border-black/5 shadow-2xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
                <div className="p-6 bg-purple-brand/5 text-purple-brand rounded-full mb-8">
                   <CreditCard size={48} />
                </div>
                <h2 className="text-2xl font-black mb-4">Confirmar Transacción</h2>
                <p className="text-gray-500 font-medium mb-10 max-w-sm">
                  Haz clic en el botón de abajo para abrir la pasarela de PayPhone y completar tu pago de forma segura.
                </p>
                <div id="pp-button" className="w-full max-w-xs transition-all hover:scale-105"></div>
                <button 
                  onClick={() => setStep(1)} 
                  className="mt-8 text-xs font-black text-gray-400 hover:text-purple-brand uppercase tracking-widest"
                >
                  &larr; Cambiar Datos
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-5">
             <div className="sticky top-32 space-y-6">
                <div className="bg-purple-brand text-white rounded-[2.5rem] p-10 shadow-3xl overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                   
                   <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                      <CreditCard size={20} /> Resumen de Orden
                   </h3>

                   <div className="flex flex-col gap-4 mb-8 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {cartItems.map(item => (
                        <div key={item.cartId} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0 text-sm">
                           <span className="font-bold opacity-80 flex-1 truncate mr-4">{item.name}</span>
                           <span className="font-black whitespace-nowrap">${parseFloat(item.price).toLocaleString()}</span>
                        </div>
                      ))}
                   </div>

                   <div className="space-y-3 pt-6 border-t border-white/20">
                      <div className="flex justify-between text-xs font-bold opacity-60 uppercase tracking-widest">
                        <span>Subtotal (Base 0%)</span>
                        <span>${cartSubtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold opacity-60 uppercase tracking-widest">
                        <span>IVA (15%)</span>
                        <span>${cartTax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-3xl font-black pt-4">
                        <span>TOTAL</span>
                        <span>${cartTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-black/5 divide-y divide-black/5">
                   <div className="py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-mint-success/10 text-mint-success flex items-center justify-center">
                         <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Entrega Garantizada</p>
                        <p className="text-xs font-bold">24-48 horas laborables</p>
                      </div>
                   </div>
                   <div className="py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-brand/10 text-purple-brand flex items-center justify-center">
                         <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Envíos a Nivel Nacional</p>
                        <p className="text-xs font-bold">Servientrega / Laarcourier</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </main>

      <Footer />
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6">
           <div className="w-12 h-12 border-4 border-purple-brand/10 border-t-purple-brand rounded-full animate-spin"></div>
           <p className="text-sm font-black text-purple-brand animate-pulse uppercase tracking-[0.2em]">Validando Transacción...</p>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-brand/10 border-t-purple-brand rounded-full animate-spin"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
