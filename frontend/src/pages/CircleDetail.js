import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../utils/translations';
import { usePreferences } from '../context/PreferencesContext';
import './CircleDetail.css';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'YOUR_API_KEY_HERE';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function CircleDetail({ user, onMovieClick }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [circle, setCircle] = useState(null);
  const [sharedReviews, setSharedReviews] = useState([]);
  const [members, setMembers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

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

      // Cargar miembros del círculo
      const { data: membersData, error: membersError } = await supabase
        .from('circle_members')
        .select('user_id, role, joined_at')
        .eq('circle_id', id)
        .order('joined_at', { ascending: true });

      if (membersError) {
        console.error('Error al cargar miembros:', membersError);
      } else {
        // Encontrar el rol del usuario actual
        const currentUserMember = membersData?.find((m) => m.user_id === user.id);
        setUserRole(currentUserMember?.role || null);

        // Cargar perfiles para los miembros
        const memberUserIds = membersData?.map((m) => m.user_id) || [];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', memberUserIds);

        const profilesMap = {};
        (profilesData || []).forEach((profile) => {
          profilesMap[profile.id] = profile.username || 'Usuario';
        });

        const membersWithProfiles = (membersData || []).map((member) => ({
          ...member,
          username: profilesMap[member.user_id] || 'Usuario',
        }));

        setMembers(membersWithProfiles);
      }

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
      setError(`${t('errorLoadingRecommendations')} ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    loadCircleDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleRemoveMember = async (memberUserId) => {
    if (!user || !supabase || !id) return;
    if (userRole !== 'owner') return; // Solo el owner puede eliminar miembros

    setRemovingMember(memberUserId);
    try {
      const { error } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', id)
        .eq('user_id', memberUserId);

      if (error) throw error;

      // Recargar los detalles del círculo
      await loadCircleDetails();
    } catch (err) {
      console.error('Error al eliminar miembro:', err);
      setError(t('errorRemovingMember'));
    } finally {
      setRemovingMember(null);
    }
  };

  if (!user) {
    return (
      <div className="circle-detail-container">
        <div className="circle-detail-empty">
          <p>{t('mustLoginToJoin')}</p>
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
        ← {t('backToCircles')}
      </button>

      {loading ? (
        <div className="circle-detail-loading">
          <div className="spinner" />
          <p>{t('loadingRecommendations')}</p>
        </div>
      ) : error ? (
        <div className="circle-detail-error">
          <p>{error}</p>
        </div>
      ) : !circle ? (
        <div className="circle-detail-empty">
          <p>{t('circleNotFound')}</p>
        </div>
      ) : (
        <>
          <div className="circle-detail-header">
            <div className="circle-detail-header-top">
              <div>
                <h2 className="circle-detail-title">👥 {circle.name}</h2>
                {circle.description && (
                  <p className="circle-detail-description">{circle.description}</p>
                )}
              </div>
              <button
                className="circle-view-members-button"
                onClick={() => setShowMembers(!showMembers)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('viewMembers')} ({members.length})</span>
              </button>
            </div>
            <p className="circle-detail-count">
              {sharedReviews.length}{' '}
              {sharedReviews.length === 1
                ? t('circleRecommendations')
                : t('circleRecommendationsPlural')}
            </p>
          </div>

          {/* Modal de miembros */}
          {showMembers && (
            <div className="circle-members-modal-overlay" onClick={() => setShowMembers(false)}>
              <div className="circle-members-modal" onClick={(e) => e.stopPropagation()}>
                <div className="circle-members-modal-header">
                  <h3 className="circle-members-modal-title">{t('circleMembers')}</h3>
                  <button
                    className="circle-members-modal-close"
                    onClick={() => setShowMembers(false)}
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </div>
                <div className="circle-members-list">
                  {members.length === 0 ? (
                    <div className="circle-members-empty">
                      <p>{t('noMembers')}</p>
                    </div>
                  ) : (
                    members.map((member) => (
                      <div key={member.user_id} className="circle-member-item">
                        <div className="circle-member-info">
                          <span className="circle-member-name">{member.username}</span>
                          <span className={`circle-member-role ${member.role}`}>
                            {member.role === 'owner' ? `👑 ${t('creator')}` : `👤 ${t('member')}`}
                          </span>
                        </div>
                        {userRole === 'owner' && member.user_id !== user.id && (
                          <button
                            className="circle-member-remove"
                            onClick={() => handleRemoveMember(member.user_id)}
                            disabled={removingMember === member.user_id}
                            title={t('removeMember')}
                          >
                            {removingMember === member.user_id ? (
                              <div className="spinner-small" />
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {sharedReviews.length === 0 ? (
            <div className="circle-detail-empty-reviews">
              <p className="empty-icon">🎬</p>
              <p className="empty-title">{t('noRecommendations')}</p>
              <p className="empty-text">
                {t('noRecommendationsText')}
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
                        <span className="reviewer-label">{t('recommendedBy')}</span>
                        <span className="reviewer-name">{item.username}</span>
                      </div>
                      <div className="circle-detail-rating">
                        ⭐ {t('rating')} {Number.isInteger(Number(item.rating))
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
