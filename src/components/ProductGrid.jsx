import React from 'react';
import ProductCard from './ProductCard';
import { useStore } from '../context/StoreContext';
import './ProductGrid.css';

const ProductGrid = () => {
  const { products, loading } = useStore();

  return (
    <section className="product-grid-container">
      <div className="grid-header">
        <h2 className="section-title">NOVEDADES</h2>
        <div className="system-status">
          <span className="dot"></span>
          SISTEMA EN LÍNEA
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>Cargando productos...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
          No hay productos disponibles. <a href="/admin/products" style={{ color: '#1a1a1a' }}>Añade desde el admin →</a>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
