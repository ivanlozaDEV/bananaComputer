"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, Image, Tag, Package, LogOut, ExternalLink, Users 
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/hero', icon: Image, label: 'Hero' },
  { href: '/admin/categories', icon: Tag, label: 'Categorías' },
  { href: '/admin/products', icon: Package, label: 'Productos' },
  { href: '/admin/waitlist', icon: Users, label: 'Lista de Espera' },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-black/10 flex flex-col sticky top-0 shadow-sm">
      <div className="p-6 border-b border-black/10 flex items-center gap-3 bg-gray-50/50">
        <span className="text-2xl">🍌</span>
        <span className="font-black text-black tracking-tight uppercase text-lg">Admin</span>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1 mt-4">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3.5 px-5 py-3 rounded-2xl text-sm font-black transition-all group relative
                ${isActive ? 'text-purple-brand bg-purple-brand/5 border border-purple-brand/10' : 'text-gray-500 hover:text-black hover:bg-black/5'}
              `}
            >
              <Icon size={18} className={`${isActive ? 'text-purple-brand' : 'text-gray-400 group-hover:text-black'}`} />
              <span className="tracking-wide">{label}</span>
              {isActive && (
                <div className="absolute left-1 w-1 h-5 bg-gradient-to-b from-banana-yellow via-raspberry to-purple-brand rounded-full shadow-lg shadow-purple-brand/20"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-black/10 flex flex-col gap-1">
        <Link 
          href="/" 
          className="flex items-center gap-4 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black hover:bg-black/5 transition-all"
        >
          <ExternalLink size={16} />
          <span>Ver Tienda</span>
        </Link>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-4 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-raspberry hover:bg-raspberry/5 transition-all w-full text-left"
        >
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      <div className="p-6 bg-gray-50/50 border-t border-black/5 text-[8px] font-black text-black/30 uppercase tracking-[0.3em] text-center">
        Banana Computer Mgmt 2.0
      </div>
    </aside>
  );
};

export default Sidebar;
