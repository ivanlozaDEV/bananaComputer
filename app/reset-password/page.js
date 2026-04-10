"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Logo from '@/components/Logo';
import { Eye, EyeOff, Check, X, Shield, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pass) => {
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const isLongEnough = pass.length >= 8;
    return { hasNumber, hasSpecial, isLongEnough };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { hasNumber, hasSpecial, isLongEnough } = validatePassword(password);
    if (!isLongEnough || !hasNumber || !hasSpecial) {
      setError('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    setLoading(true);

    const { error: resetError } = await updatePassword(password);
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      showToast('Contraseña actualizada con éxito.', 'success');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-brand/10 blur-[150px] rounded-full"></div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-3xl border border-black/5 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-10">
          <Link href="/login" className="mb-4 hover:scale-110 transition-transform">
            <Logo size="small" />
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Nueva Identidad</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Establece tu nueva contraseña de acceso</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                required
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-purple-brand transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-gray-50 rounded-xl">
              <div className={`flex items-center gap-1.5 text-[8px] font-bold ${password.length >= 8 ? 'text-mint-success' : 'text-gray-300'}`}>
                 {password.length >= 8 ? <Check size={10} /> : <Shield size={10} />} 8+ Caracteres
              </div>
              <div className={`flex items-center gap-1.5 text-[8px] font-bold ${/\d/.test(password) ? 'text-mint-success' : 'text-gray-300'}`}>
                 {/\d/.test(password) ? <Check size={10} /> : <Shield size={10} />} Incluye número
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
              required
            />
          </div>

          {error && <p className="p-4 bg-raspberry/5 text-raspberry text-xs font-bold rounded-xl border border-raspberry/10">{error}</p>}

          <button 
            type="submit" 
            className="w-full py-5 bg-purple-brand text-white rounded-2xl font-black text-lg hover:scale-102 active:scale-95 transition-all shadow-xl shadow-purple-brand/20 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Restaurando...' : 'Establecer Contraseña'}
          </button>
        </form>

        <Link href="/login" className="mt-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-black transition-colors">
          <ArrowLeft size={12} /> Cancelar y Volver
        </Link>
      </div>
    </div>
  );
}
