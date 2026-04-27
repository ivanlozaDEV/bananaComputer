"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import WaitlistForm from './WaitlistForm';

const WaitlistModal = ({ isOpen, onClose, product }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-3xl overflow-hidden relative border border-black/5 animate-in slide-in-from-bottom-4 duration-500 z-[10000]">
        <header className="p-6 border-b border-black/5 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-black text-lg tracking-tight">Lista de Espera</h3>
            <p className="text-[10px] font-bold text-purple-brand uppercase tracking-widest">{product?.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-6">
          <WaitlistForm 
            interest={`Interesado en ${product?.name} desde Modal`}
            explanation="La espera usualmente dura 3 días laborables, primero le confirmaríamos las existencias."
          />
        </div>

        <footer className="px-6 py-4 bg-gray-50 border-t border-black/5 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Banana Computer — Smart Inventory
          </p>
        </footer>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default WaitlistModal;
