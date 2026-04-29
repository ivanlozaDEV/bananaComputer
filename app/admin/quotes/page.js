"use client";
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, CheckCircle2, Clock, RefreshCw,
  Plus, FileText, Link, ExternalLink, Trash2, XCircle, Pencil
} from 'lucide-react';
import NextLink from 'next/link';
import { useToast } from '@/context/ToastContext';

const STATUS_CONFIG = {
  sent:    { label: 'Enviada', color: 'text-purple-brand', bg: 'bg-purple-brand/10', border: 'border-purple-brand/20', Icon: Clock },
  paid:    { label: 'Pagada',   color: 'text-mint-success',  bg: 'bg-mint-success/10',  border: 'border-mint-success/20',  Icon: CheckCircle2 },
  expired: { label: 'Expirada', color: 'text-gray-400',      bg: 'bg-gray-100',          border: 'border-gray-200',         Icon: XCircle },
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => { fetchQuotes(); }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Quotes]', error);
      showToast('Error al cargar cotizaciones', 'error');
    } else {
      setQuotes(data || []);
    }
    setLoading(false);
  };

  const copyQuoteLink = (slug) => {
    const url = `${window.location.origin}/cotizacion/${slug}`;
    navigator.clipboard.writeText(url);
    showToast('Link copiado al portapapeles', 'success');
  };

  const deleteQuote = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta cotización?')) return;
    
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) {
      showToast('Error al eliminar', 'error');
    } else {
      setQuotes(prev => prev.filter(q => q.id !== id));
      showToast('Cotización eliminada', 'success');
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4">
        <NextLink href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors w-fit">
          <ArrowLeft size={12} /> Volver al Dashboard
        </NextLink>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Cotizaciones</h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Genera presupuestos rápidos y links de pago para tus clientes.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchQuotes}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-black/10 text-xs font-black text-gray-500 hover:text-black hover:border-black/20 transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <NextLink
              href="/admin/quotes/new"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-brand text-white text-xs font-black shadow-lg shadow-purple-brand/20 hover:scale-[1.02] transition-all"
            >
              <Plus size={16} /> NUEVA COTIZACIÓN
            </NextLink>
          </div>
        </div>
      </header>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-black/5 rounded-3xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-black/5 border-t-purple-brand rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Cargando cotizaciones...</span>
          </div>
        </div>
      ) : quotes.length === 0 ? (
        <div className="py-20 text-center text-gray-300 font-medium italic bg-white border border-black/5 rounded-3xl flex flex-col items-center gap-4">
          <FileText size={40} className="opacity-20" />
          <p>No hay cotizaciones todavía. ¡Crea la primera!</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/5 bg-gray-50/50">
                {['Estado', 'Cliente', 'Items', 'Total', 'Vence', 'Acciones'].map(h => (
                  <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => {
                const isExpired = new Date(quote.expires_at) < new Date() && quote.status !== 'paid';
                const status = isExpired ? 'expired' : quote.status;
                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.sent;
                const itemsCount = quote.items?.length || 0;
                
                return (
                  <tr key={quote.id} className="border-b border-black/5 last:border-0 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        <cfg.Icon size={10} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-gray-800">{quote.customer_data.full_name || 'Sin nombre'}</p>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">{quote.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-700">{itemsCount} productos</p>
                      <p className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">
                        {quote.items.map(i => i.name).join(', ')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-900">${Number(quote.totals.total).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? 'text-raspberry' : 'text-gray-400'}`}>
                        {new Date(quote.expires_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <NextLink
                          href={`/admin/quotes/${quote.id}/view`}
                          className="p-2 text-gray-400 hover:text-purple-brand hover:bg-purple-brand/5 rounded-xl transition-all"
                          title="Ver / Imprimir"
                        >
                          <FileText size={16} />
                        </NextLink>
                        <button
                          onClick={() => copyQuoteLink(quote.slug)}
                          className="p-2 text-gray-400 hover:text-purple-brand hover:bg-purple-brand/5 rounded-xl transition-all"
                          title="Copiar Link"
                        >
                          <Link size={16} />
                        </button>
                        <NextLink
                          href={`/admin/quotes/${quote.id}/edit`}
                          className="p-2 text-gray-400 hover:text-purple-brand hover:bg-purple-brand/5 rounded-xl transition-all"
                          title="Editar Cotización"
                        >
                          <Pencil size={16} />
                        </NextLink>
                        <NextLink
                          target="_blank"
                          href={`/cotizacion/${quote.slug}`}
                          className="p-2 text-gray-400 hover:text-purple-brand hover:bg-purple-brand/5 rounded-xl transition-all"
                          title="Ver Link Público"
                        >
                          <ExternalLink size={16} />
                        </NextLink>
                        <button
                          onClick={() => deleteQuote(quote.id)}
                          className="p-2 text-gray-400 hover:text-raspberry hover:bg-raspberry/5 rounded-xl transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
