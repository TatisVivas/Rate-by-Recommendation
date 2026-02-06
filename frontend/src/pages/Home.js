import React, { useState, useEffect } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { useTranslation } from '../utils/translations';
import './Home.css';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'YOUR_API_KEY_HERE';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

function Home({ user, onMovieClick }) {
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTrendingMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.language]);

  // Limpiar resultados cuando el campo de búsqueda esté vacío
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMovies([]);
      setError(null);
    }
  }, [searchQuery]);

  const loadTrendingMovies = async () => {
    setLoadingTrending(true);
    try {
      const tmdbLanguage = preferences.language === 'en' ? 'en-US' : 'es-ES';
      const response = await fetch(
        `${TMDB_BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=${tmdbLanguage}`
      );
      if (response.ok) {
        const data = await response.json();
        setTrendingMovies(data.results?.slice(0, 10) || []);
      }
    } catch (err) {
      console.error('Error al cargar películas trending:', err);
    } finally {
      setLoadingTrending(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tmdbLanguage = preferences.language === 'en' ? 'en-US' : 'es-ES';
      const url = `${TMDB_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=${tmdbLanguage}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al buscar películas');
      }

      const data = await response.json();
      setMovies(data.results || []);
    } catch (err) {
      setError(t('errorLoadingMovies') || 'No se pudieron cargar las películas. Verifica tu API key.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const MovieCard = ({ movie }) => {
    const noImageText = preferences.language === 'en' ? 'No+Image' : 'Sin+Imagen';
    const posterUrl = movie.poster_path 
      ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
      : `https://via.placeholder.com/500x750?text=${noImageText}`;

    return (
      <div className="movie-card" onClick={() => onMovieClick(movie)}>
        <div className="movie-poster">
          <img 
            src={posterUrl} 
            alt={movie.title}
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/500x750?text=${noImageText}`;
            }}
          />
        </div>
        <div className="movie-info">
          <h3 className="movie-title">{movie.title}</h3>
          {movie.release_date && (
            <p className="movie-year">{new Date(movie.release_date).getFullYear()}</p>
          )}
          {movie.vote_average > 0 && (
            <div className="movie-rating">
              <span className="rating-star">⭐</span>
              <span>{movie.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const featuredMovie = trendingMovies[0];

  return (
    <div className="home-container">
      <div className="hero-section">
        {featuredMovie && featuredMovie.backdrop_path && (
          <div 
            className="hero-backdrop"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${TMDB_BACKDROP_BASE_URL}${featuredMovie.backdrop_path})`
            }}
          />
        )}
        
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">🎬 {t('discover')}</h1>
            <p className="hero-subtitle">{t('discoverSubtitle')}</p>
          </div>
          
          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                className="search-input"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-button" disabled={loading}>
                {loading ? t('searching') : `🔍 ${t('search')}`}
              </button>
            </form>
          </div>
        </div>
      </div>

      {!loadingTrending && trendingMovies.length > 0 && !searchQuery && (
        <div className="trending-section">
          <h2 className="trending-title">⭐ {t('trendingMovies')}</h2>
          <div className="trending-movies">
            {trendingMovies.map((movie) => {
              const noImageText = preferences.language === 'en' ? 'No+Image' : 'Sin+Imagen';
              const posterUrl = movie.poster_path 
                ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
                : `https://via.placeholder.com/500x750?text=${noImageText}`;
              
              return (
                <div 
                  key={movie.id} 
                  className="trending-card"
                  onClick={() => onMovieClick(movie)}
                >
                  <div className="trending-poster">
                    <img 
                      src={posterUrl} 
                      alt={movie.title}
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/500x750?text=${noImageText}`;
                      }}
                    />
                    {movie.vote_average > 0 && (
                      <div className="trending-rating">
                        <span>⭐</span>
                        <span>{movie.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="trending-movie-title">{movie.title}</h3>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('loadingMovies')}</p>
        </div>
      )}

      {!loading && movies.length > 0 && (
        <div className="movies-container">
          <h2 className="results-title">
            {movies.length} {movies.length === 1 ? t('resultsFound') : t('resultsFoundPlural')}
          </h2>
          <div className="movies-grid">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {!loading && !error && movies.length === 0 && searchQuery && (
        <div className="no-results">
          <p>{t('noResults')} "{searchQuery}"</p>
        </div>
      )}

    </div>
  );
}

export default Home;

