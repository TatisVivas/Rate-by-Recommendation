import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { usePreferences } from '../context/PreferencesContext';
import { useTranslation } from '../utils/translations';
import './Recommendations.css';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'YOUR_API_KEY_HERE';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function Recommendations({ user, onMovieClick }) {
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [watchlist, setWatchlist] = useState([]);
  const [recommendations, setRecommendations] = useState({
    basedOnWatchlist: [],
    similarMovies: [],
    popularRecommendations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadWatchlist = async () => {
    if (!user || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error al cargar watchlist:', err);
      return [];
    }
  };

  const fetchMovieRecommendations = async (movieId) => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/recommendations?api_key=${API_KEY}&language=es-ES&page=1`
      );
      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
      return [];
    } catch (err) {
      console.error(`Error al obtener recomendaciones para ${movieId}:`, err);
      return [];
    }
  };

  const fetchSimilarMovies = async (movieId) => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}&language=es-ES&page=1`
      );
      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
      return [];
    } catch (err) {
      console.error(`Error al obtener películas similares para ${movieId}:`, err);
      return [];
    }
  };

  const fetchMovieDetails = async (movieId) => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-ES`
      );
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error(`Error al cargar detalles de ${movieId}:`, err);
      return null;
    }
  };

  const deduplicateMovies = (movies) => {
    const seen = new Set();
    return movies.filter(movie => {
      if (seen.has(movie.id)) {
        return false;
      }
      seen.add(movie.id);
      return true;
    });
  };

  const loadRecommendations = async () => {
    if (!user || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      // Obtener watchlist del usuario
      const watchlistData = await loadWatchlist();
      setWatchlist(watchlistData);

      if (watchlistData.length === 0) {
        setLoading(false);
        return;
      }

      // Obtener IDs de películas en watchlist
      const watchlistIds = watchlistData.map(item => item.movie_id);
      const watchlistSet = new Set(watchlistIds);

      // Arrays para almacenar todas las recomendaciones
      let allRecommendations = [];
      let allSimilar = [];

      // Para cada película en la watchlist, obtener recomendaciones y similares
      const recommendationPromises = watchlistIds.slice(0, 5).map(async (movieId) => {
        const [recs, similar] = await Promise.all([
          fetchMovieRecommendations(movieId),
          fetchSimilarMovies(movieId)
        ]);
        return { recommendations: recs, similar };
      });

      const results = await Promise.all(recommendationPromises);

      // Combinar todas las recomendaciones
      results.forEach(({ recommendations: recs, similar }) => {
        allRecommendations = [...allRecommendations, ...recs];
        allSimilar = [...allSimilar, ...similar];
      });

      // Deduplicar y filtrar películas ya en watchlist
      const filteredRecommendations = deduplicateMovies(
        allRecommendations.filter(movie => !watchlistSet.has(movie.id))
      );
      const filteredSimilar = deduplicateMovies(
        allSimilar.filter(movie => !watchlistSet.has(movie.id))
      );

      // Obtener películas populares como recomendación adicional
      let popularMovies = [];
      if (watchlistIds.length > 0) {
        try {
          // Obtener géneros de las películas en watchlist
          const genrePromises = watchlistIds.slice(0, 3).map(id => fetchMovieDetails(id));
          const movieDetails = await Promise.all(genrePromises);
          const genres = new Set();
          movieDetails.forEach(movie => {
            if (movie && movie.genres) {
              movie.genres.forEach(genre => genres.add(genre.id));
            }
          });

          // Si hay géneros, buscar películas populares de esos géneros
          if (genres.size > 0) {
            const genreIds = Array.from(genres).slice(0, 3).join(',');
            const response = await fetch(
              `${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&sort_by=popularity.desc&with_genres=${genreIds}&page=1`
            );
            if (response.ok) {
              const data = await response.json();
              popularMovies = data.results || [];
            }
          }
        } catch (err) {
          console.error('Error al obtener películas populares:', err);
        }
      }

      // Filtrar películas populares que no estén en watchlist
      const filteredPopular = deduplicateMovies(
        popularMovies.filter(movie => !watchlistSet.has(movie.id))
      ).slice(0, 20);

      // Ordenar por popularidad y limitar cantidad
      const sortedRecommendations = filteredRecommendations
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 20);
      
      const sortedSimilar = filteredSimilar
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 20);

      setRecommendations({
        basedOnWatchlist: sortedRecommendations,
        similarMovies: sortedSimilar,
        popularRecommendations: filteredPopular
      });
    } catch (err) {
      setError(`Error al cargar recomendaciones: ${err.message}`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="recommendations-container">
        <div className="recommendations-empty">
          <p>{t('loginRequired')}</p>
        </div>
      </div>
    );
  }

  const MovieCard = ({ movie }) => {
    const posterUrl = movie.poster_path 
      ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
      : 'https://via.placeholder.com/500x750?text=Sin+Imagen';

    return (
      <div className="recommendation-card" onClick={() => onMovieClick && onMovieClick(movie)}>
        <div className="recommendation-poster">
          <img 
            src={posterUrl} 
            alt={movie.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x750?text=Sin+Imagen';
            }}
          />
        </div>
        <div className="recommendation-info">
          <h3 className="recommendation-title">{movie.title}</h3>
          {movie.release_date && (
            <p className="recommendation-year">{new Date(movie.release_date).getFullYear()}</p>
          )}
          {movie.vote_average > 0 && (
            <div className="recommendation-rating">
              <span>⭐</span>
              <span>{movie.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const RecommendationSection = ({ title, movies, emptyMessage }) => {
    if (loading) return null;
    
    if (movies.length === 0) {
      return (
        <div className="recommendation-section">
          <h3 className="section-title">{title}</h3>
          <p className="section-empty">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="recommendation-section">
        <h3 className="section-title">{title}</h3>
        <div className="recommendations-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="recommendations-container">
      <div className="recommendations-header">
        <h2 className="recommendations-title">🎯 {t('recommendations')}</h2>
        <p className="recommendations-subtitle">
          {watchlist.length > 0 
            ? t('recommendationsSubtitle').replace('{count}', watchlist.length)
            : t('recommendationsEmptySubtitle')
          }
        </p>
        <button 
          className="refresh-button" 
          onClick={loadRecommendations}
          disabled={loading}
        >
          {loading ? t('loading') : '🔄 ' + t('refreshRecommendations')}
        </button>
      </div>

      {error && (
        <div className="recommendations-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="recommendations-loading">
          <div className="spinner"></div>
          <p>{t('loadingRecommendations')}</p>
        </div>
      ) : watchlist.length === 0 ? (
        <div className="recommendations-empty">
          <p className="empty-icon">📭</p>
          <p className="empty-title">{t('emptyWatchlistTitle')}</p>
          <p className="empty-text">{t('emptyWatchlistText')}</p>
        </div>
      ) : (
        <div className="recommendations-content">
          <RecommendationSection
            title={t('basedOnYourWatchlist')}
            movies={recommendations.basedOnWatchlist}
            emptyMessage={t('noRecommendations')}
          />
          
          <RecommendationSection
            title={t('similarMovies')}
            movies={recommendations.similarMovies}
            emptyMessage={t('noSimilarMovies')}
          />
          
          <RecommendationSection
            title={t('popularInYourGenres')}
            movies={recommendations.popularRecommendations}
            emptyMessage={t('noPopularMovies')}
          />
        </div>
      )}
    </div>
  );
}

export default Recommendations;

