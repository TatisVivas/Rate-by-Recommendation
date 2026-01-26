import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Watchlist.css';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'YOUR_API_KEY_HERE';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function Watchlist({ user, onMovieClick }) {
  const [watchlist, setWatchlist] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadWatchlist();
    }
  }, [user]);

  const loadWatchlist = async () => {
    if (!user || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      setWatchlist(data || []);

      // Cargar detalles de cada película
      if (data && data.length > 0) {
        const moviePromises = data.map(async (item) => {
          try {
            const response = await fetch(
              `${TMDB_BASE_URL}/movie/${item.movie_id}?api_key=${API_KEY}&language=es-ES`
            );
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch (err) {
            console.error(`Error al cargar película ${item.movie_id}:`, err);
            return null;
          }
        });

        const movieResults = await Promise.all(moviePromises);
        setMovies(movieResults.filter(movie => movie !== null));
      } else {
        setMovies([]);
      }
    } catch (err) {
      setError(`Error al cargar lista: ${err.message}`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (movieId) => {
    if (!user || !supabase) return;

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) throw error;

      // Recargar la lista
      await loadWatchlist();
    } catch (err) {
      setError(`Error al eliminar: ${err.message}`);
      console.error('Error:', err);
    }
  };

  if (!user) {
    return (
      <div className="watchlist-container">
        <div className="watchlist-empty">
          <p>Debes iniciar sesión para ver tu lista de seguimiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-container">
      <div className="watchlist-header">
        <h2 className="watchlist-title">📋 Mi Lista de Seguimiento</h2>
        <p className="watchlist-subtitle">
          {movies.length} {movies.length === 1 ? 'película guardada' : 'películas guardadas'}
        </p>
      </div>

      {error && (
        <div className="watchlist-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="watchlist-loading">
          <div className="spinner"></div>
          <p>Cargando tu lista...</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="watchlist-empty">
          <p className="empty-icon">📭</p>
          <p className="empty-title">Tu lista está vacía</p>
          <p className="empty-text">
            Agrega películas a tu lista desde la página de inicio haciendo clic en cualquier película
          </p>
        </div>
      ) : (
        <div className="watchlist-grid">
          {movies.map((movie) => {
            const posterUrl = movie.poster_path 
              ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
              : 'https://via.placeholder.com/500x750?text=Sin+Imagen';

            return (
              <div key={movie.id} className="watchlist-card">
                <div className="watchlist-poster" onClick={() => onMovieClick && onMovieClick(movie)}>
                  <img 
                    src={posterUrl} 
                    alt={movie.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/500x750?text=Sin+Imagen';
                    }}
                  />
                  <button
                    className="watchlist-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromWatchlist(movie.id);
                    }}
                    title="Eliminar de la lista"
                  >
                    ×
                  </button>
                </div>
                <div className="watchlist-info">
                  <h3 className="watchlist-movie-title">{movie.title}</h3>
                  {movie.release_date && (
                    <p className="watchlist-year">{new Date(movie.release_date).getFullYear()}</p>
                  )}
                  {movie.vote_average > 0 && (
                    <div className="watchlist-rating">
                      <span>⭐</span>
                      <span>{movie.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Watchlist;

