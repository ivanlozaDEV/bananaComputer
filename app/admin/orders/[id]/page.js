"use client";
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { getOrderBreakdown } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Package,
  CreditCard, MapPin, User, ShoppingBag, Receipt,
  Phone, Mail, Hash, Shield, Building2, Tag,
  Printer, Truck, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'text-banana-yellow', bg: 'bg-banana-yellow/10', border: 'border-banana-yellow/20', Icon: Clock },
  verificando_pago: { label: 'Verificando Pago', color: 'text-banana-yellow', bg: 'bg-banana-yellow/10', border: 'border-banana-yellow/20', Icon: Clock },
  paid: { label: 'Pagado', color: 'text-mint-success', bg: 'bg-mint-success/10', border: 'border-mint-success/20', Icon: CheckCircle2 },
  shipped: { label: 'Enviado', color: 'text-purple-brand', bg: 'bg-purple-brand/10', border: 'border-purple-brand/20', Icon: Package },
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
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers ( id, full_name, phone ),
          order_items (
            id, quantity, unit_price,
            products ( id, name, sku, image_url, price, transfer_price )
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

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`¿Cambiar estado a ${STATUS_CONFIG[newStatus]?.label}?`)) return;
    
    setUpdatingStatus(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert("Error actualizando estado: " + error.message);
    } else {
      setOrder(prev => ({ ...prev, status: newStatus }));
      
      // Notify Customer via Email
      const customerEmail = order.customers?.email || order.billing_address?.email;
      if (customerEmail) {
        fetch('/api/email/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'status_update',
            order,
            customerEmail,
            newStatus
          })
        }).catch(err => console.error("Email notification failed:", err));
      }
    }
    setUpdatingStatus(false);
  };

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
        <div className="flex items-center justify-between no-print">
          <Link href="/admin/orders" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors w-fit">
            <ArrowLeft size={12} /> Volver a Pedidos
          </Link>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-purple-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-brand/20"
          >
            <Printer size={16} /> Imprimir Etiqueta de Envío
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight text-gray-900">{order.order_number || 'Pedido'}</h1>
            <div className="relative group">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm cursor-pointer flex items-center gap-2`}>
                 {cfg.label}
                 <ChevronRight size={10} className="rotate-90" />
              </span>
              
              {/* Status Dropdown */}
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-black/10 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                {Object.entries(STATUS_CONFIG).map(([key, item]) => (
                  <button
                    key={key}
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(key)}
                    className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 flex items-center gap-2 transition-colors ${order.status === key ? 'text-purple-brand bg-purple-brand/5' : 'text-gray-400'}`}
                  >
                    <item.Icon size={12} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            {updatingStatus && <div className="w-4 h-4 border-2 border-purple-brand/20 border-t-purple-brand rounded-full animate-spin" />}
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
          <div className="space-y-3">
            <InfoBlock label="Nombre" value={billing.full_name} />
            <InfoBlock label="Identificación" value={billing.id_number} />
            <InfoBlock label="Email" value={billing.email} />
            <InfoBlock label="Teléfono" value={billing.phone} />
            <InfoBlock label="Calle Principal" value={billing.street_main} />
            {billing.street_secondary && <InfoBlock label="Calle Secundaria" value={billing.street_secondary} />}
            <InfoBlock label="Nro. Casa/Apto" value={billing.house_number} />
            <InfoBlock label="Ciudad" value={billing.city} />
            <InfoBlock label="Cantón" value={billing.canton} />
            <InfoBlock label="Provincia" value={billing.province} />
            {billing.zip_code && <InfoBlock label="Código Postal" value={billing.zip_code} />}
          </div>
        </Section>

        <Section icon={MapPin} title="Envío" iconColor="text-mint-success">
          <div className="space-y-3">
            <InfoBlock label="Nombre" value={shipping.full_name} />
            <InfoBlock label="Teléfono" value={shipping.phone} />
            <InfoBlock label="Calle Principal" value={shipping.street_main} />
            {shipping.street_secondary && <InfoBlock label="Calle Secundaria" value={shipping.street_secondary} />}
            <InfoBlock label="Nro. Casa/Apto" value={shipping.house_number} />
            <InfoBlock label="Ciudad" value={shipping.city} />
            <InfoBlock label="Cantón" value={shipping.canton} />
            <InfoBlock label="Provincia" value={shipping.province} />
            {shipping.zip_code && <InfoBlock label="Código Postal" value={shipping.zip_code} />}
            
            {JSON.stringify(billing) === JSON.stringify(shipping) && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-mint-success/5 border border-mint-success/20 rounded-full w-fit">
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
                const isTransfer = order.payment_method === 'transfer';
                const displayPrice = item.unit_price;
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
                        {item.quantity} × <span className="font-bold text-gray-700">${(Number(displayPrice) / 1.15).toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">${((item.quantity * displayPrice) / 1.15).toFixed(2)}</p>
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
              {(() => {
                const itemsWithQty = items.map(it => ({ ...it, price: it.unit_price }));
                const pricing = getOrderBreakdown(itemsWithQty, order.payment_method || 'transfer');
                return (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-bold uppercase tracking-widest">Subtotal</span>
                      <span className="font-bold text-gray-700">${pricing.baseTotalSinIva.toFixed(2)}</span>
                    </div>
                    {pricing.hasDiscount && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-banana-yellow">Descuento</span>
                        <span className="font-bold text-banana-yellow">-${pricing.discountSinIva.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs pt-4 border-t border-black/5">
                      <span className="text-gray-400 font-bold uppercase tracking-widest">Base Imponible</span>
                      <span className="font-bold text-gray-700">${pricing.baseImponible.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-bold uppercase tracking-widest">IVA (15%)</span>
                      <span className="font-bold text-gray-700">${pricing.iva.toFixed(2)}</span>
                    </div>
                  </>
                );
              })()}
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Envío</span>
                <span className="font-bold text-mint-success">Gratis</span>
              </div>
              <div className="pt-4 border-t border-black/5 flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Total Neto</span>
                <span className="text-3xl font-black text-gray-900">${Number(order.total).toFixed(2)}</span>
              </div>

              {/* Payment method block — dynamic */}
              <div className="mt-8 pt-6 border-t border-black/5 space-y-4">
                {order.payment_method === 'transfer' ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-brand/5 flex items-center justify-center text-purple-brand">
                        <Building2 size={14} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Método de Pago</p>
                        <p className="text-xs font-bold text-gray-900">Transferencia Bancaria</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-banana-yellow/10 border border-banana-yellow/20 rounded-2xl">
                      <Tag size={12} className="text-banana-yellow" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-banana-yellow">Descuento ~6% aplicado</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-raspberry/5 flex items-center justify-center text-raspberry">
                        <CreditCard size={14} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Método de Pago</p>
                        <p className="text-xs font-bold text-gray-900">PayPhone · Tarjeta</p>
                      </div>
                    </div>
                    {order.authorization_code && (
                      <div className="flex justify-between items-center p-3 bg-mint-success/5 border border-mint-success/20 rounded-2xl">
                        <span className="text-[9px] font-black uppercase tracking-widest text-mint-success">Autorización</span>
                        <span className="font-mono text-xs font-black text-gray-700">{order.authorization_code}</span>
                      </div>
                    )}
                    {(order.payphone_transaction_id || order.client_transaction_id) && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">ID Transacción</p>
                        <p className="text-[10px] font-mono text-gray-400 break-all leading-tight opacity-60">
                          {order.payphone_transaction_id || order.client_transaction_id}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div className="pt-4 border-t border-black/5 flex items-center gap-2 text-[10px] font-mono text-gray-400">
                  <Shield size={10} />
                  <span>ID: {order.id.slice(0,18)}...</span>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* ── Shipping Label (Print Only) ── */}
      <div className="print-only fixed inset-0 bg-white p-10 font-sans text-black">
        <div className="border-4 border-black p-8 max-w-[500px] mx-auto">
          <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-6">
            <div>
              <h2 className="text-4xl font-black mb-1">BANANA</h2>
              <p className="text-xs font-bold uppercase tracking-widest leading-none">High Performance Computing</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase">Pedido</p>
              <p className="text-2xl font-black">{order.order_number || order.id.slice(0,8)}</p>
            </div>
          </div>

          <div className="space-y-12 mb-12">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Truck size={12} /> Destinatario
              </p>
              <p className="text-2xl font-black uppercase mb-2">{shipping.full_name}</p>
              <p className="text-lg font-bold leading-tight">{shipping.street_main} {shipping.house_number}</p>
              <p className="text-lg font-bold leading-tight">{shipping.city}, {shipping.province}</p>
              {shipping.street_secondary && <p className="text-sm font-medium text-gray-600 mt-2 italic">{shipping.street_secondary}</p>}
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2">Teléfono</p>
                <p className="text-xl font-black">{shipping.phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2">Identificación</p>
                <p className="text-xl font-black">{shipping.id_number || billing.id_number}</p>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-black pt-8 flex flex-col items-center gap-4">
            <div className="w-full h-16 bg-gray-100 flex items-center justify-center font-mono font-bold border border-black/10">
              PLACEHOLDER_BARCODE_{order.order_number}
            </div>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-50">Frágil · Manéjese con cuidado</p>
          </div>
        </div>
      </div>
    </div>
  );
}
