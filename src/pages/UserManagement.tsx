
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, User, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

const UserManagement = () => {
  const { users, currentUser, addUser, removeUser } = useAuth();
  const { toast } = useToast();
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    isAdmin: false,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }
    
    // Check if username already exists
    if (users.some((user) => user.username === newUser.username)) {
      toast({
        title: "Error",
        description: "Username already exists",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await addUser(newUser);
      setNewUser({ username: "", password: "", isAdmin: false });
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "User added successfully",
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTestUser = async () => {
    setIsLoading(true);
    
    // Check if test user already exists
    if (users.some((user) => user.username === "test")) {
      toast({
        title: "Info",
        description: "Test user already exists",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      await addUser({
        username: "test",
        password: "test123",
        isAdmin: false,
      });
      
      toast({
        title: "Success",
        description: "Test user added successfully. Username: test, Password: test123",
      });
    } catch (error) {
      console.error("Error adding test user:", error);
      toast({
        title: "Error",
        description: "Failed to add test user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setIsLoading(true);
    
    try {
      await removeUser(userId);
      toast({
        title: "Success",
        description: "User removed successfully",
      });
    } catch (error) {
      console.error("Error removing user:", error);
      toast({
        title: "Error",
        description: "Failed to remove user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleAddTestUser} disabled={isLoading}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Test User
            </Button>
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
                    Create a new user account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAdmin"
                      checked={newUser.isAdmin}
                      onCheckedChange={(checked) =>
                        setNewUser((prev) => ({
                          ...prev,
                          isAdmin: !!checked,
                        }))
                      }
                    />
                    <label
                      htmlFor="isAdmin"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Admin User
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
                        {user.isAdmin ? "Admin" : "Regular User"}
                      </TableCell>
                      <TableCell>
                        {currentUser?.id !== user.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isLoading}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the user account.
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
