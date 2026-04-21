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
  ChevronDown, ArrowRight
} from 'lucide-react';
import FeatureCard from '@/components/FeatureCard';
import BrandText from '@/components/BrandText';

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
  const { heroContent } = useStore();
  const [showAI, setShowAI] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [promoIndex, setPromoIndex] = useState(0);
  const [phase, setPhase] = useState('hero'); // 'hero' | 'hero-out' | 'banner-in' | 'banner' | 'banner-out'

  // Fetch active promotions once on mount
  useEffect(() => {
    supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setPromotions(data);
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
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex flex-col items-center justify-center pt-24 md:pt-28 pb-8 md:pb-12 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 bg-cream-bg">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-banana-yellow/20 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-brand/10 blur-[120px] rounded-full"></div>
        </div>

        {/* ── HERO CONTENT ── */}
        <div className="max-w-4xl w-full flex flex-col items-center text-center">
          {/* Logo large */}
          <div className="mb-8 md:mb-10 hover:scale-110 transition-transform duration-700 cursor-none transform-gpu">
            <Logo size="large" animated={true} />
          </div>

          <h1 className="mb-4 md:mb-6 text-4xl md:text-6xl lg:text-8xl px-4 uppercase font-black tracking-tighter">
            <BrandText text={heroContent?.title || 'PEELING INTO THE FUTURE'} brandClassName="font-pixel-legacy text-black" />
          </h1>

          <p className="text-sm md:text-lg text-gray-400 font-medium max-w-2xl mb-6 md:mb-8 px-6 leading-relaxed">
            <BrandText text={heroContent?.subtitle || 'Bienvenido a Banana Computer, tu aliado confiable para hardware global con garantía oficial.'} secondary={true} />
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center">
            <div className="relative group/cta">
              {/* Floating Bananas Effect */}
              <div className="absolute inset-0 pointer-events-none -z-10 opacity-100 transition-opacity">
                <span className="absolute -top-8 -left-8 text-2xl animate-[bananaFloat_4s_linear_infinite] delay-0">🍌</span>
                <span className="absolute -top-12 left-1/2 text-2xl animate-[bananaFloat_3.5s_linear_infinite] delay-500">🍌</span>
                <span className="absolute -top-8 -right-8 text-2xl animate-[bananaFloat_4.5s_linear_infinite] delay-1000">🍌</span>
              </div>
              <button
                className="group relative px-10 py-5 bg-purple-brand text-white rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-purple-brand/30 flex items-center gap-4 overflow-hidden animate-shake-strong animate-ai-glow"
                onClick={() => setShowAI(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Sparkles className="text-banana-yellow" size={24} />
                {heroContent?.primary_cta || 'Explorar Sistemas'}
              </button>
            </div>
          </div>

          {/* Trust Stats */}
          <div className="mt-12 md:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 opacity-80">
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck size={32} className="text-purple-brand" />
              <span className="text-[10px] font-black uppercase tracking-widest">Equipos Originales</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Award size={32} className="text-purple-brand" />
              <span className="text-[10px] font-black uppercase tracking-widest">Garantía Real</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Truck size={32} className="text-purple-brand" />
              <span className="text-[10px] font-black uppercase tracking-widest">Entrega Express</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Lock size={32} className="text-purple-brand" />
              <span className="text-[10px] font-black uppercase tracking-widest">Pago Seguro</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 animate-bounce">
          <ChevronDown className="text-gray-300" size={32} />
        </div>
      </section>

      {/* Promotions Carousel Section */}
      {promotions.length > 0 && (
        <section className="bg-cream-bg py-8 md:py-12 border-y border-black/5">
          <div className="max-w-7xl mx-auto px-4">
            <HeroBanner 
              promotion={currentPromo} 
              promoCount={promotions.length} 
              activeIndex={promoIndex} 
            />
          </div>
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
              desc="Distribuidores oficiales de ASUS, Lenovo, HP y Apple en el país."
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
