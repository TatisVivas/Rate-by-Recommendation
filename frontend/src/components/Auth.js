import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
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

        setMessage('¡Inicio de sesión exitoso!');
        if (onAuthChange) onAuthChange(data.user);
      } else {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

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
        setMessage('¡Registro exitoso!');
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
      setMessage('Revisa tu correo: te enviamos un enlace para restablecer tu contraseña. Si no lo ves, revisa la carpeta de spam.');
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
          <h2>Recuperar contraseña</h2>
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
              <p className="auth-forgot-hint">Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Cargando...' : 'Enviar enlace'}
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
              ← Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
        
        {error && (
          <div className="auth-error">
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className={`auth-message ${!isLogin && message.includes('Registro exitoso') ? 'auth-message-important' : ''}`}>
            <p>{message}</p>
            {!isLogin && message.includes('Registro exitoso') && (
              <div className="email-verification-notice">
                <p className="email-notice-title">📧 Verifica tu correo electrónico</p>
                <p className="email-notice-text">
                  Hemos enviado un enlace de confirmación a <strong>{email}</strong>
                </p>
                <p className="email-notice-spam">
                  ⚠️ <strong>Importante:</strong> Si no encuentras el correo, revisa tu carpeta de <strong>spam o correo no deseado</strong>
                </p>
                <p className="email-notice-hint">
                  Una vez que confirmes tu cuenta, podrás iniciar sesión normalmente.
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAuth} className="auth-form">
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="username">Nombre de usuario</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu nombre de usuario"
                required={!isLogin}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
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
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
            >
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;

