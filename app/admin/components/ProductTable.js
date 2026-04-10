"use client";
import React from 'react';
import { Pencil, Trash2, Box, Tag, DollarSign, CheckCircle2, XCircle } from 'lucide-react';

const ProductTable = ({ products, onEdit, onDelete }) => {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5 bg-white/5">
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Producto</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">SKU</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Categoría</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Precio</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Stock</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Estado</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
              <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Box size={20} className="opacity-10" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-tight text-white group-hover:text-banana-yellow transition-colors">{p.name}</span>
                    <span className="text-[10px] opacity-40 uppercase tracking-widest font-black">{p.model_number || 'S/M'}</span>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                  {p.sku || '—'}
                </span>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Tag size={12} className="text-purple-brand" />
                  {p.categories?.name || '—'}
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-1 font-black text-sm text-white">
                  <span className="text-xs opacity-30">$</span>
                  {p.price !== null && p.price !== undefined && !isNaN(parseFloat(p.price)) ? parseFloat(p.price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}
                </div>
              </td>
              <td className="px-8 py-6 text-center">
                <span className={`text-xs font-black ${parseInt(p.stock) <= 0 ? 'text-raspberry' : 'text-mint-success'}`}>
                  {p.stock}
                </span>
              </td>
              <td className="px-8 py-6 text-center">
                 <div className="flex justify-center">
                   {p.is_active ? <CheckCircle2 size={16} className="text-mint-success opacity-40" /> : <XCircle size={16} className="text-gray-700" />}
                 </div>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onEdit(p)}
                    className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(p.id)}
                    className="p-2.5 rounded-xl bg-raspberry/10 text-raspberry hover:bg-raspberry hover:text-white transition-all shadow-sm"
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
              <td colSpan="7" className="px-8 py-20 text-center">
                <div className="flex flex-col items-center gap-4 opacity-20">
                  <Box size={40} />
                  <span className="text-xs font-black uppercase tracking-[0.3em]">No hay productos en el inventario</span>
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
