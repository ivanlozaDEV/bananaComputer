"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Cpu, MemoryStick, HardDrive, Monitor, Battery,
  Scale, Wifi, Camera, Layers, Zap, Scan, Settings,
  Palette, Film, ChevronLeft, ChevronRight, ShoppingCart, Bell
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

const getIcon = (name, size = 14) => {
  const IconComp = ICON_MAP[name] || ICON_MAP.default;
  return <IconComp size={size} />;
};

const ProductCard = ({ product, addedIds, handleAddToCart, variant = 'grid' }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const images = React.useMemo(() => {
    let imgs = [];
    try {
      if (Array.isArray(product.images)) {
        imgs = product.images;
      } else if (typeof product.images === 'string' && product.images.length > 0) {
        // Handle postgres array format {url1,url2} or JSON string ["url1","url2"]
        const cleaned = product.images.startsWith('{')
          ? product.images.replace('{', '[').replace('}', ']')
          : product.images;
        if (cleaned.startsWith('[')) {
          imgs = JSON.parse(cleaned);
        } else {
          imgs = product.images.split(',').map(s => s.trim());
        }
      }
    } catch (e) {
      console.error("Error parsing images for product:", product.id, e);
    }

    if (imgs.length === 0 && product.image_url) {
      imgs = [product.image_url];
    }
    const result = imgs.filter(img => typeof img === 'string' && img.length > 0);
    return result;
  }, [product.images, product.image_url]);

  const nextImg = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const isAdded = addedIds?.has(product.id);
  const basePrice = parseFloat(product.price) || 0;
  const transferPrice = product.transfer_price ? parseFloat(product.transfer_price) : (basePrice / 1.06);

  if (variant === 'list') {
    return (
      <article className="group relative bg-white rounded-2xl border border-black/5 overflow-hidden transition-all duration-500 hover:shadow-xl flex flex-col sm:flex-row h-full sm:min-h-[220px]">
        {/* Image - Left */}
        <div className="relative w-full sm:w-[200px] min-h-[180px] sm:min-h-0 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border-b sm:border-b-0 sm:border-r border-black/5">
          <Link href={`/producto/${product.id}`} className="w-full h-full flex items-center justify-center">
            {images.length > 0 ? (
              <img
                src={images[imgIndex]}
                alt={product.name}
                className="object-contain w-full h-full p-8 transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="text-4xl grayscale opacity-20">🍌</div>
            )}
          </Link>

          {/* Badge */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
            {product.stock === 0 ? (
              <span className="px-2 py-0.5 text-[8px] font-black tracking-widest uppercase rounded-full shadow-md bg-raspberry text-white">
                AGOTADA
              </span>
            ) : product.badgeType === 'featured' || product.is_featured ? (
              <span className="px-2 py-0.5 text-[8px] font-black tracking-widest uppercase rounded-full shadow-md bg-purple-brand text-white flex items-center gap-1">
                🏆 MÁS VENDIDA
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[8px] font-black tracking-widest uppercase rounded-full shadow-md bg-banana-yellow text-black">
                NUEVO
              </span>
            )}
          </div>
        </div>

        {/* Info - Middle */}
        <div className="flex-1 p-5 flex flex-col gap-3 min-w-0">
          <div className="flex-1">
            <Link href={`/producto/${product.id}`} className="block">
              <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className="text-base font-black leading-tight group-hover:text-purple-brand transition-colors line-clamp-2">{product.name}</h3>
                <span className="text-[9px] font-bold py-0.5 px-2 bg-black/5 rounded-full">{product.year}</span>
              </div>
              {product.model_number && (
                <span className="inline-block px-2 py-0.5 bg-purple-brand/5 text-purple-brand text-[9px] font-black tracking-widest uppercase rounded mb-2">
                  {product.model_number}
                </span>
              )}
              <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed">
                {product.marketing_subtitle || product.description}
              </p>
            </Link>
          </div>

          {/* Specs Mini View */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {product.specs?.slice(0, 6).map((spec, index) => (
              <div key={index} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-black/5">
                <span className="text-purple-brand opacity-60 scale-75 shrink-0">{getIcon(spec.icon, 12)}</span>
                <span className="text-[8px] font-black whitespace-nowrap">{spec.value}{spec.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Pane - Right */}
        <div className="w-full sm:w-[180px] p-5 bg-gray-50/50 border-t sm:border-t-0 sm:border-l border-black/5 flex flex-col justify-center items-center gap-4 shrink-0">
          <div className="text-center flex flex-col gap-1">
            <div className="flex flex-col items-center">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Precio Normal (incl. IVA)</span>
              <span className="block text-xl font-bold text-gray-400 leading-none line-through opacity-50">
                ${formatPrice(basePrice)}
              </span>
            </div>

            <div className="mt-2 text-center">
              <span className="block text-[10px] font-black text-purple-brand uppercase tracking-widest leading-none mb-1">Efectivo / Transferencia</span>
              <span className="block text-2xl font-black text-purple-brand">
                ${formatPrice(transferPrice)}
              </span>
              <span className="block text-[8px] font-bold uppercase tracking-wider opacity-60 mt-1">IVA INCLUIDO • Disponible en checkout</span>
            </div>
          </div>

          <div className="flex flex-col w-full gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (product.stock > 0) {
                  handleAddToCart(e, product);
                } else {
                  setIsWaitlistOpen(true);
                }
              }}
              className={`
                w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
                ${product.stock === 0 ? 'bg-purple-brand/10 text-purple-brand hover:bg-purple-brand/20' : isAdded ? 'bg-mint-success text-white' : 'bg-banana-yellow text-black hover:scale-105 active:scale-95 shadow-md shadow-banana-yellow/10'}
              `}
            >
              {product.stock === 0 ? (
                <>
                  <Bell size={14} />
                  ME INTERESA
                </>
              ) : isAdded ? '✓ LISTO' : (
                <>
                  <ShoppingCart size={14} fill="currentColor" />
                  AGREGAR
                </>
              )}
            </button>
            <Link
              href={`/producto/${product.id}`}
              className="w-full py-2.5 bg-white border border-black/5 text-center rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-purple-brand transition-all hover:bg-white"
            >
              VER DETALLES
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // Default Grid layout
  return (
    <article className="group relative bg-white rounded-2xl border border-black/5 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] flex flex-col h-full">
      {/* Badge */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex flex-col gap-1">
        {product.stock === 0 ? (
          <span className="px-2 py-0.5 md:px-3 md:py-1 bg-raspberry text-white text-[8px] md:text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg">
            AGOTADA
          </span>
        ) : product.badgeType === 'featured' || product.is_featured ? (
          <span className="px-2 py-0.5 md:px-3 md:py-1 bg-purple-brand text-white text-[8px] md:text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg flex items-center gap-1">
            🏆 MÁS VENDIDA
          </span>
        ) : (
          <span className="px-2 py-0.5 md:px-3 md:py-1 bg-banana-yellow text-black text-[8px] md:text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg">
            NUEVO
          </span>
        )}
      </div>

      {/* Image Carousel */}
      <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
        <Link href={`/producto/${product.id}`} className="absolute inset-0 flex items-center justify-center z-0">
          {images.length > 0 ? (
            <img
              src={images[imgIndex]}
              alt={product.name}
              className="object-contain w-full h-full p-2 md:p-6 transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="text-3xl md:text-5xl grayscale opacity-20">🍌</div>
          )}
        </Link>

        {images.length > 1 && (
          <>
            <button
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 p-1 md:p-2 bg-black/5 md:bg-black/10 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 text-black hover:bg-black/30 hover:scale-110 active:scale-95"
              onClick={prevImg}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-1 md:p-2 bg-black/5 md:bg-black/10 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 text-black hover:bg-black/30 hover:scale-110 active:scale-95"
              onClick={nextImg}
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1 pointer-events-none">
              {images.map((_, i) => (
                <span key={i} className={`h-1 md:h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-purple-brand w-3 md:w-4' : 'bg-black/20 w-1 md:w-1.5'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info Container */}
      <div className="p-3 md:p-6 flex flex-col flex-1 gap-2 md:gap-4">
        <Link href={`/producto/${product.id}`} className="block">
          <div className="flex justify-between items-start gap-1 mb-0.5">
            <h3 className="text-[13px] md:text-base font-black leading-tight group-hover:text-purple-brand transition-colors line-clamp-2">{product.name}</h3>
            <span className="text-[8px] md:text-[9px] font-bold py-0.5 px-1.5 bg-black/5 rounded-full whitespace-nowrap lg:shrink-0">{product.year}</span>
          </div>
          {product.model_number && (
            <span className="inline-block px-1.5 py-0.5 bg-purple-brand/5 text-purple-brand text-[8px] md:text-[9px] font-black tracking-widest uppercase rounded">
              {product.model_number}
            </span>
          )}
          <p className="mt-1 text-[10px] md:text-xs text-gray-500 font-medium line-clamp-2 leading-tight md:leading-relaxed">
            {product.marketing_subtitle || product.description}
          </p>
        </Link>

        {/* Specs Grid - Hidden or very compact on mobile */}
        <div className="grid grid-cols-2 gap-1.5 md:gap-2">
          {product.specs?.slice(0, 6).map((spec, index) => (
            <div key={index} className="flex items-center gap-1 md:gap-2 p-1 md:p-1.5 rounded-lg md:rounded-xl bg-gray-50 border border-black/5">
              <span className="text-purple-brand opacity-60 scale-75 md:scale-90">{getIcon(spec.icon, 12)}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] md:text-[9px] font-black leading-none truncate">{spec.value}{spec.unit}</span>
                <span className="hidden md:block text-[7px] font-bold text-gray-400 uppercase tracking-tighter">{spec.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Price & CTA */}
        <div className="mt-auto pt-3 md:pt-4 flex flex-col border-t border-black/5 gap-3">
          <div className="flex flex-col w-full">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Efectivo / Transferencia (incl. IVA)</span>
                <span className="text-lg md:text-2xl font-black text-purple-brand leading-none">
                  ${formatPrice(transferPrice)}
                </span>
              </div>
              <div className="flex flex-col items-end opacity-40">
                <span className="text-[7px] font-bold uppercase tracking-tighter">Normal (incl. IVA)</span>
                <span className="text-[10px] md:text-xs font-bold line-through">
                  ${formatPrice(basePrice)}
                </span>
              </div>
            </div>
            <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest opacity-40 mt-1">Precio final con factura</span>
          </div>

          <div className="flex gap-1 md:gap-2 shrink-0">

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (product.stock > 0) {
                  handleAddToCart(e, product);
                } else {
                  setIsWaitlistOpen(true);
                }
              }}
              className={`
                flex items-center justify-center gap-1 px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black text-[9px] md:text-xs transition-all tracking-tight
                ${product.stock === 0 ? 'bg-purple-brand/10 text-purple-brand hover:bg-purple-brand/20' : isAdded ? 'bg-mint-success text-white scale-95' : 'bg-banana-yellow text-black hover:scale-105 active:scale-95 shadow-lg shadow-banana-yellow/20'}
              `}
            >
              {product.stock === 0 ? (
                <span className="whitespace-nowrap flex items-center gap-1">
                  <Bell size={12} /> ME INTERESA
                </span>
              ) : isAdded ? (
                <span className="hidden md:inline">AÑADIDO</span>
              ) : (
                <>
                  <ShoppingCart size={12} fill="currentColor" className="md:w-[14px] md:h-[14px]" />
                  <span className="whitespace-nowrap">AGREGAR</span>
                </>
              )}
              {isAdded && product.stock > 0 && <span className="md:hidden">✓</span>}
            </button>
          </div>
        </div>
      </div>
      <WaitlistModal 
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        product={product}
      />
    </article>
  );
};

export default ProductCard;
