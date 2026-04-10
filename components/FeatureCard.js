import React from 'react';

export default function FeatureCard({ icon, title, desc, color }) {
  return (
    <div className="p-8 rounded-[2rem] bg-white border border-black/5 hover:border-purple-brand/10 transition-all hover:-translate-y-1 hover:shadow-xl shadow-purple-brand/5 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} mb-6 transition-transform group-hover:scale-110 duration-500`}>{icon}</div>
      <h3 className="text-lg font-black mb-3">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-3">{desc}</p>
    </div>
  );
}
