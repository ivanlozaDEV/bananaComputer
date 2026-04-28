"use client";
import React from 'react';
import Link from 'next/link';
import { ExternalLink, ArrowRight, Cpu, Zap, Radio, CircuitBoard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * HeroBanner — A professional, responsive carousel-style banner.
 * Now with "Artistic Adornments" and Framer Motion transitions.
 */
const HeroBanner = ({ promotion, promoCount, activeIndex }) => {
  if (!promotion) return null;

  const isExternal = promotion.link_url?.startsWith('http');
  const Tag = isExternal ? 'a' : Link;
  const linkProps = isExternal
    ? { href: promotion.link_url, target: '_blank', rel: 'noopener noreferrer' }
    : { href: promotion.link_url || '#' };

  return (
    <div className="relative group w-full max-w-6xl mx-auto">
      {/* ── CONSOLE FRAME (ROG Ally Inspired) ── */}
      <div className="relative z-10 bg-[#1a1a1a] rounded-[3rem] p-4 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden">
        {/* Console Vents & Texture */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
        
        <div className="flex items-center gap-4 md:gap-8">
          {/* Left Controller Area */}
          <div className="hidden lg:flex flex-col items-center gap-12 w-24">
            {/* Joystick Left */}
            <div className="relative w-16 h-16 rounded-full bg-[#111] shadow-inner border border-white/10 flex items-center justify-center group/joy">
              {/* RGB Ring */}
              <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-purple-brand via-banana-yellow to-raspberry animate-spin-slow opacity-60 blur-[2px]"></div>
              <div className="w-12 h-12 rounded-full bg-[#222] relative z-10 shadow-xl border border-white/5 group-hover/joy:translate-x-1 group-hover/joy:translate-y-1 transition-transform"></div>
            </div>
            {/* D-Pad */}
            <div className="grid grid-cols-3 grid-rows-3 w-16 h-16 opacity-40">
              <div className="col-start-2 bg-white/10 rounded-t-sm"></div>
              <div className="row-start-2 col-start-1 bg-white/10 rounded-l-sm"></div>
              <div className="row-start-2 col-start-2 bg-white/20"></div>
              <div className="row-start-2 col-start-3 bg-white/10 rounded-r-sm"></div>
              <div className="row-start-3 col-start-2 bg-white/10 rounded-b-sm"></div>
            </div>
          </div>

          {/* Screen Area (The Banner) */}
          <div className="relative flex-1 aspect-[21/9] md:aspect-[25/9] bg-black rounded-2xl overflow-hidden border-4 border-[#111] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={promotion.id || activeIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="w-full h-full relative"
              >
                <Tag {...linkProps} className="block w-full h-full relative overflow-hidden z-10">
                  {/* Background Blur Fill */}
                  <div className="absolute inset-0 z-0">
                    <img src={promotion.image_url} className="w-full h-full object-cover blur-2xl opacity-40 scale-110" alt="" />
                  </div>

                  {/* Animated Background Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent z-10 pointer-events-none"></div>
                  
                  {/* Main Image */}
                  <img
                    src={promotion.image_url}
                    alt={promotion.title || "Promoción Banana Computer"}
                    className="w-full h-full object-contain relative z-10"
                    draggable={false}
                  />

                  {/* Content Overlay */}
                  {(promotion.title || promotion.subtitle) && (
                    <div className="absolute inset-0 z-20 flex flex-col justify-end pb-8 px-8 md:px-12 pointer-events-none">
                      <div className="max-w-xl">
                        {promotion.badge && (
                          <span className="inline-block px-2.5 py-0.5 bg-banana-yellow text-black text-[9px] font-black tracking-widest uppercase rounded-sm mb-3 shadow-lg">
                            {promotion.badge}
                          </span>
                        )}
                        <h2 className="text-xl md:text-3xl font-black text-white mb-1 leading-tight uppercase drop-shadow-lg">
                          {promotion.title}
                        </h2>
                        <div className="inline-flex items-center gap-2 text-[10px] font-black text-banana-yellow uppercase tracking-[0.2em] mt-2 group-hover:translate-x-2 transition-transform pointer-events-auto cursor-none">
                          Ver Oferta <ArrowRight size={12} />
                        </div>
                      </div>
                    </div>
                  )}
                </Tag>
              </motion.div>
            </AnimatePresence>

            {/* Screen Reflect Effect */}
            <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50"></div>
          </div>

          {/* Right Controller Area */}
          <div className="hidden lg:flex flex-col items-center gap-12 w-24">
            {/* Buttons XYBA */}
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">Y</div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">A</div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">X</div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">B</div>
            </div>
            {/* Joystick Right */}
            <div className="relative w-16 h-16 rounded-full bg-[#111] shadow-inner border border-white/10 flex items-center justify-center group/joy2">
              <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-banana-yellow via-raspberry to-purple-brand animate-spin-slow opacity-60 blur-[2px] [animation-direction:reverse]"></div>
              <div className="w-12 h-12 rounded-full bg-[#222] relative z-10 shadow-xl border border-white/5 group-hover/joy2:-translate-x-1 group-hover/joy2:-translate-y-1 transition-transform"></div>
            </div>
          </div>
        </div>

        {/* Console Bottom Info / Indicators */}
        <div className="mt-4 flex items-center justify-between px-4 opacity-30">
          <div className="flex gap-4">
            <div className="w-8 h-1 bg-white/20 rounded-full"></div>
            <div className="w-8 h-1 bg-white/20 rounded-full"></div>
          </div>
          {promoCount > 1 && (
            <div className="flex gap-2">
              {Array.from({ length: promoCount }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === activeIndex ? 'bg-banana-yellow' : 'bg-white/20'}`}></div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
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
