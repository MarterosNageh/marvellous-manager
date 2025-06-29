import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fetchToken } from "../../../notification";
import { supabase } from "@/integrations/supabase/client";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const saveTokenToDatabase = async (userId: string, token: string) => {
    try {
      // Get device information
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        vendor: navigator.vendor,
        appVersion: navigator.appVersion,
        timestamp: new Date().toISOString()
      };

      console.log('📱 Saving FCM token to database:', {
        userId,
        tokenLength: token.length,
        deviceInfo,
      });

      // First, check if this token already exists for this user
      const { data: existingTokens } = await supabase
        .from('fcm_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('fcm_token', token);

      if (existingTokens && existingTokens.length > 0) {
        console.log('✅ Token already exists for this user, updating last seen');
        
        // Update the existing token record
        const { error: updateError } = await supabase
          .from('fcm_tokens')
          .update({ 
            updated_at: new Date().toISOString(),
            is_active: true,
            device_info: deviceInfo
          })
          .eq('id', existingTokens[0].id);

        if (updateError) {
          console.error('❌ Error updating FCM token:', updateError);
        } else {
          console.log('✅ FCM token updated successfully');
        }
      } else {
        // Insert a new token record
        const { error: insertError } = await supabase
          .from('fcm_tokens')
          .insert([
            {
              user_id: userId,
              fcm_token: token,
              device_info: deviceInfo,
              is_active: true
            }
          ]);

        if (insertError) {
          console.error('❌ Error inserting FCM token:', insertError);
        } else {
          console.log('✅ FCM token saved successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
  };

  const initializeNotifications = async (userId: string) => {
    try {
      const token = await fetchToken();
      if (token) {
        console.log('FCM token obtained after login:', token.slice(0, 10) + '...');
        await saveTokenToDatabase(userId, token);
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
        // Get the current user from localStorage to get their ID
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          // Initialize notifications after successful login
          await initializeNotifications(user.id);
        }
        
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
