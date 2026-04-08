import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import './LoginPage.css'; // Reusing login styles

const ResetPasswordPage = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      alert('Contraseña actualizada con éxito.');
      navigate('/login');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-panel">
        <div className="login-logo">
          <Logo size="small" />
          <span className="login-brand">BananaComputer</span>
        </div>

        <h1 className="login-title">Nueva contraseña</h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Ingresa tu nueva contraseña para acceder a tu cuenta.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-brand login-submit" disabled={loading}>
            {loading ? 'Actualizando...' : 'Establecer contraseña'}
          </button>
        </form>

        <Link to="/login" className="login-back">← Volver a inicio de sesión</Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
