import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Eye, EyeOff, Check, X, Shield, Mail } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const { user, signIn, signUp, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // If already logged in, send them to their dashboard/profile
  React.useEffect(() => {
    if (user && !authLoading) {
      navigate(isSuperAdmin ? '/admin' : '/perfil');
    }
  }, [user, authLoading, isSuperAdmin, navigate]);

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

    if (isSignup && data?.user && data?.session === null) {
      setSignupSuccess(true);
      setLoading(false);
      return;
    }

    setLoading(false);

    // Redirect happens via useEffect above when user state updates
  };

  return (
    <div className="login-page">
      <div className="login-card glass-panel">
        <div className="login-logo">
          <Logo size="small" />
          <span className="login-brand">BananaComputer</span>
        </div>

        <h1 className="login-title">{isSignup ? 'Crear cuenta' : 'Iniciar sesión'}</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {isSignup && (
              <div className="password-hints">
                <div className={`hint ${password.length >= 8 ? 'valid' : ''}`}>
                  {password.length >= 8 ? <Check size={12} /> : <Shield size={12} />} 8+ caracteres
                </div>
                <div className={`hint ${/\d/.test(password) ? 'valid' : ''}`}>
                  {/\d/.test(password) ? <Check size={12} /> : <Shield size={12} />} Incluye un número
                </div>
                <div className={`hint ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'valid' : ''}`}>
                  {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? <Check size={12} /> : <Shield size={12} />} Símbolo (!@#...)
                </div>
                <div className={`hint ${password && password === confirmPassword ? 'valid' : ''}`}>
                  {password && password === confirmPassword ? <Check size={12} /> : <X size={12} />} Coinciden
                </div>
              </div>
            )}
          </div>

          {isSignup && (
            <div className="form-group">
              <label>Confirmar Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-brand login-submit" disabled={loading}>
            {loading ? 'Cargando...' : isSignup ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        <div className="login-divider">
          <span>o</span>
        </div>

        <button 
          className="btn-google" 
          onClick={() => useAuth().signInWithGoogle()}
          disabled={loading}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          Continuar con Google
        </button>

        {signupSuccess && (
          <div className="signup-success-msg">
            <p>¡Cuenta creada! Revisa tu email para confirmar tu cuenta antes de iniciar sesión.</p>
          </div>
        )}

        {!isSignup && (
          <Link to="/forgot-password" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        )}

        <button
          className="login-toggle"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>

        <Link to="/" className="login-back">← Volver a la tienda</Link>
      </div>
    </div>

  );
};

export default LoginPage;
