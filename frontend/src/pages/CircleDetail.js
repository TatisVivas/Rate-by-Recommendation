import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './CircleDetail.css';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'YOUR_API_KEY_HERE';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function CircleDetail({ user, onMovieClick }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState(null);
  const [sharedReviews, setSharedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCircleDetails = useCallback(async () => {
    if (!user || !supabase || !id) return;

    setLoading(true);
    setError(null);

    try {
      // Cargar información del círculo
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .eq('id', id)
        .single();

      if (circleError) throw circleError;
      setCircle(circleData);

      // Cargar reseñas compartidas en este círculo (sin join anidado)
      const { data: sharesData, error: sharesError } = await supabase
        .from('circle_review_shares')
        .select('id, shared_at, review_id, shared_by')
        .eq('circle_id', id)
        .order('shared_at', { ascending: false });

      if (sharesError) {
        console.error('Error al cargar shares:', sharesError);
        throw sharesError;
      }

      if (sharesData && sharesData.length > 0) {
        // Obtener los review_ids y user_ids únicos
        const reviewIds = sharesData.map((share) => share.review_id).filter(Boolean);
        const userIds = [...new Set(sharesData.map((share) => share.shared_by))];

        // Cargar reseñas
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('id, movie_id, rating, content, user_id')
          .in('id', reviewIds);

        if (reviewsError) {
          console.error('Error al cargar reviews:', reviewsError);
          throw reviewsError;
        }

        // Cargar perfiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error al cargar perfiles:', profilesError);
          // No lanzar error aquí, solo usar 'Usuario' como fallback
        }

        // Crear mapas para acceso rápido
        const reviewsMap = {};
        (reviewsData || []).forEach((review) => {
          reviewsMap[review.id] = review;
        });

        const profilesMap = {};
        (profilesData || []).forEach((profile) => {
          profilesMap[profile.id] = profile.username || 'Usuario';
        });

        // Combinar datos y obtener detalles de películas desde TMDb
        const moviePromises = sharesData.map(async (share) => {
          const review = reviewsMap[share.review_id];
          if (!review) return null;

          try {
            const response = await fetch(
              `${TMDB_BASE_URL}/movie/${review.movie_id}?api_key=${API_KEY}&language=es-ES`
            );
            if (response.ok) {
              const movie = await response.json();
              return {
                ...movie,
                reviewId: review.id,
                rating: review.rating,
                content: review.content,
                sharedBy: share.shared_by,
                sharedAt: share.shared_at,
                username: profilesMap[share.shared_by] || 'Usuario',
              };
            }
            return null;
          } catch (err) {
            console.error(`Error al cargar película ${review.movie_id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(moviePromises);
        setSharedReviews(results.filter((item) => item !== null));
      } else {
        setSharedReviews([]);
      }
    } catch (err) {
      console.error('Error al cargar detalles del círculo:', err);
      setError(`No se pudieron cargar las recomendaciones del círculo. ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    loadCircleDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  if (!user) {
    return (
      <div className="circle-detail-container">
        <div className="circle-detail-empty">
          <p>Debes iniciar sesión para ver los detalles del círculo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="circle-detail-container">
      <button
        className="circle-detail-back-button"
        onClick={() => navigate('/circles')}
      >
        ← Volver a Mis Círculos
      </button>

      {loading ? (
        <div className="circle-detail-loading">
          <div className="spinner" />
          <p>Cargando recomendaciones...</p>
        </div>
      ) : error ? (
        <div className="circle-detail-error">
          <p>{error}</p>
        </div>
      ) : !circle ? (
        <div className="circle-detail-empty">
          <p>Círculo no encontrado.</p>
        </div>
      ) : (
        <>
          <div className="circle-detail-header">
            <h2 className="circle-detail-title">👥 {circle.name}</h2>
            {circle.description && (
              <p className="circle-detail-description">{circle.description}</p>
            )}
            <p className="circle-detail-count">
              {sharedReviews.length}{' '}
              {sharedReviews.length === 1
                ? 'película recomendada'
                : 'películas recomendadas'}
            </p>
          </div>

          {sharedReviews.length === 0 ? (
            <div className="circle-detail-empty-reviews">
              <p className="empty-icon">🎬</p>
              <p className="empty-title">Aún no hay recomendaciones</p>
              <p className="empty-text">
                Cuando los miembros del círculo compartan sus reseñas, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="circle-detail-grid">
              {sharedReviews.map((item) => {
                const noImageText = 'Sin+Imagen';
                const posterUrl = item.poster_path
                  ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}`
                  : `https://via.placeholder.com/500x750?text=${noImageText}`;

                return (
                  <div key={`${item.id}-${item.reviewId}`} className="circle-detail-card">
                    <div
                      className="circle-detail-poster"
                      onClick={() => onMovieClick && onMovieClick(item)}
                    >
                      <img
                        src={posterUrl}
                        alt={item.title}
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/500x750?text=${noImageText}`;
                        }}
                      />
                      <div className="circle-detail-badge">
                        {Number.isInteger(Number(item.rating))
                          ? Number(item.rating)
                          : Number(item.rating).toFixed(1)}
                        /5
                      </div>
                    </div>
                    <div className="circle-detail-info">
                      <h3 className="circle-detail-movie-title">{item.title}</h3>
                      {item.release_date && (
                        <p className="circle-detail-year">
                          {new Date(item.release_date).getFullYear()}
                        </p>
                      )}
                      <div className="circle-detail-reviewer">
                        <span className="reviewer-label">Recomendado por:</span>
                        <span className="reviewer-name">{item.username}</span>
                      </div>
                      <div className="circle-detail-rating">
                        ⭐ Calificación: {Number.isInteger(Number(item.rating))
                          ? Number(item.rating)
                          : Number(item.rating).toFixed(1)}
                        /5
                      </div>
                      {item.content && (
                        <p className="circle-detail-comment">{item.content}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CircleDetail;
