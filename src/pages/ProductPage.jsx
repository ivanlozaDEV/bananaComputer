import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import './ProductPage.css';

// Maps Lucide icon names (stored in DB) → emoji for display
const ICON_MAP = {
  'memory-stick': '🧠', 'hard-drive': '💾', 'cpu': '⚡', 'monitor': '🖥️',
  'battery': '🔋', 'scale': '⚖️', 'wifi': '📶', 'camera': '📷',
  'layers': '🎮', 'zap': '⚡', 'scan': '🌈', 'default': '⚙️',
};
const icon = (name) => ICON_MAP[name] || name || ICON_MAP.default;

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [attrs, setAttrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('specs'); // 'specs' | 'datasheet'
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: prod } = await supabase
        .from('products')
        .select('*, categories(name), subcategories(name)')
        .eq('id', id)
        .single();
      if (!prod) { navigate('/'); return; }
      setProduct(prod);

      // Load spec card attribute values + definitions
      const { data: prodAttrs } = await supabase
        .from('product_attributes')
        .select('value, attribute_definitions(name, unit, icon, display_order)')
        .eq('product_id', id)
        .order('attribute_definitions(display_order)');
      setAttrs(prodAttrs || []);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="pp-loading">
          <div className="pp-spinner" />
          <span>Cargando producto...</span>
        </div>
      </>
    );
  }

  const datasheetEntries = product.datasheet ? Object.entries(product.datasheet) : [];

  return (
    <>
      <Header />
      <div className="pp-root">

        {/* ── Breadcrumb ─────────────────────────────── */}
        <nav className="pp-breadcrumb">
          <button onClick={() => navigate('/')}>Inicio</button>
          <span>›</span>
          <span>{product.categories?.name || 'Productos'}</span>
          <span>›</span>
          <span className="pp-breadcrumb-current">{product.name}</span>
        </nav>

        {/* ── Hero: image + buy card ─────────────────── */}
        <section className="pp-hero">
          {/* Left: image */}
          <div className="pp-img-wrap">
            <div className="pp-img-frame">
              {product.image_url
                ? <img src={product.image_url} alt={product.name} className="pp-img" />
                : <div className="pp-img-placeholder">🍌</div>
              }
            </div>
            {/* Category badge */}
            {product.subcategories?.name && (
              <span className="pp-cat-badge">{product.subcategories.name}</span>
            )}
          </div>

          {/* Right: info + buy */}
          <div className="pp-info">
            <p className="pp-tagline">{product.tagline}</p>
            <h1 className="pp-name">{product.name}</h1>
            <p className="pp-subtitle">{product.marketing_subtitle}</p>

            {/* Spec pills */}
            {attrs.length > 0 && (
              <div className="pp-specs-row">
                {attrs.slice(0, 5).map((a, i) => (
                  <div key={i} className="pp-spec-pill">
                    <span className="pp-spec-icon">{icon(a.attribute_definitions?.icon)}</span>
                    <div>
                      <div className="pp-spec-val">{a.value}{a.attribute_definitions?.unit ? ` ${a.attribute_definitions.unit}` : ''}</div>
                      <div className="pp-spec-name">{a.attribute_definitions?.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Buy card (glassmorphism) */}
            <div className="pp-buy-card">
              <div className="pp-price-row">
                <span className="pp-price">${parseFloat(product.price).toFixed(2)}</span>
                <span className="pp-stock">{product.stock > 0 ? `${product.stock} en stock` : '⚠ Sin stock'}</span>
              </div>
              <button
                className={`pp-btn-cart ${added ? 'pp-btn-added' : ''}`}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
              </button>
              <p className="pp-sku">SKU: {product.sku}</p>
            </div>
          </div>
        </section>

        {/* ── Marketing body ─────────────────────────── */}
        {product.marketing_body && (
          <section className="pp-marketing">
            <p>{product.marketing_body}</p>
          </section>
        )}

        {/* ── Tabs: Especificaciones / Datasheet ─────── */}
        <section className="pp-tabs-section">
          <div className="pp-tabs">
            <button
              className={`pp-tab ${tab === 'specs' ? 'pp-tab-active' : ''}`}
              onClick={() => setTab('specs')}
            >Especificaciones</button>
            {datasheetEntries.length > 0 && (
              <button
                className={`pp-tab ${tab === 'datasheet' ? 'pp-tab-active' : ''}`}
                onClick={() => setTab('datasheet')}
              >Datasheet Técnico</button>
            )}
          </div>

          {tab === 'specs' && (
            <div className="pp-specs-grid">
              {attrs.length > 0 ? attrs.map((a, i) => (
                <div key={i} className="pp-spec-row">
                  <span className="pp-spec-row-icon">{icon(a.attribute_definitions?.icon)}</span>
                  <span className="pp-spec-row-name">{a.attribute_definitions?.name}</span>
                  <span className="pp-spec-row-val">
                    {a.value}{a.attribute_definitions?.unit ? ` ${a.attribute_definitions.unit}` : ''}
                  </span>
                </div>
              )) : (
                <p style={{ color: '#666', padding: '1.5rem' }}>Sin especificaciones cargadas.</p>
              )}
            </div>
          )}

          {tab === 'datasheet' && datasheetEntries.length > 0 && (
            <div className="pp-datasheet">
              <table className="pp-ds-table">
                <tbody>
                  {datasheetEntries.map(([key, val], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'pp-ds-even' : ''}>
                      <td className="pp-ds-key">{key}</td>
                      <td className="pp-ds-val">{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </>
  );
};

export default ProductPage;
