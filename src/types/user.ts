export interface User {
  id: string;
  email: string;
  username?: string;
  role?: 'admin' | 'senior' | 'operator' | 'producer';
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
  team?: string;
  location?: string;
  title?: string;
  isAdmin?: boolean;
} 