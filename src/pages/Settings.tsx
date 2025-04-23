
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Settings as SettingsIcon, User, Bell, Shield } from "lucide-react";
import Image from "@/components/ui/image";
import { useDarkMode } from "@/hooks/use-dark-mode";
import UserManagement from "./UserManagement";

const Settings = () => {
  const { currentUser } = useAuth();
  const isDarkMode = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  if (!currentUser?.isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Manage your application's general settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Company Information</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input id="company-name" placeholder="Company Name" defaultValue="Marvellous Inc." />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company-email">Company Email</Label>
                      <Input id="company-email" type="email" placeholder="email@company.com" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company-address">Company Address</Label>
                    <Textarea id="company-address" placeholder="Enter your company address" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <Image 
                        src={isDarkMode ? "/logo-marvellous-white.png" : "/logo-marvellous-black.png"} 
                        alt="Company Logo" 
                        className="h-12 w-auto"
                      />
                      <Button variant="outline" size="sm">Change Logo</Button>
                    </div>
                  </div>
                </div>
                
                <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md p-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-between w-full p-2">
                      <span>Advanced Settings</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "transform rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable Debug Mode</p>
                        <p className="text-sm text-muted-foreground">
                          Displays additional information for debugging purposes
                        </p>
                      </div>
                      <Switch id="debug-mode" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Maintenance Mode</p>
                        <p className="text-sm text-muted-foreground">
                          Only administrators can access the application
                        </p>
                      </div>
                      <Switch id="maintenance-mode" />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Manage notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={notificationsEnabled} 
                    onCheckedChange={setNotificationsEnabled} 
                  />
                </div>
                
                {notificationsEnabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="new-project-notification">New Project Created</Label>
                      <Switch id="new-project-notification" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hard-drive-notification">Hard Drive Status Changed</Label>
                      <Switch id="hard-drive-notification" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="user-notification">User Account Changes</Label>
                      <Switch id="user-notification" defaultChecked />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage security preferences for your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Password Policy</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require Strong Passwords</p>
                      <p className="text-sm text-muted-foreground">
                        Users must create passwords with numbers, symbols, and mixed case
                      </p>
                    </div>
                    <Switch id="strong-password" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Password Expiration</p>
                      <p className="text-sm text-muted-foreground">
                        Users must change their password every 90 days
                      </p>
                    </div>
                    <Switch id="password-expiry" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for all administrator accounts
                      </p>
                    </div>
                    <Switch id="require-2fa" />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="destructive">
                    Reset All Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
