import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import './ProductGrid.css';

const ProductGrid = () => {
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState(new Set());

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    addToCart(product);
    setAddedIds(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name, slug), product_attributes(value, attribute_definitions(name, unit, icon))')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Grouping logic
        const groups = {};
        (data || []).forEach(p => {
          const catName = p.categories?.name || 'Otros';
          if (!groups[catName]) groups[catName] = [];
          groups[catName].push(p);
        });

        const processedGroups = Object.keys(groups).map(name => {
          const items = groups[name];
          
          // Sort: Featured first, then by date
          const featured = items.filter(p => p.is_featured).slice(0, 3);
          const featuredIds = new Set(featured.map(f => f.id));
          
          const latest = items
            .filter(p => !featuredIds.has(p.id))
            .slice(0, 3);
          
          const combined = [
            ...featured.map(p => ({ ...p, badgeType: 'featured' })),
            ...latest.map(p => ({ ...p, badgeType: 'new' }))
          ];

          return {
            name,
            products: combined.map(p => {
              const year = new Date(p.created_at).getFullYear().toString();
              const specs = (p.product_attributes || [])
                .slice(0, 3)
                .map(a => ({
                  label: a.attribute_definitions?.name,
                  value: a.value,
                  unit: a.attribute_definitions?.unit || '',
                  icon: a.attribute_definitions?.icon || '•'
                }));

              return { ...p, year, specs };
            })
          };
        }).filter(g => g.products.length > 0);

        setCategoryGroups(processedGroups);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="products-section">
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>
          Cargando catalogo...
        </div>
      </section>
    );
  }

  return (
    <div className="catalog-wrapper">
      {categoryGroups.map((group) => (
        <section key={group.name} id={group.name.toLowerCase()} className="products-section">
          <div className="section-header">
            <h2 className="section-title">
              {group.name}
            </h2>
            <div className="rainbow-stripe" style={{ width: '60px', height: '4px', margin: '0.5rem auto 0' }}></div>
          </div>

          <div className="products-grid">
            {group.products.map((product) => (
              <article key={product.id} className="product-card">
                {/* Badge Mapping */}
                {product.badgeType === 'featured' ? (
                  <span className="product-badge" style={{ background: '#4B467B', color: '#ffffff' }}>
                    DISTINGUIDO
                  </span>
                ) : (
                  <span className="product-badge" style={{ background: '#FBDD33', color: '#000000' }}>
                    ULTIMA LLEGADA
                  </span>
                )}

                {/* Product Visual */}
                <div className="product-image-container">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="product-image"
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      <span style={{ color: 'var(--banana)' }}>🍌</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="product-info">
                  <div className="product-header">
                    <h3 className="product-name">{product.name}</h3>
                    <span className="product-year">{product.year}</span>
                  </div>
                  
                  <p className="product-description">{product.marketing_subtitle || product.description}</p>
                  
                  {/* Specs Pills */}
                  <div className="product-specs-grid">
                    {product.specs.map((spec, index) => (
                      <div key={index} className="spec-pill">
                        <span className="spec-icon">{spec.icon}</span>
                        <div className="spec-details">
                          <span className="spec-value">{spec.value}{spec.unit}</span>
                          <span className="spec-label">{spec.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="product-footer">
                    <div className="product-price-block">
                      <span className="product-price">${parseFloat(product.price).toLocaleString()}</span>
                      <span className="price-tax-note">Incluido impuestos</span>
                    </div>
                    <div className="product-actions">
                      <a 
                        href={`/producto/${product.id}`} 
                        className="btn-product btn-details"
                      >
                        Info
                      </a>
                      <button 
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`btn-product btn-cart ${addedIds.has(product.id) ? 'added' : ''}`}
                        style={{ background: '#FBDD33', color: '#000', border: '1px solid #FBDD33' }}
                      >
                        {addedIds.has(product.id) ? '✓' : '+ Carrito'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProductGrid;
