"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { Eye, EyeOff, Check, X, Shield, Mail, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { user, signIn, signUp, isAdmin, loading: authLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      router.push(isAdmin ? '/admin' : '/perfil');
    }
  }, [user, authLoading, isAdmin, router]);

  const validatePassword = (pass) => {
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const isLongEnough = pass.length >= 8;
    return { hasNumber, hasSpecial, isLongEnough };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignup) {
      const { hasNumber, hasSpecial, isLongEnough } = validatePassword(password);
      if (!isLongEnough || !hasNumber || !hasSpecial) {
        setError('La contraseña no cumple con los requisitos de seguridad.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        setLoading(false);
        return;
      }
    }

    const { error: authError, data } = isSignup
      ? await signUp(email, password)
      : await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (isSignup && data?.user && !data?.session) {
      setSignupSuccess(true);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-banana-yellow/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-brand/5 blur-[150px] rounded-full"></div>

      <div className="w-full max-w-[400px] bg-white rounded-[2rem] p-8 shadow-3xl border border-black/5 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-4 hover:scale-110 transition-transform">
            <Logo size="small" />
          </Link>
          <h1 className="text-2xl md:text-2xl font-black tracking-tight">{isSignup ? 'Compra fácil.' : 'Bienvenido de nuevo.'}</h1>
          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-2">{isSignup ? 'Crea tu cuenta oficial.' : <>Ingresa a <span className="font-pixel text-purple-brand/60">Banana Computer</span></>}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Corporativo</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all pl-12"
                required
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contraseña Segura</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
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

            {isSignup && (
              <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-gray-50 rounded-xl">
                <div className={`flex items-center gap-1.5 text-[8px] font-bold ${password.length >= 8 ? 'text-mint-success' : 'text-gray-300'}`}>
                  {password.length >= 8 ? <Check size={10} /> : <Shield size={10} />} 8+ Caracteres
                </div>
                <div className={`flex items-center gap-1.5 text-[8px] font-bold ${/\d/.test(password) ? 'text-mint-success' : 'text-gray-300'}`}>
                  {/\d/.test(password) ? <Check size={10} /> : <Shield size={10} />} Incluye número
                </div>
                <div className={`flex items-center gap-1.5 text-[8px] font-bold ${/[!@#$%^&*]/.test(password) ? 'text-mint-success' : 'text-gray-300'}`}>
                  {/[!@#$%^&*]/.test(password) ? <Check size={10} /> : <Shield size={10} />} Usa símbolos
                </div>
              </div>
            )}
          </div>

          {isSignup && (
            <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:border-purple-brand/30 focus:bg-white transition-all"
                required
              />
            </div>
          )}

          {error && <p className="p-4 bg-raspberry/5 text-raspberry text-[10px] font-bold rounded-xl border border-raspberry/10">{error}</p>}

          <button
            type="submit"
            className="w-full py-3.5 bg-purple-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-102 active:scale-95 transition-all shadow-xl shadow-purple-brand/20 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sincronizando...' : isSignup ? 'Crear Cuenta' : 'Ingresar'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6 opacity-20">
          <div className="h-px bg-black flex-1"></div>
          <span className="text-[10px] font-black font-pixel">o</span>
          <div className="h-px bg-black flex-1"></div>
        </div>

        <button
          onClick={() => signInWithGoogle()}
          className="w-full flex items-center justify-center gap-3 py-3.5 border border-black/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continuar con Google
        </button>

        {signupSuccess && (
          <div className="mt-8 p-6 bg-mint-success/5 border border-mint-success/10 rounded-2xl flex flex-col items-center text-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-10 h-10 bg-mint-success rounded-full flex items-center justify-center text-white">
              <Check size={20} />
            </div>
            <p className="text-[10px] font-bold text-mint-success leading-relaxed uppercase tracking-tight">
              ¡Casi listo! Revisa tu bandeja de entrada para verificar tu cuenta.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-2">
          {!isSignup && (
            <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 hover:text-purple-brand transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          )}
          <button
            className="text-[10px] font-black text-purple-brand hover:underline uppercase tracking-widest"
            onClick={() => { setIsSignup(!isSignup); setError(''); }}
          >
            {isSignup ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
          </button>
        </div>

        <Link href="/" className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-black transition-colors">
          <ArrowLeft size={12} /> Volver a la vitrina
        </Link>
      </div>
    </div>
  );
}
