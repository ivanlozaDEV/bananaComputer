import React from 'react';
import Header from '../components/Header';
import Logo from '../components/Logo';
import ProductGrid from '../components/ProductGrid';
import AIAssistant from '../components/AIAssistant';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Award, Truck, Lock, CheckCircle, Headphones, Package, Zap, Sparkles } from 'lucide-react';
import './StorePage.css';
import Footer from '../components/Footer';


const StorePage = () => {
  const { heroContent } = useStore();
  const [showAI, setShowAI] = React.useState(false);

  return (
    <div className="store-page">
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          {/* Logo */}
          <div className="hero-logo">
            <Logo size="large" animated={true} />
          </div>

          {/* Title */}
          <h1 className="hero-title">
            {heroContent?.title || 'Tu Tecnologia'} <span className="highlight">{heroContent?.title ? '' : 'Garantizada'}</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            {heroContent?.subtitle || 'Bienvenido a Banana Computer, tu aliado confiable para adquirir hardware de las mejores marcas globales con garantia oficial y soporte local en Ecuador.'}
          </p>

          {/* CTA Buttons */}
          <div className="hero-buttons">
            <div className="cta-ai-wrapper">
              <div className="floating-bananas">
                <span>🍌</span><span>🍌</span><span>🍌</span>
              </div>
              <button 
                className="btn btn-primary btn-ai-trigger"
                onClick={() => setShowAI(true)}
              >
                <Sparkles size={18} /> {heroContent?.primary_cta || 'Explorar Sistemas'}
              </button>
            </div>
            <a href="#nosotros" className="btn btn-secondary">
              {heroContent?.secondary_cta || 'Soporte y Garantia'}
            </a>
          </div>
          
          {/* Stats */}
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-icon"><ShieldCheck size={28} /></span>
              <span className="stat-label">Equipos originales</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-icon"><Award size={28} /></span>
              <span className="stat-label">Garantía real</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-icon"><Truck size={28} /></span>
              <span className="stat-label">Entrega gratis</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-icon"><Lock size={28} /></span>
              <span className="stat-label">Pago seguro</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <ProductGrid />

      {/* Features Section */}
      <section id="nosotros" className="features-section">
        <div className="section-header">
          <span className="section-label">// Por que Banana Computer</span>
          <h2 className="section-title">
            Calidad y <span className="highlight">Confianza</span>
          </h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--mint)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3 className="feature-title">Garantia Local</h3>
            <p className="feature-description">
              Todos nuestros productos cuentan con garantia valida en Ecuador, respaldada directamente por las marcas.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--banana)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <h3 className="feature-title">Soporte Directo</h3>
            <p className="feature-description">
              Asistencia tecnica personalizada y soporte post-venta para asegurar el mejor funcionamiento de tu equipo.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--sunset)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            <h3 className="feature-title">Marcas Lideres</h3>
            <p className="feature-description">
              Distribuimos hardware de las marcas mas reconocidas a nivel mundial para garantizar durabilidad y potencia.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: 'var(--ocean)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M16 8l-6 6-2-2"></path>
              </svg>
            </div>
            <h3 className="feature-title">Productos Nuevos</h3>
            <p className="feature-description">
              Solo vendemos productos sellados de fabrica, asegurando que estrenas tecnologia de ultima generacion.
            </p>
          </div>
        </div>
      </section>
      <Footer />
      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
    </div>

  );
};


export default StorePage;
;
