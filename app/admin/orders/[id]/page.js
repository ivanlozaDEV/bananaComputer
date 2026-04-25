"use client";
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Package,
  CreditCard, MapPin, User, ShoppingBag, Receipt,
  Phone, Mail, Hash, Shield
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const STATUS_CONFIG = {
  paid: { label: 'Pagado', color: 'text-mint-success', bg: 'bg-mint-success/10', border: 'border-mint-success/20', Icon: CheckCircle2 },
  pending: { label: 'Pendiente', color: 'text-banana-yellow', bg: 'bg-banana-yellow/10', border: 'border-banana-yellow/20', Icon: Clock },
  cancelled: { label: 'Cancelado', color: 'text-raspberry', bg: 'bg-raspberry/10', border: 'border-raspberry/20', Icon: XCircle },
};

function InfoBlock({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className={`text-sm font-bold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function Section({ icon: Icon, title, iconColor = 'text-purple-brand', children }) {
  return (
    <div className="bg-white border border-black/10 rounded-3xl p-6 shadow-sm">
      <h2 className="flex items-center gap-2.5 text-base font-black text-gray-900 mb-6">
        <div className={`p-2 rounded-xl bg-black/5 ${iconColor}`}><Icon size={16} /></div>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers ( id, full_name, phone, email:id ),
          order_items (
            id, quantity, unit_price,
            products ( id, name, sku, image_url, price )
          )
        `)
        .eq('id', id)
        .single();

      if (error) { setError(error.message); }
      else { setOrder(data); }
      setLoading(false);
    };
    if (id) fetchOrder();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <div className="w-10 h-10 border-4 border-black/5 border-t-purple-brand rounded-full animate-spin" />
    </div>
  );

  if (error || !order) return (
    <div className="py-20 text-center text-gray-400 font-medium">
      <p>No se encontró el pedido.</p>
      <Link href="/admin/orders" className="text-purple-brand text-sm font-black mt-4 inline-block">← Volver a Pedidos</Link>
    </div>
  );

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const billing = order.billing_address || {};
  const shipping = order.shipping_address || {};
  const customer = order.customers || {};
  const items = order.order_items || [];
  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-6xl">
      
      {/* ── Header ── */}
      <header className="flex flex-col gap-4">
        <Link href="/admin/orders" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors w-fit">
          <ArrowLeft size={12} /> Volver a Pedidos
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight text-gray-900">{order.order_number || 'Pedido'}</h1>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm`}>
               {cfg.label}
            </span>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Fecha del Pedido</p>
            <p className="font-bold text-gray-700 text-sm whitespace-nowrap">{new Date(order.created_at).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
        </div>
      </header>

      {/* ── 1. Perfil de Cliente (Barra Horizontal) ── */}
      <div className="bg-white border border-black/10 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-brand/5 border border-purple-brand/10 flex items-center justify-center text-purple-brand font-black text-lg">
            {(customer.full_name || billing.full_name || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Cliente</p>
            <p className="font-black text-gray-900 leading-none">{customer.full_name || billing.full_name || 'Invitado'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-8">
          <InfoBlock label="Email" value={billing.email} />
          <InfoBlock label="Teléfono" value={customer.phone || billing.phone} />
          <InfoBlock label="Cédula/RUC" value={billing.id_number} />
        </div>
      </div>

      {/* ── 2. Direcciones (Side by Side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={Receipt} title="Facturación" iconColor="text-banana-yellow">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-1">{billing.full_name}</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {billing.street_main} {billing.house_number}<br/>
                {billing.street_secondary && <span className="opacity-60 text-xs italic">y {billing.street_secondary}<br/></span>}
                <span className="font-bold text-gray-800">{billing.city}, {billing.province}</span>
                {billing.zip_code && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded-lg text-[10px] font-mono">{billing.zip_code}</span>}
              </p>
            </div>
          </div>
        </Section>

        <Section icon={MapPin} title="Envío" iconColor="text-mint-success">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-1">{shipping.full_name}</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {shipping.street_main} {shipping.house_number}<br/>
                {shipping.street_secondary && <span className="opacity-60 text-xs italic">y {shipping.street_secondary}<br/></span>}
                <span className="font-bold text-gray-800">{shipping.city}, {shipping.province}</span>
                {shipping.zip_code && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded-lg text-[10px] font-mono">{shipping.zip_code}</span>}
              </p>
            </div>
            {JSON.stringify(billing) === JSON.stringify(shipping) && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-mint-success/5 border border-mint-success/20 rounded-full">
                 <CheckCircle2 size={12} className="text-mint-success" />
                 <span className="text-[9px] font-black uppercase text-mint-success">Misma que facturación</span>
              </div>
            )}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── 3. Productos (2/3 width) ── */}
        <div className="lg:col-span-2">
          <Section icon={ShoppingBag} title={`Contenido del Pedido (${items.length} ítems)`} iconColor="text-purple-brand">
            <div className="space-y-4 divide-y divide-black/5">
              {items.map(item => {
                const product = item.products || {};
                return (
                  <div key={item.id} className="flex items-center gap-4 group pt-4 first:pt-0 last:pb-0">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-black/5 overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <img 
                        src={product.image_url || 'https://via.placeholder.com/150'} 
                        alt={product.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate leading-tight">{product.name || 'Producto'}</p>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">SKU: {product.sku || '—'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity} × <span className="font-bold text-gray-700">${Number(item.unit_price).toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">${(item.quantity * item.unit_price).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
              </div>
            </Section>
        </div>

        {/* ── 4. Pago y Totales (1/3 width) ── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Section icon={Hash} title="Resumen" iconColor="text-banana-yellow">
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Subtotal (Base)</span>
                <span className="font-bold text-gray-700">${(Number(order.total) / 1.15).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">IVA (15%)</span>
                <span className="font-bold text-gray-700">${(Number(order.total) - (Number(order.total) / 1.15)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Envío</span>
                <span className="font-bold text-mint-success">Gratis</span>
              </div>
              <div className="pt-4 border-t border-black/5 flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Total Neto</span>
                <span className="text-3xl font-black text-gray-900">${Number(order.total).toFixed(2)}</span>
              </div>
              
              {/* PayPhone Integration */}
              <div className="mt-8 pt-6 border-t border-black/5 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-raspberry/5 flex items-center justify-center text-raspberry">
                       <CreditCard size={14} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Pago PayPhone</p>
                       <p className="text-xs font-bold text-gray-900">Tarjeta de Crédito/Débito</p>
                    </div>
                 </div>
                 {order.authorization_code && (
                   <div className="flex justify-between items-center p-3 bg-mint-success/5 border border-mint-success/20 rounded-2xl">
                      <span className="text-[9px] font-black uppercase tracking-widest text-mint-success">Autorización</span>
                      <span className="font-mono text-xs font-black text-gray-700">{order.authorization_code}</span>
                   </div>
                 )}
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">ID Transacción</p>
                    <p className="text-[10px] font-mono text-gray-400 break-all leading-tight opacity-60">
                       {order.payphone_transaction_id || order.client_transaction_id}
                    </p>
                 </div>
                 <div className="pt-4 border-t border-black/5 flex items-center gap-2 text-[10px] font-mono text-gray-400">
                    <Shield size={10} />
                    <span>ID Interno: {order.id.slice(0,18)}...</span>
                 </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
