import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  role?: string;
  title?: string;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, isAdmin?: boolean) => Promise<boolean>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('auth_users').select('*').eq('username', username).single();

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (!data || data.password !== password) {
        console.log('Invalid credentials');
        return false;
      }

      setCurrentUser({
        id: data.id,
        username: data.username,
        isAdmin: data.isAdmin,
        role: data.role,
        title: data.title
      });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const register = async (username: string, password: string, isAdmin = false): Promise<boolean> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('auth_users')
        .insert([{ username, password, isAdmin }]);

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      console.log('Registration successful:', data);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('auth_users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      ));
      
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .order('username');

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      login,
      logout,
      register,
      updateUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
