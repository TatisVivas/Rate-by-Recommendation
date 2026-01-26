import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const location = useLocation();

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
              🏠 Inicio
            </Link>
            <Link 
              to="/watchlist" 
              className={`navbar-link ${location.pathname === '/watchlist' ? 'active' : ''}`}
            >
              📋 Mi Lista
            </Link>
            <Link 
              to="/recommendations" 
              className={`navbar-link ${location.pathname === '/recommendations' ? 'active' : ''}`}
            >
              🎯 Recomendaciones
            </Link>
            <Link 
              to="/profile" 
              className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}
            >
              👤 Perfil
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

