import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const ProductTable = ({ products, onEdit, onDelete }) => {
  return (
    <table className="admin-table">
      <thead>
        <tr><th>Producto</th><th>SKU</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Activo</th><th></th></tr>
      </thead>
      <tbody>
        {products.map(p => (
          <tr key={p.id}>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {p.image_url
                  ? <img src={p.image_url} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '8px' }} />
                  : <div style={{ width: '36px', height: '36px', background: '#272727', borderRadius: '8px' }} />
                }
                <span style={{ color: '#fff', fontWeight: 600 }}>{p.name}</span>
              </div>
            </td>
            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.sku}</td>
            <td>{p.categories?.name || '—'}</td>
            <td>{p.price !== null && p.price !== undefined && !isNaN(parseFloat(p.price)) ? `$${parseFloat(p.price).toFixed(2)}` : '—'}</td>
            <td>{p.stock}</td>
            <td><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: p.is_active ? '#4ade80' : '#555' }} /></td>
            <td>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="admin-btn admin-btn-ghost" style={{ padding: '0.4rem 0.6rem' }} onClick={() => onEdit(p)}><Pencil size={14} /></button>
                <button className="admin-btn admin-btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={() => onDelete(p.id)}><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ProductTable;
