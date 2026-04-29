"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Logo from '@/components/Logo';
import ProductGrid from '@/components/ProductGrid';
import AIAssistant from '@/components/AIAssistant';
import HeroBanner from '@/components/HeroBanner';
import { useStore } from '@/context/StoreContext';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck, Award, Truck, Lock, Sparkles,
  ChevronDown, ArrowRight, CircuitBoard, Cpu, Zap
} from 'lucide-react';
import FeatureCard from '@/components/FeatureCard';
import BrandText from '@/components/BrandText';
import BrandFloaters from '@/components/BrandFloaters';

// ─── Timing constants (ms) ────────────────────────────────────────
const HERO_DISPLAY_MS = 2200;  // how long hero stays before first exit
const HERO_RETURN_MS = 2000;  // how long hero shows on its return
const BANNER_DISPLAY_MS = 5000;  // how long banner stays visible
const TRANSITION_MS = 700;   // must match CSS transition duration in HeroBanner

/**
 * Phase state machine:
 *   hero-in → (2.2s) → hero-out → (0.7s) → banner-in → (5s) → banner-out → (0.7s) → hero-in → ...
 */
export default function HomePage() {
  const { heroContent, brandLogos } = useStore();
  const [showAI, setShowAI] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [marqueeMsgs, setMarqueeMsgs] = useState([]);
  const [laptopProducts, setLaptopProducts] = useState([]);
  const [promoIndex, setPromoIndex] = useState(0);
  const [phase, setPhase] = useState('hero'); // 'hero' | 'hero-out' | 'banner-in' | 'banner' | 'banner-out'

  // Fetch active content once on mount
  useEffect(() => {
    // Promotions
    supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setPromotions(data);
      });

    // Marquee Messages
    supabase
      .from('marquee_messages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setMarqueeMsgs(data);
      });

    // Laptop Products for bottom marquee
    supabase
      .from('products')
      .select('name, categories!inner(name)')
      .eq('is_active', true)
      .ilike('categories.name', '%laptop%')
      .limit(15)
      .then(({ data, error }) => {
        if (error) console.error('Error fetching laptops marquee:', error);
        if (data) setLaptopProducts(data);
      });
  }, []);

  // Auto-cycle promotions every 5 seconds
  useEffect(() => {
    if (promotions.length <= 1) return;
    const t = setInterval(() => {
      setPromoIndex(i => (i + 1) % promotions.length);
    }, BANNER_DISPLAY_MS);
    return () => clearInterval(t);
  }, [promotions]);

  const currentPromo = promotions[promoIndex] ?? null;

  return (
    <main className="flex-1">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[85vh] flex items-center pt-24 md:pt-32 pb-12 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 bg-cream-bg">
          <div className="absolute bottom-0 right-[20%] w-[40%] h-[40%] bg-raspberry/10 blur-[100px] rounded-full"></div>
        </div>

        {/* ── HERO CONTENT ── */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* LEFT COLUMN: Text and CTA */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10 w-full">
            <h1 className="mb-4 md:mb-6 text-5xl md:text-7xl lg:text-8xl uppercase font-black tracking-tighter leading-[0.9] drop-shadow-sm">
              <BrandText text={heroContent?.title || 'PEELING INTO THE FUTURE'} brandClassName="font-pixel-legacy text-black" />
            </h1>

            <p className="text-base md:text-xl text-gray-500 font-medium max-w-xl mb-8 leading-relaxed">
              <BrandText text={heroContent?.subtitle || 'Bienvenido a Banana Computer, tu aliado confiable para hardware global con garantía oficial.'} secondary={true} />
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative group/cta">
                {/* Floating Bananas Effect */}
                <div className="absolute inset-0 pointer-events-none -z-10 opacity-100 transition-opacity">
                  <span className="absolute -top-8 -left-8 text-2xl animate-[bananaFloat_4s_linear_infinite] delay-0">🍌</span>
                  <span className="absolute -top-12 left-1/2 text-2xl animate-[bananaFloat_3.5s_linear_infinite] delay-500">🍌</span>
                  <span className="absolute -top-8 -right-8 text-2xl animate-[bananaFloat_4.5s_linear_infinite] delay-1000">🍌</span>
                </div>
                <button
                  className="group relative px-10 py-5 bg-purple-brand text-white rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-purple-brand/30 flex items-center gap-4 overflow-hidden animate-ai-glow"
                  onClick={() => setShowAI(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Sparkles className="text-banana-yellow" size={24} />
                  {heroContent?.primary_cta || 'Explorar Sistemas'}
                </button>
              </div>
            </div>

            {/* Trust Stats - Grid Layout under CTA */}
            <div className="mt-12 grid grid-cols-2 gap-6 w-full max-w-md opacity-90 border-t border-black/5 pt-8">
              <div className="flex items-center gap-3">
                <ShieldCheck size={28} className="text-purple-brand" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-800 text-left leading-tight">Equipos<br />Originales</span>
              </div>
              <div className="flex items-center gap-3">
                <Award size={28} className="text-purple-brand" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-800 text-left leading-tight">Garantía<br />Real</span>
              </div>
              <div className="flex items-center gap-3">
                <Truck size={28} className="text-purple-brand" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-800 text-left leading-tight">Entrega<br />Express</span>
              </div>
              <div className="flex items-center gap-3">
                <Lock size={28} className="text-purple-brand" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-800 text-left leading-tight">Pago<br />Seguro</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Visual floating layout */}
          <div className="relative w-full h-[400px] lg:h-[600px] flex items-center justify-center min-h-0 z-10 hidden md:flex">
            {/* Ambient Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/60 blur-[80px] rounded-full z-0"></div>

            {/* Central Logo container */}
            <div className="relative z-10 animate-float-hero shadow-2xl rounded-2xl bg-white border border-purple-brand/10 p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-banana-yellow/10 to-transparent z-0 pointer-events-none"></div>
              <Logo size="large" animated={true} />
            </div>

            {/* Orbiting Brand Logos */}
            <BrandFloaters logos={brandLogos} />

            {/* Geometric orbits */}
            <div className="absolute top-1/2 left-1/2 w-[80%] h-[80%] lg:w-[110%] lg:h-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-brand/10 border-dashed animate-[spin_60s_linear_infinite]"></div>
            <div className="absolute top-1/2 left-1/2 w-[60%] h-[60%] lg:w-[80%] lg:h-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-banana-yellow/20 border-dotted animate-[spin_40s_linear_infinite_reverse]"></div>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <ChevronDown className="text-gray-300" size={32} />
        </div>

        {/* Local animations */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes float_hero {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(2deg); }
          }
          @keyframes float_hero_reverse {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(20px) rotate(-2deg); }
          }
          .animate-float-hero { animation: float_hero 7s ease-in-out infinite; }
          .animate-float-hero-reverse { animation: float_hero_reverse 8s ease-in-out infinite; }
        `}} />
      </section>

      {/* Promotions Carousel Section - Tech Arena Style */}
      {promotions.length > 0 && (
        <section className="bg-purple-brand py-4 md:py-6 relative overflow-hidden border-y border-white/5">
          {/* ── TECH ARENA DECORATIONS ── */}
          {/* Animated Circuit Grid */}
          <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-brand via-[#3A3561] to-[#2D2852]"></div>

          {/* Glowing Nodes & Lines */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <div className="absolute top-[10%] left-[5%] w-px h-32 bg-gradient-to-b from-transparent via-banana-yellow/40 to-transparent"></div>
            <div className="absolute top-[20%] right-[8%] w-px h-48 bg-gradient-to-b from-transparent via-purple-brand/60 to-transparent"></div>
            <div className="absolute bottom-[15%] left-[12%] w-64 h-px bg-gradient-to-r from-transparent via-banana-yellow/30 to-transparent"></div>

            {/* Pulsing Tech Nodes */}
            <div className="absolute top-1/4 right-[15%] w-2 h-2 bg-banana-yellow rounded-full animate-pulse shadow-[0_0_10px_#FBDD33]"></div>
            <div className="absolute bottom-1/3 left-[10%] w-2 h-2 bg-purple-brand rounded-full animate-pulse delay-700 shadow-[0_0_10px_#4B467B]"></div>
          </div>

          {/* ── TOP MARQUEE (The "Ticker") ── */}
          <div className="absolute top-0 left-0 w-full py-2.5 bg-black/40 backdrop-blur-xl border-b border-white/10 overflow-hidden z-20 flex items-center">
            <div
              className="whitespace-nowrap animate-[marquee_linear_infinite] flex items-center gap-12"
              style={{
                animationDuration: `${Math.max(40, (marqueeMsgs.length || 4) * 12)}s`
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-12 text-[9px] font-black uppercase tracking-[0.3em] text-banana-yellow/80">
                  {marqueeMsgs.length > 0 ? marqueeMsgs.map((msg, idx) => (
                    <React.Fragment key={msg.id || idx}>
                      <span>{msg.text}</span>
                      <span className="text-white/40">•</span>
                    </React.Fragment>
                  )) : (
                    <>
                      <span>⚡ OFERTAS EXCLUSIVAS SEMANALES</span>
                      <span className="text-white/40">•</span>
                      <span>🎮 HARDWARE GLOBAL CON GARANTÍA LOCAL</span>
                      <span className="text-white/40">•</span>
                      <span>🚀 ENTREGAS EXPRESS A NIVEL NACIONAL</span>
                      <span className="text-white/40">•</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 relative z-10 pt-6 pb-6">
            {/* Section Heading */}
            <div className="flex flex-col items-center mb-6">
              <h2 className="text-2xl md:text-4xl font-black text-white text-center uppercase tracking-tighter">
                Zona de <span className="text-banana-yellow">Oportunidades</span>
              </h2>
            </div>
            <HeroBanner
              promotion={currentPromo}
              promoCount={promotions.length}
              activeIndex={promoIndex}
            />
          </div>

          {/* ── BOTTOM MARQUEE (Reverse direction) ── */}
          <div className="absolute bottom-0 left-0 w-full py-3 bg-black/20 backdrop-blur-sm border-t border-white/5 overflow-hidden z-20 flex items-center">
            <div
              className="whitespace-nowrap animate-[marquee_linear_infinite_reverse] flex items-center gap-12"
              style={{
                animationDuration: `${Math.max(30, (laptopProducts.length || 6) * 8)}s`
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-12 text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                  {laptopProducts.length > 0 ? laptopProducts.map((p, idx) => (
                    <React.Fragment key={idx}>
                      <span>{p.name}</span>
                      <span>•</span>
                    </React.Fragment>
                  )) : (
                    <>
                      <span>ASUS ROG</span>
                      <span>•</span>
                      <span>LENOVO LEGION</span>
                      <span>•</span>
                      <span>HP OMEN</span>
                      <span>•</span>
                      <span>ACER PREDATOR</span>
                      <span>•</span>
                      <span>APPLE M3 SERIES</span>
                      <span>•</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}} />
        </section>
      )}

      {/* Catalog Anchor */}
      <div id="catalogo" className="h-4"></div>

      {/* Products Section */}
      <section className="pt-12 pb-4">
        <ProductGrid />
      </section>

      {/* Features Section */}
      <section className="pt-12 pb-20 bg-cream-bg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-purple-brand opacity-60 font-pixel text-[10px] uppercase tracking-[0.4em] mb-4">// DISTINCIÓN BANANA COMPUTER</span>
            <h2 className="mb-4">Calidad y <span className="text-purple-brand">Confianza</span></h2>
            <div className="h-1 bg-purple-brand w-16 opacity-10"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<ShieldCheck size={32} />}
              title="Garantía Local"
              desc="Respaldo directo de las marcas en Ecuador, sin complicaciones."
              color="bg-purple-brand text-banana-yellow"
            />
            <FeatureCard
              icon={<Sparkles size={32} />}
              title="Soporte Directo"
              desc="Asistencia técnica de expertos para configurar tu equipo ideal."
              color="bg-purple-brand text-banana-yellow"
            />
            <FeatureCard
              icon={<Award size={32} />}
              title="Marcas Líderes"
              desc="Canal distribuidor oficial de ASUS, Lenovo y HP en el país."
              color="bg-purple-brand text-banana-yellow"
            />
            <FeatureCard
              icon={<Lock size={32} />}
              title="Productos Nuevos"
              desc="Equipos 100% sellados de fábrica con trazabilidad garantizada."
              color="bg-purple-brand text-banana-yellow"
            />
          </div>
        </div>
      </section>

      <Footer />
      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
    </main>
  );
}
