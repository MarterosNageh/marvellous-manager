
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/user';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        const storedUserId = localStorage.getItem('currentUserId');
        if (storedUserId) {
          const { data: userData, error } = await supabase
            .from('auth_users')
            .select('*')
            .eq('id', storedUserId)
            .single();

          if (error) {
            console.error('Error fetching user:', error);
            localStorage.removeItem('currentUserId');
          } else if (userData) {
            const user: User = {
              id: userData.id,
              username: userData.username,
              role: userData.role as 'admin' | 'senior' | 'operator' | 'producer',
              isAdmin: userData.is_admin,
              team: userData.team_name || undefined,
              title: userData.title || undefined,
              created_at: userData.created_at,
            };
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        localStorage.removeItem('currentUserId');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { data: userData, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !userData) {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive"
        });
        return false;
      }

      const user: User = {
        id: userData.id,
        username: userData.username,
        role: userData.role as 'admin' | 'senior' | 'operator' | 'producer',
        isAdmin: userData.is_admin,
        team: userData.team_name || undefined,
        title: userData.title || undefined,
        created_at: userData.created_at,
      };

      setCurrentUser(user);
      localStorage.setItem('currentUserId', userData.id);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.username}!`
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setCurrentUser(null);
      localStorage.removeItem('currentUserId');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out"
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error", 
        description: "An error occurred during logout",
        variant: "destructive"
      });
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
