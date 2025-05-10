import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  // Initialize - check for stored user first before any other operations
  useEffect(() => {
    const initializeAuth = async () => {
      // First check for stored user in localStorage to restore session
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          console.log("Session restored from localStorage:", parsedUser.username);
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('currentUser');
      }

      // Then fetch users and check/create admin user
      await fetchUsers();
      await checkAndCreateAdminUser();
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // This function will check if admin user exists and create it if not
  const checkAndCreateAdminUser = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error("Error checking for admin user:", error);
        return;
      }
      
      if (!data) {
        console.log("Admin user doesn't exist, creating it...");
        // Create the admin user
        const { data: insertData, error: insertError } = await supabase
          .from('auth_users')
          .insert([
            { 
              username: 'admin', 
              password: 'admin123',
              is_admin: true
            }
          ])
          .select();
        
        if (insertError) {
          console.error("Error creating admin user:", insertError);
          toast.error("Failed to create admin user. Please check the console for details.");
        } else {
          console.log("Admin user created successfully");
          await fetchUsers(); // Refresh users list
        }
      } else {
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
          .maybeSingle();

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
      
      // Direct database login without going through Supabase Auth for simplicity
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
      
      console.log("Password matched, setting current user");

      // Set current user without using Supabase Auth
      const user = {
        id: userData.id,
        username: userData.username,
        password: userData.password,
        isAdmin: userData.is_admin
      };
      
      setCurrentUser(user);
      
      // Store user in localStorage for session persistence
      localStorage.setItem('currentUser', JSON.stringify(user));

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
      // Clear authentication state from localStorage
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const addUser = async (user: Omit<User, "id">) => {
    try {
      console.log("Adding user:", user);
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', user.username)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking existing user:", checkError);
        toast.error("Error checking if user already exists");
        return;
      }
      
      if (existingUser) {
        console.log("User already exists:", existingUser);
        toast.error("Username already exists");
        return;
      }

      // Create user in auth_users table
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .insert([
          { 
            username: user.username,
            password: user.password,
            is_admin: user.isAdmin
          }
        ])
        .select('*');

      if (userError) {
        console.error("Error adding user:", userError);
        toast.error("Failed to add user: " + userError.message);
        return;
      }
      
      console.log("User added successfully:", userData);
      toast.success(`User ${user.username} added successfully`);

      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user: " + error.message);
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
        toast.error("Failed to remove user: " + error.message);
        return;
      }

      toast.success("User removed successfully");
      
      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user: " + error.message);
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

  // Only render children when authentication is initialized
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
