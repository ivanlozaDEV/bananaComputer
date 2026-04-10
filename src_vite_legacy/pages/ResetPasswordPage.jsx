import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';
import { Eye, EyeOff, Check, X, Shield, Lock } from 'lucide-react';
import './LoginPage.css'; // Reusing login styles

const ResetPasswordPage = () => {
  const { updatePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
          </div>
          
          <div className="form-group">
            <label>Confirmar contraseña</label>
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
