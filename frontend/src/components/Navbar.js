import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../utils/translations';
import { usePreferences } from '../context/PreferencesContext';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link 
          to="/" 
          className="navbar-logo"
          onClick={() => window.location.reload()}
        >
          <div className="navbar-logo-container">
            <img 
              src="/rbr.ico" 
              alt="Rate by Recommendation Logo" 
              className="navbar-logo-icon"
            />
            <h1 className="navbar-title">Rate by Recommendation</h1>
          </div>
        </Link>
        
        {user && (
          <div className="navbar-menu">
            <Link 
              to="/" 
              className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              🏠 {t('home')}
            </Link>
            <Link 
              to="/watchlist" 
              className={`navbar-link ${location.pathname === '/watchlist' ? 'active' : ''}`}
            >
              📋 {t('watchlist')}
            </Link>
            <Link 
              to="/my-ratings" 
              className={`navbar-link ${location.pathname === '/my-ratings' ? 'active' : ''}`}
            >
              ⭐ {t('myRatings')}
            </Link>
            <Link 
              to="/recommendations" 
              className={`navbar-link ${location.pathname === '/recommendations' ? 'active' : ''}`}
            >
              🎯 {t('recommendations')}
            </Link>
            <Link 
              to="/profile" 
              className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}
            >
              👤 {t('profile')}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

