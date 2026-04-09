import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LegalPage.css';

const LegalPage = () => {
  const { section } = useParams();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);

  const sections = {
    privacidad: {
      title: 'Política de Privacidad',
      content: (
        <>
          <p>En <strong>Banana Computer</strong>, la privacidad de nuestros clientes es una prioridad. Esta política describe cómo manejamos su información personal.</p>
          
          <h2>1. Recolección de Datos</h2>
          <p>Solo recolectamos la información estrictamente necesaria para procesar sus pedidos y mejorar su experiencia en nuestra tienda:</p>
          <ul>
            <li>Nombre y datos de contacto para envíos.</li>
            <li>Información de facturación conforme a las leyes tributarias de Ecuador.</li>
            <li>Historial de navegación básico para mejorar nuestras recomendaciones.</li>
          </ul>

          <h2>2. Uso de la Información</h2>
          <p>Su información se utiliza exclusivamente para:</p>
          <ul>
            <li>Gestionar el despacho de productos a nivel nacional.</li>
            <li>Brindar soporte técnico y gestionar garantías oficiales.</li>
            <li>Notificar sobre el estado de sus pedidos.</li>
          </ul>

          <h2>3. Seguridad de Pagos</h2>
          <p>Las transacciones financieras se procesan a través de pasarelas de pago seguras con certificación PCI-DSS. <strong>Banana Computer no almacena los datos de sus tarjetas de crédito o débito.</strong></p>

          <h2>4. Sus Derechos</h2>
          <p>Usted tiene derecho a solicitar el acceso, corrección o eliminación de sus datos personales de nuestra base de datos en cualquier momento a través de nuestro canal de soporte.</p>
        </>
      )
    },
    terminos: {
      title: 'Términos y Condiciones',
      content: (
        <>
          <p>Bienvenido a Banana Computer. Al utilizar nuestro sitio web, usted acepta cumplir con los siguientes términos y condiciones de uso.</p>

          <h2>1. Garantía Oficial Local</h2>
          <p>Todos los productos de hardware comercializados cuentan con <strong>Garantía Oficial del Fabricante</strong> válida en Ecuador (mínimo 1 año). Banana Computer actúa como enlace directo con los centros de servicio autorizados.</p>

          <h2>2. Políticas de Envío</h2>
          <p>Realizamos envíos a todo el territorio ecuatoriano a través de operadores logísticos certificados. Los tiempos de entrega varían según la ciudad, con un promedio de 24 a 48 horas laborables.</p>

          <h2>3. Precios e Impuestos</h2>
          <p>Todos los precios publicados en nuestro sitio <strong>ya incluyen el IVA (15%)</strong>, cumpliendo con la normativa vigente en Ecuador. El valor final que usted ve es el que realmente paga.</p>

          <h2>4. Devoluciones y Cambios</h2>
          <p>Se aceptan cambios o devoluciones dentro de los primeros 7 días posteriores a la entrega, siempre y cuando el producto se encuentre en su <strong>empaque original sellado</strong> y no haya sido activado o utilizado.</p>
          
          <h2>5. Compromiso de Precio Bajo</h2>
          <p>En Banana Computer nos esforzamos por ofrecer el mejor precio del mercado oficial. Si encuentra un precio menor en un distribuidor autorizado del mismo producto, contáctenos para igualar la oferta.</p>
        </>
      )
    },
    cookies: {
      title: 'Política de Cookies',
      content: (
        <>
          <p>Utilizamos cookies para asegurar que su experiencia en Banana Computer sea lo más fluida y personalizada posible.</p>

          <h2>¿Qué son las cookies?</h2>
          <p>Son pequeños archivos de texto que se almacenan en su navegador para recordar información sobre su visita.</p>

          <h2>Cookies Esenciales</h2>
          <p>Son necesarias para el funcionamiento básico del sitio y permiten:</p>
          <ul>
            <li>Mantener los productos en su carrito de compras.</li>
            <li>Gestionar su sesión de usuario de forma segura.</li>
            <li>Recordar sus preferencias de navegación.</li>
          </ul>

          <h2>Gestión de Cookies</h2>
          <p>Usted puede configurar su navegador para bloquear o alertar sobre estas cookies, pero algunas partes de nuestro sitio no funcionarán correctamente si decide deshabilitarlas.</p>
        </>
      )
    }
  };

  const currentSection = sections[section] || sections.terminos;

  return (
    <div className="legal-root">
      <Header />
      
      <main className="legal-page">
        <header className="legal-header">
          <h1 className="legal-title">{currentSection.title}</h1>
          <p className="legal-last-updated">Última actualización: Abril 2026</p>
        </header>

        <section className="legal-content">
          {currentSection.content}
        </section>

        <nav className="legal-nav-simple">
          <Link to="/legal/terminos" className={`legal-nav-link ${section === 'terminos' ? 'active' : ''}`}>Términos</Link>
          <Link to="/legal/privacidad" className={`legal-nav-link ${section === 'privacidad' ? 'active' : ''}`}>Privacidad</Link>
          <Link to="/legal/cookies" className={`legal-nav-link ${section === 'cookies' ? 'active' : ''}`}>Cookies</Link>
        </nav>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPage;
