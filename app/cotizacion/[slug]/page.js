"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  FileText, Printer, CreditCard, Clock, 
  CheckCircle2, ArrowRight, ShieldCheck, ShoppingBag,
  Mail, Phone, MessageCircle
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
    const mode = quote.totals?.paymentMode || 'transfer';
    setPaymentMethod(mode);
    clearCart();

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
        <div className="no-print">
        <Footer />
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="no-print">
        <Header />
      </div>
      
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className={`${quote.quote_type === 'options' ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-6`}>
            <header className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-black/5 shadow-2xl shadow-black/5 relative print-container">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-banana-yellow via-raspberry to-purple-brand no-print" />
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                <div>
                  <h1 className="text-3xl font-black text-purple-brand tracking-tighter uppercase leading-none">
                    {quote.quote_type === 'options' ? 'Opciones de Compra' : 'Cotización'}
                  </h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mt-2">ID: {quote.slug}</p>
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit
                    ${isExpired ? 'bg-raspberry/5 text-raspberry border-raspberry/10' : 'bg-mint-success/5 text-mint-success border-mint-success/10'}`}>
                    {isExpired ? 'Expirada' : 'Proforma Válida'}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vence el {new Date(quote.expires_at).toLocaleDateString()}</p>
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
                   <p className="text-xs font-bold text-gray-800">Fecha: {new Date(quote.created_at).toLocaleDateString()}</p>
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
                        <th className="pb-4 text-right">Total Neto</th>
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
                                  <p className="text-[13px] font-black text-gray-900 uppercase leading-tight">{item.name}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.pills?.map((p, idx) => (
                                      <span key={idx} className="text-[8px] font-black bg-gray-50 border border-black/[0.05] px-1.5 py-0.5 rounded text-gray-400 uppercase">
                                        {p.icon} {p.value}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex flex-col gap-1 mt-3">
                                    {item.warranty && (
                                      <div className="flex items-center gap-2 text-[9px] font-bold text-mint-success bg-mint-success/5 px-2 py-1 rounded-lg w-fit">
                                        <ShieldCheck size={10} /> {item.warranty}
                                      </div>
                                    )}
                                    {item.gifts && (
                                      <div className="flex items-center gap-2 text-[9px] font-bold text-purple-brand bg-purple-brand/5 px-2 py-1 rounded-lg w-fit">
                                        <ShoppingBag size={10} /> {item.gifts}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-6 text-center text-sm font-bold text-gray-500">{item.quantity}</td>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {quote.items.map((item, i) => {
                    const isTransfer = quote.totals?.paymentMode === 'transfer';
                    const displayPrice = isTransfer ? item.transfer_price : item.price;
                    
                    return (
                      <a 
                        key={i} 
                        href={`/categoria/${item.category_slug || 'c'}/${item.subcategory_slug || 's'}/${item.slug}`}
                        className="group bg-white rounded-3xl border border-black/5 p-4 hover:shadow-xl transition-all flex flex-col h-full relative"
                      >
                        <div className="absolute top-3 left-3 bg-purple-brand text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest z-10">
                          Opción {i + 1}
                        </div>
                        
                        <div className="aspect-square bg-gray-50 rounded-2xl mb-3 overflow-hidden p-4 border border-black/5">
                          <img 
                            src={item.image_url || 'https://via.placeholder.com/400'} 
                            alt={item.name} 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                          />
                        </div>

                        <div className="flex-1 flex flex-col">
                          <h3 className="text-[11px] font-black text-gray-900 uppercase leading-tight mb-2 line-clamp-2">{item.name}</h3>
                          
                          {/* Specs en grid 2 columnas — igual que ProductCard */}
                          {item.pills && item.pills.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 mb-3">
                              {item.pills.map((pill, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-gray-50 border border-black/5">
                                  {pill.icon && <span className="text-purple-brand opacity-60 text-[10px] shrink-0">{pill.icon}</span>}
                                  <div className="flex flex-col min-w-0 overflow-hidden">
                                    <span className="text-[8px] font-black leading-none truncate text-gray-900">{pill.value}</span>
                                    {pill.label && <span className="text-[6px] font-bold text-gray-400 uppercase tracking-tighter truncate">{pill.label}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-1 mb-3">
                             {item.warranty && (
                               <p className="flex items-center gap-1.5 text-[8px] font-black text-mint-success uppercase tracking-tighter">
                                  <ShieldCheck size={10} /> {item.warranty}
                               </p>
                             )}
                             {item.gifts && (
                               <p className="flex items-center gap-1.5 text-[8px] font-black text-purple-brand uppercase tracking-tighter">
                                  <ShoppingBag size={10} /> {item.gifts}
                               </p>
                             )}
                          </div>

                          <div className="mt-auto pt-3 border-t border-black/5 flex items-end justify-between">
                             <div>
                                <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Precio Final</p>
                                <p className="text-2xl font-black text-gray-900 tracking-tighter leading-none">${Number(displayPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                             </div>
                             <p className="text-[7px] font-bold text-purple-brand uppercase tracking-widest italic">IVA Incluido</p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </header>

            {quote.quote_type === 'options' && (
              <div className="bg-white rounded-[2rem] p-8 border border-black/5 shadow-sm text-center no-print">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">¿Cuál opción prefieres?</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-lg mx-auto mb-6">
                  Contacta con tu asesor de ventas para confirmar disponibilidad inmediata de la opción elegida.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                   <button 
                     onClick={() => window.print()}
                     className="flex items-center gap-2 px-6 py-3 bg-white border border-black/10 text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                   >
                      <Printer size={14} /> Descargar Comparativa
                   </button>
                   <a 
                     href={`https://wa.me/593999046647?text=Hola! Estoy interesado en la proforma ${quote.slug}. Me gustaría la opción...`}
                     target="_blank"
                     className="flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#25D366]/20"
                   >
                      <MessageCircle size={14} /> Contactar Asesor
                   </a>
                </div>
              </div>
            )}
          </div>

          {quote.quote_type !== 'options' && (
            <div className="lg:col-span-4 flex flex-col gap-6 no-print">
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
        </div>

        {/* Sellos de Confianza Banana */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 py-10 border-t border-black/5">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-2xl">✅</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Somos distribuidores oficiales en Ecuador</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-2xl">🛡️</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Garantía directa de fabricante</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-2xl">🔧</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Upgrade de tu equipo sin afectar la garantía</p>
          </div>
        </div>

        <footer className="mt-10 pt-10 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-brand rounded-full flex items-center justify-center text-white font-black">B</div>
              <div>
                 <p className="text-xs font-black text-gray-900 uppercase">Banana Computer</p>
                 <p className="text-[10px] font-bold text-gray-400">High Performance Retail</p>
              </div>
           </div>
           <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">bananacomputer.com © 2026</p>
        </footer>
      </main>
      <div className="no-print">
        <Footer />
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          main { padding-top: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .bg-cream-bg { background: white !important; }
          .shadow-2xl, .shadow-xl, .shadow-sm { box-shadow: none !important; border: 1px solid #eee !important; }
          .print-container { 
            border: none !important; 
            padding: 0 !important; 
            overflow: visible !important; 
            display: block !important;
          }
          
          /* Forzar visibilidad del contenido de la proforma */
          .lg\:col-span-12, .lg\:col-span-8 { width: 100% !important; display: block !important; }
          .grid.grid-cols-1.lg\:grid-cols-12 { display: block !important; }

          /* CAMBIO A FLEX PARA PRINT (Más estable que Grid en PDF) */
          .grid.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
            margin-top: 15px !important;
            justify-content: space-between !important;
          }
          
          .grid.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 > a {
            width: 48% !important; /* Más seguro para 2 columnas */
            max-width: 48% !important;
            display: flex !important;
            flex-direction: column !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 1px solid #eee !important;
            padding: 10px !important;
            min-height: auto !important;
            background: white !important;
          }

          /* Forzar colores para impresión */
          h1, h2, h3, p, span, td, th { color: black !important; opacity: 1 !important; }
          .text-purple-brand { color: #5D2D91 !important; }
          .text-mint-success { color: #00B894 !important; }
          
          /* Reducir textos para que quepan */
          h1 { font-size: 20px !important; }
          h3 { font-size: 10px !important; margin-bottom: 4px !important; }
          .text-2xl { font-size: 16px !important; }
          .text-xl { font-size: 14px !important; }
          .text-[7px], .text-[8px], .text-[9px], .text-[10px] { font-size: 7px !important; }
          
          /* Reducir espacios en blanco */
          .mb-10, .mb-8, .pb-8 { margin-bottom: 10px !important; padding-bottom: 10px !important; }
          .p-8, .p-10 { padding: 15px !important; }
          
          /* Forzar visibilidad de imágenes y evitar recortes */
          img { max-height: 120px !important; width: auto !important; margin: 0 auto !important; }
          .aspect-square { height: 140px !important; margin-bottom: 8px !important; }

          /* Evitar saltos de página a mitad de una tarjeta */
          .group { page-break-inside: avoid; break-inside: avoid; }

          /* Sellos de confianza en una sola fila para print */
          .mt-16.grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            padding-top: 2rem !important;
            margin-top: 2rem !important;
          }
          .mt-16.grid .text-2xl { font-size: 1.2rem !important; }
          .mt-16.grid p { font-size: 8px !important; }
        }
      `}</style>
    </div>
  );
}
