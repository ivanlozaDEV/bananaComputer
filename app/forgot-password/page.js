"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { Mail, CheckCircle, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error: resetError } = await resetPassword(email);
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-banana-yellow/10 blur-[150px] rounded-full"></div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-3xl border border-black/5 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-10">
          <Link href="/login" className="mb-4 hover:translate-x-[-4px] transition-transform">
            <Logo size="small" />
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-center">Recuperar Acceso</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 text-center leading-relaxed max-w-[80%]">
            Ingresa tu email y te enviaremos un enlace de restauración oficial.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Registrado</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all pl-12"
                required
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            </div>
          </div>

          {error && <p className="p-4 bg-raspberry/5 text-raspberry text-xs font-bold rounded-xl border border-raspberry/10">{error}</p>}
          
          {message ? (
            <div className="p-6 bg-mint-success/5 border border-mint-success/10 rounded-2xl flex flex-col items-center text-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-10 h-10 bg-mint-success rounded-full flex items-center justify-center text-white">
                <CheckCircle size={20} />
              </div>
              <p className="text-xs font-bold text-mint-success leading-relaxed">{message}</p>
            </div>
          ) : (
            <button 
              type="submit" 
              className="w-full py-4 bg-purple-brand text-white rounded-2xl font-black text-lg hover:scale-102 active:scale-95 transition-all shadow-xl shadow-purple-brand/20 disabled:opacity-50 flex items-center justify-center gap-3"
              disabled={loading}
            >
              {loading ? 'Sincronizando...' : <><Send size={18} /> Enviar Enlace</>}
            </button>
          )}
        </form>

        <Link href="/login" className="mt-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-black transition-colors">
          <ArrowLeft size={12} /> Volver al Inicio de Sesión
        </Link>
      </div>
    </div>
  );
}
