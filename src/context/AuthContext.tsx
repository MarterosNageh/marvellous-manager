
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  addUser: (user: Omit<User, "id">) => void;
  removeUser: (userId: string) => void;
  users: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAdminUser: User = {
  id: "admin-1",
  username: "admin",
  password: "admin123",
  isAdmin: true,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = localStorage.getItem("users");
    return storedUsers ? JSON.parse(storedUsers) : [defaultAdminUser];
  });
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || !session) {
          setCurrentUser(null);
          sessionStorage.removeItem("currentUser");
          toast({
            title: "Session Expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setCurrentUser(null);
        sessionStorage.removeItem("currentUser");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const login = (username: string, password: string): boolean => {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      
      // Removing the timeout that forces logout
      // The session will now persist until the browser is closed
      // or the user explicitly logs out
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem("currentUser");
  };

  const addUser = (user: Omit<User, "id">) => {
    const newUser = {
      ...user,
      id: `user-${Date.now()}`,
    };
    
    setUsers((prev) => [...prev, newUser]);
  };

  const removeUser = (userId: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
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
