"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, ShieldCheck, Truck,
  Cpu, MemoryStick, HardDrive, Monitor, Battery,
  Scale, Wifi, Camera, Layers, Zap, Scan, Settings,
  Palette, Film, ChevronRight, Home, Sparkles, Trophy, Bell
} from 'lucide-react';
import WaitlistModal from './WaitlistModal';

const ICON_MAP = {
  '🧠': MemoryStick,
  '💾': HardDrive,
  '⚡': Cpu,
  '🖥️': Monitor,
  '🔋': Battery,
  '⚖️': Scale,
  '📶': Wifi,
  '📷': Camera,
  '🎮': Layers,
  '🎨': Palette,
  '🌈': Scan,
  '🎬': Film,
  'memory-stick': MemoryStick,
  'hard-drive': HardDrive,
  'cpu': Cpu,
  'monitor': Monitor,
  'battery': Battery,
  'scale': Scale,
  'wifi': Wifi,
  'camera': Camera,
  'layers': Layers,
  'zap': Zap,
  'scan': Scan,
  'default': Settings,
};

const formatPrice = (price) => {
  return (price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getIcon = (name, size = 18) => {
  const IconComp = ICON_MAP[name] || ICON_MAP.default;
  return <IconComp size={size} />;
};

export default function ProductDetailView({ product, initialAttrs = [] }) {
  const { addToCart } = useCart();
  const [dsOpen, setDsOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(product?.images?.[0] || product?.image_url);

  const basePrice = parseFloat(product?.price) || 0;
  const transferPrice = product?.transfer_price ? parseFloat(product.transfer_price) : (basePrice / 1.06);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const datasheetEntries = product?.datasheet ? Object.entries(product.datasheet) : [];
  const allImages = product?.images?.length > 0 ? product.images : (product?.image_url ? [product.image_url] : []);

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product?.name,
    "image": allImages,
    "description": product?.marketing_subtitle || product?.description,
    "sku": product?.model_number || product?.id,
    "mpn": product?.model_number,
    "brand": {
      "@type": "Brand",
      "name": product?.brand || "Banana Computer"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://bananacomputer.store/producto/${product?.slug || product?.id}`,
      "priceCurrency": "USD",
      "price": product?.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product?.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Banana Computer"
      }
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://bananacomputer.store/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": product?.categories?.name,
        "item": `https://bananacomputer.store/categoria/${product?.categories?.slug || product?.category_id}`
      },
      product?.subcategories?.name ? {
        "@type": "ListItem",
        "position": 3,
        "name": product?.subcategories?.name,
        "item": `https://bananacomputer.store/categoria/${product?.categories?.slug || product?.category_id}/${product?.subcategories?.slug || product?.subcategory_id}`
      } : null,
      {
        "@type": "ListItem",
        "position": product?.subcategories?.name ? 4 : 3,
        "name": product?.name,
        "item": `https://bananacomputer.store/producto/${product?.slug || product?.id}`
      }
    ].filter(Boolean)
  };

  const BananaRating = ({ score }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-xl ${i <= (score || 0) ? 'grayscale-0 opacity-100' : 'grayscale opacity-30'}`}>🍌</span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-bg pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 pt-28 pb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
        <Link href="/" className="hover:text-purple-brand"><Home size={12} /></Link>
        <ChevronRight size={10} />
        <Link href={`/categoria/${product?.categories?.slug || product?.category_id}`} className="hover:text-purple-brand">{product?.categories?.name}</Link>
        {product?.subcategories?.name && (
          <>
            <ChevronRight size={10} />
            <Link 
              href={`/categoria/${product?.categories?.slug || product?.category_id}/${product?.subcategories?.slug || product?.subcategory_id}`} 
              className="hover:text-purple-brand"
            >
              {product.subcategories.name}
            </Link>
          </>
        )}
        <ChevronRight size={10} />
        <span className="text-purple-brand opacity-100">{product?.name}</span>
      </nav>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Gallery */}
          <div className="flex flex-col gap-6">
            <div className="aspect-square bg-white rounded-3xl border border-black/5 flex items-center justify-center p-8 overflow-hidden">
              {activeImg ? (
                <img src={activeImg} alt={product?.name} className="object-contain w-full h-full hover:scale-110 transition-transform duration-700" />
              ) : (
                <span className="text-6xl opacity-10">🍌</span>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {allImages.map((u, i) => (
                  <button
                    key={i}
                    className={`w-24 h-24 shrink-0 rounded-2xl bg-white border-2 transition-all p-2 flex items-center justify-center ${activeImg === u ? 'border-purple-brand shadow-xl' : 'border-transparent opacity-60'}`}
                    onClick={() => setActiveImg(u)}
                  >
                    <img src={u} alt="" className="object-contain w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-purple-brand font-black text-[10px] uppercase tracking-[0.2em]">{product?.tagline || 'Ecuador Tech Official'}</span>
                {(product?.is_featured || product?.badgeType === 'featured') && (
                  <span className="px-2 py-0.5 bg-purple-brand text-white text-[8px] font-black tracking-widest uppercase rounded-full flex items-center gap-1 shadow-sm">
                    🏆 MÁS VENDIDA
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-1.5 tracking-tight">{product?.name}</h1>
              {product?.model_number && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold uppercase opacity-40">PN:</span>
                  <span className="px-3 py-1 bg-black/5 rounded-full text-[10px] font-black tracking-wide">{product.model_number}</span>
                </div>
              )}
              <p className="mt-4 text-sm text-gray-500 font-medium leading-relaxed">{product?.marketing_subtitle || product?.description}</p>
            </div>

              <div className="p-6 rounded-3xl bg-white border border-black/5 flex flex-col gap-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${product?.stock > 0 ? 'text-mint-success' : 'text-raspberry'}`}>
                      {product?.stock > 0 ? `✓ ${product.stock} en stock real` : '✗ AGOTADA'}
                    </span>
                    {product?.stock === 0 && (
                      <p className="text-[10px] font-bold text-gray-400 italic mt-1 leading-tight">
                        La espera usualmente dura 3 días laborables,<br/>pero primero le confirmaríamos las existencias.
                      </p>
                    )}
                    <div className="flex flex-col gap-4 mt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-purple-brand uppercase tracking-[0.2em] mb-1">Efectivo / Transferencia (incl. IVA)</span>
                        <span className="text-3xl lg:text-5xl font-black text-purple-brand">
                          ${formatPrice(transferPrice)}
                        </span>
                      </div>
                      <div className="flex flex-col pt-4 border-t border-black/5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Precio Normal (Tarjeta / Otros)</span>
                        <div className="flex items-baseline gap-3">
                          <span className="text-xl md:text-2xl font-bold text-gray-400 line-through">
                            ${formatPrice(basePrice)}
                          </span>
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Incluye IVA</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mt-1">Precio final con factura oficial</span>
                      </div>
                    </div>
                  </div>

                {product?.stock > 0 ? (
                  <button
                    className={`
                      px-8 py-3.5 rounded-2xl font-black text-sm md:text-base transition-all shadow-xl
                      ${added ? 'bg-mint-success text-white scale-95' : 'bg-banana-yellow text-black hover:scale-105 active:scale-95 shadow-banana-yellow/20'}
                    `}
                    onClick={handleAddToCart}
                  >
                    {added ? '✓ AGREGADO' : 'COMPRAR AHORA'}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsWaitlistOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm bg-purple-brand/10 text-purple-brand hover:bg-purple-brand/20 transition-all shadow-sm border border-purple-brand/10"
                  >
                    <Bell size={18} /> ME INTERESA
                  </button>
                )}
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-black/5 pt-8">
                {initialAttrs.slice(0, 6).map((a, i) => (
                  <div key={i} className="flex flex-col gap-1 p-3 rounded-2xl border border-black/5 hover:bg-gray-50 transition-colors">
                    <span className="text-purple-brand opacity-60">{getIcon(a.attribute_definitions?.icon, 18)}</span>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{a.attribute_definitions?.name}</span>
                    <span className="text-[11px] font-black leading-tight">{a.value}{a.attribute_definitions?.unit ? ` ${a.attribute_definitions.unit}` : ''}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-4 opacity-50 text-[10px] font-bold uppercase tracking-widest border-t border-black/5">
                <div className="flex items-center gap-2"><ShieldCheck size={14} /> Garantía Local en Ecuador (1 Año)</div>
                <div className="flex items-center gap-2"><Truck size={14} /> Envío Certificado a nivel nacional</div>
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase opacity-20 text-center tracking-widest leading-relaxed">Original Retail Product • SKU: {product?.sku}</p>
          </div>
        </div>

        {/* Banana Review Section */}
        {product?.banana_review && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32"
          >
            <div className="flex items-center gap-4 mb-10">
              <h2 className="text-2xl font-black tracking-tight">Banana <span className="text-purple-brand">Expert</span> Review</h2>
              <div className="px-3 py-1 bg-black text-white text-[9px] font-black tracking-[0.2em] rounded-full flex items-center gap-1.5">
                <Sparkles size={12} className="text-banana-yellow" /> AI POWERED
              </div>
            </div>

            <div className="bg-white border border-black/5 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative group shadow-sm">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-brand/5 blur-[100px] -z-0"></div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Verdict */}
                <div className="lg:col-span-12 p-6 rounded-3xl bg-purple-brand/5 border border-purple-brand/10 flex flex-col md:flex-row items-center gap-6">
                  <div className="px-4 py-2 bg-purple-brand text-white font-black text-sm tracking-widest rounded-xl shrink-0">EL VEREDICTO</div>
                  <p className="text-lg md:text-2xl font-black italic tracking-tight text-center md:text-left text-purple-brand">\"{product.banana_review.verdict}\"</p>
                </div>

                {/* Scores */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <h4 className="text-[10px] font-black tracking-[0.3em] opacity-40 uppercase mb-2">// PUNTUACIÓN TÉCNICA</h4>
                  {[
                    { label: 'Oficina / Trabajo', score: product.banana_review.scores?.office },
                    { label: 'Heavy Gaming', score: product.banana_review.scores?.gaming },
                    { label: 'Diseño / Pantalla', score: product.banana_review.scores?.design },
                    { label: 'Portabilidad', score: product.banana_review.scores?.portability },
                    { label: 'Costo / Beneficio', score: product.banana_review.scores?.value },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-black/5 group-hover:bg-purple-brand/5 transition-colors">
                      <span className="font-bold text-sm tracking-tight text-gray-700">{s.label}</span>
                      <BananaRating score={s.score} />
                    </div>
                  ))}
                </div>

                {/* Pros/Cons */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-mint-success/10 border border-mint-success/20">
                      <h4 className="text-xs font-black text-mint-success mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <Zap size={14} /> Lo más destacado
                      </h4>
                      <ul className="flex flex-col gap-3 text-sm font-medium opacity-80">
                        {product.banana_review.pros?.map((p, i) => <li key={i} className="flex gap-2 text-mint-success"><span className="shrink-0">✓</span> <span className="text-gray-600">{p}</span></li>)}
                      </ul>
                    </div>
                    <div className="p-6 rounded-3xl bg-purple-brand/5 border border-purple-brand/20">
                      <h4 className="text-xs font-black text-purple-brand mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <Scan size={14} /> A considerar
                      </h4>
                      <ul className="flex flex-col gap-3 text-sm font-medium opacity-80 text-gray-600">
                        {product.banana_review.cons?.map((c, i) => <li key={i} className="flex gap-2"><span className="shrink-0">•</span> <span>{c}</span></li>)}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Detailed */}
                <div className="lg:col-span-12 p-8 rounded-3xl bg-gray-50 border border-black/5 mt-2 shadow-sm">
                  <h4 className="text-[10px] font-black tracking-[0.3em] opacity-40 uppercase mb-6 text-purple-brand">// ANÁLISIS CRÍTICO DEL EXPERTO</h4>
                  <p className="text-lg opacity-80 leading-relaxed font-medium text-gray-700">{product.banana_review.detailed_review}</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Expandable Datasheet */}
        {datasheetEntries.length > 0 && (
          <section className="mt-20 mb-20">
            <button
              className="w-full flex items-center justify-between p-8 rounded-3xl bg-white border border-black/5 hover:border-purple-brand/20 transition-all font-black"
              onClick={() => setDsOpen(!dsOpen)}
            >
              <div className="flex items-center gap-4">
                <Layers className="text-purple-brand" size={24} />
                <span className="text-xl">Ficha Técnica Oficial</span>
              </div>
              {dsOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            <div className={`overflow-hidden transition-all duration-700 ${dsOpen ? 'max-h-[2000px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-8 bg-white rounded-3xl border border-black/5">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {datasheetEntries.map(([key, val], i) => (
                      <tr key={i} className="border-b border-black/5 last:border-0">
                        <td className="py-4 font-black uppercase text-[10px] text-gray-400 w-1/3 tracking-widest">{key}</td>
                        <td className="py-4 font-bold opacity-80">{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>

      <WaitlistModal 
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        product={product}
      />
      <Footer />
    </div>
  );
}
