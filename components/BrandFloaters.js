"use client";
import React from 'react';
import { motion } from 'framer-motion';

/**
 * BrandFloaters component
 * Renders a set of floating brand logos with premium animations.
 * @param {Array} logos - Array of logo objects { id, url, name }
 */
export default function BrandFloaters({ logos = [] }) {
  if (!logos || logos.length === 0) return null;

  // Orbiting configurations 30% closer to the center
  const floatingConfigs = [
    { top: '8%', left: '22%', delay: 0, duration: 12, size: 70 },
    { top: '25%', right: '4%', delay: 2, duration: 15, size: 85 },
    { bottom: '22%', left: '1%', delay: 4, duration: 14, size: 80 },
    { bottom: '4%', right: '25%', delay: 1, duration: 13, size: 90 },
    { top: '46%', left: '-10%', delay: 3, duration: 16, size: 65 },
    { top: '53%', right: '-10%', delay: 5, duration: 18, size: 75 },
    { top: '-2%', right: '32%', delay: 0.5, duration: 14, size: 70 },
    { bottom: '-2%', left: '32%', delay: 2.5, duration: 17, size: 65 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {logos.slice(0, 8).map((logo, index) => {
        const config = floatingConfigs[index % floatingConfigs.length];

        return (
          <motion.div
            key={logo.id || index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 0.8,
              scale: 1,
              y: [0, -20, 0, 20, 0],
              x: [0, 15, 0, -15, 0],
              rotate: [0, 3, -3, 0]
            }}
            transition={{
              opacity: { duration: 1 },
              scale: { duration: 1 },
              y: {
                duration: config.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: config.delay
              },
              x: {
                duration: config.duration * 1.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: config.delay
              },
              rotate: {
                duration: config.duration * 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: config.delay
              }
            }}
            className="absolute flex items-center justify-center group"
            style={{
              top: config.top,
              left: config.left,
              right: config.right,
              bottom: config.bottom,
              width: config.size,
              height: config.size,
            }}
          >
            <div className="relative w-full h-full p-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 shadow-lg shadow-black/5 flex items-center justify-center transition-all duration-500 group-hover:bg-white/90 group-hover:scale-110 group-hover:opacity-100 group-hover:shadow-xl">
              <img
                src={logo.url}
                alt={logo.name || 'Brand Logo'}
                className="max-w-full max-h-full object-contain transition-all duration-500"
              />

              {/* Subtle inner glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
