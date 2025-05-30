
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
  isAuthenticated: boolean | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, isAdmin?: boolean) => Promise<boolean>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  addUser: (username: string, password: string, isAdmin?: boolean, role?: string, title?: string) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
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

  const isAuthenticated = currentUser !== null;

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
        isAdmin: data.is_admin,
        role: data.role || undefined,
        title: data.title || undefined
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
        .insert([{ username, password, is_admin: isAdmin }]);

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

  const addUser = async (username: string, password: string, isAdmin = false, role?: string, title?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('auth_users')
        .insert([{ 
          username, 
          password, 
          is_admin: isAdmin,
          role: role || null,
          title: title || null
        }]);

      if (error) {
        console.error('Add user error:', error);
        return false;
      }

      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Add user failed:', error);
      return false;
    }
  };

  const removeUser = async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('auth_users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Remove user error:', error);
        return false;
      }

      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Remove user failed:', error);
      return false;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      // Convert frontend field names to database field names
      const dbUpdates: any = {};
      if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.title !== undefined) dbUpdates.title = updates.title;

      const { error } = await supabase
        .from('auth_users')
        .update(dbUpdates)
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

      // Convert database field names to frontend field names
      const mappedUsers: User[] = (data || []).map(user => ({
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin,
        role: user.role || undefined,
        title: user.title || undefined
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      isAuthenticated,
      login,
      logout,
      register,
      updateUser,
      addUser,
      removeUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
