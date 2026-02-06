import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Confirmacion.css';

function JoinCircle({ user }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Uniéndote al círculo...');

  useEffect(() => {
    const join = async () => {
      if (!supabase) {
        setStatus('error');
        setMessage('Supabase no está configurado.');
        return;
      }

      if (!user) {
        setStatus('error');
        setMessage('Debes iniciar sesión para unirte a un círculo.');
        return;
      }

      try {
        const { data: circle, error } = await supabase
          .from('circles')
          .select('*')
          .eq('invite_code', code)
          .single();

        if (error || !circle) {
          setStatus('error');
          setMessage('No se encontró ningún círculo con este enlace.');
          return;
        }

        const { error: memberError } = await supabase
          .from('circle_members')
          .upsert(
            {
              circle_id: circle.id,
              user_id: user.id,
              role: 'member',
            },
            { onConflict: 'circle_id,user_id' }
          );

        if (memberError) {
          throw memberError;
        }

        setStatus('success');
        setMessage(`Te uniste al círculo "${circle.name}". Redirigiendo...`);

        setTimeout(() => {
          navigate('/circles');
        }, 2000);
      } catch (err) {
        console.error('Error al unirse al círculo:', err);
        setStatus('error');
        setMessage('No se pudo completar la unión al círculo. Intenta de nuevo más tarde.');
      }
    };

    join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, user]);

  return (
    <div className="confirm-container">
      <div className="confirm-card">
        <h2 className="confirm-title">
          {status === 'success' ? '✅ ¡Listo!' : status === 'error' ? '⚠️ Ocurrió un problema' : '👥 Uniéndote al círculo'}
        </h2>
        <p className="confirm-message">{message}</p>
        {status === 'error' && (
          <button
            type="button"
            className="confirm-button"
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </button>
        )}
      </div>
    </div>
  );
}

export default JoinCircle;

