"use client";
import React from 'react';
import Link from 'next/link';
import { ExternalLink, ArrowRight, Cpu, Zap, Radio, CircuitBoard } from 'lucide-react';

/**
 * HeroBanner — A professional, responsive carousel-style banner.
 * Now with "Artistic Adornments" for a premium tech feel.
 */
const HeroBanner = ({ promotion, promoCount, activeIndex }) => {
  if (!promotion) return null;

  const isExternal = promotion.link_url?.startsWith('http');
  const Tag = isExternal ? 'a' : Link;
  const linkProps = isExternal
    ? { href: promotion.link_url, target: '_blank', rel: 'noopener noreferrer' }
    : { href: promotion.link_url || '#' };

  return (
    <div className="relative group w-full overflow-hidden rounded-[2.5rem] bg-white border border-black/5 shadow-2xl shadow-purple-brand/5 aspect-[21/9] md:aspect-[25/9]">
      {/* ── ARTISTIC DECORATIONS (Floating Tech Decor) ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-20 transition-opacity group-hover:opacity-40">
        {/* Floating Icons */}
        <Cpu className="absolute top-10 left-1/4 text-purple-brand/20 animate-[float_6s_ease-in-out_infinite]" size={48} />
        <Zap className="absolute bottom-10 right-1/4 text-banana-yellow/30 animate-[float_5s_ease-in-out_infinite] delay-1000" size={32} />
        <Radio className="absolute top-1/2 left-10 text-purple-brand/10 animate-[float_7s_ease-in-out_infinite] delay-500" size={24} />
        <CircuitBoard className="absolute bottom-20 left-1/3 text-banana-yellow/20 animate-[float_8s_ease-in-out_infinite] delay-200" size={56} />
        
        {/* Scanning Light Beam */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-brand/5 to-transparent -translate-x-full animate-[scan_4s_linear_infinite]"></div>

        {/* Geometric Accents */}
        <div className="absolute -top-12 -right-12 w-48 h-48 border border-purple-brand/5 rounded-full"></div>
        <div className="absolute -top-8 -right-8 w-48 h-48 border border-purple-brand/5 rounded-full"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 border border-banana-yellow/10 rounded-full"></div>
      </div>

      <Tag {...linkProps} className="block w-full h-full relative overflow-hidden z-10">
        {/* Animated Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-brand/5 to-transparent z-10 pointer-events-none"></div>
        
        {/* Main Image */}
        <img
          src={promotion.image_url}
          alt={promotion.title || "Promoción Banana Computer"}
          className="w-full h-full object-cover md:object-contain transition-transform duration-[2000ms] ease-out group-hover:scale-105"
          draggable={false}
        />

        {/* Content Overlay */}
        {(promotion.title || promotion.subtitle) && (
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-16 pointer-events-none">
            <div className="max-w-xl animate-in fade-in slide-in-from-left-8 duration-700">
              {promotion.badge && (
                <span className="inline-block px-3 py-1 bg-banana-yellow text-black text-[10px] font-black tracking-widest uppercase rounded-full mb-4 shadow-lg animate-ai-glow">
                  {promotion.badge}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-black text-black mb-2 leading-tight uppercase drop-shadow-sm">
                {promotion.title}
              </h2>
              <p className="text-sm md:text-lg text-gray-500 font-medium mb-6 line-clamp-2">
                {promotion.subtitle}
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-xl group-hover:bg-purple-brand transition-colors shadow-xl pointer-events-auto cursor-none">
                Ver Oferta <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        )}

        {/* External Icon Badge */}
        {isExternal && (
          <div className="absolute top-8 right-8 z-30 p-2.5 bg-white/80 backdrop-blur-md border border-black/5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg">
            <ExternalLink size={18} className="text-purple-brand" />
          </div>
        )}
      </Tag>

      {/* Modern Carousel Indicators (Glassmorphism) */}
      {promoCount > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 p-2 bg-black/10 backdrop-blur-md rounded-full border border-white/20">
          {Array.from({ length: promoCount }).map((_, i) => (
            <div
              key={i}
              className={`
                h-1.5 rounded-full transition-all duration-500
                ${i === activeIndex ? 'bg-white w-10 shadow-[0_0_12px_rgba(255,255,255,0.7)]' : 'bg-white/40 w-1.5 hover:bg-white/60'}
              `}
            />
          ))}
        </div>
      )}

      {/* High-end Polish: Corner Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-banana-yellow/5 blur-[100px] -z-10 rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-brand/5 blur-[100px] -z-10 rounded-full"></div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes scan {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
};

export default HeroBanner;
