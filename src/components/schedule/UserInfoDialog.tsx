
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usersTable } from '@/integrations/supabase/tables/schedule';
import { shiftsTable } from '@/integrations/supabase/tables/schedule';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface UserInfoDialogProps {
  userId: string | null;
  onClose: () => void;
}

interface UserInfo {
  id: string;
  username: string;
  role: string;
  title?: string;
  balance: number;
}

interface UserShift {
  id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  status: string;
}

const UserInfoDialog = ({ userId, onClose }: UserInfoDialogProps) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userShifts, setUserShifts] = useState<UserShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newBalance, setNewBalance] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchUserInfo();
      fetchUserShifts();
    }
  }, [userId]);

  const fetchUserInfo = async () => {
    try {
      if (!userId) return;
      
      const userData = await usersTable.getById(userId);
      if (userData) {
        setUser({
          id: userData.id,
          username: userData.username,
          role: userData.role,
          title: userData.title,
          balance: userData.balance || 0
        });
        setNewBalance(userData.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      toast({
        title: "Error",
        description: "Failed to load user information",
        variant: "destructive",
      });
    }
  };

  const fetchUserShifts = async () => {
    try {
      if (!userId) return;
      
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
      
      const allShifts = await shiftsTable.getByUserId(userId);
      const currentWeekShifts = allShifts.filter(shift => {
        const shiftDate = new Date(shift.start_time);
        return shiftDate >= currentWeekStart && shiftDate <= currentWeekEnd;
      });
      
      setUserShifts(currentWeekShifts);
    } catch (error) {
      console.error('Error fetching user shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!user) return;
    
    try {
      setUpdating(true);
      
      // Since we don't have a userBalancesTable anymore, we'll update the auth_users table directly
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('auth_users')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, balance: newBalance } : null);
      
      toast({
        title: "Success",
        description: "User balance updated successfully",
      });
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update user balance",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={!!userId} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={!!userId} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Not Found</DialogTitle>
          </DialogHeader>
          <p>Unable to load user information.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={!!userId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Information</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <p className="text-sm font-medium">{user.username}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                </div>
              </div>
              {user.title && (
                <div>
                  <Label>Title</Label>
                  <p className="text-sm font-medium">{user.title}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Balance Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Balance Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Balance</Label>
                <p className="text-2xl font-bold text-green-600">{user.balance} hours</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label htmlFor="newBalance">Update Balance</Label>
                <div className="flex gap-2">
                  <Input
                    id="newBalance"
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(Number(e.target.value))}
                    placeholder="Enter new balance"
                  />
                  <Button 
                    onClick={handleBalanceUpdate}
                    disabled={updating || newBalance === user.balance}
                  >
                    {updating ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Week Shifts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Week's Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              {userShifts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shifts scheduled for this week</p>
              ) : (
                <div className="space-y-2">
                  {userShifts.map(shift => (
                    <div key={shift.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{shift.shift_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(shift.start_time), 'MMM dd, HH:mm')} - 
                          {format(new Date(shift.end_time), 'HH:mm')}
                        </p>
                      </div>
                      <Badge 
                        variant={shift.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {shift.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserInfoDialog;
