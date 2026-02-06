import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { usePreferences } from '../context/PreferencesContext';
import { useTranslation } from '../utils/translations';
import './MyRatings.css';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'YOUR_API_KEY_HERE';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function MyRatings({ user, onMovieClick }) {
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRatings = useCallback(async () => {
    if (!user || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('movie_id, rating, content, id')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (reviewsError) throw reviewsError;

      if (reviewsData && reviewsData.length > 0) {
        const tmdbLanguage = preferences.language === 'en' ? 'en-US' : 'es-ES';
        const moviePromises = reviewsData.map(async (review) => {
          try {
            const response = await fetch(
              `${TMDB_BASE_URL}/movie/${review.movie_id}?api_key=${API_KEY}&language=${tmdbLanguage}`
            );
            if (response.ok) {
              const movie = await response.json();
              return { ...movie, userRating: review.rating, userReview: review.content };
            }
            return null;
          } catch (err) {
            console.error(`Error al cargar película ${review.movie_id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(moviePromises);
        setItems(results.filter((m) => m !== null));
      } else {
        setItems([]);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar tus calificaciones');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, preferences.language]);

  useEffect(() => {
    if (user) {
      loadRatings();
    }
  }, [user, loadRatings]);

  if (!user) {
    return (
      <div className="my-ratings-container">
        <div className="my-ratings-empty">
          <p>{t('loginRequiredRatings')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-ratings-container">
      <div className="my-ratings-header">
        <h2 className="my-ratings-title">⭐ {t('myRatings')}</h2>
        <p className="my-ratings-subtitle">
          {items.length} {items.length === 1 ? t('moviesRated') : t('moviesRatedPlural')}
        </p>
      </div>

      {error && (
        <div className="my-ratings-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="my-ratings-loading">
          <div className="spinner"></div>
          <p>{t('loadingRatings')}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="my-ratings-empty">
          <p className="empty-icon">⭐</p>
          <p className="empty-title">{t('emptyRatings')}</p>
          <p className="empty-text">{t('emptyRatingsText')}</p>
        </div>
      ) : (
        <div className="my-ratings-grid">
          {items.map((movie) => {
            const noImageText = preferences.language === 'en' ? 'No+Image' : 'Sin+Imagen';
            const posterUrl = movie.poster_path
              ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
              : `https://via.placeholder.com/500x750?text=${noImageText}`;

            return (
              <div key={movie.id} className="my-ratings-card">
                <div
                  className="my-ratings-poster"
                  onClick={() => onMovieClick && onMovieClick(movie)}
                >
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/500x750?text=${noImageText}`;
                    }}
                  />
                  <div className="my-ratings-badge">
                    {Number.isInteger(Number(movie.userRating)) ? Number(movie.userRating) : Number(movie.userRating).toFixed(1)}/5
                  </div>
                </div>
                <div className="my-ratings-info">
                  <h3 className="my-ratings-movie-title">{movie.title}</h3>
                  {movie.release_date && (
                    <p className="my-ratings-year">{new Date(movie.release_date).getFullYear()}</p>
                  )}
                  <p className="my-ratings-user-rating">
                    ⭐ {t('yourRating')}: {Number.isInteger(Number(movie.userRating)) ? Number(movie.userRating) : Number(movie.userRating).toFixed(1)}/5
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyRatings;
