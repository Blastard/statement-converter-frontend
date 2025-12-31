import { createClient } from '@supabase/supabase-js';

// Load keys from Vercel/Local Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase Environment Variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);