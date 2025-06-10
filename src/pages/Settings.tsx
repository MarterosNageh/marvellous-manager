import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth, AuthUser } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Crown, UserCog, Edit, Users } from "lucide-react";
import { toast } from "sonner";

interface SelectedUser {
  id: string;
  username: string;
  role: 'admin' | 'senior' | 'operator';
  isAdmin: boolean;
  title?: string;
}

const Settings = () => {
  const { currentUser, users, updateUser, isAdmin } = useAuth();
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'senior' | 'operator'>('operator');
  const [selectedTitle, setSelectedTitle] = useState("");

  // Reset form when dialog opens/closes
  const handleDialogChange = (open: boolean) => {
    if (open === false) {
      setSelectedUser(null);
      setSelectedRole('operator');
      setSelectedTitle("");
    }
    setIsEditUserOpen(open);
  };

  // Initialize form when selecting a user
  const handleSelectUser = (user: SelectedUser) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedTitle(user.title || "");
    setIsEditUserOpen(true);
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'senior' | 'operator', newTitle?: string) => {
    try {
      if (!selectedUser) return;

      const updateData: any = {};
      
      // Only include role in update if it's different from current
      if (newRole !== selectedUser.role) {
        updateData.role = newRole;
      }
      
      // Only include title in update if it's different from current
      if (newTitle !== selectedUser.title) {
        updateData.title = newTitle;
      }
      
      // Only proceed with update if there are changes
      if (Object.keys(updateData).length > 0) {
        const success = await updateUser(userId, updateData);
      
      if (success) {
          toast.success("User information updated successfully");
          handleDialogChange(false);
        }
      } else {
        handleDialogChange(false);
      }
    } catch (error) {
      toast.error("Failed to update user information");
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
        
        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid grid-cols-2 mb-8">
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
            )}
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
          </TabsList>
          
          {isAdmin && (
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
                      {users.map(user => {
                        const RoleIcon = getRoleIcon(user.role || (user.isAdmin ? 'admin' : 'operator'));
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
                              <Badge variant={getRoleBadgeVariant(user.role || (user.isAdmin ? 'admin' : 'operator'))}>
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {user.role || (user.isAdmin ? 'Admin' : 'Operator')}
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
                                  handleSelectUser(user as SelectedUser);
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
          )}

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
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Crown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          Administrator
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
                          <li>• Full system access</li>
                          <li>• User management (add, edit, remove)</li>
                          <li>• Can set user roles</li>
                          <li>• Access to all settings</li>
                          <li>• Complete task management</li>
                          <li>• View all analytics and reports</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          Senior
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                          <li>• Can complete tasks</li>
                          <li>• Can add users (without role setting)</li>
                          <li>• Limited user management</li>
                          <li>• No settings access</li>
                          <li>• View team analytics</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          Operator
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                          <li>• View assigned tasks</li>
                          <li>• Cannot complete tasks</li>
                          <li>• No user management</li>
                          <li>• No settings access</li>
                          <li>• Basic viewing permissions</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={handleDialogChange}>
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
                <Select 
                  value={selectedRole}
                  onValueChange={(value: 'admin' | 'senior' | 'operator') => setSelectedRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={selectedTitle}
                  placeholder="e.g., Senior Developer, Team Lead"
                  onChange={(e) => setSelectedTitle(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={() => {
                  if (selectedUser) {
                    handleUpdateUserRole(selectedUser.id, selectedRole, selectedTitle);
                  }
                }}
              >
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
