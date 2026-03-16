import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vgexbtqtdilyzydstbur.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnZXhidHF0ZGlseXp5ZHN0YnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Mjk4MjAsImV4cCI6MjA4OTIwNTgyMH0.a5xbi-wRRn8uChA0jLjFZqqKEa1axwdXbsNs5GjXJwU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
