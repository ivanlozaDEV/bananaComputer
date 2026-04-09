import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { MapPin, Phone, Mail, Globe, MessageSquare, Share2 } from 'lucide-react';

import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="rainbow-stripe"></div>
      
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-brand">
          <div className="footer-logo-container">
            <Logo size="small" animated={false} />
            <span className="footer-logo-text">
              <span className="footer-logo-highlight">Banana</span> Computer
            </span>
          </div>
          <p className="footer-tagline">
            Líderes en tecnología oficial en Ecuador. <br />
            Comprar nunca fue tan fácil.
          </p>
          <div className="footer-bottom-links" style={{ marginTop: '0.5rem', opacity: 0.8 }}>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-link"><Globe size={18} /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-link"><Share2 size={18} /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-link"><MessageSquare size={18} /></a>
          </div>

        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4 className="footer-section-title">Navegación</h4>
          <ul className="footer-list">
            <li><Link to="/" className="footer-link">Inicio</Link></li>
            <li><Link to="/contacto" className="footer-link">Contacto</Link></li>
            <li><Link to="/perfil" className="footer-link">Mi Perfil</Link></li>
            <li><Link to="/login" className="footer-link">Iniciar Sesión</Link></li>
          </ul>
        </div>

        {/* Categories (Placeholder or dynamic) */}
        <div className="footer-section">
          <h4 className="footer-section-title">Productos</h4>
          <ul className="footer-list">
            <li><Link to="/categoria/laptops" className="footer-link">Laptops</Link></li>
            <li><Link to="/categoria/componentes" className="footer-link">Componentes</Link></li>
            <li><Link to="/categoria/perifericos" className="footer-link">Periféricos</Link></li>
            <li><Link to="/categoria/monitores" className="footer-link">Monitores</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4 className="footer-section-title">Contacto</h4>
          <ul className="footer-list">
            <li className="footer-contact-item">
              <MapPin size={18} className="footer-contact-icon" />
              <span>Guayaquil, Ecuador</span>
            </li>
            <li className="footer-contact-item">
              <Phone size={18} className="footer-contact-icon" />
              <span>+593 99 904 6647</span>
            </li>
            <li className="footer-contact-item">
              <Mail size={18} className="footer-contact-icon" />
              <span>ventas@banana-computer.com</span>
    
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-copyright">
          &copy; {currentYear} Banana Computer. Todos los derechos reservados.
        </p>
        <div className="footer-bottom-links">
          <a href="/legal/privacidad" className="footer-bottom-link">Privacidad</a>
          <a href="/legal/terminos" className="footer-bottom-link">Términos</a>
          <a href="/legal/cookies" className="footer-bottom-link">Cookies</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
