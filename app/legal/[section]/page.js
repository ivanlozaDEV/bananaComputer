"use client";
import React, { use } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LegalPage({ params }) {
  const { section } = use(params);

  const sections = {
    privacidad: {
      title: 'Política de Privacidad',
      content: (
        <div className="prose prose-sm max-w-none">
          <p className="text-lg text-gray-600 mb-8">En <strong>Banana Computer</strong>, la privacidad de nuestros clientes es una prioridad. Esta política describe cómo manejamos su información personal.</p>
          
          <h2 className="text-xl font-black mt-10 mb-4 uppercase tracking-wider text-purple-brand">1. Recolección de Datos</h2>
          <p className="text-gray-500 leading-relaxed mb-4">Solo recolectamos la información estrictamente necesaria para procesar sus pedidos y mejorar su experiencia en nuestra tienda:</p>
          <ul className="list-disc pl-6 text-gray-500 flex flex-col gap-2">
            <li>Nombre y datos de contacto para envíos nacionales.</li>
            <li>Información de facturación conforme a las leyes tributarias de Ecuador.</li>
            <li>Historial de navegación básico para mejorar nuestras recomendaciones inteligentes.</li>
          </ul>

          <h2 className="text-xl font-black mt-10 mb-4 uppercase tracking-wider text-purple-brand">2. Uso de la Información</h2>
          <p className="text-gray-500 leading-relaxed mb-4">Su información se utiliza exclusivamente para:</p>
          <ul className="list-disc pl-6 text-gray-500 flex flex-col gap-2">
            <li>Gestionar el despacho de productos a través de Servientrega u otros operadores certificados.</li>
            <li>Brindar soporte técnico y gestionar garantías oficiales del fabricante.</li>
            <li>Notificar sobre el estado en tiempo real de sus pedidos.</li>
          </ul>

          <h2 className="text-xl font-black mt-10 mb-4 uppercase tracking-wider text-purple-brand">3. Seguridad de Pagos</h2>
          <p className="text-gray-500 leading-relaxed">Las transacciones financieras se procesan a través de pasarelas de pago seguras con certificación PCI-DSS. <strong>Banana Computer no almacena los datos de sus tarjetas de crédito o débito.</strong></p>
        </div>
      )
    },
    terminos: {
      title: 'Términos y Condiciones',
      content: (
        <div className="prose prose-sm max-w-none">
          <p className="text-lg text-gray-600 mb-8">Bienvenido a Banana Computer. Al utilizar nuestro sitio web, usted acepta cumplir con los siguientes términos y condiciones de uso oficial en Ecuador.</p>

          <h2 className="text-xl font-black mt-10 mb-4 uppercase tracking-wider text-purple-brand">1. Garantía Oficial Local</h2>
          <p className="text-gray-500 leading-relaxed">Todos los productos de hardware comercializados cuentan con <strong>Garantía Oficial del Fabricante</strong> válida en Ecuador (mínimo 1 año). Banana Computer actúa como enlace directo con los centros de servicio autorizados.</p>

          <h2 className="text-xl font-black mt-10 mb-4 uppercase tracking-wider text-purple-brand">2. Políticas de Envío</h2>
          <p className="text-gray-500 leading-relaxed">Realizamos envíos a todo el territorio ecuatoriano a través de operadores logísticos certificados. Los tiempos de entrega varían según la ciudad, con un promedio de 24 a 48 horas laborables.</p>

          <h2 className="text-xl font-black mt-10 mb-4 uppercase tracking-wider text-purple-brand">3. Precios e Impuestos</h2>
          <p className="text-gray-500 leading-relaxed">Todos los precios publicados en nuestro sitio <strong>ya incluyen el IVA (15%)</strong>, cumpliendo con la normativa vigente en Ecuador. El valor final que usted ve es el que realmente paga.</p>

          <h2 className="text-xl font-black mt-10 mb-4 uppercase tracking-wider text-purple-brand">4. Devoluciones y Cambios</h2>
          <p className="text-gray-500 leading-relaxed font-bold border-l-4 border-banana-yellow pl-4 py-2 italic text-gray-700">Se aceptan cambios o devoluciones dentro de los primeros 7 días posteriores a la entrega, siempre y cuando el producto se encuentre en su empaque original sellado y no haya sido activado o utilizado.</p>
        </div>
      )
    },
    cookies: {
      title: 'Política de Cookies',
      content: (
        <div className="prose prose-sm max-w-none">
          <p className="text-lg text-gray-600 mb-8">Utilizamos cookies para asegurar que su experiencia en Banana Computer sea lo más fluida y personalizada posible.</p>

          <h2 className="text-xl font-black mt-10 mb-4 uppercase tracking-wider text-purple-brand">¿Qué son las cookies?</h2>
          <p className="text-gray-500 leading-relaxed">Son pequeños archivos de texto que se almacenan en su navegador para recordar información sobre su visita y preferencias.</p>

          <h2 className="text-xl font-black mt-10 mb-4 uppercase tracking-wider text-purple-brand">Cookies Esenciales</h2>
          <p className="text-gray-500 leading-relaxed flex flex-col gap-4">
            Son necesarias para el funcionamiento básico del sitio y permiten:
            <span className="flex items-center gap-2">• Mantener los productos en su carrito de compras.</span>
            <span className="flex items-center gap-2">• Gestionar su sesión de usuario de forma segura.</span>
            <span className="flex items-center gap-2">• Recordar sus preferencias de navegación inteligente.</span>
          </p>
        </div>
      )
    }
  };

  const currentSection = sections[section] || sections.terminos;

  return (
    <div className="min-h-screen bg-cream-bg">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-40 pb-20">
        <header className="mb-16 border-b border-black/5 pb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">// Información Legal</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{currentSection.title}</h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-50">Última actualización: Abril 2026</p>
        </header>

        <section className="bg-white rounded-[3rem] p-10 md:p-16 border border-black/5 shadow-2xl shadow-black/5 mb-16">
          {currentSection.content}
        </section>

        <nav className="flex flex-wrap items-center justify-center gap-4">
          <LegalNavLink href="/legal/terminos" active={section === 'terminos'}>Términos</LegalNavLink>
          <LegalNavLink href="/legal/privacidad" active={section === 'privacidad'}>Privacidad</LegalNavLink>
          <LegalNavLink href="/legal/cookies" active={section === 'cookies'}>Cookies</LegalNavLink>
        </nav>
      </main>

      <Footer />
    </div>
  );
}

function LegalNavLink({ href, active, children }) {
  return (
    <Link 
      href={href} 
      className={`
        px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all
        ${active ? 'bg-purple-brand text-white shadow-lg' : 'bg-white border border-black/5 text-gray-400 hover:text-purple-brand hover:-translate-y-1'}
      `}
    >
      {children}
    </Link>
  );
}
