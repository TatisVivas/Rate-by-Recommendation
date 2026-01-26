import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Faltan las variables de entorno de Supabase:');
  console.error('   REACT_APP_SUPABASE_URL');
  console.error('   REACT_APP_SUPABASE_ANON_KEY');
  console.error('Verifica tu archivo .env');
}

// Crear cliente de Supabase (puede ser null si no hay credenciales)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

