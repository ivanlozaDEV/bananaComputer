"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Cpu, MemoryStick, HardDrive, Monitor, Battery, 
  Scale, Wifi, Camera, Layers, Zap, Scan, Settings,
  Palette, Film, ChevronLeft, ChevronRight, ShoppingCart
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

const getIcon = (name, size = 14) => {
  const IconComp = ICON_MAP[name] || ICON_MAP.default;
  return <IconComp size={size} />;
};

const ProductCard = ({ product, addedIds, handleAddToCart }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const images = product.images?.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);
  
  const nextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((imgIndex + 1) % images.length);
  };
  
  const prevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((imgIndex - 1 + images.length) % images.length);
  };

  const isAdded = addedIds?.has(product.id);

  return (
    <article className="group relative bg-white dark:bg-dark-nav rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] flex flex-col">
      {/* Badge */}
      <div className="absolute top-4 left-4 z-10">
        {product.badgeType === 'featured' ? (
          <span className="px-3 py-1 bg-purple-brand text-white text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg">
            DISTINGUIDO
          </span>
        ) : (
          <span className="px-3 py-1 bg-banana-yellow text-black text-[10px] font-black tracking-widest uppercase rounded-full shadow-lg">
            ULTIMA LLEGADA
          </span>
        )}
      </div>

      {/* Image Carousel */}
      <div className="relative aspect-[4/3] bg-gray-50 dark:bg-black/20 flex items-center justify-center overflow-hidden">
        <Link href={`/producto/${product.id}`} className="w-full h-full flex items-center justify-center">
          {images.length > 0 ? (
            <img 
              src={images[imgIndex]} 
              alt={product.name} 
              className="object-contain w-full h-full p-6 transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="text-5xl grayscale opacity-20">🍌</div>
          )}
        </Link>
        
        {images.length > 1 && (
          <>
            <button className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white" onClick={prevImg}>
              <ChevronLeft size={20} />
            </button>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white" onClick={nextImg}>
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-purple-brand w-4' : 'bg-black/20'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info Container */}
      <div className="p-6 flex flex-col flex-1 gap-4">
        <Link href={`/producto/${product.id}`} className="block">
          <div className="flex justify-between items-start gap-2 mb-0.5">
            <h3 className="text-base font-black leading-tight group-hover:text-purple-brand transition-colors line-clamp-1">{product.name}</h3>
            <span className="text-[9px] font-bold py-0.5 px-2 bg-black/5 rounded-full whitespace-nowrap">{product.year}</span>
          </div>
          {product.model_number && (
            <span className="inline-block px-2 py-0.5 bg-purple-brand/5 text-purple-brand text-[9px] font-black tracking-widest uppercase rounded">
              {product.model_number}
            </span>
          )}
          <p className="mt-2 text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
            {product.marketing_subtitle || product.description}
          </p>
        </Link>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2">
          {product.specs?.slice(0, 4).map((spec, index) => (
            <div key={index} className="flex items-center gap-2 p-1.5 rounded-xl bg-gray-50 border border-black/5">
              <span className="text-purple-brand opacity-60 scale-90">{getIcon(spec.icon)}</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-black leading-none">{spec.value}{spec.unit}</span>
                <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">{spec.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Price & CTA */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-black/5">
          <div className="flex flex-col">
            <span className="text-xl font-black text-purple-brand leading-none">
              ${(parseFloat(product.price) || 0).toLocaleString()}
            </span>
            <span className="text-[0.55rem] font-bold text-gray-400 uppercase tracking-widest mt-1">Incluido impuestos</span>
          </div>
          
          <div className="flex gap-2">
            <Link 
              href={`/producto/${product.id}`}
              className="p-3 rounded-xl bg-purple-brand/5 text-purple-brand hover:bg-purple-brand/10 transition-colors"
              title="Ver detalles"
            >
              <Zap size={18} fill="currentColor" />
            </Link>
            <button 
              onClick={(e) => handleAddToCart(e, product)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all
                ${isAdded ? 'bg-mint-success text-white scale-95' : 'bg-banana-yellow text-black hover:scale-105 active:scale-95 shadow-lg shadow-banana-yellow/20'}
              `}
            >
              {isAdded ? 'AÑADIDO ✓' : (
                <>
                  <ShoppingCart size={14} fill="currentColor" />
                  + CARRITO
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
