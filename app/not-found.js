"use client";
export const dynamic = 'force-dynamic';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-32 px-4 text-center">
      <h1 className="text-9xl font-black text-banana-yellow mb-8 animate-bounce">404</h1>
      <h2 className="text-4xl font-black tracking-tight mb-4 uppercase">¿Te perdiste en la selva?</h2>
      <p className="text-gray-500 font-medium max-w-md mb-12">
        La página que buscas no existe o ha sido movida. Pero no te preocupes, siempre puedes volver al inicio.
      </p>
      <Link 
        href="/"
        className="px-10 py-4 bg-purple-brand text-white rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-brand/20"
      >
        VOLVER AL INICIO
      </Link>
    </div>
  );
}
