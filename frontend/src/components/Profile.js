import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { usePreferences } from '../context/PreferencesContext';
import { useTranslation } from '../utils/translations';
import './Profile.css';

function Profile({ user, onLogout }) {
  const { preferences, updatePreference } = usePreferences();
  const t = useTranslation(preferences.language);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);

  const loadProfile = async () => {
    if (!user || !supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUsername(data.username || '');
      } else {
        // Crear perfil si no existe
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'Usuario',
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
        await loadProfile();
      }
    } catch (err) {
      setError(`Error al cargar perfil: ${err.message}`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user || !supabase) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username || user.email?.split('@')[0] || 'Usuario',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      await loadProfile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(`Error al guardar: ${err.message}`);
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    setSavingPrefs(true);
    try {
      await updatePreference(key, value);
    } catch (err) {
      setError(`Error al guardar preferencia: ${err.message}`);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-empty">
          <p>Debes iniciar sesión para ver tu perfil</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2 className="profile-title">👤 {t('myProfile')}</h2>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h3 className="section-title">{t('personalInfo')}</h3>
          
          <div className="profile-field">
            <label htmlFor="email">{t('email')}</label>
            <input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="profile-input disabled"
            />
            <p className="field-hint">{t('emailHint')}</p>
          </div>

          <div className="profile-field">
            <label htmlFor="username">{t('username')}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('username')}
              className="profile-input"
            />
          </div>

          {error && (
            <div className="profile-error">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="profile-success">
              <p>✅ {t('profileUpdated')}</p>
            </div>
          )}

          <button
            className="profile-save-button"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? t('saving') : t('saveChanges')}
          </button>
        </div>

        <div className="profile-section">
          <h3 className="section-title">{t('preferences')}</h3>
          
          <div className="preferences-list">
            <div className="preference-item">
              <div className="preference-info">
                <span className="preference-label">{t('notifications')}</span>
                <span className="preference-description">{t('notificationsDesc')}</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                  disabled={savingPrefs}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <span className="preference-label">{t('language')}</span>
                <span className="preference-description">{t('languageDesc')}</span>
              </div>
              <select
                className="preference-select"
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                disabled={savingPrefs}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <span className="preference-label">{t('theme')}</span>
                <span className="preference-description">{t('themeDesc')}</span>
              </div>
              <select
                className="preference-select"
                value={preferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                disabled={savingPrefs}
              >
                <option value="dark">{t('dark')}</option>
                <option value="light">{t('light')}</option>
              </select>
            </div>
          </div>
          {savingPrefs && (
            <div className="preference-saving">
              <span>💾 {t('saving')}</span>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h3 className="section-title">{t('session')}</h3>
          <button
            className="profile-logout-button"
            onClick={handleLogout}
          >
            🚪 {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;

