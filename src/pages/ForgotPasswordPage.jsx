import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import './LoginPage.css'; // Reusing login styles

const ForgotPasswordPage = () => {
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
    <div className="login-page">
      <div className="login-card glass-panel">
        <div className="login-logo">
          <Logo size="small" />
          <span className="login-brand">BananaComputer</span>
        </div>

        <h1 className="login-title">Recuperar contraseña</h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

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

          {error && <p className="login-error">{error}</p>}
          
          {message && (
            <div className="signup-success-msg">
              <CheckCircle size={20} style={{ marginBottom: '0.5rem' }} />
              <p>{message}</p>
            </div>
          )}

          {!message && (
            <button type="submit" className="btn-brand login-submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          )}
        </form>

        <Link to="/login" className="login-back">← Volver al inicio de sesión</Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
