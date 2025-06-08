
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
  isAuthenticated: boolean | null;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          // Verify the user still exists in the database
          const { data: dbUser, error } = await supabase
            .from('auth_users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error || !dbUser) {
            // User no longer exists, clear session
            localStorage.removeItem('currentUser');
            setIsAuthenticated(false);
            return;
          }

          // Set JWT claims for RLS to work
          await supabase.rpc('set_claim', {
            uid: user.id,
            claim: 'username',
            value: user.username
          }).catch(() => {
            // Fallback: set in local storage for RLS functions
            localStorage.setItem('current_username', user.username);
          });

          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, []);

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

      const user: User = {
        id: data.id,
        username: data.username,
        isAdmin: data.is_admin,
        role: data.role,
        title: data.title,
        created_at: data.created_at
      };

      // Set JWT claims for RLS to work
      await supabase.rpc('set_claim', {
        uid: user.id,
        claim: 'username',
        value: user.username
      }).catch(() => {
        // Fallback: set in local storage for RLS functions
        localStorage.setItem('current_username', user.username);
      });

      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Store user session in localStorage with timestamp for security
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
    
    // Clear any JWT claims
    supabase.rpc('set_claim', {
      uid: null,
      claim: 'username',
      value: null
    }).catch(() => {
      // Silent fail for cleanup
    });
    
    toast.success('Logged out successfully');
  };

  const refreshUsers = async () => {
    try {
      if (!currentUser?.isAdmin && currentUser?.role !== 'manager') {
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
      toast.error('Failed to refresh users');
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
    try {
      // Check authorization
      if (!currentUser?.isAdmin && currentUser?.id !== userId) {
        toast.error('Unauthorized to update this user');
        return false;
      }

      const updateData: any = {};
      
      if (userData.username) updateData.username = userData.username;
      if (userData.isAdmin !== undefined) updateData.is_admin = userData.isAdmin;
      if (userData.role) updateData.role = userData.role;
      if (userData.title !== undefined) updateData.title = userData.title;

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
        const updatedUser = { ...currentUser, ...userData };
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
      // Check authorization
      if (!currentUser?.isAdmin) {
        toast.error('Only administrators can add users');
        return false;
      }

      // Input validation
      if (!userData.username || userData.username.length < 3) {
        toast.error('Username must be at least 3 characters long');
        return false;
      }

      if (!userData.password || userData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
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
        if (error.code === '23505') {
          toast.error('Username already exists');
        } else {
          console.error('Add user error:', error);
          toast.error('Failed to add user');
        }
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
      // Check authorization
      if (!currentUser?.isAdmin) {
        toast.error('Only administrators can remove users');
        return false;
      }

      // Prevent self-deletion
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

  // Auto-refresh users when authentication status changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      refreshUsers();
    }
  }, [isAuthenticated, currentUser?.id]);

  // Session timeout check
  useEffect(() => {
    const checkSessionTimeout = () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser && isAuthenticated) {
        try {
          const sessionData = JSON.parse(storedUser);
          const now = Date.now();
          const sessionAge = now - (sessionData.loginTime || 0);
          const timeout = sessionData.sessionTimeout || 24 * 60 * 60 * 1000;

          if (sessionAge > timeout) {
            toast.warning('Session expired. Please log in again.');
            logout();
          }
        } catch (error) {
          console.error('Session validation error:', error);
          logout();
        }
      }
    };

    // Check session timeout every 5 minutes
    const interval = setInterval(checkSessionTimeout, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
