import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../utils/translations';
import { usePreferences } from '../context/PreferencesContext';
import './Confirmacion.css';

function JoinCircle({ user }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState(t('joinCircle'));

  useEffect(() => {
    const join = async () => {
      if (!supabase) {
        setStatus('error');
        setMessage(t('supabaseNotConfigured'));
        return;
      }

      if (!user) {
        setStatus('error');
        setMessage(t('mustLoginToJoin'));
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
          setMessage(t('circleNotFound'));
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
        setMessage(`${t('joiningCircle')} "${circle.name}". ${t('redirecting')}...`);

        setTimeout(() => {
          navigate('/circles');
        }, 2000);
      } catch (err) {
        console.error('Error al unirse al círculo:', err);
        setStatus('error');
        setMessage(t('joinError'));
      }
    };

    join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, user]);

  return (
    <div className="confirm-container">
      <div className="confirm-card">
        <h2 className="confirm-title">
          {status === 'success' ? '✅ ¡Listo!' : status === 'error' ? '⚠️ Ocurrió un problema' : `👥 ${t('joinCircle')}`}
        </h2>
        <p className="confirm-message">{message}</p>
        {status === 'error' && (
          <button
            type="button"
            className="confirm-button"
            onClick={() => navigate('/')}
          >
            {t('backToHome')}
          </button>
        )}
      </div>
    </div>
  );
}

export default JoinCircle;

