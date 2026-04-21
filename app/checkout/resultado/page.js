"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ShieldAlert } from 'lucide-react';
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
            // Recuperar carrito desde sessionStorage si el contexto ya lo limpió
            let pendingCart = { items: cartItems, total: cartTotal };
            try {
              const saved = sessionStorage.getItem('banana_pending_cart');
              if (saved) {
                pendingCart = JSON.parse(saved);
              }
            } catch (_) {}

            const orderData = {
              customer_id: user?.id || null,
              total: pendingCart.total || data.amount / 100,
              status: 'paid',
              client_transaction_id: clientTxId,
              payphone_transaction_id: data.transactionId,
              authorization_code: data.authorizationCode,
            };

            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert(orderData)
              .select()
              .single();

            if (!orderError && order && pendingCart.items?.length > 0) {
              const items = pendingCart.items.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity || 1,
                unit_price: item.price
              }));
              await supabase.from('order_items').insert(items);
            }
          } catch (dbErr) {
            console.error('[Resultado] Error guardando orden:', dbErr);
            // No bloquear la UI por error de DB — el pago ya fue aprobado
          }

          // Limpiar carrito y sessionStorage
          clearCart();
          try { sessionStorage.removeItem('banana_pending_cart'); } catch (_) {}

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
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 max-w-xl mx-auto px-4 pt-40 pb-20 text-center w-full">
          <div className="inline-flex p-5 bg-mint-success/10 text-mint-success rounded-full mb-8 animate-bounce">
            <CheckCircle2 size={64} />
          </div>
          <h1 className="text-4xl font-black text-purple-brand mb-4">¡Orden Confirmada!</h1>
          <p className="text-gray-500 font-medium mb-4 leading-relaxed">
            Hemos recibido tu pago y estamos preparando tu envío. Recibirás un correo con el detalle de tu factura.
          </p>

          {txData && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-10 text-left space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Monto Cobrado</span>
                <span className="font-black">${(txData.amount / 100).toFixed(2)} USD</span>
              </div>
              {txData.cardBrand && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Tarjeta</span>
                  <span className="font-black">{txData.cardBrand} ****{txData.lastDigits}</span>
                </div>
              )}
              {txData.authorizationCode && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Autorización</span>
                  <span className="font-black font-mono text-mint-success">{txData.authorizationCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">ID Transacción</span>
                <span className="font-mono text-xs text-gray-500">{txData.transactionId || payphoneId}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Link href="/perfil" className="w-full py-4 bg-purple-brand text-white rounded-2xl font-black shadow-xl shadow-purple-brand/20 hover:scale-105 transition-all">
              VER MIS PEDIDOS
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
