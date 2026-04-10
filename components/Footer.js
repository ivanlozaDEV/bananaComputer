import React from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { MapPin, Phone, Mail, Globe, MessageSquare, Share2 } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-purple-brand text-white pt-16 pb-8 px-4 relative overflow-hidden">
      <div className="rainbow-stripe absolute top-0 left-0"></div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
        {/* Brand Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Logo size="small" />
            <span className="font-pixel text-xl font-extrabold tracking-tight">
              <span className="text-banana-yellow">Banana</span> Computer
            </span>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            Líderes en tecnología oficial en Ecuador. <br />
            Comprar nunca fue tan fácil.
          </p>
          <div className="flex gap-4 mt-2 opacity-80">
            <a href="#" className="hover:text-banana-yellow transition-colors"><Globe size={20} /></a>
            <a href="#" className="hover:text-banana-yellow transition-colors"><Share2 size={20} /></a>
            <a href="#" className="hover:text-banana-yellow transition-colors"><MessageSquare size={20} /></a>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-banana-yellow mb-6 opacity-80">Navegación</h4>
          <ul className="flex flex-col gap-3 text-sm opacity-70">
            <li><Link href="/" className="hover:text-banana-yellow hover:opacity-100 transition-all">Inicio</Link></li>
            <li><Link href="/contacto" className="hover:text-banana-yellow hover:opacity-100 transition-all">Contacto</Link></li>
            <li><Link href="/perfil" className="hover:text-banana-yellow hover:opacity-100 transition-all">Mi Perfil</Link></li>
            <li><Link href="/login" className="hover:text-banana-yellow hover:opacity-100 transition-all">Iniciar Sesión</Link></li>
          </ul>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-banana-yellow mb-6 opacity-80">Productos</h4>
          <ul className="flex flex-col gap-3 text-sm opacity-70">
            <li><Link href="/categoria/laptops" className="hover:text-banana-yellow hover:opacity-100 transition-all">Laptops</Link></li>
            <li><Link href="/categoria/componentes" className="hover:text-banana-yellow hover:opacity-100 transition-all">Componentes</Link></li>
            <li><Link href="/categoria/perifericos" className="hover:text-banana-yellow hover:opacity-100 transition-all">Periféricos</Link></li>
            <li><Link href="/categoria/monitores" className="hover:text-banana-yellow hover:opacity-100 transition-all">Monitores</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-banana-yellow mb-6 opacity-80">Contacto</h4>
          <ul className="flex flex-col gap-4 text-sm opacity-80">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-banana-yellow shrink-0 mt-0.5" />
              <span>Guayaquil, Ecuador</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone size={18} className="text-banana-yellow shrink-0 mt-0.5" />
              <span>+593 99 904 6647</span>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={18} className="text-banana-yellow shrink-0 mt-0.5" />
              <span>ventas@banana-computer.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-50">
        <p>&copy; {currentYear} <span className="font-pixel">Banana Computer</span>. Todos los derechos reservados.</p>
        <div className="flex gap-6">
          <Link href="/legal/privacidad" className="hover:opacity-100 transition-opacity">Privacidad</Link>
          <Link href="/legal/terminos" className="hover:opacity-100 transition-opacity">Términos</Link>
          <Link href="/legal/cookies" className="hover:opacity-100 transition-opacity">Cookies</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
