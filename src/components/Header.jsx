import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { useCart } from '../context/CartContext';
import './Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { cartItems, cartCount, removeFromCart, cartTotal, cartSubtotal, cartTax } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        {/* Rainbow stripe at top */}
        <div className="rainbow-stripe"></div>
        
        <div className="header-content">
          {/* Logo */}
          <a href="/" className="header-logo">
            <Logo size="small" animated={false} />
            <span className="logo-text">
              <span className="logo-highlight">Banana</span> Computer
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="header-nav">
            <a href="#productos" className="nav-link">Productos</a>
            <a href="#nosotros" className="nav-link">Nosotros</a>
            <a href="#soporte" className="nav-link">Soporte</a>
            <a href="#contacto" className="nav-link">Contacto</a>
          </nav>

          {/* Cart Button */}
          <div className="header-actions">
            <button className="btn-nav" onClick={() => setCartOpen(true)}>
              <span className="btn-icon">🛒</span>
              Carrito
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>

          {/* Mobile menu button */}
          <button 
            className={`menu-toggle ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
          <a href="#productos" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Productos</a>
          <a href="#nosotros" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Nosotros</a>
          <a href="#soporte" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Soporte</a>
          <a href="#contacto" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Contacto</a>
          <button className="btn-nav mobile" onClick={() => { setMenuOpen(false); setCartOpen(true); }}>
            Ver Carrito ({cartCount})
          </button>
        </nav>
      </header>

      {/* Cart Sidebar Overlay */}
      <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)}></div>
      
      {/* Cart Sidebar */}
      <aside className={`cart-sidebar ${cartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Tu Carrito</h2>
          <button className="close-cart" onClick={() => setCartOpen(false)}>&times;</button>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="empty-cart-msg">
              <span className="empty-bananas">🍌🍌🍌</span>
              <p>Tu carrito está vacío</p>
              <button className="btn-secondary" onClick={() => setCartOpen(false)}>Explorar Productos</button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.cartId} className="cart-item">
                <div className="cart-item-img">
                  {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>🍌</span>}
                </div>
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p className="price">${parseFloat(item.price).toLocaleString()}</p>
                </div>
                <button className="remove-item" onClick={() => removeFromCart(item.cartId)}>&times;</button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-row">
              <span>Subtotal (sin IVA):</span>
              <span>${cartSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="cart-summary-row">
              <span>IVA (15%):</span>
              <span>${cartTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="cart-total">
              <span>Total:</span>
              <span>${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <button className="btn-primary checkout-btn" onClick={() => alert('Próximamente: Finalizar Compra')}>
              Finalizar Pedido
            </button>
            <p className="warranty-notice">✓ Envío seguro y Garantía local en Ecuador</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Header;
