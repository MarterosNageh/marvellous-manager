import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { TaskUtilizationTable } from "@/components/dashboard/TaskUtilizationTable";
import { HardDrive, ArrowRight, Boxes, Users, BarChart2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { isToday, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types for Dashboard
interface HardDriveData {
  id: string;
  name: string;
  serial_number: string;
  status: string;
  project_id: string;
  capacity: string;
  free_space: string;
  data: string;
  cables: any;
  created_at: string;
  updated_at: string;
  project?: {
    name: string;
  };
  drive_type: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
}

interface ShiftData {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  user: {
    username: string;
    role: string;
  } | null;
}

interface DayOffUser {
  user: {
    username: string;
    role: string;
  } | null;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
}

const Dashboard = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [hardDrives, setHardDrives] = useState<HardDriveData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [currentShifts, setCurrentShifts] = useState<ShiftData[]>([]);
  const [dayOffUsers, setDayOffUsers] = useState<{ username: string; role: string }[]>([]);
  const [stats, setStats] = useState({
    totalHardDrives: 0,
    availableHardDrives: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalUsers: 0,
    lowSpaceHardDrives: 0
  });
  const [loading, setLoading] = useState(true);
  const [randomGif, setRandomGif] = useState<string>("");
  
  // Function to get a random GIF
  const getRandomGif = () => {
    const gifs = ['01.gif', '02.gif', '03.gif', '04.gif', '05.gif'];
    const randomIndex = Math.floor(Math.random() * gifs.length);
    return `/GIF/${gifs[randomIndex]}`;
  };

  // Set random GIF on component mount
  useEffect(() => {
    setRandomGif(getRandomGif());
  }, []);

  // Data loading functions
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch Hard Drives with Project Info
        const { data: hardDrivesData, error: hardDrivesError } = await supabase
          .from('hard_drives')
          .select('*, project:projects(name)')
          .order('created_at', { ascending: false });
        
        if (hardDrivesError) throw hardDrivesError;
        setHardDrives(hardDrivesData as HardDriveData[]);
        
        // Fetch Projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (projectsError) throw projectsError;
        setProjects(projectsData as ProjectData[]);

        // Fetch Current Shifts
        const now = new Date().toISOString();
        const { data: shiftsData, error: shiftsError } = await supabase
          .from('shifts')
          .select('*, user:auth_users(username, role)')
          .lte('start_time', now)
          .gte('end_time', now);

        if (shiftsError) throw shiftsError;
        setCurrentShifts((shiftsData as any[]).map(shift => ({
          id: shift.id,
          user_id: shift.user_id,
          start_time: shift.start_time,
          end_time: shift.end_time,
          shift_type: shift.shift_type,
          user: shift.user
        })) as ShiftData[]);

        // Fetch Day Off Users (users with approved time off requests for today)
        const today = new Date().toISOString().split('T')[0];
        const { data: dayOffData, error: dayOffError } = await supabase
          .from('shift_requests')
          .select('user:auth_users!user_id(username, role)')
          .eq('status', 'approved')
          .eq('request_type', 'leave')
          .lte('start_date', today)
          .gte('end_date', today);

        if (dayOffError) throw dayOffError;
        setDayOffUsers((dayOffData as DayOffUser[]).map(d => d.user).filter((user): user is NonNullable<typeof user> => user !== null));
        
        // Get Stats
        const [
          { count: totalHardDrives },
          { count: availableHardDrives },
          { count: totalProjects },
          { count: activeProjects },
          { count: totalUsers }
        ] = await Promise.all([
          supabase.from('hard_drives').select('*', { count: 'exact', head: true }),
          supabase.from('hard_drives').select('*', { count: 'exact', head: true }).eq('status', 'available'),
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('auth_users').select('*', { count: 'exact', head: true })
        ]);

        // Calculate low space hard drives from the fetched data
        const lowSpaceHardDrives = projects.reduce((count, project) => {
          const projectBackupDrives = hardDrivesData
            .filter(drive => 
              drive.project_id === project.id && 
              drive.drive_type === 'backup'
            )
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          if (projectBackupDrives.length === 0) return count;
          
          const latestBackupDrive = projectBackupDrives[0];
          const freeSpace = parseFloat(latestBackupDrive.free_space);
          const capacity = parseFloat(latestBackupDrive.capacity);
          
          if (!isNaN(freeSpace) && !isNaN(capacity) && (freeSpace / capacity) * 100 < 20) {
            return count + 1;
          }
          
          return count;
        }, 0);
        
        setStats({
          totalHardDrives: totalHardDrives || 0,
          availableHardDrives: availableHardDrives || 0,
          totalProjects: totalProjects || 0,
          activeProjects: activeProjects || 0,
          totalUsers: totalUsers || 0,
          lowSpaceHardDrives
        });
      } catch (error) {
        toast({
          title: "Error loading dashboard data",
          description: "Please try again later",
          variant: "destructive",
        });
        console.error("Dashboard data loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Rendering logic
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        {/* Top Row: Greeting and Current Shift Status */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Greeting Card */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">{getGreeting()}, {currentUser?.username}!</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-3">
              <div className="flex-shrink-0">
                <p className="text-muted-foreground text-sm">
                  Welcome to your dashboard. Here's an overview of your workspace.
                </p>
                {currentUser?.role && (
                  <Badge className="mt-1" variant="outline">
                    {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                  </Badge>
                )}
              </div>
              {/* Random GIF - only show on larger screens */}
              <div className="hidden lg:block h-48">
                {randomGif && (
                  <img 
                    src={randomGif} 
                    alt="Random GIF" 
                    className="h-full w-full rounded-lg object-contain"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Shift Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Shift Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-medium mb-2 text-sm">Currently On Shift</h3>
                {currentShifts.length > 0 ? (
                  <div className="space-y-2">
                    {currentShifts.map(shift => (
                      <div
                        key={shift.id}
                        className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50"
                      >
                        <div
                          className="w-1 h-8 rounded-full"
                          style={{ 
                            backgroundColor: shift.shift_type === 'morning' ? '#10B981' : 
                                          shift.shift_type === 'night' ? '#8B5CF6' : 
                                          shift.shift_type === 'over night' ? '#F59E0B' : '#3B82F6'
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{shift.user?.username || 'Unknown User'}</span>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {shift.shift_type}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50"
                      >
                        <div
                          className="w-1 h-8 rounded-full"
                          style={{ backgroundColor: shift.shift_type === 'morning' ? '#10B981' : 
                                                  shift.shift_type === 'night' ? '#8B5CF6' : 
                                                  shift.shift_type === 'over night' ? '#F59E0B' : '#3B82F6' }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{shift.user?.username || 'Unknown User'}</span>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {shift.shift_type}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {dayOffUsers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 text-sm">Day Off</h3>
                  <div className="space-y-2">
                    {dayOffUsers.map((user, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50"
                      >
                        <div
                          className="w-1 h-8 rounded-full"
                          style={{ backgroundColor: '#6B7280' }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{user.username}</span>
                            <Badge variant="secondary" className="capitalize text-xs">
                              Day Off
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(), 'EEEE, MMMM d')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatsCard 
            title="Total Projects" 
            value={stats.totalProjects} 
            description={`${stats.activeProjects} active`}
            icon={<Boxes className="h-4 w-4" />} 
          />
          <StatsCard 
            title="Hard Drives" 
            value={stats.totalHardDrives} 
            description={`${stats.availableHardDrives} available`}
            icon={<HardDrive className="h-4 w-4" />} 
          />
          <StatsCard 
            title="Task Utilization" 
            value="86%" 
            description="Last 30 days"
            icon={<BarChart2 className="h-4 w-4" />} 
          />
          <StatsCard 
            title="Low Space Drives" 
            value={stats.lowSpaceHardDrives}
            description="< 20% free space"
            icon={<AlertTriangle className="h-4 w-4" />} 
          />
        </div>

        {/* Low Space Hard Drives by Project */}
        <Card>
          <CardHeader>
            <CardTitle>Low Space Hard Drives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map(project => {
                // Get all backup drives for this project, sorted by creation date (newest first)
                const projectBackupDrives = hardDrives
                  .filter(drive => 
                    drive.project_id === project.id && 
                    drive.drive_type === 'backup' &&
                    project.status?.toLowerCase() === 'available'
                  )
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                
                if (projectBackupDrives.length === 0) return null;

                // Get the latest backup drive
                const latestDrive = projectBackupDrives[0];
                const freeSpacePercentage = (parseInt(latestDrive.free_space) / parseInt(latestDrive.capacity)) * 100;
                const hasLowSpace = freeSpacePercentage < 20;
                const isCritical = freeSpacePercentage < 10;
                
                // Only show if the latest drive has low space
                if (!hasLowSpace) return null;
                
                return (
                  <div key={project.id} className="space-y-2">
                    <h3 className="font-medium">{project.name}</h3>
                    <div 
                      className={cn(
                        "flex items-center justify-between p-2 border rounded-lg transition-colors",
                        isCritical 
                          ? "bg-red-400 border-red-400 text-white" 
                          : "bg-white border-gray-200"
                      )}
                    >
                      <div>
                        <p className="font-medium">{latestDrive.name}</p>
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm",
                            isCritical ? "text-white/90" : "text-muted-foreground"
                          )}>
                            {freeSpacePercentage.toFixed(1)}% free
                          </p>
                          <span className={cn(
                            "text-xs",
                            isCritical ? "text-white/75" : "text-muted-foreground/75"
                          )}>
                            • Added {format(new Date(latestDrive.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant={isCritical ? "secondary" : "outline"} 
                        size="sm" 
                        asChild
                      >
                        <Link to={`/hard-drives/${latestDrive.id}`}>
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!projects.some(project => {
                const projectBackupDrives = hardDrives
                  .filter(drive => 
                    drive.project_id === project.id && 
                    drive.drive_type === 'backup' &&
                    project.status?.toLowerCase() === 'available'
                  )
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                
                if (projectBackupDrives.length === 0) return false;
                
                const latestDrive = projectBackupDrives[0];
                const freeSpacePercentage = (parseInt(latestDrive.free_space) / parseInt(latestDrive.capacity)) * 100;
                return freeSpacePercentage < 20;
              }) && (
                <p className="text-center text-muted-foreground py-4">
                  no hards Low space
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Utilization Table */}
        <TaskUtilizationTable />
      </div>
    </MainLayout>
  );
};

const StatsCard = ({ title, value, description, icon }: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard; 