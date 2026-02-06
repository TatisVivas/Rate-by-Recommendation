import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../utils/translations';
import './Auth.css';

if (!supabase) {
  console.error('Supabase no está configurado. Verifica tus variables de entorno.');
}

function Auth({ onAuthChange }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
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
  React.useEffect(() => {
    const handleStorageChange = () => {
      setLanguage(getLanguage());
    };
    
    window.addEventListener('storage', handleStorageChange);
    // También escuchar un evento personalizado para cambios en la misma pestaña
    window.addEventListener('languageChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChange', handleStorageChange);
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (!supabase) {
      setError('Supabase no está configurado. Verifica tus variables de entorno.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Verificar si existe el perfil, si no, crearlo
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profile) {
          // Crear perfil si no existe
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: email.split('@')[0],
              updated_at: new Date().toISOString(),
            });

          if (profileError) throw profileError;
        }

        setMessage(t('loginSuccess'));
        if (onAuthChange) onAuthChange(data.user);
      } else {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        // Usuario ya existe: Supabase puede devolver error o session null
        const isAlreadyRegistered =
          (error && /already registered|already exists|user already|duplicate|already been registered/i.test(error.message)) ||
          (!error && data?.user && !data?.session);

        if (isAlreadyRegistered) {
          setError(null);
          setMessage(t('emailAlreadyExists'));
          setIsLogin(true);
          return;
        }

        if (error) throw error;

        // Crear perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username || email.split('@')[0],
            updated_at: new Date().toISOString(),
          });

        if (profileError) throw profileError;

        // No llamar a onAuthChange aquí porque el usuario necesita confirmar el email primero
        setMessage(t('registerSuccess'));
      }
    } catch (err) {
      setError(err.message);
      console.error('Error de autenticación:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase no está configurado. Verifica tus variables de entorno.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const redirectTo = `${window.location.origin}/restablecer-contraseña`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (err) throw err;
      setMessage(t('emailResetSent'));
    } catch (err) {
      setError(err.message);
      console.error('Error al enviar enlace de recuperación:', err);
    } finally {
      setLoading(false);
    }
  };

  // Vista: ¿Olvidaste tu contraseña? (solo email)
  if (isForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>{t('recoverPassword')}</h2>
          {error && (
            <div className="auth-error"><p>{error}</p></div>
          )}
          {message && (
            <div className="auth-message auth-message-important">
              <p>{message}</p>
            </div>
          )}
          {!message && (
            <>
              <p className="auth-forgot-hint">{t('forgotPasswordHint')}</p>
              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="forgot-email">{t('email')}</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>
                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? t('loading') : t('sendLink')}
                </button>
              </form>
            </>
          )}
          <div className="auth-switch">
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
                setMessage(null);
              }}
            >
              {t('backToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? t('login') : t('register')}</h2>
        
        {error && (
          <div className="auth-error">
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className={`auth-message ${!isLogin && message === t('registerSuccess') ? 'auth-message-important' : ''} ${message === t('emailAlreadyExists') ? 'auth-message-important' : ''}`}>
            <p>{message}</p>
            {!isLogin && message === t('registerSuccess') && (
              <div className="email-verification-notice">
                <p className="email-notice-title">📧 {t('emailVerificationNotice')}</p>
                <p className="email-notice-text">
                  {t('emailVerificationSent')} <strong>{email}</strong>
                </p>
                <p className="email-notice-spam">
                  ⚠️ {t('emailVerificationSpam')}
                </p>
                <p className="email-notice-hint">
                  {t('emailVerificationConfirm')}
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAuth} className="auth-form">
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="username">{t('username')}</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('usernamePlaceholder')}
                required={!isLogin}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">{t('email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">{t('password')}</label>
            <div className="auth-password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                required
                minLength={6}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                title={showPassword ? t('hidePassword') : t('showPassword')}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? t('loading') : isLogin ? t('login') : t('register')}
          </button>

          {isLogin && (
            <div className="auth-forgot-wrap">
              <button
                type="button"
                className="auth-link auth-link-forgot"
                onClick={() => {
                  setIsForgotPassword(true);
                  setError(null);
                  setMessage(null);
                }}
              >
                {t('forgotPassword')}
              </button>
            </div>
          )}
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? t('noAccount') + ' ' : t('haveAccount') + ' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
            >
              {isLogin ? t('signUp') : t('signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;

