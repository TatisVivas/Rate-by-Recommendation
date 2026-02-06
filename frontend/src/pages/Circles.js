import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Circles.css';

function Circles({ user }) {
  const navigate = useNavigate();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [copiedCircleId, setCopiedCircleId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCircles = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select('circle:circles(*), role')
        .eq('user_id', user.id);

      if (error) throw error;

      const uniqueCircles = [];
      const seen = new Set();
      (data || []).forEach((row) => {
        if (row.circle && !seen.has(row.circle.id)) {
          seen.add(row.circle.id);
          uniqueCircles.push({
            ...row.circle,
            userRole: row.role, // Agregar el rol del usuario
          });
        }
      });

      setCircles(uniqueCircles);
    } catch (err) {
      console.error('Error al cargar círculos:', err);
      setError('No se pudieron cargar tus círculos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCircles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'RBR-';
    for (let i = 0; i < 6; i += 1) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateCircle = async (e) => {
    e.preventDefault();
    if (!user || !supabase) return;
    if (!name.trim()) {
      setError('El nombre del círculo es obligatorio.');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const inviteCode = generateInviteCode();

      const { data: circle, error: insertError } = await supabase
        .from('circles')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          owner_id: user.id,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: memberError } = await supabase.from('circle_members').insert({
        circle_id: circle.id,
        user_id: user.id,
        role: 'owner',
      });

      if (memberError) throw memberError;

      setName('');
      setDescription('');
      setIsModalOpen(false);
      await loadCircles();
    } catch (err) {
      console.error('Error al crear círculo:', err);
      setError('No se pudo crear el círculo. Intenta de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  const getInviteUrl = (inviteCode) => {
    if (typeof window === 'undefined') {
      return `/join/${inviteCode}`;
    }
    const baseUrl = window.location.origin || '';
    return `${baseUrl}/join/${inviteCode}`;
  };

  const handleCopyLink = async (circleId, inviteCode) => {
    const url = getInviteUrl(inviteCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCircleId(circleId);
      setTimeout(() => {
        setCopiedCircleId(null);
      }, 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      // Fallback para navegadores que no soportan clipboard API
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedCircleId(circleId);
      setTimeout(() => {
        setCopiedCircleId(null);
      }, 2000);
    }
  };

  const handleDeleteCircle = async (circleId) => {
    if (!user || !supabase) return;

    setDeleting(true);
    try {
      // Eliminar el círculo (esto también eliminará los miembros y shares por cascade)
      const { error } = await supabase
        .from('circles')
        .delete()
        .eq('id', circleId)
        .eq('owner_id', user.id); // Solo si es el dueño

      if (error) throw error;

      setDeleteConfirm(null);
      await loadCircles();
    } catch (err) {
      console.error('Error al eliminar círculo:', err);
      setError('No se pudo eliminar el círculo. Intenta de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="circles-container">
      <div className="circles-header">
        <div className="circles-header-content">
          <div>
            <h2 className="circles-title">👥 Mis Círculos</h2>
            <p className="circles-subtitle">
              Crea círculos para compartir tus recomendaciones con amigos y familia.
            </p>
          </div>
          <button
            className="circles-create-group-button"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="circles-create-icon">+</span>
            <span>Crear grupo</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="circles-loading">
          <div className="spinner" />
          <p>Cargando círculos...</p>
        </div>
      ) : circles.length === 0 ? (
        <div className="circles-empty-state">
          <div className="circles-empty-icon">👥</div>
          <h3 className="circles-empty-title">Aún no tienes círculos</h3>
          <p className="circles-empty-text">
            Crea tu primer círculo para empezar a compartir recomendaciones con tus amigos y familia.
          </p>
          <button
            className="circles-create-group-button-empty"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="circles-create-icon">+</span>
            <span>Crear grupo</span>
          </button>
        </div>
      ) : (
        <div className="circles-grid">
          {circles.map((circle) => (
            <div key={circle.id} className="circles-card">
              {circle.userRole === 'owner' && (
                <button
                  className="circles-delete-button"
                  onClick={() => setDeleteConfirm(circle)}
                  title="Eliminar círculo"
                  aria-label="Eliminar círculo"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              <div className="circles-card-header">
                <h3 className="circles-card-name">{circle.name}</h3>
                {circle.description && (
                  <p className="circles-card-description">{circle.description}</p>
                )}
              </div>
              <div className="circles-card-invite">
                <span className="circles-invite-label">Link de invitación:</span>
                <div className="circles-invite-input-container">
                  <input
                    className="circles-invite-input"
                    type="text"
                    readOnly
                    value={getInviteUrl(circle.invite_code)}
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    className="circles-copy-button"
                    onClick={() => handleCopyLink(circle.id, circle.invite_code)}
                    title="Copiar link"
                    aria-label="Copiar link de invitación"
                  >
                    {copiedCircleId === circle.id ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                className="circles-card-button"
                onClick={() => navigate(`/circles/${circle.id}`)}
              >
                Ver recomendaciones →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear círculo */}
      {isModalOpen && (
        <div className="circles-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="circles-modal" onClick={(e) => e.stopPropagation()}>
            <div className="circles-modal-header">
              <h3 className="circles-modal-title">Crear nuevo círculo</h3>
              <button
                className="circles-modal-close"
                onClick={() => {
                  setIsModalOpen(false);
                  setName('');
                  setDescription('');
                  setError(null);
                }}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateCircle} className="circles-modal-form">
              <div className="circles-field">
                <label htmlFor="circle-name">Nombre del círculo</label>
                <input
                  id="circle-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Familia, Amigos cinéfilos, Compañeros de trabajo..."
                  autoFocus
                />
              </div>
              <div className="circles-field">
                <label htmlFor="circle-description">Descripción (opcional)</label>
                <textarea
                  id="circle-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe brevemente el propósito del círculo."
                />
              </div>
              {error && (
                <div className="circles-error">
                  <p>{error}</p>
                </div>
              )}
              <div className="circles-modal-actions">
                <button
                  type="button"
                  className="circles-modal-cancel"
                  onClick={() => {
                    setIsModalOpen(false);
                    setName('');
                    setDescription('');
                    setError(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="circles-modal-submit"
                  disabled={creating}
                >
                  {creating ? 'Creando...' : 'Crear círculo'}
                </button>
          </div>
        </form>
      </div>
    </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {deleteConfirm && (
        <div className="circles-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="circles-modal circles-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="circles-modal-header">
              <h3 className="circles-modal-title">Eliminar círculo</h3>
              <button
                className="circles-modal-close"
                onClick={() => setDeleteConfirm(null)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="circles-delete-content">
              <p className="circles-delete-message">
                ¿Estás seguro de que quieres eliminar el círculo <strong>"{deleteConfirm.name}"</strong>?
              </p>
              <p className="circles-delete-warning">
                Esta acción no se puede deshacer. Se eliminarán todas las recomendaciones compartidas en este círculo.
              </p>
            </div>
            <div className="circles-modal-actions">
              <button
                type="button"
                className="circles-modal-cancel"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="circles-modal-delete"
                onClick={() => handleDeleteCircle(deleteConfirm.id)}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar círculo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Circles;

