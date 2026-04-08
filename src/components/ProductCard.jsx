import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const [imgError, setImgError] = useState(false);
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();

  const handleAdd = (e) => {
    e.stopPropagation();
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 500);
  };

  const imageUrl = product.image_url || product.image;
  const categoryName = product.categories?.name || product.category || '';

  return (
    <div
      className="product-card glass-panel"
      onClick={() => navigate(`/producto/${product.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="product-image-container">
        {!imgError && imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="product-image"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-image-placeholder">
            <span className="placeholder-icon">🍌</span>
            <span className="placeholder-text">[ IMAGEN NO DISPONIBLE ]</span>
          </div>
        )}
        {categoryName && <div className="product-tag">{categoryName}</div>}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description || product.marketing_subtitle}</p>
        <div className="product-footer">
          <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
          <button
            className={`retro-button ${isAdding ? 'adding' : ''}`}
            onClick={handleAdd}
          >
            {isAdding ? '¡Añadido!' : 'Añadir al Carrito'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
