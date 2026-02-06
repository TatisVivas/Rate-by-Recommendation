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

  const loadCircles = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select('circle:circles(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const uniqueCircles = [];
      const seen = new Set();
      (data || []).forEach((row) => {
        if (row.circle && !seen.has(row.circle.id)) {
          seen.add(row.circle.id);
          uniqueCircles.push(row.circle);
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

  return (
    <div className="circles-container">
      <div className="circles-header">
        <h2 className="circles-title">👥 Mis Círculos</h2>
        <p className="circles-subtitle">
          Crea círculos para compartir tus recomendaciones con amigos y familia.
        </p>
      </div>

      <div className="circles-content">
        <div className="circles-form-card">
          <h3 className="circles-section-title">Crear nuevo círculo</h3>
          <form onSubmit={handleCreateCircle} className="circles-form">
            <div className="circles-field">
              <label htmlFor="circle-name">Nombre del círculo</label>
              <input
                id="circle-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Familia, Amigos cinéfilos, Compañeros de trabajo..."
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
            <button
              type="submit"
              className="circles-create-button"
              disabled={creating}
            >
              {creating ? 'Creando círculo...' : 'Crear círculo'}
            </button>
          </form>
        </div>

        <div className="circles-list-card">
          <h3 className="circles-section-title">Tus círculos</h3>

          {loading ? (
            <div className="circles-loading">
              <div className="spinner" />
              <p>Cargando círculos...</p>
            </div>
          ) : circles.length === 0 ? (
            <div className="circles-empty">
              <p>Aún no tienes círculos. ¡Crea el primero arriba!</p>
            </div>
          ) : (
            <ul className="circles-list">
              {circles.map((circle) => (
                <li key={circle.id} className="circles-item">
                  <div className="circles-item-main">
                    <h4 className="circles-item-name">{circle.name}</h4>
                    {circle.description && (
                      <p className="circles-item-description">{circle.description}</p>
                    )}
                  </div>
                  <div className="circles-item-invite">
                    <span className="circles-invite-label">Link de invitación:</span>
                    <input
                      className="circles-invite-input"
                      type="text"
                      readOnly
                      value={getInviteUrl(circle.invite_code)}
                      onFocus={(e) => e.target.select()}
                    />
                    <p className="circles-invite-hint">
                      Comparte este link para que otras personas se unan a tu círculo.
                    </p>
                  </div>
                  <button
                    className="circles-view-button"
                    onClick={() => navigate(`/circles/${circle.id}`)}
                  >
                    Ver recomendaciones →
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Circles;

