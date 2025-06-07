import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fetchToken } from "../../../notification";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    login
  } = useAuth();
  const {
    toast
  } = useToast();

  const initializeNotifications = async () => {
    try {
      const token = await fetchToken();
      if (token) {
        console.log('FCM initialized successfully after login');
      }
    } catch (error) {
      console.error('Error initializing FCM:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      console.log(`Attempting login for user: ${username}`);
      const success = await login(username, password);
      
      if (success) {
        // Initialize notifications after successful login
        await initializeNotifications();
        
        toast({
          title: "Login Successful",
          description: "Welcome back!"
        });
      } else {
        console.error("Login failed");
        toast({
          title: "Login Failed",
          description: "Invalid username or password. Please check your credentials and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} />
          </div>
          
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </CardFooter>
      </form>
    </Card>;
};
export default LoginForm;