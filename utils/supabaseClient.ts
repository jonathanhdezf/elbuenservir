import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ldcqyvemlykiflgjvlfg.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkY3F5dmVtbHlraWZsZ2p2bGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNTYzODAsImV4cCI6MjEwNjkzMjM4MH0.Ej1AvUxFZuhdSrjNL4H4mMkrsk1C_CRUVGQ-WFHM8ak';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
