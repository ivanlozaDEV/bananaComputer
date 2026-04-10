"use client";
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
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
  Palette, Film, ChevronRight, Home, Sparkles
} from 'lucide-react';

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

const getIcon = (name, size = 18) => {
  const IconComp = ICON_MAP[name] || ICON_MAP.default;
  return <IconComp size={size} />;
};

export default function ProductDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [attrs, setAttrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dsOpen, setDsOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(null);

  useEffect(() => {
    const load = async () => {
      let { data: prod, error } = await supabase
        .from('products')
        .select('*, categories(id, name), subcategories:subcategory_id(id, name)')
        .eq('id', id)
        .single();

      if (error) {
        // Fallback for different relation naming
        const { data: fbProd } = await supabase
          .from('products')
          .select('*, categories(id, name)')
          .eq('id', id)
          .single();
        
        if (!fbProd) {
          router.push('/');
          return;
        }
        prod = fbProd;
      }
      
      setProduct(prod);
      if (prod) {
        setActiveImg(prod.images?.[0] || prod.image_url);
      }

      const { data: prodAttrs } = await supabase
        .from('product_attributes')
        .select('value, attribute_definitions(name, unit, icon, display_order)')
        .eq('product_id', id)
        .order('attribute_definitions(display_order)');
      setAttrs(prodAttrs || []);
      setLoading(false);
    };
    load();
  }, [id, router]);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-purple-brand text-white">
        <span className="text-5xl animate-bounce">🍌</span>
        <span className="font-black uppercase tracking-widest text-xs opacity-60">Cargando detalles...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream-bg">
        <Header />
        <div className="max-w-7xl mx-auto px-4 pt-40 pb-20 flex flex-col items-center justify-center text-center">
          <span className="text-8xl mb-8">🍌🔎</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-purple-brand mb-4">Producto No Encontrado</h1>
          <p className="text-gray-500 font-medium mb-12 max-w-lg">
            Parece que el equipo que buscas ha sido retirado del inventario o el enlace ya no es válido.
          </p>
          <Link 
            href="/" 
            className="px-8 py-4 bg-purple-brand text-white rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-brand/20"
          >
            Regresar al Catálogo
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const datasheetEntries = product.datasheet ? Object.entries(product.datasheet) : [];
  const allImages = product.images?.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);

  const BananaRating = ({ score }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-xl ${i <= (score || 0) ? 'grayscale-0 opacity-100' : 'grayscale opacity-30'}`}>🍌</span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-bg pb-20">
      <Header />
      
      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 pt-28 pb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
        <Link href="/" className="hover:text-purple-brand"><Home size={12} /></Link>
        <ChevronRight size={10} />
        <Link href={`/categoria/${product.category_id}`} className="hover:text-purple-brand">{product.categories?.name}</Link>
        {product.subcategories?.name && (
          <>
            <ChevronRight size={10} />
            <span>{product.subcategories.name}</span>
          </>
        )}
        <ChevronRight size={10} />
        <span className="text-purple-brand opacity-100">{product.name}</span>
      </nav>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          
          {/* Gallery */}
          <div className="flex flex-col gap-6">
            <div className="aspect-square bg-white rounded-3xl border border-black/5 flex items-center justify-center p-8 overflow-hidden">
              {activeImg ? (
                <img src={activeImg} alt={product.name} className="object-contain w-full h-full hover:scale-110 transition-transform duration-700" />
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
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-purple-brand font-black text-[10px] uppercase tracking-[0.2em]">{product.tagline || 'Ecuador Tech Official'}</span>
              <h1 className="mb-2 tracking-tight">{product.name}</h1>
              {product.model_number && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold uppercase opacity-40">PN:</span>
                  <span className="px-3 py-1 bg-black/5 rounded-full text-[10px] font-black tracking-wide">{product.model_number}</span>
                </div>
              )}
              <p className="mt-4 text-sm text-gray-500 font-medium leading-relaxed">{product.marketing_subtitle || product.description}</p>
            </div>

            <div className="p-6 md:p-8 rounded-3xl bg-white border border-black/5 flex flex-col gap-6 md:gap-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${product.stock > 0 ? 'text-mint-success' : 'text-raspberry'}`}>
                    {product.stock > 0 ? `✓ ${product.stock} en stock real` : '✗ Sin stock temporalmente'}
                  </span>
                  <span className="text-3xl md:text-4xl font-black text-purple-brand mt-1">
                    ${(parseFloat(product.price) || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </span>
                  <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mt-1">Precio Incluido impuestos</span>
                </div>
                
                <button
                  className={`
                    px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg transition-all shadow-2xl
                    ${added ? 'bg-mint-success text-white scale-95' : 'bg-banana-yellow text-black hover:scale-105 active:scale-95 shadow-banana-yellow/20'}
                    ${product.stock === 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                  `}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  {added ? '✓ AGREGADO' : 'COMPRAR AHORA'}
                </button>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-black/5 pt-8">
                {attrs.slice(0, 6).map((a, i) => (
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
            
            <p className="text-[10px] font-bold uppercase opacity-20 text-center tracking-widest leading-relaxed">Original Retail Product • SKU: {product.sku}</p>
          </div>
        </div>

        {/* Banana Review Section */}
        {product.banana_review && (
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
                  <p className="text-lg md:text-2xl font-black italic tracking-tight text-center md:text-left text-purple-brand">"{product.banana_review.verdict}"</p>
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

                {/* Pros/Cons & Detailed */}
                <div className="lg:col-span-7 flex flex-col gap-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-mint-success/10 border border-mint-success/20">
                      <h4 className="text-xs font-black text-mint-success mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <Zap size={14} /> Lo más destacado
                      </h4>
                      <ul className="flex flex-col gap-3 text-sm font-medium opacity-80">
                        {product.banana_review.pros?.map((p, i) => <li key={i} className="flex gap-2 text-mint-success"><span>✓</span> <span className="text-gray-600">{p}</span></li>)}
                      </ul>
                    </div>
                    <div className="p-6 rounded-3xl bg-purple-brand/5 border border-purple-brand/20">
                      <h4 className="text-xs font-black text-purple-brand mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <Scan size={14} /> A considerar
                      </h4>
                      <ul className="flex flex-col gap-3 text-sm font-medium opacity-80 text-gray-600">
                        {product.banana_review.cons?.map((c, i) => <li key={i} className="flex gap-2"><span>•</span> {c}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl bg-gray-50 border border-black/5">
                    <h4 className="text-[10px] font-black tracking-[0.3em] opacity-40 uppercase mb-6 text-purple-brand">// ANÁLISIS CRÍTICO DEL EXPERTO</h4>
                    <p className="text-lg opacity-80 leading-relaxed font-medium text-gray-700">{product.banana_review.detailed_review}</p>
                  </div>
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

      <Footer />
    </div>
  );
}

