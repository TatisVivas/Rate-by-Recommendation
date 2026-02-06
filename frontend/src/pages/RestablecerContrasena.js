import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../utils/translations';
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
  
  // Obtener idioma desde localStorage
  const getLanguage = () => {
    const savedPrefs = localStorage.getItem('preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        return parsed.language || 'es';
      } catch (err) {
        return 'es';
      }
    }
    return 'es';
  };
  
  const [language, setLanguage] = useState(getLanguage());
  const t = useTranslation(language);
  
  // Escuchar cambios en el idioma
  useEffect(() => {
    const handleStorageChange = () => {
      setLanguage(getLanguage());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languageChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChange', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setError(t('passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordMinLength'));
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
      setError(err.message || t('invalidLinkMessage'));
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
          <p className="loading-text">{t('checkingLink')}</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="restablecer-container">
        <div className="restablecer-card">
          <h1 className="restablecer-title">{t('invalidLink')}</h1>
          <p className="restablecer-message">
            {t('invalidLinkMessage')}
          </p>
          <button type="button" className="confirmacion-button" onClick={() => navigate('/', { replace: true })}>
            {t('goToLogin')}
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
          <h1 className="restablecer-title">{t('passwordUpdated')}</h1>
          <p className="restablecer-message">{t('passwordUpdatedMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="restablecer-container">
      <div className="restablecer-card">
        <h1 className="restablecer-title">{t('newPasswordTitle')}</h1>
        <p className="restablecer-message">{t('chooseSecurePassword')}</p>

        {error && (
          <div className="auth-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form restablecer-form">
          <div className="auth-field">
            <label htmlFor="new-password">{t('newPassword')}</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('minCharacters')}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirm-password">{t('confirmPassword')}</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('repeatPassword')}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="auth-button confirmacion-button" disabled={loading}>
            {loading ? t('saving') : t('savePassword')}
          </button>
        </form>

        <button type="button" className="auth-link restablecer-back" onClick={() => navigate('/', { replace: true })}>
          {t('backToHome')}
        </button>
      </div>
    </div>
  );
};

export default RestablecerContrasena;
