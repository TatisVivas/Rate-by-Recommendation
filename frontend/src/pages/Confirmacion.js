import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Confirmacion.css';

const Confirmacion = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si el usuario está autenticado después de la confirmación
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsVerified(true);
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleGoToLogin = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="confirmacion-container">
        <div className="confirmacion-card">
          <div className="loading-spinner"></div>
          <p className="loading-text">Verificando tu cuenta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmacion-container">
      <div className="confirmacion-card">
        <div className="success-icon">
          <svg viewBox="0 0 100 100" className="checkmark-svg">
            <circle className="checkmark-circle" cx="50" cy="50" r="45" />
            <path className="checkmark-check" d="M30 50 L45 65 L70 35" />
          </svg>
        </div>
        
        <h1 className="confirmacion-title">
          ¡Gracias por confirmar tu cuenta!
        </h1>
        
        <p className="confirmacion-message">
          Tu cuenta ha sido verificada exitosamente. Ahora eres parte de{' '}
          <strong className="brand-name">Rate by Recommendation</strong>.
        </p>
        
        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">⭐</span>
            <span>Califica tus películas favoritas</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <span>Recibe recomendaciones personalizadas</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📋</span>
            <span>Crea y gestiona tu lista de películas</span>
          </div>
        </div>

        <div className="confirmacion-actions">
          <button 
            onClick={handleGoToLogin}
            className="confirmacion-button"
          >
            Comenzar a explorar
          </button>
        </div>

        <p className="confirmacion-hint">
          {isVerified 
            ? 'Ya puedes iniciar sesión y empezar a usar todas las funciones.'
            : 'Si aún no has iniciado sesión, hazlo ahora para comenzar.'}
        </p>
      </div>
    </div>
  );
};

export default Confirmacion;
