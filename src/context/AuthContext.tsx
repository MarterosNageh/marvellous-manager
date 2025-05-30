
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  role?: string;
  title?: string;
  created_at: string;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<boolean>;
  addUser: (userData: { username: string; password: string; isAdmin: boolean; role?: string; title?: string }) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
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

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for user:', username);
      
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        console.error('Login failed:', error);
        return false;
      }

      const user: User = {
        id: data.id,
        username: data.username,
        isAdmin: data.is_admin,
        role: data.role,
        title: data.title,
        created_at: data.created_at
      };

      setCurrentUser(user);
      console.log('Login successful:', user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const refreshUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .order('username');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const mappedUsers: User[] = data.map(user => ({
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin,
        role: user.role,
        title: user.title,
        created_at: user.created_at
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
    try {
      const updateData: any = {};
      
      if (userData.username) updateData.username = userData.username;
      if (userData.isAdmin !== undefined) updateData.is_admin = userData.isAdmin;
      if (userData.role) updateData.role = userData.role;
      if (userData.title) updateData.title = userData.title;

      const { error } = await supabase
        .from('auth_users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user:', error);
        return false;
      }

      await refreshUsers();
      
      // Update current user if it's the same user
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...userData } : null);
      }

      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  const addUser = async (userData: { username: string; password: string; isAdmin: boolean; role?: string; title?: string }): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('auth_users')
        .insert({
          username: userData.username,
          password: userData.password,
          is_admin: userData.isAdmin,
          role: userData.role || 'operator',
          title: userData.title
        });

      if (error) {
        console.error('Error adding user:', error);
        toast.error('Failed to add user');
        return false;
      }

      toast.success('User added successfully');
      await refreshUsers();
      return true;
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
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
        console.error('Error removing user:', error);
        toast.error('Failed to remove user');
        return false;
      }

      toast.success('User removed successfully');
      await refreshUsers();
      return true;
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
      return false;
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const isAuthenticated = currentUser !== null;

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      isAuthenticated,
      login,
      logout,
      refreshUsers,
      updateUser,
      addUser,
      removeUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
