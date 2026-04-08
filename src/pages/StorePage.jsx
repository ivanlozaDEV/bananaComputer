import React from 'react'
import Header from '../components/Header'
import ProductGrid from '../components/ProductGrid'
import Logo from '../components/Logo'
import { useStore } from '../context/StoreContext'
import '../App.css'

function StorePage() {
  const { heroContent } = useStore();
  const hasHeroImage = !!heroContent?.image_url;

  return (
    <div className="app-container">
      <Header />
      <main>
        <section className={`hero-section ${hasHeroImage ? 'hero-split' : ''}`}>
          <div className="hero-content">
            <div className="hero-logo-container">
              <Logo size="large" />
            </div>
            <h1 className="hero-title">{heroContent?.title || 'BANANA COMPUTER'}</h1>
            <h2 className="hero-subtitle">{heroContent?.subtitle || 'El futuro de la computación. Redefinido.'}</h2>
            <div className="hero-actions">
              <button className="retro-button">{heroContent?.primary_cta || 'Explorar Sistemas'}</button>
              <button className="outline-button">{heroContent?.secondary_cta || 'Más información'}</button>
            </div>
          </div>
          {hasHeroImage && (
            <div className="hero-image-container">
              <img src={heroContent.image_url} alt="Hero" className="hero-image" />
            </div>
          )}
        </section>

        <section className="products-section">
          <ProductGrid />
        </section>
      </main>

      <footer className="main-footer">
        <div className="footer-content">
          <p>&copy; 1984 - 2026 BananaComputer Inc. Todos los derechos reservados.</p>
          <div className="footer-links">
            <a href="#about">Sobre nosotros</a>
            <a href="#support">Soporte</a>
            <a href="#contact">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default StorePage
