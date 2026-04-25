"use client";
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShoppingBag, ArrowLeft, CheckCircle2, XCircle,
  Clock, RefreshCw, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG = {
  paid:      { label: 'Pagado',    color: 'text-mint-success',  bg: 'bg-mint-success/10',  border: 'border-mint-success/20',  Icon: CheckCircle2 },
  pending:   { label: 'Pendiente', color: 'text-banana-yellow', bg: 'bg-banana-yellow/10', border: 'border-banana-yellow/20', Icon: Clock },
  cancelled: { label: 'Cancelado', color: 'text-raspberry',     bg: 'bg-raspberry/10',     border: 'border-raspberry/20',    Icon: XCircle },
};

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all'); // 'all' | 'paid' | 'pending' | 'cancelled'

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, total, created_at,
        client_transaction_id, authorization_code,
        payphone_transaction_id, billing_address,
        customers ( full_name, phone ),
        order_items ( id, quantity, unit_price, products ( name, sku ) )
      `)
      .order('created_at', { ascending: false });

    if (error) console.error('[Orders]', error);
    else setOrders(data || []);
    setLoading(false);
  };

  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const totals = {
    all:       orders.length,
    paid:      orders.filter(o => o.status === 'paid').length,
    pending:   orders.filter(o => o.status === 'pending').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const revenue = orders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors w-fit">
          <ArrowLeft size={12} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Pedidos</h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Todas las compras confirmadas por PayPhone.</p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-black/10 text-xs font-black text-gray-500 hover:text-black hover:border-black/20 transition-all"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </header>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Pedidos',  value: totals.all,                      sub: 'órdenes' },
          { label: 'Pagados',        value: totals.paid,                      sub: 'aprobados' },
          { label: 'Pendientes',     value: totals.pending,                   sub: 'en espera' },
          { label: 'Ingresos',       value: `$${revenue.toFixed(2)}`,         sub: 'USD cobrado' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white border border-black/10 rounded-3xl p-5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{label}</p>
            <p className="text-2xl font-black text-gray-900">{loading ? '—' : value}</p>
            <p className="text-[9px] font-medium text-gray-300 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'paid', 'pending', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border
              ${filter === f
                ? 'bg-purple-brand text-white border-purple-brand shadow-lg shadow-purple-brand/20'
                : 'bg-white text-gray-500 border-black/10 hover:border-black/20 hover:text-black'}`}
          >
            {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagados' : f === 'pending' ? 'Pendientes' : 'Cancelados'}
            <span className="ml-1.5 opacity-60">({totals[f]})</span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-black/5 rounded-3xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-black/5 border-t-purple-brand rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Cargando pedidos...</span>
          </div>
        </div>
      ) : shown.length === 0 ? (
        <div className="py-20 text-center text-gray-300 font-medium italic bg-white border border-black/5 rounded-3xl">
          No hay pedidos {filter !== 'all' ? `con estado "${filter}"` : 'todavía'}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/5 bg-gray-50/50">
                {['Estado', 'Cliente', 'Productos', 'Total', 'Fecha', ''].map(h => (
                  <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const itemCount = order.order_items?.length || 0;
                const customerName = order.customers?.full_name || order.billing_address?.full_name || 'Cliente invitado';
                return (
                  <tr key={order.id} className="border-b border-black/5 last:border-0 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        <cfg.Icon size={10} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-gray-800">{customerName}</p>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">Ref: {order.order_number || order.id.slice(0,8)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-700">
                        {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium truncate max-w-[160px]">
                        {order.order_items?.map(i => i.products?.name).filter(Boolean).join(', ')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-900">${Number(order.total).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(order.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[9px] text-gray-300 font-medium">
                        {new Date(order.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-purple-brand opacity-0 group-hover:opacity-100 transition-all"
                      >
                        Ver detalle <ChevronRight size={12} />
                      </Link>
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
