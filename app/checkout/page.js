"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ShieldCheck, ArrowLeft, Truck, FileText, CreditCard,
  MapPin, Phone, User, Mail, ChevronRight, CheckCircle2, Check,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getWhatsAppUrl } from '@/lib/whatsapp';

function CheckoutContent() {
  const {
    cartItems, cartTotal, cartSubtotal, cartTax, cartCount, clearCart,
    paymentMethod, setPaymentMethod, getFinalPrice, baseTotal, discountAmount
  } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  // Note: PayPhone redirect params are now handled by /checkout/resultado

  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const [billingInfo, setBillingInfo] = useState({
    full_name: '', email: '', phone: '', street_main: '', street_secondary: '', house_number: '', city: '', province: '', canton: '', zip_code: '', id_number: '', id_type: 1
  });
  const [shippingInfo, setShippingInfo] = useState({
    full_name: '', phone: '', street_main: '', street_secondary: '', house_number: '', city: '', province: '', canton: '', zip_code: '', id_number: '', id_type: 1
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Address Management State
  const [selectedBillingId, setSelectedBillingId] = useState(null);
  const [selectedShippingId, setSelectedShippingId] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [billingModified, setBillingModified] = useState(false);
  const [shippingModified, setShippingModified] = useState(false);
  const [saveAsNewBilling, setSaveAsNewBilling] = useState(false);
  const [saveAsNewShipping, setSaveAsNewShipping] = useState(false);

  // Load user data if present
  useEffect(() => {
    if (user) {
      const fetchProfileAndAddresses = async () => {
        // Parallel fetch for speed
        const [profileRes, addrsRes] = await Promise.all([
          supabase.from('customers').select('*').eq('id', user.id).single(),
          supabase.from('customer_addresses').select('*').eq('customer_id', user.id).order('is_default', { ascending: false })
        ]);

        const profile = profileRes.data;
        const addrs = addrsRes.data || [];

        setSavedAddresses(addrs);

        // ── AUTO-FILL LOGIC ──
        // 1. Try to find the default address first
        const defaultAddr = addrs.find(a => a.is_default) || addrs[0];

        if (defaultAddr) {
          // If we have a saved address, use it as priority
          selectBillingAddress(defaultAddr);
        } else if (profile) {
          // Fallback to basic profile info if no address book entries exist
          const data = {
            full_name: profile.full_name || '',
            email: user.email,
            phone: profile.phone || '593',
            address: profile.address_line1 || '',
            city: profile.city || '',
            id_number: '', id_type: 1
          };
          setBillingInfo(data);
          if (sameAsBilling) setShippingInfo(data);
        }
      };
      fetchProfileAndAddresses();
    }
  }, [user]);

  // PayPhone redirect confirmation is handled by /checkout/resultado page

  const selectBillingAddress = (addr) => {
    setSelectedBillingId(addr.id);
    setBillingModified(false);
    const data = {
      full_name: addr.full_name,
      email: addr.email || user?.email || '',
      phone: addr.phone,
      street_main: addr.street_main || addr.address_line1 || '',
      street_secondary: addr.street_secondary || '',
      house_number: addr.house_number || '',
      city: addr.city || '',
      province: addr.province || '',
      canton: addr.canton || '',
      zip_code: addr.zip_code || '',
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
      street_main: addr.street_main || addr.address_line1 || '',
      street_secondary: addr.street_secondary || '',
      house_number: addr.house_number || '',
      city: addr.city || '',
      province: addr.province || '',
      canton: addr.canton || '',
      zip_code: addr.zip_code || '',
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
        street_main: info.street_main,
        street_secondary: info.street_secondary,
        house_number: info.house_number,
        city: info.city,
        province: info.province,
        canton: info.canton,
        zip_code: info.zip_code,
        id_number: info.id_number,
        id_type: info.id_type,
        address_line1: info.street_main, // Fallback for compatibility
        city: info.city, // Re-ensure city is passed in case of old schema
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

  const handleConfirmTransfer = async () => {
    setLoading(true);
    // 1. Sync profile/address
    if (user) {
      try {
        await supabase.from('customers').update({
          full_name: billingInfo.full_name,
          phone: billingInfo.phone,
          street_main: billingInfo.street_main,
          city: billingInfo.city,
          updated_at: new Date().toISOString()
        }).eq('id', user.id);
      } catch (e) { }
    }

    // 2. Create Order in DB immediately
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id || null,
          total: cartTotal,
          base_total: baseTotal,
          final_total: cartTotal,
          discount_amount: discountAmount,
          status: 'pending_verification',
          payment_method: 'transfer',
          billing_address: billingInfo,
          shipping_address: sameAsBilling ? billingInfo : shippingInfo,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create Order Items
      const items = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity || 1,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      // 4. Trigger Email Alerts
      const emailPayload = {
        order: { ...order, billing_address: billingInfo, order_items: items },
        customerEmail: billingInfo.email || user?.email,
      };

      // Admin Alert
      fetch('/api/email/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new_order_admin', ...emailPayload })
      }).catch(err => console.error("Admin Email Alert failed:", err));

      // Customer Initial Confirmation
      fetch('/api/email/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'status_update', ...emailPayload, newStatus: 'verificando_pago' })
      }).catch(err => console.error("Customer Email notification failed:", err));

      // 5. Generate WhatsApp Message & URL
      const whatsappUrl = getWhatsAppUrl(
        { ...order, full_name: billingInfo.full_name },
        cartItems,
        { subtotal: cartSubtotal, tax: cartTax, total: cartTotal },
        'transfer'
      );

      // 5. Persist minimal info for resultado page (to show summary)
      sessionStorage.setItem('banana_last_order', JSON.stringify({
        order_number: order.order_number,
        whatsappUrl: whatsappUrl
      }));

      // 6. Final cleanup and redirect
      // Important: We clear cart only AFTER successful DB creation
      // clearCart(); // We can clear it here or in resultado. Redirection to WhatsApp will happen next.

      // We'll redirect to a URL that resultado can handle AND also trigger the WA window
      window.location.href = `/checkout/resultado?method=transfer&orderId=${order.id}`;
    } catch (err) {
      console.error('Error creating transfer order:', err);
      showToast('Error al crear el pedido. Por favor intenta de nuevo.', 'error');
      setLoading(false);
    }
  };

  const initPayPhone = async () => {
    // ── SYNC BACK TO PROFILE AND ADDRESS BOOK ──
    // If the user is logged in, we automatically save these details
    // so they are ready for their next purchase or profile visit.
    if (user) {
      try {
        // 1. Update main profile (customers)
        await supabase.from('customers').update({
          full_name: billingInfo.full_name,
          phone: billingInfo.phone,
          street_main: billingInfo.street_main,
          street_secondary: billingInfo.street_secondary,
          house_number: billingInfo.house_number,
          province: billingInfo.province,
          canton: billingInfo.canton,
          city: billingInfo.city,
          zip_code: billingInfo.zip_code,
          updated_at: new Date().toISOString()
        }).eq('id', user.id);

        // 2. Ensure an address book entry exists if none selected
        if (!selectedBillingId) {
          await supabase.from('customer_addresses').insert({
            customer_id: user.id,
            full_name: billingInfo.full_name,
            phone: billingInfo.phone,
            street_main: billingInfo.street_main,
            street_secondary: billingInfo.street_secondary,
            house_number: billingInfo.house_number,
            province: billingInfo.province,
            canton: billingInfo.canton,
            city: billingInfo.city,
            zip_code: billingInfo.zip_code,
            id_number: billingInfo.id_number,
            id_type: billingInfo.id_type,
            email: user.email,
            label: 'Dirección de Compra',
            is_default: savedAddresses.length === 0 // Make default if it's the first one
          });
        }
      } catch (e) {
        console.error("Sync error:", e);
      }
    }

    // ── Persist checkout data BEFORE PayPhone redirects away from our app ──
    try {
      sessionStorage.setItem('banana_pending_cart', JSON.stringify({
        items: cartItems,
        total: cartTotal,
      }));
      sessionStorage.setItem('banana_pending_checkout', JSON.stringify({
        billing: billingInfo,
        shipping: sameAsBilling ? billingInfo : shippingInfo,
        sameAsBilling,
        userId: user?.id || null, // Safe for guest users
        paymentMethod: 'payphone',
        baseTotal: baseTotal,
        discountAmount: 0
      }));
    } catch (_) { }
    setStep(2);
  };

  // Render PayPhone button when entering Step 2
  useEffect(() => {
    if (step === 2 && window.PPaymentButtonBox && paymentMethod === 'payphone') {
      // Small timeout to ensure DOM is fully painted
      const timer = setTimeout(() => {
        const amountCents = Math.round(cartTotal * 100);
        const taxCents = Math.round(cartTax * 100);
        const subCents = amountCents - taxCents;

        // v1.1 Documentation logic: 
        // 1. If tax exists, subtotal goes to amountWithTax.
        // 2. Otherwise, subtotal goes to amountWithoutTax.
        const amountWithTax = taxCents > 0 ? subCents : 0;
        const amountWithoutTax = taxCents > 0 ? 0 : subCents;

        const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || 'MISSING_TOKEN';
        const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || 'MISSING_STORE_ID';

        // Phone formatting: PayPhone SDK v1.1 documentation says +593984111222
        let cleanPhone = billingInfo.phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('593')) cleanPhone = cleanPhone.slice(3);
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);

        // Final format: +593 + 9 digits
        const formattedPhone = `+593${cleanPhone.padStart(9, '9').slice(-9)}`;

        const clientTxId = `BANANA-${Date.now()}`;

        const ppb = new window.PPaymentButtonBox({
          token: token,
          storeId: storeId,
          clientTransactionId: clientTxId,
          amount: amountCents,
          amountWithTax: amountWithTax,
          amountWithoutTax: amountWithoutTax,
          tax: taxCents,
          service: 0,
          tip: 0,
          currency: "USD",
          reference: `Compra Banana Computer - ${cartCount} items`,
          phoneNumber: formattedPhone,
          email: billingInfo.email,
          documentId: billingInfo.id_number,
          identificationType: parseInt(billingInfo.id_type),
          lang: "es",
          defaultMethod: "card",
          timeZone: -5,
          lat: "-0.180653",
          lng: "-78.467838",
          responseUrl: window.location.origin + '/checkout/resultado',
          cancelledUrl: window.location.origin + '/checkout/resultado?status=cancelled',
        });

        ppb.render('pp-button');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, cartTotal, cartTax, cartCount, billingInfo, paymentMethod]);

  // confirmPayment logic has moved to /checkout/resultado/page.js

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
        onLoad={() => { }}
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
              <div className={`flex items-center gap-2 ${paymentMethod === 'transfer' ? 'text-purple-brand/60' : 'text-purple-brand/60'}`}>
                {paymentMethod === 'transfer' ? <span className="text-lg">🍌</span> : <ShieldCheck size={18} />}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {paymentMethod === 'transfer' ? 'Checkout por Transferencia Bancaria' : 'Checkout Seguro con PayPhone'}
                </span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                      {savedAddresses.map(addr => {
                        const isSelected = selectedBillingId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            onClick={() => selectBillingAddress(addr)}
                            className={`
                               p-5 rounded-3xl border-2 text-left transition-all relative group
                               ${isSelected
                                ? 'bg-purple-brand/5 border-purple-brand shadow-xl shadow-purple-brand/10'
                                : 'bg-white border-black/5 hover:border-purple-brand/30 hover:bg-gray-50/50'}
                             `}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-purple-brand' : 'text-gray-400'}`}>
                                  {addr.label}
                                </span>
                                {isSelected && (
                                  <div className="w-5 h-5 bg-purple-brand text-white rounded-full flex items-center justify-center">
                                    <Check size={12} />
                                  </div>
                                )}
                              </div>
                              <p className="font-black text-gray-900 text-sm mt-1">{addr.full_name}</p>
                              <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1 line-clamp-2">
                                {addr.street_main || addr.address_line1} {addr.house_number}, {addr.city}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold mt-2">{addr.phone}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                      <input
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                        value={billingInfo.full_name}
                        onChange={(e) => setBillingInfo(p => ({ ...p, full_name: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email (Factura Electrónica)</label>
                      <input
                        type="email"
                        className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                        value={billingInfo.email}
                        onChange={(e) => updateBilling({ email: e.target.value })}
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
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Provincia</label>
                        <input
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                          value={billingInfo.province}
                          onChange={(e) => updateBilling({ province: e.target.value })}
                          placeholder="Ej: Guayas"
                        />
                      </div>
                      <div className="md:col-span-1 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciudad</label>
                        <input
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                          value={billingInfo.city}
                          onChange={(e) => updateBilling({ city: e.target.value })}
                          placeholder="Ej: Guayaquil"
                        />
                      </div>
                      <div className="md:col-span-1 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cantón</label>
                        <input
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                          value={billingInfo.canton}
                          onChange={(e) => updateBilling({ canton: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calle Principal</label>
                        <input
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                          value={billingInfo.street_main}
                          onChange={(e) => updateBilling({ street_main: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calle Secundaria</label>
                        <input
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                          value={billingInfo.street_secondary}
                          onChange={(e) => updateBilling({ street_secondary: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest"># Casa/Apto</label>
                        <input
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                          value={billingInfo.house_number}
                          onChange={(e) => updateBilling({ house_number: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Código Postal</label>
                        <input
                          className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                          value={billingInfo.zip_code}
                          onChange={(e) => updateBilling({ zip_code: e.target.value })}
                        />
                      </div>
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

                      {!selectedBillingId && billingInfo.street_main && (
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                          {savedAddresses.map(addr => {
                            const isSelected = selectedShippingId === addr.id;
                            return (
                              <button
                                key={addr.id}
                                onClick={() => selectShippingAddress(addr)}
                                className={`
                                  p-5 rounded-3xl border-2 text-left transition-all relative
                                  ${isSelected
                                    ? 'bg-purple-brand/5 border-purple-brand shadow-xl shadow-purple-brand/10'
                                    : 'bg-white border-black/5 hover:border-purple-brand/30 hover:bg-gray-50/50'}
                                `}
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-purple-brand' : 'text-gray-400'}`}>
                                      {addr.label}
                                    </span>
                                    {isSelected && (
                                      <div className="w-5 h-5 bg-purple-brand text-white rounded-full flex items-center justify-center">
                                        <Check size={12} />
                                      </div>
                                    )}
                                  </div>
                                  <p className="font-black text-gray-900 text-sm mt-1">{addr.full_name}</p>
                                  <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1 line-clamp-2">
                                    {addr.street_main || addr.address_line1} {addr.house_number}, {addr.city}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-bold mt-2">{addr.phone}</p>
                                </div>
                              </button>
                            );
                          })}
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
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Provincia</label>
                            <input
                              className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                              value={shippingInfo.province}
                              onChange={(e) => updateShipping({ province: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciudad</label>
                            <input
                              className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                              value={shippingInfo.city}
                              onChange={(e) => updateShipping({ city: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Canton</label>
                            <input
                              className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                              value={shippingInfo.canton}
                              onChange={(e) => updateShipping({ canton: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calle Principal</label>
                            <input
                              className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                              value={shippingInfo.street_main}
                              onChange={(e) => updateShipping({ street_main: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calle Secundaria</label>
                            <input
                              className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                              value={shippingInfo.street_secondary}
                              onChange={(e) => updateShipping({ street_secondary: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest"># Casa/Apto</label>
                            <input
                              className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                              value={shippingInfo.house_number}
                              onChange={(e) => updateShipping({ house_number: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Código Postal</label>
                            <input
                              className="bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white outline-none focus:ring-4 ring-purple-brand/5 transition-all"
                              value={shippingInfo.zip_code}
                              onChange={(e) => updateShipping({ zip_code: e.target.value })}
                            />
                          </div>
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

                          {!selectedShippingId && shippingInfo.street_main && (
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

                {/* Payment Method Selector */}
                <section className="bg-white rounded-[2.5rem] p-10 border border-black/5 shadow-2xl shadow-black/5">
                  <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                    <CreditCard className="text-purple-brand" size={24} /> Método de Pago
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('payphone')}
                      className={`
                        p-6 rounded-[2rem] border-2 text-left transition-all
                        ${paymentMethod === 'payphone'
                          ? 'border-purple-brand bg-purple-brand/5 shadow-xl shadow-purple-brand/10'
                          : 'border-black/5 hover:border-purple-brand/20'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-brand text-white rounded-2xl">
                          <CreditCard size={20} />
                        </div>
                        {paymentMethod === 'payphone' && <CheckCircle2 size={20} className="text-purple-brand" />}
                      </div>
                      <p className="font-black text-gray-900">Tarjeta de Crédito / Débito</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Pago Inmediato (PayPhone)</p>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('transfer')}
                      className={`
                        p-6 rounded-[2rem] border-2 text-left transition-all
                        ${paymentMethod === 'transfer'
                          ? 'border-purple-brand bg-purple-brand/5 shadow-xl shadow-purple-brand/10'
                          : 'border-black/5 hover:border-purple-brand/20'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-brand text-white rounded-2xl">
                          <Building2 size={20} />
                        </div>
                        {paymentMethod === 'transfer' && <CheckCircle2 size={20} className="text-purple-brand" />}
                      </div>
                      <p className="font-black text-gray-900">Transferencia Bancaria</p>
                      <p className="text-[10px] font-black text-purple-brand mt-1 uppercase tracking-widest">Ahorra approx. 6%</p>
                    </button>
                  </div>

                  {paymentMethod === 'transfer' && (
                    <div className="mt-8 p-6 bg-purple-brand/5 border border-purple-brand/10 rounded-[2rem] animate-in fade-in slide-in-from-top-4">
                      <div className="flex gap-4 items-start">
                        <div className="p-2 bg-purple-brand text-white rounded-xl">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-purple-brand uppercase tracking-widest mb-1">Ahorra pagando por transferencia</h4>
                          <p className="text-[10px] font-bold leading-relaxed text-purple-brand/70">
                            Al seleccionar este método, recibirás un descuento de aproximadamente el 6% sobre el PVP.
                            Podrás revisar el desglose final y generar tu orden en el siguiente paso.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <button
                  onClick={initPayPhone}
                  disabled={loading}
                  className="w-full py-6 bg-banana-yellow text-black rounded-[2rem] font-black text-xl hover:scale-102 hover:shadow-2xl transition-all flex items-center justify-center gap-4 group"
                >
                  {loading ? 'PROCESANDO...' : 'CONTINUAR AL PAGO'}
                  <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-12 border border-black/5 shadow-2xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
                <div className="p-6 bg-purple-brand/5 text-purple-brand rounded-full mb-8">
                  {paymentMethod === 'transfer' ? <Building2 size={48} /> : <CreditCard size={48} />}
                </div>
                <h2 className="text-2xl font-black mb-4">
                  {paymentMethod === 'transfer' ? 'Confirmar Orden ' : 'Confirmar Transacción'}
                </h2>
                <p className="text-gray-500 font-medium mb-10 max-w-sm">
                  {paymentMethod === 'transfer'
                    ? 'Estás a un paso de completar tu pedido. Al confirmar, guardaremos tu orden y te ayudaremos a enviar el comprobante.'
                    : 'Haz clic en el botón de abajo para abrir la pasarela de PayPhone y completar tu pago de forma segura.'}
                </p>

                <div className="w-full space-y-8 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Billing Data */}
                    <div className="bg-gray-50 rounded-3xl p-6 border border-black/5 text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-brand mb-4 flex items-center gap-2">
                        <FileText size={12} /> Datos de Facturación
                      </h4>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-700">{billingInfo.full_name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{billingInfo.id_number} • {billingInfo.email}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{billingInfo.phone}</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-2">{billingInfo.street_main}, {billingInfo.house_number}</p>
                      </div>
                    </div>

                    {/* Shipping Data */}
                    <div className="bg-gray-50 rounded-3xl p-6 border border-black/5 text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-brand mb-4 flex items-center gap-2">
                        <Truck size={12} /> Datos de Envío
                      </h4>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-700">{shippingInfo.full_name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{shippingInfo.phone}</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-2">{shippingInfo.street_main}, {shippingInfo.house_number}</p>
                        <p className="text-[10px] text-gray-400 leading-tight italic">{shippingInfo.city}, {shippingInfo.province}</p>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === 'transfer' ? (
                    <div className="space-y-8">
                      <label className="flex items-start gap-4 p-4 bg-purple-brand/5 rounded-2xl border border-purple-brand/10 cursor-pointer group text-left">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="w-5 h-5 mt-1 rounded-lg border-purple-brand/20 text-purple-brand focus:ring-purple-brand"
                        />
                        <span className="text-xs font-bold text-purple-brand/80 leading-relaxed group-hover:text-purple-brand transition-colors">
                          Acepto que los datos de mi pedido son correctos y me comprometo a realizar la transferencia por el valor total de <span className="font-black">${cartTotal.toFixed(2)}</span>.
                        </span>
                      </label>

                      <button
                        onClick={handleConfirmTransfer}
                        disabled={loading || !agreedToTerms}
                        className={`
                             w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3
                             ${agreedToTerms
                            ? 'bg-purple-brand text-white shadow-xl shadow-purple-brand/20 hover:scale-105 active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                           `}
                      >
                        <Building2 size={20} />
                        {loading ? 'PROCESANDO...' : 'GENERAR ORDEN'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center w-full">
                      <div id="pp-button" className="w-full max-w-xs transition-all hover:scale-105"></div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="mt-8 text-xs font-black text-gray-400 hover:text-purple-brand uppercase tracking-widest"
                >
                  &larr; Cambiar Datos o Pago
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
                  <CreditCard size={20} /> Tu Compra
                </h3>


                <div className="space-y-3 pt-6 border-t border-white/20">
                  <div className="flex flex-col gap-6 mb-8">
                    {cartItems.map(item => (
                      <div key={item.cartId} className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40 mb-1 line-clamp-1">{item.name}</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xl md:text-2xl font-black">${(getFinalPrice(parseFloat(item.price), paymentMethod) / 1.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[10px] font-bold uppercase opacity-60">x {item.quantity || 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs font-bold opacity-60 uppercase tracking-widest pt-4 border-t border-white/10">
                    <span>Subtotal</span>
                    <span>${cartSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold opacity-60 uppercase tracking-widest">
                    <span>IVA (15%)</span>
                    <span>${cartTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-3xl font-black pt-4">
                    <span>TOTAL</span>
                    <span>${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
