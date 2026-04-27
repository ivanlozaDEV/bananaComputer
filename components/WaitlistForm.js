"use client";
import React, { useState, memo } from 'react';
import { Sparkles } from 'lucide-react';
import { addToWaitlist } from '@/lib/inventory';

const WaitlistForm = ({ interest, explanation }) => {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await addToWaitlist(email, interest);
      setJoined(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (joined) return (
    <div className="bg-mint-success/10 border border-mint-success/20 p-6 rounded-2xl text-xs font-black uppercase tracking-widest text-mint-success flex flex-col gap-2 items-center text-center">
      <div className="flex items-center gap-2">
        <Sparkles size={18} /> ¡Anotado con éxito!
      </div>
      <span className="opacity-80">Te avisaremos a {email} apenas tengamos noticias.</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="bg-white border border-black/5 p-6 rounded-3xl flex flex-col gap-4 text-black shadow-sm group hover:border-purple-brand/20 transition-all">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-brand">Lista de Espera</p>
          <p className="text-xs font-bold text-gray-500">¿Quieres que te avisemos cuando llegue stock?</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="tu@email.com"
            className="flex-1 bg-gray-50 border border-black/5 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-purple-brand/30 transition-all font-medium"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-purple-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-brand/80 transition-all disabled:opacity-50"
          >
            {submitting ? '...' : 'Anotarme'}
          </button>
        </div>
        
        {explanation && (
          <p className="text-[10px] font-bold text-gray-400 italic leading-relaxed pt-2 border-t border-black/5">
            {explanation}
          </p>
        )}
      </form>
    </div>
  );
};

export default memo(WaitlistForm);
