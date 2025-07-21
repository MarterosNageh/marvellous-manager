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
import { User, Crown, UserCog, Edit, Users, Plus, Shield } from "lucide-react";
import { toast } from "sonner";

interface SelectedUser {
  id: string;
  username: string;
  role: 'admin' | 'senior' | 'operator' | 'producer';
  isAdmin: boolean;
  title?: string;
}

const Settings = () => {
  const { currentUser, users, updateUser, isAdmin, addUser, removeUser } = useAuth();
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'senior' | 'operator' | 'producer'>('operator');
  const [selectedTitle, setSelectedTitle] = useState("");
  // Add User dialog state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    isAdmin: false,
    role: "operator" as 'admin' | 'senior' | 'operator' | 'producer',
    title: ""
  });
  const [isAddUserLoading, setIsAddUserLoading] = useState(false);
  const [editUserUsername, setEditUserUsername] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");

  // Reset form when dialog opens/closes
  const handleDialogChange = (open: boolean) => {
    if (open === false) {
      setSelectedUser(null);
      setSelectedRole('operator');
      setSelectedTitle("");
      setEditUserUsername("");
      setEditUserPassword("");
    }
    setIsEditUserOpen(open);
  };

  // Initialize form when selecting a user
  const handleSelectUser = (user: SelectedUser) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedTitle(user.title || "");
    setEditUserUsername(user.username);
    setEditUserPassword("");
    setIsEditUserOpen(true);
  };

  const handleUpdateUserRole = async (
    userId: string,
    newRole: 'admin' | 'senior' | 'operator' | 'producer',
    newTitle?: string
  ) => {
    try {
      if (!selectedUser) return;

      const updateData: any = {};

      if (editUserUsername && editUserUsername !== selectedUser.username) {
        updateData.username = editUserUsername;
      }
      if (editUserPassword && editUserPassword.length >= 6) {
        updateData.password = editUserPassword;
      }
      if (newRole !== selectedUser.role) {
        updateData.role = newRole;
      }
      if (newTitle !== selectedUser.title) {
        updateData.title = newTitle;
      }

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

  const handleAddUser = async () => {
    if (!currentUser?.isAdmin) {
      toast.error("Only administrators can add users");
      return;
    }
    if (!newUser.username || !newUser.password) {
      toast.error("Username and password are required");
      return;
    }
    if (newUser.username.length < 3) {
      toast.error("Username must be at least 3 characters long");
      return;
    }
    if (newUser.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (users.some(user => user.username.toLowerCase() === newUser.username.toLowerCase())) {
      toast.error("Username already exists");
      return;
    }
    setIsAddUserLoading(true);
    try {
      const success = await addUser(newUser);
      if (success) {
        setNewUser({
          username: "",
          password: "",
          isAdmin: false,
          role: "operator",
          title: ""
        });
        setIsAddUserOpen(false);
      }
    } catch (error) {
      toast.error("Failed to add user");
    } finally {
      setIsAddUserLoading(false);
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
                  <div className="flex justify-end mb-4">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg text-lg flex items-center" onClick={() => setIsAddUserOpen(true)}>
                      <Plus className="mr-2 h-5 w-5" />
                      Add User
                    </Button>
                  </div>
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
                              {isAdmin && currentUser?.id !== user.id && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="ml-2"
                                  onClick={async () => {
                                    if (window.confirm(`Are you sure you want to delete user '${user.username}'? This action cannot be undone.`)) {
                                      const success = await removeUser(user.id);
                                      if (success) {
                                        toast.success(`User '${user.username}' deleted successfully`);
                                      }
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              {/* Add User Dialog */}
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent className="max-w-md w-full">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account with specific role and permissions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        placeholder="Enter username (min 3 characters)"
                        onChange={(e) => setNewUser(prev => ({
                          ...prev,
                          username: e.target.value
                        }))}
                      />
                      <p className="text-xs text-gray-500">Must be unique and at least 3 characters.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        placeholder="Enter password (min 6 characters)"
                        onChange={(e) => setNewUser(prev => ({
                          ...prev,
                          password: e.target.value
                        }))}
                      />
                      <p className="text-xs text-gray-500">At least 6 characters. (Passwords are stored as plain text!)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title (Optional)</Label>
                      <Input
                        id="title"
                        value={newUser.title}
                        placeholder="e.g., Senior Developer, Team Lead"
                        onChange={(e) => setNewUser(prev => ({
                          ...prev,
                          title: e.target.value
                        }))}
                      />
                      <p className="text-xs text-gray-500">User's job title or description.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(value) => setNewUser(prev => ({
                          ...prev,
                          role: value as 'admin' | 'senior' | 'operator' | 'producer'
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operator">Operator</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="producer">Producer</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {newUser.isAdmin ? (
                          <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-red-500" />Full system access, can manage all users, tasks, and data</span>
                        ) : newUser.role === 'senior' ? "Can complete tasks, add users (without role setting), manage team schedules"
                          : newUser.role === 'operator' ? "Can view schedules, submit requests, view tasks (no completion)"
                          : newUser.role === 'producer' ? "Can view hard drives (read-only), create tasks (no assignments)"
                          : "Basic user permissions"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAdmin"
                        checked={newUser.isAdmin}
                        onChange={(e) => setNewUser(prev => ({
                          ...prev,
                          isAdmin: e.target.checked
                        }))}
                        className="accent-red-600 h-4 w-4"
                      />
                      <label htmlFor="isAdmin" className="text-sm font-medium leading-none flex items-center gap-1">
                        <Shield className="h-3 w-3 text-red-500" />
                        Admin User (Full System Access)
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddUser} disabled={isAddUserLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                      {isAddUserLoading ? "Adding..." : "Add User"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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

                    <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          Producer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-purple-700 dark:text-purple-300">
                          <li>• View hard drives (read-only)</li>
                          <li>• Create tasks (no assignments)</li>
                          <li>• No user management</li>
                          <li>• No settings access</li>
                          <li>• Limited system access</li>
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
                <Label>Username</Label>
                <Input
                  value={editUserUsername}
                  placeholder="Enter username"
                  onChange={(e) => setEditUserUsername(e.target.value)}
                />
                <p className="text-xs text-gray-500">Must be unique and at least 3 characters.</p>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={editUserPassword}
                  placeholder="Leave blank to keep current password"
                  onChange={(e) => setEditUserPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500">At least 6 characters. Leave blank to keep unchanged.</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={selectedRole}
                  onValueChange={(value: 'admin' | 'senior' | 'operator' | 'producer') => setSelectedRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="producer">Producer</SelectItem>
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
