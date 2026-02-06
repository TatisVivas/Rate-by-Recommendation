import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { PreferencesProvider } from './context/PreferencesContext';
import { useTranslation } from './utils/translations';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Home from './pages/Home';
import Confirmacion from './pages/Confirmacion';
import RestablecerContrasena from './pages/RestablecerContrasena';
import Watchlist from './components/Watchlist';
import MyRatings from './components/MyRatings';
import Recommendations from './components/Recommendations';
import Profile from './components/Profile';
import MovieModal from './components/MovieModal';
import SplashCursor from './components/SplashCursor';
import './App.css';
import './styles/light-theme.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  
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

  // Verificar sesión al cargar
  useEffect(() => {
    if (!supabase) {
      console.error('Supabase no está configurado');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const handleWatchlistUpdate = () => {
    // Esto se puede usar para refrescar la lista si es necesario
  };

  // Componente para rutas protegidas
  const ProtectedRoutes = () => {
    if (!user) {
      return (
        <>
          <header className="app-header-auth">
            <div className="header-content">
              <h1 className="app-title">{t('appTitle')}</h1>
              <p className="app-subtitle">{t('appSubtitle')}</p>
            </div>
          </header>
          <main className="app-main">
            <Auth onAuthChange={handleAuthChange} />
          </main>
        </>
      );
    }

    return (
      <PreferencesProvider user={user}>
        <SplashCursor />
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="app-main">
          <Routes>
            <Route 
              path="/" 
              element={<Home user={user} onMovieClick={handleMovieClick} />} 
            />
            <Route 
              path="/watchlist" 
              element={<Watchlist user={user} onMovieClick={handleMovieClick} />} 
            />
            <Route 
              path="/my-ratings" 
              element={<MyRatings user={user} onMovieClick={handleMovieClick} />} 
            />
            <Route 
              path="/recommendations" 
              element={<Recommendations user={user} onMovieClick={handleMovieClick} />} 
            />
            <Route 
              path="/profile" 
              element={<Profile user={user} onLogout={handleLogout} />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p className="footer-text">
            This product uses the{' '}
            <a 
              href="https://www.themoviedb.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              TMDB API
            </a>
            {' '}but is not endorsed or certified by TMDB.
          </p>
          <p className="footer-text">
            © {new Date().getFullYear()} Rate by Recommendation - Tatis Vivas
          </p>
        </footer>

        {selectedMovie && (
          <MovieModal
            movie={selectedMovie}
            user={user}
            onClose={handleCloseModal}
            onWatchlistUpdate={handleWatchlistUpdate}
          />
        )}
      </PreferencesProvider>
    );
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta pública para confirmación de cuenta */}
          <Route 
            path="/confirmacion" 
            element={
              <main className="app-main">
                <Confirmacion />
              </main>
            } 
          />
          {/* Ruta pública para restablecer contraseña (desde el email) */}
          <Route 
            path="/restablecer-contraseña" 
            element={
              <main className="app-main">
                <RestablecerContrasena />
              </main>
            } 
          />
          
          {/* Todas las demás rutas */}
          <Route path="*" element={<ProtectedRoutes />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
