import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  ShoppingCart, Menu, X, Phone, LogIn, LogOut, ChevronRight
} from 'lucide-react';
import './Header.css';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const {
    cartItems, cartCount, removeFromCart,
    cartTotal, cartSubtotal, cartTax,
    isCartOpen, openCart, closeCart,
  } = useCart();

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    };
    fetchCats();

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const whatsappLink = "https://wa.me/593991452461?text=Hola%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20un%20producto.";

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="rainbow-stripe"></div>

        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="header-logo">
            <Logo size="small" animated={false} />
            <span className="logo-text">
              <span className="logo-highlight">Banana</span> Computer
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav">
            {categories.map(cat => (
              <Link key={cat.id} to={`/categoria/${cat.id}`} className="nav-link">{cat.name}</Link>
            ))}
            <Link to="/contacto" className="nav-link contact-nav">Contacto</Link>
          </nav>

          {/* Desktop Actions */}
          <div className="header-actions">
            {user ? (
              <div className="user-menu-container">
                <button className="btn-nav profile-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <span className="btn-icon">🍌</span>
                  {user.email.split('@')[0]}
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown glass-panel">
                    <Link to="/perfil" className="dropdown-link" onClick={() => setUserMenuOpen(false)}>Mi Perfil</Link>
                    <button onClick={() => { handleSignOut(); setUserMenuOpen(false); }} className="dropdown-link logout-btn">Cerrar Sesión</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-nav login-btn">
                <span className="btn-icon">🍌</span>
                Sign In
              </Link>
            )}

            <button className="btn-nav cart-btn" onClick={openCart}>
              <span className="btn-icon"><ShoppingCart size={18} /></span>
              Carrito
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className={`mobile-nav ${menuOpen ? 'open' : ''}`}>

          {/* Categories */}
          {categories.map(cat => (
            <Link key={cat.id} to={`/categoria/${cat.id}`} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <ChevronRight size={14} className="mn-chevron" />
              {cat.name}
            </Link>
          ))}

          {/* Contacto — same style as categories, separated */}
          <div className="mobile-nav-section-divider" />
          <Link to="/contacto" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            <Phone size={14} className="mn-chevron" />
            Contacto
          </Link>

          {/* Auth section */}
          {user ? (
            <>
              <div className="mobile-nav-section-divider" />
              <Link to="/perfil" className="mobile-nav-link mn-user-link" onClick={() => setMenuOpen(false)}>
                🍌 {user.email.split('@')[0]}
              </Link>
              <button className="mobile-nav-logout" onClick={() => { handleSignOut(); setMenuOpen(false); }}>
                <LogOut size={14} />
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <div className="mobile-nav-section-divider" />
              <Link to="/login" className="mobile-nav-link mn-login" onClick={() => setMenuOpen(false)}>
                <LogIn size={14} />
                Iniciar Sesión
              </Link>
            </>
          )}

          {/* Cart — always at the bottom */}
          <div className="mobile-nav-section-divider" />
          <button className="mn-cart-btn" onClick={() => { setMenuOpen(false); openCart(); }}>
            <ShoppingCart size={16} />
            Ver Carrito
            {cartCount > 0 && <span className="mn-cart-badge">{cartCount}</span>}
          </button>

        </nav>
      </header>

      {/* Cart Sidebar Overlay */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={closeCart}></div>

      {/* Cart Sidebar */}
      <aside className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Tu Carrito</h2>
          <button className="close-cart" onClick={closeCart}>&times;</button>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="empty-cart-msg">
              <span className="empty-bananas">🍌🍌🍌</span>
              <p>Tu carrito está vacío</p>
              <button className="btn-secondary" onClick={closeCart}>Explorar Productos</button>
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
