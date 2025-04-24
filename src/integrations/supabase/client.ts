
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://venxltsumlixfgysffqu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnhsdHN1bWxpeGZneXNmZnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTAxMjgsImV4cCI6MjA2MDk2NjEyOH0.nh-jpcFgH1MDIcslbcG4uk82qT81w-IDjI4zMpmLv_Y";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, // Keep session persistence enabled
    storage: sessionStorage, // Use sessionStorage which clears when browser closes
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
