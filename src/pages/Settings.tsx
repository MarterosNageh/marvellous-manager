
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, Settings as SettingsIcon, User, Bell, Shield, Users, Crown, UserCog, Edit } from "lucide-react";
import Image from "@/components/ui/image";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { toast } from "sonner";

const Settings = () => {
  const { currentUser, users, updateUser } = useAuth();
  const isDarkMode = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  if (!currentUser?.isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  const handleUpdateUserRole = async (userId: string, newRole: string, newTitle?: string) => {
    try {
      await updateUser(userId, { 
        role: newRole, 
        title: newTitle 
      });
      toast.success("User role updated successfully");
      setIsEditUserOpen(false);
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'supervisor': return 'secondary';
      case 'employee': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown;
      case 'manager': return UserCog;
      case 'supervisor': return User;
      default: return User;
    }
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Roles & Permissions
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
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and their basic information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const RoleIcon = getRoleIcon(user.role || (user.isAdmin ? 'admin' : 'employee'));
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{user.username}</p>
                                <p className="text-sm text-muted-foreground">
                                  {currentUser?.id === user.id && "(Current User)"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role || (user.isAdmin ? 'admin' : 'employee'))}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {user.role || (user.isAdmin ? 'Admin' : 'Employee')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{user.title || 'Not Set'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Active</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditUserOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role Definitions</CardTitle>
                  <CardDescription>
                    Define roles and their permissions across the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Crown className="h-4 w-4 text-red-600" />
                          Administrator
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-red-700">
                          <li>• Full system access</li>
                          <li>• User management</li>
                          <li>• System settings</li>
                          <li>• All shift management</li>
                          <li>• Analytics and reports</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-blue-600" />
                          Manager
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-blue-700">
                          <li>• Team management</li>
                          <li>• Shift scheduling</li>
                          <li>• Approve requests</li>
                          <li>• View analytics</li>
                          <li>• Task assignment</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-green-600" />
                          Supervisor
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-green-700">
                          <li>• View team schedules</li>
                          <li>• Submit shift requests</li>
                          <li>• Manage own tasks</li>
                          <li>• Limited reporting</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-gray-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          Employee
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>• View own schedule</li>
                          <li>• Submit requests</li>
                          <li>• Track own tasks</li>
                          <li>• Basic dashboard access</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                      <Label htmlFor="shift-notifications">Shift Updates</Label>
                      <Switch id="shift-notifications" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="request-notifications">Request Approvals</Label>
                      <Switch id="request-notifications" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="task-notifications">Task Assignments</Label>
                      <Switch id="task-notifications" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="user-notifications">User Account Changes</Label>
                      <Switch id="user-notifications" defaultChecked />
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

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role & Title</DialogTitle>
              <DialogDescription>
                Update {selectedUser?.username}'s role and title
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select defaultValue={selectedUser?.role || (selectedUser?.isAdmin ? 'admin' : 'employee')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  defaultValue={selectedUser?.title || ''}
                  placeholder="e.g., Senior Developer, Team Lead"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateUserRole(selectedUser?.id, 'manager', 'Team Lead')}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Settings;
