import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import './ProductGrid.css';

const ProductCard = ({ product, addedIds, handleAddToCart }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const images = product.images?.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);
  
  const nextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((imgIndex + 1) % images.length);
  };
  
  const prevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((imgIndex - 1 + images.length) % images.length);
  };

  return (
    <article className="product-card">
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

      {/* Product Visual & Carousel */}
      <div className="product-image-container">
        <a href={`/producto/${product.id}`} className="product-img-link">
          {images.length > 0 ? (
            <img 
              src={images[imgIndex]} 
              alt={product.name} 
              className="product-image"
            />
          ) : (
            <div className="product-image-placeholder">
              <span style={{ color: 'var(--banana)' }}>🍌</span>
            </div>
          )}
        </a>
        
        {images.length > 1 && (
          <>
            <button className="carousel-btn prev" onClick={prevImg} aria-label="Previous image">‹</button>
            <button className="carousel-btn next" onClick={nextImg} aria-label="Next image">›</button>
            <div className="carousel-dots">
              {images.map((_, i) => (
                <span key={i} className={`dot ${i === imgIndex ? 'active' : ''}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">
        <a href={`/producto/${product.id}`} className="product-info-link">
          <div className="product-header">
            <div>
              <h3 className="product-name">{product.name}</h3>
              {product.model_number && <span className="product-card-model">{product.model_number}</span>}
            </div>
            <span className="product-year">{product.year}</span>
          </div>
          <p className="product-description">{product.marketing_subtitle || product.description}</p>
        </a>
        
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
              + Info
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
  );
};

const ProductGrid = ({ subcategoryId }) => {
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
        let query = supabase
          .from('products')
          .select('*, categories(name, id), product_attributes(value, attribute_definitions(name, unit, icon))')
          .eq('is_active', true);

        if (subcategoryId) {
          query = query.or(`subcategory_id.eq.${subcategoryId},subcategory_ids.cs.{${subcategoryId}}`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          if (error.code === 'PGRST204' || error.message.includes('subcategory_ids')) {
            const fallbackQuery = supabase
              .from('products')
              .select('*, categories(name, id), product_attributes(value, attribute_definitions(name, unit, icon))')
              .eq('is_active', true);
            const finalQuery = subcategoryId ? fallbackQuery.eq('subcategory_id', subcategoryId) : fallbackQuery;
            const { data: fbData, error: fbError } = await finalQuery.order('created_at', { ascending: false });
            if (fbError) throw fbError;
            processData(fbData);
          } else {
            throw error;
          }
        } else {
          processData(data);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    const processData = (data) => {
      const groups = {};
      (data || []).forEach(p => {
        const catId = p.category_id || 'other';
        const catName = p.categories?.name || 'Otros';
        if (!groups[catId]) groups[catId] = { id: catId, name: catName, products: [] };
        groups[catId].products.push(p);
      });

      const processedGroups = Object.keys(groups).map(key => {
        const group = groups[key];
        const items = group.products;
        const featured = items.filter(p => p.is_featured).slice(0, 3);
        const featuredIds = new Set(featured.map(f => f.id));
        const latest = items.filter(p => !featuredIds.has(p.id)).slice(0, 3);
        const combined = [...featured.map(p => ({ ...p, badgeType: 'featured' })), ...latest.map(p => ({ ...p, badgeType: 'new' }))];

        return {
          id: group.id,
          name: group.name,
          products: combined.map(p => {
            const year = new Date(p.created_at).getFullYear().toString();
            const specs = (p.product_attributes || []).slice(0, 3).map(a => ({
              label: a.attribute_definitions?.name,
              value: a.value,
              unit: a.attribute_definitions?.unit || '',
              icon: a.attribute_definitions?.icon || '•'
            }));
            return { ...p, year, specs };
          }),
          showTitle: !subcategoryId
        };
      }).filter(g => g.products.length > 0);

      setCategoryGroups(processedGroups);
    };

    fetchProducts();
  }, [subcategoryId]);

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
          {group.showTitle && (
            <div className="section-header">
              <a href={`/categoria/${group.id}`} className="section-link">
                <h2 className="section-title">{group.name}</h2>
              </a>
              <div className="rainbow-stripe" style={{ width: '60px', height: '4px', margin: '0.5rem auto 0' }}></div>
            </div>
          )}

          <div className="products-grid">
            {group.products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                addedIds={addedIds} 
                handleAddToCart={handleAddToCart} 
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProductGrid;
