"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ShieldAlert, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

function ResultadoContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  // PayPhone envía: ?id=XXX&clientTransactionId=YYY
  const payphoneId     = searchParams.get('id');
  const clientTxId     = searchParams.get('clientTransactionId') || searchParams.get('clientTxId');

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
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (!payphoneId || !clientTxId) {
      setStatus('error');
      setErrorMsg('Parámetros de transacción no encontrados en la URL.');
      return;
    }

    let called = false;
    const confirm = async () => {
      if (called) return;
      called = true;

      try {
        const res = await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: payphoneId, clientTxId })
        });

        const data = await res.json();
        setTxData(data);

        if (data.transactionStatus === 'Approved' || data.statusCode === 3) {
          // Registrar la orden en Supabase
          try {
            // Recuperar carrito y datos de checkout desde sessionStorage
            let pendingCart = { items: cartItems, total: cartTotal };
            let pendingCheckout = { billing: null, shipping: null };

            try {
              const savedCart = sessionStorage.getItem('banana_pending_cart');
              if (savedCart) pendingCart = JSON.parse(savedCart);

              const savedCheckout = sessionStorage.getItem('banana_pending_checkout');
              if (savedCheckout) pendingCheckout = JSON.parse(savedCheckout);
            } catch (_) {}

            // PERSISTIR EN ESTADO LOCAL ANTES DE LIMPIAR
            setOrderSummary(pendingCart);
            setCheckoutInfo({
               billing: pendingCheckout.billing || {},
               shipping: pendingCheckout.shipping || pendingCheckout.billing || {}
            });

            const orderData = {
              customer_id: user?.id || pendingCheckout.userId || null,
              total: pendingCart.total || data.amount / 100,
              status: 'paid',
              client_transaction_id: clientTxId,
              payphone_transaction_id: data.transactionId,
              authorization_code: data.authorizationCode,
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
                created_at: order.created_at // PERSISTIR LA FECHA REAL DE LA DB
              }));
              if (pendingCart.items?.length > 0) {
                const items = pendingCart.items.map(item => ({
                  order_id: order.id,
                  product_id: item.id,
                  quantity: item.quantity || 1,
                  unit_price: item.price
                }));
                await supabase.from('order_items').insert(items);
              }
            }
          } catch (dbErr) {
            console.error('[Resultado] Error guardando orden:', dbErr);
          }

          // Limpiar carrito y sessionStorage
          clearCart();
          try { 
            sessionStorage.removeItem('banana_pending_cart'); 
            sessionStorage.removeItem('banana_pending_checkout');
          } catch (_) {}

          setStatus('approved');
        } else {
          setStatus('failed');
          setErrorMsg(data.message || data.error || `Estado: ${data.transactionStatus || 'Desconocido'}`);
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
            <div className="inline-flex p-5 bg-mint-success/10 text-mint-success rounded-full mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="text-4xl font-black text-purple-brand mb-2">¡Orden Confirmada!</h1>
            <p className="text-gray-500 font-medium">Gracias por tu compra. Tu pedido está en camino.</p>
          </div>

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
                  <ShieldAlert size={14} className="text-mint-success" />
                  <span className="text-[10px] font-black uppercase">Pago Verificado PayPhone</span>
                </div>
                <div className="text-[10px] font-mono">
                  ID: {txData.transactionId || payphoneId}
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
