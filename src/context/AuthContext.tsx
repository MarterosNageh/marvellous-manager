import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'senior' | 'operator' | 'producer';
  isAdmin: boolean;
  title?: string;
  created_at?: string;
  password?: string; // Add password as optional for updateUser
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  users: AuthUser[];
  isAuthenticated: boolean | null;
  isAdmin: boolean;
  isSenior: boolean;
  isProducer: boolean;
  canCompleteTask: boolean;
  canAddUser: boolean;
  canAccessSettings: boolean;
  canCreateTask: boolean;
  canViewHardDrives: boolean;
  canEditHardDrives: boolean;
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
  isProducer: false,
  canCompleteTask: false,
  canAddUser: false,
  canAccessSettings: false,
  canCreateTask: false,
  canViewHardDrives: true,
  canEditHardDrives: false,
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
  const isProducer = currentUser?.role === 'producer';
  const canCompleteTask = isAdmin || isSenior;
  const canAddUser = isAdmin || isSenior;
  const canAccessSettings = isAdmin || isSenior;
  const canCreateTask = isAdmin || isSenior || isProducer;
  const canViewHardDrives = true; // All authenticated users can view hard drives
  const canEditHardDrives = isAdmin || isSenior; // Only admin and senior can edit hard drives

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
        role: user.is_admin ? 'admin' : (user.role as 'senior' | 'operator' | 'producer' || 'operator'),
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
      console.log('Attempting login with username:', username);
      
      // First, check if the user exists
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        toast.error('Error during login. Please try again.');
        return false;
      }

      if (!userData) {
        console.error('User not found:', username);
        toast.error('Invalid username or password');
        return false;
      }

      // Then check the password
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error) {
        console.error('Login error:', error);
        toast.error('Error during login. Please try again.');
        return false;
      }

      if (!data) {
        console.error('Invalid password for user:', username);
        toast.error('Invalid username or password');
        return false;
      }

      const user: AuthUser = {
        id: data.id,
        username: data.username,
        role: data.is_admin ? 'admin' : (data.role as 'senior' | 'operator' | 'producer' || 'operator'),
        isAdmin: data.is_admin,
        title: data.title,
        created_at: data.created_at
      };

      console.log('Login successful:', {
        username: user.username,
        role: user.role,
        isAdmin: user.isAdmin
      });

      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Store user session in localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      toast.success('Login successful');
      return true;
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
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

      // Get current user data first
      const { data: currentData, error: fetchError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching current user data:', fetchError);
        toast.error('Failed to update user');
        return false;
      }

      const updateData: any = {};

      // Only include fields that are actually changing
      if (userData.role !== undefined && userData.role !== currentData.role) {
        updateData.role = userData.role;
        updateData.is_admin = userData.role === 'admin';
      }

      if (userData.title !== undefined && userData.title !== currentData.title) {
        updateData.title = userData.title;
      }

      // Add password update support
      if (userData.password !== undefined && userData.password.length >= 6 && userData.password !== currentData.password) {
        updateData.password = userData.password;
      }

      // If no changes to make, return early
      if (Object.keys(updateData).length === 0) {
        return true;
      }

      console.log('Current user data from DB:', currentData);
      console.log('User data from UI:', userData);
      console.log('Update data to be sent to Supabase:', updateData);

      const { error: updateError } = await supabase
        .from('auth_users')
        .update(updateData)
        .eq('id', userId);

      console.log('Supabase update response error:', updateError);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error('Failed to update user');
        return false;
      }

      await refreshUsers();
      
      // Update current user if it's the same user
      if (currentUser && currentUser.id === userId) {
        const updatedUser = {
          ...currentUser,
          ...updateData,
          role: updateData.role || currentUser.role,
          isAdmin: updateData.is_admin !== undefined ? updateData.is_admin : currentUser.isAdmin,
          title: updateData.title !== undefined ? updateData.title : currentUser.title
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

          const user: AuthUser = {
            id: dbUser.id,
            username: dbUser.username,
            role: dbUser.is_admin ? 'admin' : (dbUser.role as 'senior' | 'operator' | 'producer' || 'operator'),
            isAdmin: dbUser.is_admin,
            title: dbUser.title,
            created_at: dbUser.created_at
          };

          setCurrentUser(user);
          setIsAuthenticated(true);
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

  // Check and create default admin user if no users exist
  const ensureDefaultAdmin = async () => {
    try {
      // Check if any users exist
      const { data: users, error: countError } = await supabase
        .from('auth_users')
        .select('*');

      if (countError) {
        console.error('Error checking users:', countError);
        return;
      }

      if (!users || users.length === 0) {
        console.log('No users found, creating default admin user...');
        
        // Create default admin user
        const { error: createError } = await supabase
          .from('auth_users')
          .insert([
            {
              username: 'admin',
              password: 'admin123', // You should change this immediately
              is_admin: true,
              role: 'admin',
              title: 'System Administrator'
            }
          ]);

        if (createError) {
          console.error('Error creating default admin:', createError);
          return;
        }

        console.log('Default admin user created successfully');
        toast.success('Default admin user created. Username: admin, Password: admin123');
      } else {
        console.log('Users exist in database:', users.length);
      }
    } catch (error) {
      console.error('Error in ensureDefaultAdmin:', error);
    }
  };

  // Call ensureDefaultAdmin when the AuthProvider mounts
  useEffect(() => {
    ensureDefaultAdmin();
  }, []);

  const value = {
    currentUser,
    users,
    isAuthenticated,
    isAdmin,
    isSenior,
    isProducer,
    canCompleteTask,
    canAddUser,
    canAccessSettings,
    canCreateTask,
    canViewHardDrives,
    canEditHardDrives,
    login,
    logout,
    refreshUsers,
    updateUser,
    addUser,
    removeUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
