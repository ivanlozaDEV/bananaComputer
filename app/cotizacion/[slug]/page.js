"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  FileText, Printer, CreditCard, Clock, 
  CheckCircle2, ArrowRight, ShieldCheck, ShoppingBag,
  Mail, Phone
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
      
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* --- IZQUIERDA: DETALLE DE COTIZACIÓN --- */}
          <div className={`${quote.quote_type === 'options' ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-6`}>
            <header className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-black/5 shadow-2xl shadow-black/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-banana-yellow via-raspberry to-purple-brand" />
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                <div>
                  <h1 className="text-4xl font-black text-purple-brand tracking-tighter uppercase">
                    {quote.quote_type === 'options' ? 'Opciones de Compra' : 'Cotización'}
                  </h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mt-1">{quote.slug}</p>
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit
                    ${isExpired ? 'bg-raspberry/5 text-raspberry border-raspberry/10' : 'bg-mint-success/5 text-mint-success border-mint-success/10'}`}>
                    {isExpired ? 'Expirada' : 'Válida'}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400">Vence el {new Date(quote.expires_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-black/5 mb-8">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Preparado para:</p>
                  <p className="text-xl font-black text-gray-900">{quote.customer_data.full_name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><Mail size={12}/> {quote.customer_data.email}</p>
                    <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><Phone size={12}/> {quote.customer_data.phone}</p>
                  </div>
                </div>
                <div className="md:text-right flex flex-col md:justify-end">
                   <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Banana Computer</p>
                   <p className="text-xs font-bold text-gray-800">Fecha de Emisión: {new Date(quote.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* MODO ESTÁNDAR: TABLA CLÁSICA */}
              {quote.quote_type !== 'options' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        <th className="pb-4">Descripción del Equipo</th>
                        <th className="pb-4 text-center">Cant</th>
                        <th className="pb-4 text-right">Unitario</th>
                        <th className="pb-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.03]">
                      {quote.items.map((item, i) => {
                        const isTransfer = (quote.totals?.paymentMode || 'transfer') === 'transfer';
                        const displayPrice = isTransfer ? (item.transfer_price || item.price * 0.94) : item.price;
                        return (
                          <tr key={i} className="group">
                            <td className="py-6">
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-black/5 overflow-hidden flex-shrink-0">
                                  {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-gray-900 group-hover:text-purple-brand transition-colors uppercase leading-tight">{item.name}</p>
                                  {/* Pills técnicos */}
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.pills?.map((p, idx) => (
                                      <span key={idx} className="text-[8px] font-black bg-gray-50 border border-black/[0.05] px-1.5 py-0.5 rounded text-gray-400 uppercase">
                                        {p.icon} {p.value}
                                      </span>
                                    ))}
                                  </div>
                                  {/* Garantía y Obsequios */}
                                  <div className="flex flex-col gap-1 mt-3">
                                    {item.warranty && (
                                      <div className="flex items-center gap-2 text-[9px] font-bold text-mint-success bg-mint-success/5 px-2 py-1 rounded-lg w-fit">
                                        <ShieldCheck size={10} /> Garantía: {item.warranty}
                                      </div>
                                    )}
                                    {item.gifts && (
                                      <div className="flex items-center gap-2 text-[9px] font-bold text-purple-brand bg-purple-brand/5 px-2 py-1 rounded-lg w-fit">
                                        <ShoppingBag size={10} /> Incluye: {item.gifts}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-6 text-center text-sm font-bold text-gray-500">{item.quantity}</td>
                            <td className="py-6 text-right text-sm font-bold text-gray-400">${(displayPrice / 1.15).toFixed(2)}</td>
                            <td className="py-6 text-right text-sm font-black text-gray-900">${((displayPrice / 1.15) * item.quantity).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* MODO OPCIONES: GRID DE TARJETAS COMPARATIVAS */}
              {quote.quote_type === 'options' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quote.items.map((item, i) => {
                    const isTransfer = (quote.totals?.paymentMode || 'transfer') === 'transfer';
                    const displayPrice = isTransfer ? (item.transfer_price || item.price * 0.94) : item.price;
                    return (
                      <div key={i} className="flex flex-col bg-gray-50 border border-black/5 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:border-purple-brand/20 transition-all group">
                        <div className="relative aspect-square bg-white rounded-2xl border border-black/5 overflow-hidden mb-6">
                           {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}
                           <div className="absolute top-3 left-3 bg-black text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Opción {i+1}</div>
                        </div>
                        
                        <h3 className="text-sm font-black text-gray-900 uppercase leading-tight mb-4 flex-1">{item.name}</h3>
                        
                        {/* Pills */}
                        <div className="flex flex-wrap gap-1 mb-6">
                          {item.pills?.map((p, idx) => (
                            <span key={idx} className="text-[8px] font-black bg-white border border-black/[0.05] px-1.5 py-0.5 rounded text-gray-400 uppercase">
                              {p.icon} {p.value}
                            </span>
                          ))}
                        </div>

                        <div className="space-y-2 mb-6">
                          {item.warranty && (
                             <p className="flex items-center gap-2 text-[10px] font-bold text-mint-success bg-white px-3 py-1.5 rounded-xl border border-black/[0.03]">
                                <ShieldCheck size={12} /> {item.warranty} de Garantía
                             </p>
                          )}
                          {item.gifts && (
                             <p className="flex items-center gap-2 text-[10px] font-bold text-purple-brand bg-white px-3 py-1.5 rounded-xl border border-black/[0.03]">
                                <ShoppingBag size={12} /> {item.gifts}
                             </p>
                          )}
                        </div>

                        <div className="pt-6 border-t border-black/[0.05] flex flex-col items-center gap-1">
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Precio Final (IVA Inc.)</p>
                           <p className="text-3xl font-black text-purple-brand">${Number(displayPrice).toFixed(2)}</p>
                           <p className="text-[8px] font-bold text-gray-400 uppercase">Pago por {isTransfer ? 'Transferencia' : 'Tarjeta'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </header>
          </div>

          {/* --- DERECHA: TOTALES (Solo en modo Estándar) --- */}
          {quote.quote_type !== 'options' && (
            <div className="lg:col-span-4 flex flex-col gap-6">
              <aside className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-2xl shadow-black/5 sticky top-32">
                <h2 className="text-lg font-black mb-6 uppercase tracking-tight">Resumen de Totales</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>Subtotal (Neto)</span>
                    <span>${Number(quote.totals.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(quote.totals.discount) > 0 && (
                    <div className="flex justify-between text-xs font-black text-purple-brand uppercase tracking-widest bg-purple-brand/5 px-2 py-1 rounded">
                      <span>Ahorro {quote.totals.paymentMode === 'transfer' ? 'Transf.' : 'Promo'}</span>
                      <span>-${Number(quote.totals.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>IVA (15%)</span>
                    <span>${Number(quote.totals.tax).toFixed(2)}</span>
                  </div>
                  <div className="pt-6 border-t border-black/10 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Final</span>
                      <span className="text-4xl font-black text-purple-brand tracking-tighter">${Number(quote.totals.total).toFixed(2)}</span>
                    </div>
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
                    <Printer size={18} /> IMPRIMIR / PDF
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* ACCIONES PARA MODO OPCIONES (Flotante o al final) */}
          {quote.quote_type === 'options' && (
            <div className="lg:col-span-12 flex flex-col items-center gap-6 mt-4">
               <div className="bg-white border border-black/5 p-8 rounded-[2.5rem] shadow-xl text-center max-w-2xl">
                  <h3 className="text-xl font-black text-gray-900 uppercase mb-4">¿Cuál opción prefieres?</h3>
                  <p className="text-sm text-gray-500 mb-8 font-medium">
                    Contacta con tu asesor de ventas para confirmar disponibilidad inmediata de la opción elegida o solicita el link de pago directo para cualquiera de ellas.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button onClick={() => window.print()} className="px-8 py-4 bg-white border-2 border-black/5 text-black rounded-2xl font-black text-xs hover:bg-gray-50 flex items-center gap-2">
                       <Printer size={18} /> DESCARGAR COMPARATIVA
                    </button>
                    <a href={`https://wa.me/593987654321?text=Hola! Me interesa la Opción de la cotización ${quote.slug}`} className="px-8 py-4 bg-mint-success text-white rounded-2xl font-black text-xs shadow-lg shadow-mint-success/20 hover:scale-105 transition-all flex items-center gap-2">
                       CONTACTAR ASESOR
                    </a>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
