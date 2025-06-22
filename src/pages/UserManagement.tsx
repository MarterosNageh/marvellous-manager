import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, User, Shield, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const UserManagement = () => {
  const {
    users,
    currentUser,
    addUser,
    removeUser
  } = useAuth();
  
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    isAdmin: false,
    role: "operator" as 'admin' | 'senior' | 'operator' | 'producer',
    title: ""
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Security check - only admins can access user management
  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      toast.error("Access denied. Administrator privileges required.");
    }
  }, [currentUser]);

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

    // Check if username already exists
    if (users.some(user => user.username.toLowerCase() === newUser.username.toLowerCase())) {
      toast.error("Username already exists");
      return;
    }
    
    setIsLoading(true);
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
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error("Failed to add user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!currentUser?.isAdmin) {
      toast.error("Only administrators can remove users");
      return;
    }

    if (currentUser.id === userId) {
      toast.error("Cannot delete your own account");
      return;
    }

    setIsLoading(true);
    try {
      await removeUser(userId);
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error("Failed to remove user");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string, isAdmin: boolean) => {
    if (isAdmin) {
      return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
    }
    switch (role) {
      case 'senior':
        return <Badge variant="default">Senior</Badge>;
      case 'operator':
        return <Badge variant="secondary">Operator</Badge>;
      case 'producer':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">Producer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRolePermissions = (role: string, isAdmin: boolean) => {
    if (isAdmin) {
      return "Full system access, can manage all users, tasks, and data";
    }
    switch (role) {
      case 'senior':
        return "Can complete tasks, add users (without role setting), manage team schedules";
      case 'operator':
        return "Can view schedules, submit requests, view tasks (no completion)";
      case 'producer':
        return "Can view hard drives (read-only), create tasks (no assignments)";
      default:
        return "Basic user permissions";
    }
  };

  // Security check - render access denied for non-admins
  if (!currentUser?.isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-600 mb-2">Access Denied</h3>
                <p className="text-gray-600 mb-4">
                  You need administrator privileges to access user management.
                </p>
                <p className="text-sm text-gray-500">
                  Contact your system administrator if you believe this is an error.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-gray-600">Manage system users and their permissions</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                      {getRolePermissions(newUser.role, newUser.isAdmin)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAdmin"
                      checked={newUser.isAdmin}
                      onCheckedChange={(checked) => setNewUser(prev => ({
                        ...prev,
                        isAdmin: !!checked
                      }))}
                    />
                    <label htmlFor="isAdmin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
                      <Shield className="h-3 w-3 text-red-500" />
                      Admin User (Full System Access)
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddUser} disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Role Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />Admin
                  </Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Full system access</li>
                  <li>• User management</li>
                  <li>• System configuration</li>
                  <li>• Role management</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">Senior</Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All operator permissions</li>
                  <li>• Complete any task</li>
                  <li>• Add new users</li>
                  <li>• Manage team schedules</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Operator</Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View team schedules</li>
                  <li>• Submit requests</li>
                  <li>• View tasks (no completion)</li>
                  <li>• View dashboard</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-purple-600 border-purple-600">Producer</Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View hard drives (read-only)</li>
                  <li>• Create tasks (no assignments)</li>
                  <li>• No user management</li>
                  <li>• No settings access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center p-6">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No users found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first user to get started.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.username}
                          {currentUser?.id === user.id && (
                            <Badge variant="outline" className="text-xs">Current</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role || 'operator', user.isAdmin)}
                      </TableCell>
                      <TableCell>
                        {user.title || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {getRolePermissions(user.role || 'operator', user.isAdmin)}
                      </TableCell>
                      <TableCell>
                        {currentUser?.id !== user.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={isLoading}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete User Account
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the user account for <strong>{user.username}</strong>.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveUser(user.id)}
                                  disabled={isLoading}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default UserManagement;
