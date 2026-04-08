import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import './LoginPage.css';

const LoginPage = () => {
  const { user, signIn, signUp, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, send them to their dashboard/profile
  React.useEffect(() => {
    if (user && !authLoading) {
      navigate(isSuperAdmin ? '/admin' : '/perfil');
    }
  }, [user, authLoading, isSuperAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError, data } = isSignup
      ? await signUp(email, password)
      : await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-brand login-submit" disabled={loading}>
            {loading ? 'Cargando...' : isSignup ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

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
