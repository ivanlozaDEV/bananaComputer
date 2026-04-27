"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import {
  ShoppingCart, Menu, X, Phone, LogIn, LogOut, ChevronRight, Search
} from 'lucide-react';
import { useSearch } from '@/context/SearchContext';

const Header = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const { searchQuery, setSearchQuery, isSearchOpen, toggleSearch, closeSearch } = useSearch();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const {
    cartItems, cartCount, removeFromCart,
    cartTotal, cartSubtotal, cartTax,
    baseTotal,
    isCartOpen, openCart, closeCart,
  } = useCart();

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    };
    fetchCats();

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  return (
    <>
      <header className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled ? 'bg-purple-brand text-white shadow-lg' : 'bg-white/70 backdrop-blur-md text-black border-b border-black/5'}
      `}>

        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size="small" />
            <span className="text-base font-pixel tracking-tighter transition-colors">
              <span className={scrolled ? 'text-banana-yellow' : 'text-purple-brand'}>Banana</span> Computer
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-[11px]">
            {categories.map(cat => (
              <Link key={cat.id} href={`/categoria/${cat.id}`} className="font-bold uppercase tracking-widest hover:text-banana-yellow transition-colors opacity-80 hover:opacity-100">
                {cat.name}
              </Link>
            ))}
            <Link href="/contacto" className="font-bold uppercase tracking-widest hover:text-banana-yellow transition-colors opacity-80 hover:opacity-100">Contacto</Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search Toggle */}
            <button 
              onClick={toggleSearch}
              className={`p-2.5 rounded-full transition-all ${scrolled ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
              title="Buscar productos"
            >
              <Search size={20} className={isSearchOpen ? 'text-banana-yellow' : ''} />
            </button>

            {user ? (
              <div className="relative">
                <button 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs transition-all ${scrolled ? 'bg-white/10 hover:bg-white/20' : 'bg-purple-brand/5 hover:bg-purple-brand/10'}`}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className="text-sm">🍌</span>
                  {user.email.split('@')[0]}
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white text-black p-2 rounded-xl shadow-2xl border border-black/5 flex flex-col items-stretch">
                    <Link href="/perfil" className="px-4 py-2 hover:bg-purple-brand/5 rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>Mi Perfil</Link>
                    <button onClick={() => { handleSignOut(); setUserMenuOpen(false); }} className="px-4 py-2 text-left text-raspberry hover:bg-raspberry/5 rounded-lg transition-colors font-bold">Cerrar Sesión</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={`flex items-center gap-2 px-5 py-2 rounded-full font-black text-xs transition-all ${scrolled ? 'bg-banana-yellow text-black hover:scale-105' : 'bg-purple-brand text-white hover:scale-105'}`}>
                <span className="text-sm">🍌</span>
                SIGN IN
              </Link>
            )}

            <button className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs transition-all ${scrolled ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`} onClick={openCart}>
              <ShoppingCart size={14} />
              CARRITO
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black ${scrolled ? 'bg-banana-yellow text-black' : 'bg-purple-brand text-white'}`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile hamburger & search */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleSearch} className="p-2">
              <Search size={24} />
            </button>
            <button className="p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Search Bar Inline Expandable */}
        <div className={`
          overflow-hidden transition-all duration-500 ease-in-out bg-white border-t border-black/5
          ${isSearchOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
             <Search size={20} className="text-purple-brand animate-pulse" />
             <input 
               autoFocus
               type="text"
               placeholder="Buscar laptops, componentes, accesorios..."
               className="flex-1 bg-transparent border-none py-2 text-lg font-black focus:outline-none placeholder:text-gray-300 text-gray-900"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   closeSearch();
                   router.push(`/buscar?q=${searchQuery}`);
                 }
               }}
             />
             <button onClick={closeSearch} className="p-2 text-gray-400 hover:text-black transition-colors">
               <X size={24} />
             </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown (Legacy Parity) */}
        <nav className={`
          md:hidden bg-white border-t-2 border-banana-yellow overflow-hidden transition-all duration-400 ease-in-out
          ${menuOpen ? 'max-h-[600px] py-4 px-6 opacity-100' : 'max-h-0 py-0 px-6 opacity-0'}
        `}>
          <div className="flex flex-col gap-1">
            {categories.map(cat => (
              <Link key={cat.id} href={`/categoria/${cat.id}`} className="flex items-center justify-between py-3 border-b border-black/5 text-sm font-bold uppercase tracking-widest text-gray-700 hover:text-purple-brand transition-colors" onClick={() => setMenuOpen(false)}>
                {cat.name}
                <ChevronRight size={14} className="text-purple-brand opacity-40" />
              </Link>
            ))}
            
            <div className="h-px bg-black/5 w-full my-2"></div>
            
            <Link href="/contacto" className="flex items-center gap-3 py-3 text-sm font-bold uppercase tracking-widest text-gray-700 hover:text-purple-brand" onClick={() => setMenuOpen(false)}>
              <Phone size={14} className="text-purple-brand opacity-40" />
              Contacto
            </Link>

            <div className="h-px bg-black/5 w-full my-2"></div>

            {user ? (
              <>
                <Link href="/perfil" className="py-3 text-sm font-black text-purple-brand" onClick={() => setMenuOpen(false)}>
                  🍌 {user.email.split('@')[0]}
                </Link>
                <button className="flex items-center gap-2 py-3 text-sm font-bold text-purple-brand opacity-70" onClick={() => { handleSignOut(); setMenuOpen(false); }}>
                  <LogOut size={14} />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-2 py-3 text-sm font-black text-purple-brand" onClick={() => setMenuOpen(false)}>
                <LogIn size={14} />
                Iniciar Sesión
              </Link>
            )}

            <div className="h-px bg-black/5 w-full my-2"></div>
            
            <button className="flex items-center gap-3 w-full py-4 px-4 bg-banana-yellow text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-banana-yellow/20 active:scale-95 transition-all mt-2" onClick={() => { setMenuOpen(false); openCart(); }}>
              <ShoppingCart size={16} />
              Ver Carrito
              {cartCount > 0 && <span className="ml-auto bg-purple-brand text-white text-[10px] px-2 py-0.5 rounded-full">{cartCount}</span>}
            </button>
          </div>
        </nav>
      </header>

      {/* Cart Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isCartOpen ? 'opacity-100 italic pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={closeCart}
      ></div>

      {/* Cart Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[70] p-8 shadow-3xl transition-transform duration-500 transform
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-purple-brand">Tu Carrito</h2>
          <button className="text-3xl font-light hover:rotate-90 transition-transform" onClick={closeCart}>&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[50vh] flex flex-col gap-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <span className="text-5xl">🍌🍌🍌</span>
              <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
              <button 
                className="px-6 py-2 bg-purple-brand/5 rounded-full text-purple-brand font-bold hover:bg-purple-brand/10 transition-colors"
                onClick={closeCart}
              >
                Explorar Productos
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.cartId} className="flex gap-4 items-center p-3 rounded-xl bg-gray-50 border border-black/5">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-black/5">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="object-contain w-full h-full" /> : <span className="text-2xl">🍌</span>}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm leading-tight mb-1">{item.name}</h4>
                  <div className="flex flex-col">
                    <p className="text-purple-brand font-black leading-none">${parseFloat(item.price).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-purple-brand/60 mt-1">
                      o ${(parseFloat(item.price) / 1.06).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} con transferencia
                    </p>
                  </div>
                </div>
                <button className="text-raspberry p-2 hover:bg-raspberry/5 rounded-full transition-colors" onClick={() => removeFromCart(item.cartId)}>&times;</button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="mt-auto pt-8 border-t border-black/5 flex flex-col gap-3">
            <div className="flex justify-between text-sm text-gray-500 font-bold">
              <span>Subtotal:</span>
              <span>${(baseTotal / 1.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 font-bold">
              <span>IVA (15%):</span>
              <span>${(baseTotal - (baseTotal / 1.15)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-purple-brand mt-2">
              <span>Total:</span>
              <span>${baseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            
            <div className="bg-purple-brand/5 p-3 rounded-xl border border-purple-brand/10 mt-1">
              <div className="flex justify-between text-sm font-black text-purple-brand">
                <span>Total Transferencia:</span>
                <span>${(baseTotal / 1.06).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <p className="text-[9px] font-bold text-purple-brand/60 mt-1 uppercase tracking-wider text-center">
                Precio con descuento disponible en el checkout
              </p>
            </div>

            <button className="mt-4 w-full py-4 bg-purple-brand text-white rounded-xl font-black text-xl hover:scale-102 hover:shadow-xl transition-all" onClick={handleCheckout}>
              Finalizar Pedido
            </button>
            <p className="text-center text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">✓ Envío seguro y Garantía local</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Header;
