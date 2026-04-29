"use client";
import React from 'react';
import { Pencil, Trash2, Box, Tag, DollarSign, CheckCircle2, XCircle, Layers } from 'lucide-react';

const ProductTable = ({ products, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto rounded-[2rem] border border-black/10 bg-white shadow-sm scrollbar-hide">
      <table className="w-full text-left min-w-[1000px]">
        <thead>
          <tr className="border-b border-black/10 bg-gray-50/50">
            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Producto</th>
            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Modelo</th>
            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">SKU</th>
            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Categoría</th>
            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Subcategoría</th>
            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Etiqueta</th>
            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Precio</th>
            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">Stock</th>
            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">Estado</th>
            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 text-right pr-12">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-b border-black/10 last:border-0 hover:bg-gray-50/50 transition-all group">
              <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-white border border-black/10 shadow-inner overflow-hidden flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Box size={20} className="text-gray-200" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm tracking-tight text-gray-900 group-hover:text-purple-brand transition-colors">{p.name}</span>
                  </div>
                </div>
              </td>
              <td className="px-8 py-5">
                <span className="text-[10px] font-bold text-purple-brand bg-purple-brand/5 px-2 py-1 rounded-lg border border-purple-brand/20">
                  {p.model_number || 'S/M'}
                </span>
              </td>
              <td className="px-8 py-5">
                <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-black/10">
                  {p.sku || '—'}
                </span>
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                  <Tag size={12} className="text-purple-brand" />
                  {p.categories?.name || '—'}
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                  <Layers size={12} className="text-gray-300" />
                  {p.product_subcategories?.length > 0
                    ? p.product_subcategories.map(ps => ps.subcategories?.name).filter(Boolean).join(', ')
                    : (p.subcategory?.name || '—')}
                </div>
              </td>
              {/* Badge type */}
              <td className="px-8 py-5">
                {(() => {
                  const badge = p.badge_type || 'new';
                  const map = {
                    new:         { label: 'NUEVO',          cls: 'bg-banana-yellow text-black' },
                    featured:    { label: 'DESTACADO',      cls: 'bg-purple-brand text-white' },
                    sale:        { label: 'OFERTA',         cls: 'bg-orange-500 text-white' },
                    unavailable: { label: 'NO DISPONIBLE',  cls: 'bg-raspberry text-white' },
                  };
                  const { label, cls } = map[badge] || map.new;
                  return (
                    <span className={`px-2 py-0.5 rounded-full text-[7px] font-black tracking-widest uppercase ${cls}`}>
                      {label}
                    </span>
                  );
                })()}
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-1 font-black text-sm text-gray-900">
                  <span className="text-[10px] text-gray-400 font-bold">$</span>
                  {p.price !== null && p.price !== undefined && !isNaN(parseFloat(p.price)) ? parseFloat(p.price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                </div>
              </td>
              <td className="px-8 py-5 text-center">
                <span className={`text-xs font-black ${parseInt(p.stock) <= 0 ? 'text-raspberry' : 'text-mint-success'}`}>
                  {p.stock}
                </span>
              </td>
              <td className="px-8 py-5 text-center">
                 <div className="flex justify-center">
                   {p.is_active ? <CheckCircle2 size={16} className="text-mint-success" /> : <XCircle size={16} className="text-gray-200" />}
                 </div>
              </td>
              <td className="px-8 py-5 text-right pr-12">
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => onEdit(p)}
                    className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-black hover:text-white transition-all shadow-sm"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(p.id)}
                    className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-raspberry hover:text-white transition-all shadow-sm"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan="9" className="px-8 py-20 text-center">
                <div className="flex flex-col items-center gap-4 text-gray-200">
                  <Box size={40} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">No hay productos en el inventario</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
