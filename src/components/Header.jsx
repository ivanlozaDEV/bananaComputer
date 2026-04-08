import React from 'react';
import { useCart } from '../context/CartContext';
import Logo from './Logo';
import './Header.css';

const Header = () => {
  const { cartCount } = useCart();

  return (
    <header className="main-header glass-panel">
      <div className="logo-container">
        <Logo size="small" />
        <h1 className="logo-text">BananaComputer</h1>
      </div>
      <nav className="nav-links">
        <a href="#systems" className="nav-item">Sistemas</a>
        <a href="#accessories" className="nav-item">Accesorios</a>
        <a href="#vintage" className="nav-item">Vintage</a>
      </nav>
      <div className="cart-status">
        <button className="cart-button">
          CARRITO ({cartCount})
        </button>
      </div>
      <div className="header-rainbow-stripes">
        <div className="stripe yellow"></div>
        <div className="stripe orange"></div>
        <div className="stripe red"></div>
        <div className="stripe purple"></div>
        <div className="stripe blue"></div>
        <div className="stripe green"></div>
      </div>
    </header>
  );
};

export default Header;
