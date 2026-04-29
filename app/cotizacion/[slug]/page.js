"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  FileText, Printer, CreditCard, Clock, 
  CheckCircle2, ArrowRight, ShieldCheck, ShoppingBag
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export default function PublicQuotePage() {
  const { slug } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { clearCart, addToCart, setPaymentMethod } = useCart();
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setQuote(data);
      const expired = new Date(data.expires_at) < new Date() && data.status !== 'paid';
      setIsExpired(expired);
      setLoading(false);
    };

    fetchQuote();
  }, [slug]);

  const handlePayNow = async () => {
    if (isExpired) return showToast('Esta cotización ha expirado', 'error');
    
    // 1. Configurar el método de pago de la cotización
    const mode = quote.totals?.paymentMode || 'transfer';
    setPaymentMethod(mode);

    // 2. Clear current cart for a clean experience
    clearCart();

    // 3. Add each item from quote to cart
    quote.items.forEach(item => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        transfer_price: item.transfer_price
      }, item.quantity);
    });

    showToast('Carrito actualizado con tu cotización', 'success');
    
    // 4. Redirect to checkout with quote_id
    router.push(`/checkout?quote_id=${quote.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black/5 border-t-purple-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 pt-40 pb-20 text-center">
          <FileText size={64} className="mx-auto text-gray-200 mb-6" />
          <h1 className="text-4xl font-black text-gray-900 mb-4">Cotización no encontrada</h1>
          <p className="text-gray-500 mb-8">El link es inválido o la cotización ya no existe.</p>
          <button onClick={() => router.push('/')} className="px-8 py-4 bg-purple-brand text-white rounded-2xl font-black">VOLVER A LA TIENDA</button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* --- IZQUIERDA: DETALLE DE COTIZACIÓN --- */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <header className="bg-white rounded-[2.5rem] p-10 border border-black/5 shadow-2xl shadow-black/5 relative overflow-hidden">
              {/* Rainbow accent top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-banana-yellow via-raspberry to-purple-brand" />
              
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-4xl font-black text-purple-brand tracking-tighter">COTIZACIÓN</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mt-1">{quote.slug}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                  ${isExpired ? 'bg-raspberry/5 text-raspberry border-raspberry/10' : 'bg-mint-success/5 text-mint-success border-mint-success/10'}`}>
                  {isExpired ? 'Expirada' : 'Válida'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Para:</p>
                  <p className="text-xl font-black text-gray-900">{quote.customer_data.full_name}</p>
                  <p className="text-xs font-medium text-gray-500 mt-1">{quote.customer_data.email}</p>
                  <p className="text-xs font-medium text-gray-500">{quote.customer_data.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Fechas:</p>
                  <p className="text-xs font-bold text-gray-800">Emitida: {new Date(quote.created_at).toLocaleDateString()}</p>
                  <p className={`text-xs font-bold mt-1 ${isExpired ? 'text-raspberry' : 'text-purple-brand'}`}>
                    Vence: {new Date(quote.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-black/5 pt-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      <th className="pb-4">Descripción</th>
                      <th className="pb-4 text-center">Cant</th>
                      <th className="pb-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {quote.items.map((item, i) => {
                      const isTransfer = (quote.totals?.paymentMode || 'transfer') === 'transfer';
                      const displayPrice = isTransfer ? (item.transfer_price || item.price * 0.94) : item.price;
                      return (
                        <tr key={i} className="group">
                          <td className="py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-black/5 overflow-hidden flex-shrink-0">
                                {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <p className="text-sm font-black text-gray-800 group-hover:text-purple-brand transition-colors">{item.name}</p>
                            </div>
                          </td>
                          <td className="py-5 text-center text-sm font-bold text-gray-500">{item.quantity}</td>
                          <td className="py-5 text-right text-sm font-black text-gray-900">${((displayPrice / 1.15) * item.quantity).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </header>
            
            <div className="bg-white rounded-[2rem] p-8 border border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-brand/5 text-purple-brand rounded-2xl">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase">Compra Garantizada</p>
                  <p className="text-[10px] font-medium text-gray-400">Tus datos y pago están protegidos por SSL.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black">VISA</div>
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black">MC</div>
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black">PP</div>
              </div>
            </div>
          </div>

          {/* --- DERECHA: ACCIONES Y TOTALES --- */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <aside className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-2xl shadow-black/5 sticky top-32">
              <h2 className="text-lg font-black mb-6 uppercase tracking-tight">Resumen de Pago</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Subtotal (Neto)</span>
                  <span>${Number(quote.totals.subtotal).toFixed(2)}</span>
                </div>
                {Number(quote.totals.discount) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-purple-brand">
                    <span>Ahorro Transferencia</span>
                    <span>-${Number(quote.totals.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>IVA (15%)</span>
                  <span>${Number(quote.totals.tax).toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-black/10 flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-tight">Total</span>
                  <span className="text-3xl font-black text-purple-brand">${Number(quote.totals.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePayNow}
                  disabled={isExpired}
                  className="w-full py-5 bg-purple-brand text-white rounded-2xl font-black text-sm shadow-xl shadow-purple-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} /> PAGAR AHORA <ArrowRight size={18} />
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="w-full py-4 bg-white border-2 border-purple-brand/20 text-purple-brand rounded-2xl font-black text-xs hover:bg-purple-brand/5 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> IMPRIMIR / GUARDAR PDF
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-black/5">
                <p className="text-[10px] font-medium text-gray-400 leading-relaxed text-center italic">
                  * Al hacer clic en Pagar Ahora, serás redirigido a nuestro checkout seguro donde podrás completar tus datos de envío y finalizar la compra.
                </p>
              </div>
            </aside>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
