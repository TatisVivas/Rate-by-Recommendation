import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './RestablecerContrasena.css';

const RestablecerContrasena = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    // Dar tiempo a Supabase para procesar el hash de recuperación en la URL
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionReady(!!session?.user);
      setCheckingSession(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!supabase) {
      setError('Supabase no está configurado.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setSuccess(true);
      setTimeout(() => navigate('/', { replace: true }), 2500);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la contraseña. El enlace puede haber caducado.');
      console.error('Error al restablecer contraseña:', err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="restablecer-container">
        <div className="restablecer-card">
          <div className="loading-spinner"></div>
          <p className="loading-text">Comprobando enlace...</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="restablecer-container">
        <div className="restablecer-card">
          <h1 className="restablecer-title">Enlace no válido o expirado</h1>
          <p className="restablecer-message">
            Solicita un nuevo enlace desde la pantalla de inicio de sesión con «¿Olvidaste tu contraseña?».
          </p>
          <button type="button" className="confirmacion-button" onClick={() => navigate('/', { replace: true })}>
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="restablecer-container">
        <div className="restablecer-card">
          <div className="success-icon">
            <svg viewBox="0 0 100 100" className="checkmark-svg">
              <circle className="checkmark-circle" cx="50" cy="50" r="45" />
              <path className="checkmark-check" d="M30 50 L45 65 L70 35" />
            </svg>
          </div>
          <h1 className="restablecer-title">Contraseña actualizada</h1>
          <p className="restablecer-message">Ya puedes iniciar sesión con tu nueva contraseña. Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="restablecer-container">
      <div className="restablecer-card">
        <h1 className="restablecer-title">Nueva contraseña</h1>
        <p className="restablecer-message">Elige una contraseña segura para tu cuenta.</p>

        {error && (
          <div className="auth-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form restablecer-form">
          <div className="auth-field">
            <label htmlFor="new-password">Nueva contraseña</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirm-password">Confirmar contraseña</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="auth-button confirmacion-button" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>

        <button type="button" className="auth-link restablecer-back" onClick={() => navigate('/', { replace: true })}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default RestablecerContrasena;
