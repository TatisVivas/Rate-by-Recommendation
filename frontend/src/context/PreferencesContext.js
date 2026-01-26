import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children, user }) => {
  const [preferences, setPreferences] = useState({
    notifications: true,
    language: 'es',
    theme: 'dark',
  });
  const [loading, setLoading] = useState(true);

  // Aplicar tema por defecto al inicio
  useEffect(() => {
    applyTheme('dark'); // Tema por defecto
  }, []);

  // Cargar preferencias al iniciar
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      // Cargar preferencias del localStorage si no hay usuario
      const savedPrefs = localStorage.getItem('preferences');
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          setPreferences(parsed);
          applyTheme(parsed.theme);
        } catch (err) {
          console.error('Error al cargar preferencias:', err);
        }
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPreferences = async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.preferences) {
        const prefs = typeof data.preferences === 'string' 
          ? JSON.parse(data.preferences) 
          : data.preferences;
        setPreferences(prefs);
        applyTheme(prefs.theme);
      } else {
        // Preferencias por defecto
        const defaultPrefs = {
          notifications: true,
          language: 'es',
          theme: 'dark',
        };
        setPreferences(defaultPrefs);
        applyTheme(defaultPrefs.theme);
      }
    } catch (err) {
      console.error('Error al cargar preferencias:', err);
      applyTheme('dark');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences) => {
    setPreferences(newPreferences);
    applyTheme(newPreferences.theme);

    if (!user || !supabase) {
      // Guardar en localStorage si no hay usuario
      localStorage.setItem('preferences', JSON.stringify(newPreferences));
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: newPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error al guardar preferencias:', err);
      throw err;
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    }
  };

  const updatePreference = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    await savePreferences(newPreferences);
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreference,
        savePreferences,
        loading,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

