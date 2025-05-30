
// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://venxltsumlixfgysffqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnhsdHN1bWxpeGZneXNmZnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTAxMjgsImV4cCI6MjA2MDk2NjEyOH0.nh-jpcFgH1MDIcslbcG4uk82qT81w-IDjI4zMpmLv_Y';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
