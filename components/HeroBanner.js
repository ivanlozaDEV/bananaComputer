"use client";
import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

/**
 * HeroBanner — fixed overlay below the navbar.
 * Fixed height (min of 60vh / 520px) + object-cover so it fills without stretching unnaturally.
 * z-index 40 = below navbar (z-50), above page content.
 */
const HeroBanner = ({ promotion, phase }) => {
  if (!promotion) return null;

  const opacity = phase === 'visible' ? 1 : 0;

  const wrapperStyle = {
    position: 'absolute',
    top: '80px',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    overflow: 'hidden',
    background: '#fbfbf9',
    pointerEvents: phase === 'visible' ? 'auto' : 'none',
    transition: 'opacity 0.7s ease-in-out',
    opacity,
  };

  const imgStyle = {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
  };

  const imgEl = (
    <img
      src={promotion.image_url}
      alt="Promoción Banana Computer"
      style={imgStyle}
      draggable={false}
    />
  );

  if (!promotion.link_url) {
    return <div style={wrapperStyle}>{imgEl}</div>;
  }

  const isExternal = promotion.link_url.startsWith('http');
  const Tag = isExternal ? 'a' : Link;
  const linkProps = isExternal
    ? { href: promotion.link_url, target: '_blank', rel: 'noopener noreferrer', style: { display: 'block', height: '100%' } }
    : { href: promotion.link_url, style: { display: 'block', height: '100%' } };

  return (
    <div style={wrapperStyle} className="group">
      <Tag {...linkProps} aria-label="Ver promoción">
        {imgEl}
      </Tag>
      {isExternal && (
        <div className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={14} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
