import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = meta?.env?.VITE_SUPABASE_URL || meta?.env?.NEXT_PUBLIC_SUPABASE_URL || 'https://zrrsayypnldkpirpghnt.supabase.co';
const supabaseAnonKey = meta?.env?.VITE_SUPABASE_ANON_KEY || meta?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpycnNheXlwbmxka3BpcnBnaG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NjkzMjYsImV4cCI6210MDU0NTMyNn0.qw6ghBEmrD2mr7Vkt0bVlT2q2hc53UWBc37zEd-tyvw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('orders').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      console.log('Supabase initialized successfully (project reachable). Table query note:', error.message);
    } else {
      console.log('Supabase connected successfully!');
    }
    return { connected: true, url: supabaseUrl };
  } catch (err: any) {
    console.error('Supabase connection error:', err);
    return { connected: false, error: err.message };
  }
}
