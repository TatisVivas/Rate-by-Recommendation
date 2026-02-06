import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import './MovieModal.css';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'YOUR_API_KEY_HERE';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

function MovieModal({ movie, user, onClose, onWatchlistUpdate }) {
  const [movieDetails, setMovieDetails] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const loadUserReview = useCallback(async (movieId) => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
        .single();

      if (data) {
        setRating(Number(data.rating) || 0);
        setReviewContent(data.content || '');
      } else {
        setRating(0);
        setReviewContent('');
      }
    } catch (err) {
      console.error('Error al cargar reseña:', err);
    }
  }, [user]);

  const checkWatchlist = useCallback(async (movieId) => {
    if (!user) {
      setIsInWatchlist(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
        .single();

      setIsInWatchlist(data && !data.error);
    } catch (err) {
      setIsInWatchlist(false);
    }
  }, [user]);

  useEffect(() => {
    if (movie) {
      fetchMovieDetails(movie.id);
      if (user) {
        loadUserReview(movie.id);
        checkWatchlist(movie.id);
      }
    }
  }, [movie, user, loadUserReview, checkWatchlist]);

  const fetchMovieDetails = async (movieId) => {
    try {
      const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-ES`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMovieDetails(data);
      }
    } catch (err) {
      console.error('Error al cargar detalles:', err);
    }
  };

  const handleRateMovie = async (movieId, ratingValue) => {
    if (!user) {
      return;
    }

    setRatingLoading(true);
    setRatingSuccess(false);

    try {
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
        .single();

      if (existingReview) {
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: ratingValue,
            content: reviewContent || null,
          })
          .eq('id', existingReview.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert({
            user_id: user.id,
            movie_id: movieId,
            rating: ratingValue,
            content: reviewContent || null,
          });

        if (error) throw error;
      }

      setRating(ratingValue);
      setRatingSuccess(true);
      await loadUserReview(movieId);
      setTimeout(() => setRatingSuccess(false), 3000);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleSaveReview = async () => {
    if (!movie || !user) return;
    await handleRateMovie(movie.id, rating);
  };

  const handleToggleWatchlist = async () => {
    if (!user || !movie) return;

    setWatchlistLoading(true);

    try {
      if (isInWatchlist) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', movie.id);

        if (error) throw error;
        setIsInWatchlist(false);
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            movie_id: movie.id,
          });

        if (error) throw error;
        setIsInWatchlist(true);
      }
      if (onWatchlistUpdate) onWatchlistUpdate();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const formatRating = (value) => {
    const n = Number(value);
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  };

  const getStarFill = (starIndex) => {
    const r = hoveredRating || rating;
    if (r >= starIndex) return 100;
    if (r >= starIndex - 0.5) return 50;
    return 0;
  };

  const starPath = 'M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4 2.3-7.4-6-4.6h7.6L12 2z';

  const StarRating = ({ movieId, currentRating, onRate }) => {
    const stars = [1, 2, 3, 4, 5];

    return (
      <div className="star-rating-container">
        <p className="rating-label">Califica esta película (0.5 a 5 estrellas):</p>
        <div className="star-rating star-rating-half">
          {stars.map((starIndex) => {
            const fillPct = getStarFill(starIndex);
            return (
              <div key={starIndex} className="star-wrapper star-wrapper-svg">
                <svg
                  className="star-svg"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path className="star-svg-bg" d={starPath} fill="currentColor" />
                  <path
                    className="star-svg-fill"
                    d={starPath}
                    fill="currentColor"
                    style={{ clipPath: `inset(0 ${100 - fillPct}% 0 0)` }}
                  />
                </svg>
                <button
                  type="button"
                  className="star-hit star-left"
                  onClick={() => onRate(movieId, starIndex - 0.5)}
                  onMouseEnter={() => setHoveredRating(starIndex - 0.5)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={ratingLoading}
                  aria-label={`${starIndex - 0.5} de 5`}
                />
                <button
                  type="button"
                  className="star-hit star-right"
                  onClick={() => onRate(movieId, starIndex)}
                  onMouseEnter={() => setHoveredRating(starIndex)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={ratingLoading}
                  aria-label={`${starIndex} de 5`}
                />
              </div>
            );
          })}
        </div>
        <p className="rating-value">
          {(hoveredRating || currentRating) > 0 ? `${formatRating(hoveredRating || currentRating)}/5` : 'Selecciona una calificación'}
        </p>
      </div>
    );
  };

  if (!movie) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {movieDetails ? (
          <>
            <div className="modal-header">
              <div className="modal-poster">
                <img 
                  src={movieDetails.poster_path 
                    ? `${TMDB_IMAGE_BASE_URL}${movieDetails.poster_path}`
                    : 'https://via.placeholder.com/500x750?text=Sin+Imagen'
                  }
                  alt={movieDetails.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/500x750?text=Sin+Imagen';
                  }}
                />
              </div>
              <div className="modal-info">
                <h2 className="modal-title">{movieDetails.title}</h2>
                {movieDetails.original_title !== movieDetails.title && (
                  <p className="modal-original-title">{movieDetails.original_title}</p>
                )}
                {movieDetails.release_date && (
                  <p className="modal-release-date">
                    📅 {new Date(movieDetails.release_date).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
                {movieDetails.vote_average > 0 && (
                  <div className="modal-rating">
                    <span className="rating-star">⭐</span>
                    <span>{movieDetails.vote_average.toFixed(1)}</span>
                    <span className="rating-count">({movieDetails.vote_count.toLocaleString()} votos)</span>
                  </div>
                )}
                {movieDetails.genres && movieDetails.genres.length > 0 && (
                  <div className="modal-genres">
                    {movieDetails.genres.map((genre) => (
                      <span key={genre.id} className="genre-tag">{genre.name}</span>
                    ))}
                  </div>
                )}
                {movieDetails.runtime && (
                  <p className="modal-runtime">⏱️ {movieDetails.runtime} minutos</p>
                )}
              </div>
            </div>

            {movieDetails.overview && (
              <div className="modal-overview">
                <h3>Sinopsis</h3>
                <p>{movieDetails.overview}</p>
              </div>
            )}

            {user && (
              <div className="modal-rating-section">
                <StarRating 
                  movieId={movie.id} 
                  currentRating={rating}
                  onRate={(movieId, ratingValue) => {
                    setRating(ratingValue);
                    handleRateMovie(movieId, ratingValue);
                  }}
                />

                <div className="review-content-section">
                  <label htmlFor="review-content" className="review-label">
                    Reseña (opcional):
                  </label>
                  <textarea
                    id="review-content"
                    className="review-textarea"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Escribe tu opinión sobre esta película..."
                    rows={4}
                  />
                  <button
                    className="save-review-button"
                    onClick={handleSaveReview}
                    disabled={ratingLoading || rating === 0}
                  >
                    {ratingLoading ? 'Guardando...' : 'Guardar Reseña'}
                  </button>
                </div>

                <div className="watchlist-section">
                  <button
                    className={`watchlist-button ${isInWatchlist ? 'in-watchlist' : ''}`}
                    onClick={handleToggleWatchlist}
                    disabled={watchlistLoading}
                  >
                    {watchlistLoading ? '...' : isInWatchlist ? '✓ En Lista' : '+ Agregar a Lista'}
                  </button>
                </div>

                {ratingLoading && (
                  <div className="rating-loading">
                    <div className="spinner-small"></div>
                    <span>Guardando...</span>
                  </div>
                )}
                {ratingSuccess && (
                  <div className="rating-success">
                    ✅ ¡Reseña guardada exitosamente!
                  </div>
                )}
              </div>
            )}

            {!user && (
              <div className="modal-login-prompt">
                <p>Inicia sesión para calificar y agregar películas a tu lista</p>
              </div>
            )}
          </>
        ) : (
          <div className="modal-loading">
            <div className="spinner"></div>
            <p>Cargando detalles...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieModal;

