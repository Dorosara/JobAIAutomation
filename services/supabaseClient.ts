import { createClient } from '@supabase/supabase-js';

// Configuration from project settings
const supabaseUrl = 'https://qwbnjlpzexewcgtrkghu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Ym5qbHB6ZXhld2NndHJrZ2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDA3NjAsImV4cCI6MjA4NDQ3Njc2MH0.lgV2R2xGktPkQwHnEmaoVS7YEEgae_klL86Pm_l9AXE';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing. Database features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
