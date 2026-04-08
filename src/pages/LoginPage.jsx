import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import './LoginPage.css';

const LoginPage = () => {
  const { signIn, signUp, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError, data } = isSignup
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // After login, redirect superadmin to /admin, others to /
    const role = data?.user?.app_metadata?.role;
    navigate(role === 'superadmin' ? '/admin' : '/');
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="retro-button login-submit" disabled={loading}>
            {loading ? 'Cargando...' : isSignup ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

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
