import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../utils/translations';
import './Confirmacion.css';

const Confirmacion = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  const handleGoToLogin = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="confirmacion-container">
        <div className="confirmacion-card">
          <div className="loading-spinner"></div>
          <p className="loading-text">{t('verifyingAccount')}</p>
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
          {t('thankYouConfirm')}
        </h1>
        
        <p className="confirmacion-message">
          {t('accountVerified')}{' '}
          <strong className="brand-name">Rate by Recommendation</strong>.
        </p>
        
        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">⭐</span>
            <span>{t('featureRate')}</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <span>{t('featureRecommendations')}</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📋</span>
            <span>{t('featureWatchlist')}</span>
          </div>
        </div>

        <div className="confirmacion-actions">
          <button 
            onClick={handleGoToLogin}
            className="confirmacion-button"
          >
            {t('startExploring')}
          </button>
        </div>

        <p className="confirmacion-hint">
          {isVerified 
            ? t('alreadyLoggedIn')
            : t('notLoggedInYet')}
        </p>
      </div>
    </div>
  );
};

export default Confirmacion;
