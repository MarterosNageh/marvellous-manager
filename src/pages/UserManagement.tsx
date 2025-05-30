
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, User, UserPlus } from "lucide-react";
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
    role: "operator",
    title: ""
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast.error("Username and password are required");
      return;
    }

    // Check if username already exists
    if (users.some(user => user.username === newUser.username)) {
      toast.error("Username already exists");
      return;
    }
    
    setIsLoading(true);
    try {
      await addUser(newUser);
      setNewUser({
        username: "",
        password: "",
        isAdmin: false,
        role: "operator",
        title: ""
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setIsLoading(true);
    try {
      await removeUser(userId);
    } catch (error) {
      console.error("Error removing user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string, isAdmin: boolean) => {
    if (isAdmin) {
      return <Badge variant="destructive">Admin</Badge>;
    }
    switch (role) {
      case 'manager':
        return <Badge variant="default">Manager</Badge>;
      case 'operator':
        return <Badge variant="secondary">Operator</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRolePermissions = (role: string, isAdmin: boolean) => {
    if (isAdmin) {
      return "Full system access, can manage all users, tasks, and data";
    }
    switch (role) {
      case 'manager':
        return "Can complete tasks, approve requests, manage team schedules";
      case 'operator':
        return "Can view schedules, submit requests, edit own tasks, view dashboard";
      default:
        return "Basic user permissions";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
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
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser(prev => ({
                        ...prev,
                        username: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
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
                        role: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
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
                    <label htmlFor="isAdmin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Operator</Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View team schedules</li>
                  <li>• Submit requests</li>
                  <li>• Edit own tasks only</li>
                  <li>• View dashboard</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">Manager</Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All operator permissions</li>
                  <li>• Complete any task</li>
                  <li>• Approve/reject requests</li>
                  <li>• Manage team schedules</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive">Admin</Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All manager permissions</li>
                  <li>• User management</li>
                  <li>• System configuration</li>
                  <li>• Full data access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
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
                        {user.username}{" "}
                        {currentUser?.id === user.id && "(Current)"}
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
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the user account for {user.username}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveUser(user.id)}
                                  disabled={isLoading}
                                >
                                  Delete
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
