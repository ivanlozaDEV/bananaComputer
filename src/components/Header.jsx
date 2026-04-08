import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Header.css';

const Header = () => {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const { cartItems, cartCount, removeFromCart, cartTotal, cartSubtotal, cartTax } = useCart();

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    };
    fetchCats();

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const whatsappLink = "https://wa.me/593991452461?text=Hola%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20un%20producto.";

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
            {categories.map(cat => (
              <a key={cat.id} href={`/categoria/${cat.id}`} className="nav-link">{cat.name}</a>
            ))}
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="nav-link contact-nav">Contacto</a>
          </nav>

          {/* Actions */}
          <div className="header-actions">
            {user ? (
              <div className="user-menu-container">
                <button className="btn-nav profile-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <span className="btn-icon">🍌</span>
                  {user.email.split('@')[0]}
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown glass-panel">
                    <a href="/perfil" className="dropdown-link">Mi Perfil</a>
                    <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="dropdown-link logout-btn">Cerrar Sesión</button>
                  </div>
                )}
              </div>
            ) : (
              <a href="/login" className="btn-nav login-btn">
                <span className="btn-icon">🍌</span>
                Sign In
              </a>
            )}
            
            <button className="btn-nav cart-btn" onClick={() => setCartOpen(true)}>
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
          {categories.map(cat => (
            <a key={cat.id} href={`/categoria/${cat.id}`} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{cat.name}</a>
          ))}
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mobile-nav-link contact-nav" onClick={() => setMenuOpen(false)}>Contacto</a>
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
