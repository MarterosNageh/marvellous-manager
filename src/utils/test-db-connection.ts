
import { supabase } from '@/integrations/supabase/client';

export const testDbConnection = async () => {
  try {
    const { data, error } = await supabase.from('auth_users').select('count').single();
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};
