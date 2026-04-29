"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import {
  Printer, ArrowLeft, Download, ShieldCheck,
  MapPin, Globe, Mail, Phone, CreditCard, ShoppingBag,
  Hash, Calendar, FileCheck
} from 'lucide-react';

export default function QuoteViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error(error);
        return;
      }
      setQuote(data);
      setLoading(false);
    };
    fetchQuote();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-purple-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { customer_data, items, totals, slug, created_at } = quote;
  const isTransfer = (totals?.paymentMode || 'transfer') === 'transfer';

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white pb-20 print:pb-0">
      {/* Barra de Herramientas (No se imprime) */}
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-all"
        >
          <ArrowLeft size={14} /> Volver al listado
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-8 py-4 bg-purple-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-purple-brand/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Printer size={18} /> Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* DOCUMENTO PRINCIPAL (Diseño de Alta Densidad) */}
      <main className="max-w-[850px] mx-auto bg-white shadow-2xl print:shadow-none print:max-w-full relative flex flex-col overflow-visible">

        {/* Encabezado con Logo y Marca */}
        <div className="p-10 md:p-16">
          <header className="flex justify-between items-start mb-16">
            <div className="flex items-center gap-4">
              <Logo size="medium" />
              <div>
                <h1 className="text-sm font-black tracking-tighter leading-none mb-1 font-pixel-legacy">
                  <span className="text-purple-brand">BANANA</span><br />
                  <span className="text-gray-900 uppercase">COMPUTER</span>
                </h1>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-brand italic">
                  Peeling into the future
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-white border border-black/5 rounded-xl px-4 py-3 text-right print:border-gray-200">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Cotización</p>
                <p className="text-lg font-black text-purple-brand tracking-tight">#{slug}</p>
                <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] font-bold text-gray-400">
                  <Calendar size={10} /> {new Date(created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </header>

          {/* Grid de Información Compacto */}
          <div className="grid grid-cols-2 gap-8 mb-10 border-t border-b border-black/5 py-8 print:border-gray-100">
            {/* Sección Cliente */}
            <div>
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-brand" /> CLIENTE
              </h3>
              <div className="space-y-1">
                <p className="text-lg font-black text-gray-900 leading-tight">{customer_data.full_name?.toUpperCase()}</p>
                <p className="text-[10px] font-black text-purple-brand opacity-60 uppercase tracking-widest">ID: {customer_data.id_number || 'Consumidor Final'}</p>
                <div className="pt-2 flex flex-col gap-1 text-[10px] font-bold text-gray-500">
                  <span className="flex items-center gap-2"><Mail size={12} className="text-purple-brand opacity-40" /> {customer_data.email || 'N/A'}</span>
                  <span className="flex items-center gap-2"><Phone size={12} className="text-purple-brand opacity-40" /> {customer_data.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Dirección de Entrega Completa */}
            <div>
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-banana-yellow" /> DIRECCIÓN
              </h3>
              {customer_data.address?.street_main ? (
                <div className="space-y-1">
                  {/* Calle Principal y Casa */}
                  <p className="text-xs font-black text-gray-800 leading-snug">
                    {customer_data.address.street_main} {customer_data.address.house_number}
                  </p>

                  {/* Calle Secundaria */}
                  {customer_data.address.street_secondary && (
                    <p className="text-[10px] font-bold text-gray-500 leading-tight">
                      y {customer_data.address.street_secondary}
                    </p>
                  )}

                  {/* Ciudad y Provincia */}
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight pt-1">
                    {customer_data.address.city || customer_data.address.canton}
                    {customer_data.address.province && `, ${customer_data.address.province}`}
                  </p>

                  {/* Referencia */}
                  {customer_data.address.reference && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-dashed border-black/10">
                      <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Referencia</p>
                      <p className="text-[9px] font-bold text-gray-500 leading-tight italic">"{customer_data.address.reference}"</p>
                    </div>
                  )}

                  {/* Código Postal */}
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-brand/5 border border-purple-brand/10 rounded text-[8px] font-black uppercase tracking-widest text-purple-brand">
                      <MapPin size={10} /> {customer_data.address.zip_code || 'Entrega Local'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-black/5 text-[10px] font-bold text-gray-400 italic">
                  Retiro en Showroom (Quito)
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Productos Refinada */}
          <div className="mb-8">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-black/10">
                  <th className="pb-2 font-black">Equipo / Descripción</th>
                  <th className="pb-2 text-center font-black">Cant</th>
                  <th className="pb-2 text-right font-black">P. Unitario</th>
                  <th className="pb-2 text-right font-black">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {items.map((item, idx) => {
                  const displayPrice = isTransfer ? (item.transfer_price || item.price * 0.94) : item.price;
                  return (
                    <tr key={idx}>
                      <td className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-black/5 overflow-hidden flex-shrink-0 print:border-gray-100 p-1">
                            {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-contain" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 mb-0.5">{item.name}</p>
                            <span className="px-1.5 py-0.5 bg-purple-brand/10 text-purple-brand rounded-[4px] text-[7px] font-black uppercase tracking-widest">Garantía 1 Año</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center text-[10px] font-black text-gray-500">{item.quantity}</td>
                      <td className="py-4 text-right text-[10px] font-bold text-gray-600">${(displayPrice / 1.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-4 text-right text-[10px] font-black text-gray-900">${((displayPrice / 1.15) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sección de Totales Compacta */}
          <div className="grid grid-cols-12 gap-10 mt-8 items-end">
            <div className="col-span-7">
              <div className="bg-gray-50 rounded-2xl p-6 border border-black/5">
                <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-brand mb-3 flex items-center gap-2">
                  <CreditCard size={12} /> PAGO: {isTransfer ? 'TRANSFERENCIA (-6%)' : 'TARJETA (PVP)'}
                </h4>
                {isTransfer && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Banco Pichincha</p>
                      <p className="text-[9px] font-bold text-gray-800 uppercase leading-none">Cta. Corriente #123456789</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Beneficiario</p>
                      <p className="text-[9px] font-bold text-gray-800 uppercase leading-none">Banana Computer S.A.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-5 space-y-2">
              <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>${Number(totals.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {Number(totals.discount) > 0 && (
                <div className="flex justify-between text-[9px] font-black text-raspberry uppercase tracking-widest">
                  <span>Descuento</span>
                  <span>-${Number(totals.discount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <span>IVA (15%)</span>
                <span>${Number(totals.tax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-3 border-t-2 border-black mt-2 flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-tighter text-gray-900">Total Neto</span>
                <span className="text-3xl font-black text-gray-900 tracking-tighter">
                  ${Number(totals.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Corporativo Refinado */}
          <div className="mt-16 pt-8 border-t border-black/5 flex justify-between items-center">
            <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-[0.2em] text-gray-300">
              <span>Quito, Ecuador</span>
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <span>bananacomputer.com</span>
            </div>
            <div className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">
              ID: {quote.id.substring(0, 8).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Link de Pago Dinámico y Real */}
        <div className="bg-purple-brand text-white px-8 py-4 flex flex-col items-center gap-0.5 text-center mt-auto">
          <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/50">Paga esta cotización en línea:</p>
          <a
            href={`${window.location.origin}/cotizacion/${slug}`}
            className="text-[10px] font-bold hover:text-banana-yellow transition-colors underline underline-offset-2"
          >
            {window.location.host}/cotizacion/{slug}
          </a>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            margin: 15mm;
            size: A4 portrait;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, aside, header.print-hidden, .print-hidden, .no-print {
            display: none !important;
          }
          main {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            display: block !important;
          }
          header {
            display: flex !important;
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
