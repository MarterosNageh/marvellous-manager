import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'senior' | 'operator';
  isAdmin: boolean;
  title?: string;
  created_at?: string;
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  users: AuthUser[];
  isAuthenticated: boolean | null;
  isAdmin: boolean;
  isSenior: boolean;
  canCompleteTask: boolean;
  canAddUser: boolean;
  canAccessSettings: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  updateUser: (userId: string, userData: Partial<AuthUser>) => Promise<boolean>;
  addUser: (userData: { username: string; password: string; isAdmin: boolean; role?: string; title?: string }) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  users: [],
  isAuthenticated: null,
  isAdmin: false,
  isSenior: false,
  canCompleteTask: false,
  canAddUser: false,
  canAccessSettings: false,
  login: async () => false,
  logout: () => {},
  refreshUsers: async () => {},
  updateUser: async () => false,
  addUser: async () => false,
  removeUser: async () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Compute permissions based on user role
  const isAdmin = currentUser?.role === 'admin';
  const isSenior = currentUser?.role === 'senior';
  const canCompleteTask = isAdmin || isSenior;
  const canAddUser = isAdmin || isSenior;
  const canAccessSettings = isAdmin || isSenior;

  const refreshUsers = async () => {
    try {
      if (!currentUser?.isAdmin && currentUser?.role !== 'senior') {
        // Non-admin users can only see their own profile
        setUsers(currentUser ? [currentUser] : []);
        return;
      }

      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .order('username');

      if (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to load users');
        return;
      }

      const mappedUsers: AuthUser[] = data.map(user => ({
        id: user.id,
        username: user.username,
        role: user.is_admin ? 'admin' : (user.role as 'senior' | 'operator' || 'operator'),
        isAdmin: user.is_admin,
        title: user.title,
        created_at: user.created_at
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error refreshing users:', error);
      toast.error('Failed to refresh users');
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        toast.error('Invalid username or password');
        return false;
      }

      const user: AuthUser = {
        id: data.id,
        username: data.username,
        role: data.is_admin ? 'admin' : (data.role as 'senior' | 'operator' || 'operator'),
        isAdmin: data.is_admin,
        title: data.title,
        created_at: data.created_at
      };

      // Log user data for debugging
      console.log('Login user data:', {
        fromDB: data,
        constructed: user
      });

      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Store user session in localStorage
      const sessionData = {
        ...user,
        loginTime: Date.now(),
        sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
      };
      localStorage.setItem('currentUser', JSON.stringify(sessionData));
      
      toast.success('Login successful');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('current_username');
    toast.success('Logged out successfully');
  };

  const updateUser = async (userId: string, userData: Partial<AuthUser>): Promise<boolean> => {
    try {
      if (!currentUser?.isAdmin && currentUser?.id !== userId) {
        toast.error('Unauthorized to update this user');
        return false;
      }

      const updateData: any = {
        role: userData.role,
        title: userData.title,
      };

      // Only admin can change admin status
      if (currentUser?.isAdmin && userData.role === 'admin') {
        updateData.is_admin = true;
      } else if (currentUser?.isAdmin && userData.role !== 'admin') {
        updateData.is_admin = false;
      }

      console.log('Updating user with data:', {
        userId,
        updateData,
        currentUser
      });

      const { error } = await supabase
        .from('auth_users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update user');
        return false;
      }

      await refreshUsers();
      
      // Update current user if it's the same user
      if (currentUser && currentUser.id === userId) {
        const updatedUser = {
          ...currentUser,
          ...userData,
          role: userData.role || currentUser.role,
          isAdmin: userData.role === 'admin'
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify({
          ...updatedUser,
          loginTime: Date.now(),
          sessionTimeout: 24 * 60 * 60 * 1000
        }));
      }

      toast.success('User updated successfully');
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Failed to update user');
      return false;
    }
  };

  const addUser = async (userData: { username: string; password: string; isAdmin: boolean; role?: string; title?: string }): Promise<boolean> => {
    try {
      if (!currentUser?.isAdmin) {
        toast.error('Only administrators can add users');
        return false;
      }

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
        console.error('Add user error:', error);
        toast.error('Failed to add user');
        return false;
      }

      toast.success('User added successfully');
      await refreshUsers();
      return true;
    } catch (error) {
      console.error('Add user error:', error);
      toast.error('Failed to add user');
      return false;
    }
  };

  const removeUser = async (userId: string): Promise<boolean> => {
    try {
      if (!currentUser?.isAdmin) {
        toast.error('Only administrators can remove users');
        return false;
      }

      if (currentUser.id === userId) {
        toast.error('Cannot delete your own account');
        return false;
      }

      const { error } = await supabase
        .from('auth_users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Remove user error:', error);
        toast.error('Failed to remove user');
        return false;
      }

      toast.success('User removed successfully');
      await refreshUsers();
      return true;
    } catch (error) {
      console.error('Remove user error:', error);
      toast.error('Failed to remove user');
      return false;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const sessionData = JSON.parse(storedUser);
          const now = Date.now();
          const sessionAge = now - (sessionData.loginTime || 0);
          const timeout = sessionData.sessionTimeout || 24 * 60 * 60 * 1000;

          if (sessionAge <= timeout) {
            // Verify the user still exists in the database
            const { data: dbUser, error } = await supabase
              .from('auth_users')
              .select('*')
              .eq('id', sessionData.id)
              .single();

            if (error || !dbUser) {
              console.error('Failed to verify user in database:', error);
              localStorage.removeItem('currentUser');
              setIsAuthenticated(false);
              return;
            }

            console.log('Session restoration - DB user data:', dbUser);

            const user: AuthUser = {
              id: dbUser.id,
              username: dbUser.username,
              role: dbUser.is_admin ? 'admin' : (dbUser.role as 'senior' | 'operator' || 'operator'),
              isAdmin: dbUser.is_admin,
              title: dbUser.title,
              created_at: dbUser.created_at
            };

            console.log('Session restoration - Constructed user:', user);

            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            console.log('Session expired:', { sessionAge, timeout });
            localStorage.removeItem('currentUser');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        localStorage.removeItem('currentUser');
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  // Auto-refresh users when authentication status changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      refreshUsers();
    }
  }, [isAuthenticated, currentUser?.id]);

  const value = {
    currentUser,
    users,
    isAuthenticated,
    isAdmin,
    isSenior,
    canCompleteTask,
    canAddUser,
    canAccessSettings,
    login,
    logout,
    refreshUsers,
    updateUser,
    addUser,
    removeUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
