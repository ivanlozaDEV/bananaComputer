"use client";
import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * BananaLoader — global page-transition loading screen.
 * Re-implemented for Next.js 16.
 */
const BananaLoader = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(pathname + searchParams.toString());
  const timerRef = useRef(null);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (prevPathRef.current === currentPath) return;

    prevPathRef.current = currentPath;

    // Show loader
    setVisible(true);
    clearTimeout(timerRef.current);

    // Hide after 600ms (standard Banana transition time)
    timerRef.current = setTimeout(() => setVisible(false), 600);

    return () => clearTimeout(timerRef.current);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-purple-brand text-white overflow-hidden">
      <div className="relative flex flex-col items-center gap-6 scale-110 md:scale-125 animate-in zoom-in-95 duration-500 ease-out">
        <span className="text-7xl animate-bounce drop-shadow-2xl">🍌</span>
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-banana-yellow animate-pulse">Sincronizando</span>
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-banana-yellow animate-[loading_0.6s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default BananaLoader;
