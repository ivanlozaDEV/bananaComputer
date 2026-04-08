import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import { useCart } from '../context/CartContext';
import { 
  ChevronDown, ChevronUp, ShieldCheck, Truck, 
  Cpu, MemoryStick, HardDrive, Monitor, Battery, 
  Scale, Wifi, Camera, Layers, Zap, Scan, Settings,
  Palette, Film
} from 'lucide-react';
import './ProductPage.css';

// Maps icon names/emojis (stored in DB) → Lucide Components
const ICON_MAP = {
  '🧠': MemoryStick,
  '💾': HardDrive,
  '⚡': Cpu,
  '🖥️': Monitor,
  '🔋': Battery,
  '⚖️': Scale,
  '📶': Wifi,
  '📷': Camera,
  '🎮': Layers,
  '🎨': Palette,
  '🌈': Scan,
  '🎬': Film,
  'memory-stick': MemoryStick,
  'hard-drive': HardDrive,
  'cpu': Cpu,
  'monitor': Monitor,
  'battery': Battery,
  'scale': Scale,
  'wifi': Wifi,
  'camera': Camera,
  'layers': Layers,
  'zap': Zap,
  'scan': Scan,
  'default': Settings,
};

const getIcon = (name, size = 18) => {
  const IconComp = ICON_MAP[name] || ICON_MAP.default;
  return <IconComp size={size} />;
};

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [attrs, setAttrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dsOpen, setDsOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(null);

  useEffect(() => {
    const load = async () => {
      let { data: prod, error } = await supabase
        .from('products')
        .select('*, categories(id, name), subcategories(id, name)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.warn('ProductPage query failed, attempting fallback:', error);
        const { data: fbProd, error: fbError } = await supabase
          .from('products')
          .select('*, categories(id, name)')
          .eq('id', id)
          .single();
        
        if (fbError || !fbProd) {
          console.error('Final fallback failed:', fbError);
          navigate('/');
          return;
        }
        prod = fbProd;
      }
      
      setProduct(prod);
      setActiveImg(prod.images?.[0] || prod.image_url);

      const { data: prodAttrs } = await supabase
        .from('product_attributes')
        .select('value, attribute_definitions(name, unit, icon, display_order)')
        .eq('product_id', id)
        .order('attribute_definitions(display_order)');
      setAttrs(prodAttrs || []);
      setLoading(false);
    };
    load();
  }, [id, navigate]);

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
  const allImages = product.images?.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);

  const breadcrumbItems = [
    { label: product.categories?.name || 'Categoría', path: `/categoria/${product.category_id}` },
    { label: product.subcategories?.name || 'Subcategoría', path: `/categoria/${product.category_id}/${product.subcategory_id}` },
    { label: product.name }
  ];

  const BananaRating = ({ score }) => {
    return (
      <div className="banana-rating">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`banana-icon ${i <= (score || 0) ? 'filled' : 'empty'}`}>🍌</span>
        ))}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="pp-root">
        <Breadcrumbs items={breadcrumbItems} />

        <section className="pp-hero">
          {/* Left: Gallery */}
          <div className="pp-gallery">
            <div className="pp-img-frame">
              {activeImg ? (
                <img src={activeImg} alt={product.name} className="pp-img" />
              ) : (
                <div className="pp-img-placeholder">🍌</div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="pp-thumbnails-card">
                <div className="pp-thumbnails">
                  {allImages.map((u, i) => (
                    <button 
                      key={i} 
                      className={`pp-thumb ${activeImg === u ? 'pp-thumb-active' : ''}`}
                      onClick={() => setActiveImg(u)}
                    >
                      <img src={u} alt="" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {product.subcategories?.name && (
              <span className="pp-cat-badge">{product.subcategories.name}</span>
            )}
          </div>

          {/* Right: Info */}
          <div className="pp-info">
            <div className="pp-title-card">
              <p className="pp-tagline">{product.tagline || 'Ecuador Tech Official'}</p>
              <h1 className="pp-name">{product.name}</h1>
              {product.model_number && (
                <div className="pp-model-badge">
                  <span>Modelo / Part Number:</span>
                  <strong>{product.model_number}</strong>
                </div>
              )}
              <p className="pp-subtitle">{product.marketing_subtitle || product.description}</p>
            </div>
            
            <div className="pp-buy-card">
              <div className="pp-price-section">
                <span className={`pp-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                </span>
                <span className="pp-price">
                  ${parseFloat(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="pp-tax-note">Incluido impuestos</span>
              </div>

              {/* Quick Specs Grid (Moved here for high visibility) */}
              <div className="pp-quick-specs">
                {attrs.slice(0, 6).map((a, i) => (
                  <div key={i} className="pp-quick-spec-item">
                    <span className="pp-qs-icon">{getIcon(a.attribute_definitions?.icon, 20)}</span>
                    <div className="pp-qs-text">
                      <span className="pp-qs-label">{a.attribute_definitions?.name}</span>
                      <span className="pp-qs-val">{a.value}{a.attribute_definitions?.unit ? ` ${a.attribute_definitions.unit}` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                className={`pp-btn-cart ${added ? 'pp-btn-added' : ''}`}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
              </button>
              
              <div className="pp-trust-badges">
                <span><ShieldCheck size={16} /> Garantía Local 1 Año</span>
                <span><Truck size={16} /> Envío Seguro a Todo Ecuador</span>
              </div>
              <p className="pp-sku">SKU: {product.sku}</p>
            </div>
          </div>
        </section>

        {/* ── Banana Review Section ─────────────────── */}
        {product.banana_review ? (
          <section className="pp-banana-review">
            <div className="review-header">
              <h2 className="pp-marketing-title">Banana Review Bot</h2>
              <span className="ai-badge">AI Powered</span>
            </div>

            <div className="review-card">
              <div className="verdict-bar">
                <span className="verdict-label">LA SENTENCIA:</span>
                <p className="verdict-text">{product.banana_review.verdict}</p>
              </div>

              <div className="review-dashboard">
                <div className="scores-grid">
                  <div className="score-item">
                    <span>Office / Trabajo</span>
                    <BananaRating score={product.banana_review.scores?.office} />
                  </div>
                  <div className="score-item">
                    <span>Heavy Gaming</span>
                    <BananaRating score={product.banana_review.scores?.gaming} />
                  </div>
                  <div className="score-item">
                    <span>Diseño / Creatividad</span>
                    <BananaRating score={product.banana_review.scores?.design} />
                  </div>
                  <div className="score-item">
                    <span>Portabilidad</span>
                    <BananaRating score={product.banana_review.scores?.portability} />
                  </div>
                  <div className="score-item">
                    <span>Calidad / Precio</span>
                    <BananaRating score={product.banana_review.scores?.value} />
                  </div>
                </div>

                <div className="pros-cons">
                  <div className="pc-box pros">
                    <h4>Lo bueno</h4>
                    <ul>
                      {product.banana_review.pros?.map((p, i) => <li key={i}>✓ {p}</li>)}
                    </ul>
                  </div>
                  <div className="pc-box cons">
                    <h4>Lo no tan bueno</h4>
                    <ul>
                      {product.banana_review.cons?.map((c, i) => <li key={i}>✗ {c}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="detailed-analysis">
                <h4>Análisis Crítico</h4>
                <p className="pp-marketing-text">{product.banana_review.detailed_review}</p>
              </div>
            </div>
          </section>
        ) : (
          product.marketing_body && (
            <section className="pp-marketing">
              <h2 className="pp-marketing-title">Descripción Detallada</h2>
              <p className="pp-marketing-text">{product.marketing_body}</p>
            </section>
          )
        )}

        {/* ── Expandable Datasheet (Accordion) ─────────────────── */}
        {datasheetEntries.length > 0 && (
          <section className="pp-accordion-section">
            <button 
              className="pp-accordion-trigger"
              onClick={() => setDsOpen(!dsOpen)}
            >
              <span>Ver Ficha Técnica Completa</span>
              {dsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <div className={`pp-accordion-content ${dsOpen ? 'is-open' : ''}`}>
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
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default ProductPage;
