
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  addUser: (user: Omit<User, "id">) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  users: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    
    // Create admin user if it doesn't exist
    checkAndCreateAdminUser();
  }, []);

  // Check for current session on component mount
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // If session exists, fetch the user from the database
          await fetchCurrentUser();
        } else {
          setCurrentUser(null);
        }
        setIsLoading(false);
      }
    );

    // Initial session check
    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // This function will check if admin user exists and create it if not
  const checkAndCreateAdminUser = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', 'admin')
        .single();
      
      if (error || !data) {
        console.log("Admin user doesn't exist, creating it...");
        // Create the admin user
        const { error: insertError } = await supabase
          .from('auth_users')
          .insert([
            { 
              username: 'admin', 
              password: 'admin123',
              is_admin: true
            }
          ]);
        
        if (insertError) {
          console.error("Error creating admin user:", insertError);
        } else {
          console.log("Admin user created successfully");
          await fetchUsers(); // Refresh users list
        }
      }
    } catch (error) {
      console.error("Error checking for admin user:", error);
    }
  };

  const checkSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await fetchCurrentUser();
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error checking session:", error);
      setIsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData, error } = await supabase
          .from('auth_users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(null);
          return;
        }

        if (userData) {
          setCurrentUser({
            id: userData.id,
            username: userData.username,
            password: userData.password, // Note: In production, you should not expose passwords
            isAdmin: userData.is_admin
          });
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*');

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      const formattedUsers: User[] = data.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password, // Note: In production, you should not expose passwords
        isAdmin: user.is_admin
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log(`Attempting login with username: ${username}`);
      
      // First, check if the user exists in auth_users table
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (userError) {
        console.error("Error fetching user:", userError);
        return false;
      }

      // If user doesn't exist
      if (!userData) {
        console.error("User not found");
        return false;
      }
      
      console.log("Found user data:", userData.username);
      
      // Check if password matches
      if (userData.password !== password) {
        console.error("Invalid password");
        return false;
      }
      
      console.log("Password matched, proceeding with auth");

      // Admin user - direct login without Supabase Auth
      if (username === 'admin' && password === 'admin123') {
        setCurrentUser({
          id: userData.id,
          username: userData.username,
          password: userData.password,
          isAdmin: userData.is_admin
        });
        return true;
      }

      // For other users, use Supabase Auth
      try {
        // If credentials are valid, try to sign in with Supabase Auth
        const { error } = await supabase.auth.signInWithPassword({
          email: `${username}@example.com`, // Using username as email for Supabase auth
          password: password,
        });

        if (error) {
          console.error("Error signing in with Supabase:", error);
          
          // If user exists in our custom table but not in auth, register them
          if (error.message.includes("Invalid login credentials")) {
            const { error: signUpError } = await supabase.auth.signUp({
              email: `${username}@example.com`,
              password: password,
              options: {
                data: {
                  username: username,
                  is_admin: userData.is_admin
                }
              }
            });

            if (signUpError) {
              console.error("Error signing up user:", signUpError);
              return false;
            }

            // Try signing in again
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email: `${username}@example.com`,
              password: password,
            });

            if (retryError) {
              console.error("Error signing in after registration:", retryError);
              return false;
            }
          } else {
            return false;
          }
        }
      } catch (authError) {
        console.error("Auth error:", authError);
        // Fallback to direct login if Supabase auth fails
        setCurrentUser({
          id: userData.id,
          username: userData.username,
          password: userData.password,
          isAdmin: userData.is_admin
        });
        return true;
      }

      // Set current user after successful login
      setCurrentUser({
        id: userData.id,
        username: userData.username,
        password: userData.password,
        isAdmin: userData.is_admin
      });

      return true;
    } catch (error) {
      console.error("Error during login:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const addUser = async (user: Omit<User, "id">) => {
    try {
      // First, create user in auth_users table
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .insert([
          { 
            username: user.username,
            password: user.password,
            is_admin: user.isAdmin
          }
        ])
        .select();

      if (userError) {
        console.error("Error adding user to auth_users:", userError);
        return;
      }

      // Then, create user in Supabase Auth (if needed)
      const { error: signUpError } = await supabase.auth.signUp({
        email: `${user.username}@example.com`,
        password: user.password,
        options: {
          data: {
            username: user.username,
            is_admin: user.isAdmin
          }
        }
      });

      if (signUpError) {
        console.error("Error adding user to Supabase Auth:", signUpError);
      }

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const removeUser = async (userId: string) => {
    try {
      // Delete from auth_users table
      const { error } = await supabase
        .from('auth_users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error("Error removing user:", error);
        return;
      }

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    addUser,
    removeUser,
    users,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
