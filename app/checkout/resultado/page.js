"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ShieldAlert, Printer, CreditCard, Truck, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

function ResultadoContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  // PayPhone envía: ?id=XXX&clientTransactionId=YYY
  const payphoneId = searchParams.get('id');
  const clientTxId = searchParams.get('clientTransactionId') || searchParams.get('clientTxId');
  const methodParam = searchParams.get('method'); // 'transfer'

  const [status, setStatus] = useState('loading'); // 'loading' | 'approved' | 'failed' | 'error'
  const [txData, setTxData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados locales para persistir la información del recibo DESPUÉS de limpiar el carrito
  const [orderSummary, setOrderSummary] = useState({ items: [], total: 0 });
  const [checkoutInfo, setCheckoutInfo] = useState({ billing: {}, shipping: {} });

  useEffect(() => {
    // Guardar carrito en sessionStorage antes de que se limpie, para mostrar resumen
    if (typeof window !== 'undefined') {
      try {
        const savedCart = sessionStorage.getItem('banana_pending_cart');
        if (!savedCart && cartItems.length > 0) {
          sessionStorage.setItem('banana_pending_cart', JSON.stringify({ items: cartItems, total: cartTotal }));
        }
      } catch (_) { }
    }
  }, []);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const isTransfer = methodParam === 'transfer' && orderIdParam;

    if (!clientTxId && !payphoneId && !isTransfer) {
      setStatus('error');
      setErrorMsg('Parámetros de transacción no encontrados en la URL.');
      return;
    }

    let called = false;
    const confirm = async () => {
      if (called) return;
      called = true;

      try {
        let resData = null;
        let isApproved = false;

        if (methodParam === 'transfer') {
          // Si es transferencia, la orden ya fue creada en checkout/page.js
          const orderIdParam = searchParams.get('orderId');
          const waParam = searchParams.get('wa');

          if (orderIdParam) {
            const { data: order, error: fetchError } = await supabase
              .from('orders')
              .select('*')
              .eq('id', orderIdParam)
              .single();

            if (order) {
              isApproved = true;
              resData = {
                transactionStatus: 'Pending',
                amount: order.total,
                order_number: order.order_number,
                created_at: order.created_at,
                payment_method: 'transfer'
              };

              // ── Populate receipt state from sessionStorage ──
              try {
                const savedCart = sessionStorage.getItem('banana_pending_cart');
                const savedCheckout = sessionStorage.getItem('banana_pending_checkout');
                if (savedCart) {
                  const parsedCart = JSON.parse(savedCart);
                  setOrderSummary(parsedCart);
                }
                if (savedCheckout) {
                  const parsedCheckout = JSON.parse(savedCheckout);
                  setCheckoutInfo({
                    billing: parsedCheckout.billing || {},
                    shipping: parsedCheckout.shipping || parsedCheckout.billing || {}
                  });
                } else {
                  // Fallback: use billing/shipping from the order stored in DB
                  setCheckoutInfo({
                    billing: order.billing_address || {},
                    shipping: order.shipping_address || order.billing_address || {}
                  });
                }
              } catch (_) { }


              // Clear cart + sessionStorage after populating receipt state
              clearCart();
              try {
                sessionStorage.removeItem('banana_pending_cart');
                sessionStorage.removeItem('banana_pending_checkout');
              } catch (_) { }
            } else {
              setStatus('error');
              setErrorMsg('No pudimos recuperar los detalles de tu orden.');
              return;
            }
          }
        } else {
          const res = await fetch('/api/checkout/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: payphoneId, clientTxId })
          });
          resData = await res.json();
          isApproved = resData.transactionStatus === 'Approved' || resData.statusCode === 3;
        }

        setTxData(resData);

        if (isApproved) {
          // Registrar la orden en Supabase (SOLO PARA PAYPHONE, transfer ya se guardó)
          if (methodParam !== 'transfer') {
            try {
              // Recuperar carrito y datos de checkout desde sessionStorage
              let pendingCart = { items: cartItems, total: cartTotal };
              let pendingCheckout = { billing: null, shipping: null };

              try {
                const savedCart = sessionStorage.getItem('banana_pending_cart');
                if (savedCart) pendingCart = JSON.parse(savedCart);

                const savedCheckout = sessionStorage.getItem('banana_pending_checkout');
                if (savedCheckout) pendingCheckout = JSON.parse(savedCheckout);
              } catch (_) { }

              // PERSISTIR EN ESTADO LOCAL ANTES DE LIMPIAR
              setOrderSummary(pendingCart);
              setCheckoutInfo({
                billing: pendingCheckout.billing || {},
                shipping: pendingCheckout.shipping || pendingCheckout.billing || {}
              });

              const currentMethod = pendingCheckout.paymentMethod || 'payphone';

              const orderData = {
                customer_id: user?.id || pendingCheckout.userId || null,
                total: pendingCart.total,
                base_total: pendingCheckout.baseTotal || pendingCart.total,
                final_total: pendingCart.total,
                discount_amount: pendingCheckout.discountAmount || 0,
                status: 'paid',
                payment_method: currentMethod,
                client_transaction_id: clientTxId,
                payphone_transaction_id: resData.transactionId || null,
                authorization_code: resData.authorizationCode || null,
                billing_address: pendingCheckout.billing,
                shipping_address: pendingCheckout.shipping,
              };

              const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single();

              if (!orderError && order) {
                setTxData(prev => ({
                  ...prev,
                  order_number: order.order_number,
                  created_at: order.created_at,
                  payment_method: currentMethod
                }));
                if (pendingCart.items?.length > 0) {
                  const items = pendingCart.items.map(item => ({
                    order_id: order.id,
                    product_id: item.id,
                    quantity: item.quantity || 1,
                    unit_price: item.price
                  }));
                  await supabase.from('order_items').insert(items);
                  
                  // Trigger Email Alerts
                  const emailPayload = {
                    order: { ...order, billing_address: orderData.billing_address, order_items: items },
                    customerEmail: orderData.billing_address?.email || user?.email,
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
                    body: JSON.stringify({ type: 'status_update', ...emailPayload, newStatus: 'paid' })
                  }).catch(err => console.error("Customer Email notification failed:", err));
                }
              }
            } catch (dbErr) {
              console.error('[Resultado] Error guardando orden:', dbErr);
            }
          }

          // Limpiar carrito y sessionStorage
          clearCart();
          try {
            sessionStorage.removeItem('banana_pending_cart');
            sessionStorage.removeItem('banana_pending_checkout');
          } catch (_) { }

          setStatus('approved');
        } else {
          setStatus('failed');
          setErrorMsg(resData.message || resData.error || `Estado: ${resData.transactionStatus || 'Desconocido'}`);
        }
      } catch (err) {
        console.error('[Resultado] Error al confirmar:', err);
        setStatus('error');
        setErrorMsg('Error de conexión al confirmar el pago. Contacta a soporte con tu ID de transacción.');
      }
    };

    confirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payphoneId, clientTxId]);

  /* ---------- UI ---------- */

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cream-bg flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="w-16 h-16 border-4 border-purple-brand/20 border-t-purple-brand rounded-full animate-spin" />
          <p className="text-sm font-black text-purple-brand animate-pulse uppercase tracking-[0.2em]">
            Validando Transacción...
          </p>
          {payphoneId && (
            <p className="text-xs text-gray-400 font-mono">ID: {payphoneId}</p>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-8">
        <main className="max-w-2xl w-full animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8 no-print">
            <div className="inline-flex p-5 bg-purple-brand/10 text-purple-brand rounded-full mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="text-4xl font-black text-purple-brand mb-2">
              {txData?.payment_method === 'transfer' ? 'Pedido creado - pendiente de verificación' : '¡Orden Confirmada!'}
            </h1>
            <p className="text-gray-500 font-medium">
              {txData?.payment_method === 'transfer'
                ? 'Tu pedido ha sido registrado con éxito. Sigue las instrucciones para completar la compra.'
                : 'Gracias por tu compra. Tu pedido está en camino.'}
            </p>
          </div>

          {txData?.payment_method === 'transfer' && (
            <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-black/5 p-8 rounded-[2rem] shadow-sm">
                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                  <CreditCard className="text-purple-brand" size={20} /> Instrucciones de Pago
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-purple-brand text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-3">Realiza la transferencia por el valor total de <span className="font-black text-black">${txData.amount.toFixed(2)}</span> a la siguiente cuenta:</p>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-black/5 space-y-2 text-[11px]">
                        <div className="flex justify-between"><span className="font-bold opacity-50">Banco:</span> <span className="font-black">BANCO PICHINCHA</span></div>
                        <div className="flex justify-between"><span className="font-bold opacity-50">Tipo:</span> <span className="font-black uppercase">Corriente</span></div>
                        <div className="flex justify-between"><span className="font-bold opacity-50">Nro. Cuenta:</span> <span className="font-black">2100XXXXXX</span></div>
                        <div className="flex justify-between"><span className="font-bold opacity-50">Beneficiario:</span> <span className="font-black">BANANA COMPUTER S.A.S.</span></div>
                        <div className="flex justify-between"><span className="font-bold opacity-50">RUC:</span> <span className="font-black">179XXXXXXX001</span></div>
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-purple-brand text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                    <p className="text-sm font-medium text-gray-600">Usa el número de orden <span className="font-black text-purple-brand">{txData.order_number}</span> como referencia del pago.</p>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-purple-brand text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
                    <p className="text-sm font-medium text-gray-600">Envía el comprobante de pago por WhatsApp para validar tu pedido.</p>
                  </li>
                </ul>

                <button
                  onClick={() => {
                    const lastOrder = JSON.parse(sessionStorage.getItem('banana_last_order'));
                    if (lastOrder?.whatsappUrl) window.open(lastOrder.whatsappUrl, '_blank');
                  }}
                  className="w-full mt-8 py-4 bg-purple-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg shadow-purple-brand/20"
                >
                  <ShoppingCart size={18} /> Enviar Comprobante WhatsApp
                </button>
              </div>

              <div className="bg-purple-brand text-white p-8 rounded-[2rem] shadow-xl shadow-purple-brand/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16"></div>
                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                  <Truck size={20} /> Expectativa de Entrega
                </h3>
                <div className="space-y-6">
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Procesamiento</p>
                    <p className="text-sm font-bold leading-relaxed">Una vez confirmada la transferencia, el envío se realiza en aproximadamente <span className="text-banana-yellow">24 a 36 horas</span>.</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Envío a Domicilio</p>
                    <p className="text-sm font-bold leading-relaxed">El pedido será entregado mediante <span className="font-black">Servientrega</span> y llegará en aproximadamente <span className="text-banana-yellow">24 horas</span> adicionales.</p>
                  </div>
                </div>
                <p className="mt-8 text-[9px] font-black uppercase tracking-widest opacity-40 italic">Tu pedido será procesado una vez confirmado el pago</p>
              </div>
            </div>
          )}

          {txData && (
            <div className="bg-white rounded-3xl p-8 mb-8 text-left shadow-2xl shadow-purple-brand/5 border border-black/5">
              {/* ── Identificación ── */}
              <div className="flex justify-between items-start pb-6 border-b border-black/5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nro. de Orden</p>
                  <p className="font-black text-2xl text-purple-brand">{txData.order_number || 'BC-0000'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Fecha y Hora</p>
                  <p className="font-bold text-gray-700">
                    {txData.created_at
                      ? new Date(txData.created_at).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Guayaquil' })
                      : new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Guayaquil' })
                    }
                  </p>
                </div>
              </div>

              {/* ── Items ── */}
              <div className="py-6 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detalle del Pedido</p>
                <div className="space-y-3">
                  {(orderSummary.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-purple-brand/5 text-purple-brand rounded text-[10px] font-black">{item.quantity || 1}</span>
                        <span className="text-xs font-bold text-gray-800">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-gray-900">${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Totales ── */}
              <div className="py-6 border-t border-black/5 bg-gray-50/50 -mx-8 px-8 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">Subtotal (Base)</span>
                  <span className="font-bold text-gray-700">${((orderSummary.total || 0) / 1.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">IVA (15%)</span>
                  <span className="font-bold text-gray-700">${((orderSummary.total || 0) - ((orderSummary.total || 0) / 1.15)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-black/5">
                  <span className="text-sm font-black uppercase tracking-widest text-gray-900">Total Pagado</span>
                  <span className="text-3xl font-black text-purple-brand">${(orderSummary.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* ── Direcciones ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-t border-black/5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Facturación</p>
                  <div className="text-xs leading-relaxed text-gray-600">
                    <p className="font-black text-gray-900 uppercase mb-1">{checkoutInfo.billing.full_name || 'Invitado'}</p>
                    <p>{checkoutInfo.billing.id_number} {checkoutInfo.billing.phone && `(${checkoutInfo.billing.phone})`}</p>
                    <p>{checkoutInfo.billing.street_main} {checkoutInfo.billing.house_number}</p>
                    <p>{checkoutInfo.billing.city}{checkoutInfo.billing.province && `, ${checkoutInfo.billing.province}`}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Envío</p>
                  <div className="text-xs leading-relaxed text-gray-600">
                    <p className="font-black text-gray-900 uppercase mb-1">{checkoutInfo.shipping.full_name || 'Invitado'}</p>
                    <p>{checkoutInfo.shipping.phone}</p>
                    <p>{checkoutInfo.shipping.street_main} {checkoutInfo.shipping.house_number}</p>
                    <p>{checkoutInfo.shipping.city}{checkoutInfo.shipping.province && `, ${checkoutInfo.shipping.province}`}</p>
                  </div>
                </div>
              </div>

              {/* ── Footer Recibo ── */}
              <div className="pt-6 border-t border-black/10 flex flex-wrap gap-4 items-center justify-between opacity-50">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className={txData?.payment_method === 'transfer' ? 'text-banana-yellow' : 'text-purple-brand'} />
                  <span className="text-[10px] font-black uppercase">
                    {txData?.payment_method === 'transfer' ? 'Pendiente de Transferencia' : 'Pago Verificado PayPhone'}
                  </span>
                </div>
                <div className="text-[10px] font-mono">
                  ID: {txData?.transactionId || payphoneId || clientTxId}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 no-print">
            <button
              onClick={() => window.print()}
              className="flex-1 py-4 bg-purple-brand text-white rounded-2xl font-black shadow-xl shadow-purple-brand/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Printer size={20} />
              IMPRIMIR RECIBO
            </button>

            {user ? (
              <Link href="/perfil" className="flex-1 py-4 bg-white border-2 border-purple-brand text-purple-brand rounded-2xl font-black hover:bg-purple-brand/5 transition-all flex items-center justify-center">
                VER MIS PEDIDOS
              </Link>
            ) : (
              <Link href="/" className="flex-1 py-4 bg-white border-2 border-purple-brand text-purple-brand rounded-2xl font-black hover:bg-purple-brand/5 transition-all flex items-center justify-center">
                VOLVER A LA TIENDA
              </Link>
            )}
          </div>

          <div className="mt-8 text-center no-print">
            <Link href="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-purple-brand transition-colors">
              Continuar Comprando
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // status === 'failed' | 'error'
  const isCancelled = txData?.transactionStatus === 'Cancelled';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-xl mx-auto px-4 pt-40 pb-20 text-center w-full">
        <div className={`inline-flex p-5 ${isCancelled ? 'bg-yellow-100 text-yellow-500' : 'bg-red-100 text-red-500'} rounded-full mb-8`}>
          {isCancelled ? <ShieldAlert size={64} /> : <XCircle size={64} />}
        </div>
        <h1 className="text-4xl font-black text-gray-800 mb-4">
          {isCancelled ? 'Pago Cancelado' : 'Pago No Completado'}
        </h1>
        <p className="text-gray-500 font-medium mb-4 leading-relaxed">
          {isCancelled
            ? 'Cancelaste el proceso de pago. Tu carrito sigue guardado.'
            : errorMsg || 'No pudimos procesar tu pago. Por favor intenta nuevamente.'}
        </p>
        {payphoneId && (
          <p className="text-xs text-gray-400 font-mono mb-8">Ref: {payphoneId}</p>
        )}
        <div className="flex flex-col gap-4">
          <Link href="/checkout" className="w-full py-4 bg-purple-brand text-white rounded-2xl font-black shadow-xl shadow-purple-brand/20 hover:scale-105 transition-all">
            INTENTAR NUEVAMENTE
          </Link>
          <Link href="/" className="w-full py-4 text-purple-brand font-black hover:bg-purple-brand/5 rounded-2xl transition-all">
            VOLVER A LA TIENDA
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-brand/10 border-t-purple-brand rounded-full animate-spin" />
      </div>
    }>
      <ResultadoContent />
    </Suspense>
  );
}
