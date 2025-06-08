import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { TaskUtilizationTable } from "@/components/dashboard/TaskUtilizationTable";
import { HardDrive, ArrowRight, Boxes, Users, BarChart2 } from "lucide-react";
import { Link } from "react-router-dom";
import { isToday, format } from "date-fns";

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
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
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
  const [stats, setStats] = useState({
    totalHardDrives: 0,
    availableHardDrives: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Data loading functions
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch Hard Drives
        const { data: hardDrivesData, error: hardDrivesError } = await supabase
          .from('hard_drives')
          .select('*')
          .limit(5);
        
        if (hardDrivesError) throw hardDrivesError;
        setHardDrives(hardDrivesData as HardDriveData[]);
        
        // Fetch Projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .limit(5);
        
        if (projectsError) throw projectsError;
        setProjects(projectsData as ProjectData[]);
        
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
        
        setStats({
          totalHardDrives: totalHardDrives || 0,
          availableHardDrives: availableHardDrives || 0,
          totalProjects: totalProjects || 0,
          activeProjects: activeProjects || 0,
          totalUsers: totalUsers || 0
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

  // Rendering logic
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <StatsCard 
            title="Hard Drives" 
            value={stats.totalHardDrives} 
            description={`${stats.availableHardDrives} available`}
            icon={<HardDrive className="h-4 w-4" />} 
          />
          <StatsCard 
            title="Projects" 
            value={stats.totalProjects} 
            description={`${stats.activeProjects} active`}
            icon={<Boxes className="h-4 w-4" />} 
          />
          <StatsCard 
            title="Users" 
            value={stats.totalUsers} 
            icon={<Users className="h-4 w-4" />} 
          />
          <StatsCard 
            title="Task Completion" 
            value="86%" 
            description="Last 30 days"
            icon={<BarChart2 className="h-4 w-4" />} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Hard Drives */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Hard Drives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hardDrives.length > 0 ? (
                hardDrives.map((drive) => (
                  <div 
                    key={drive.id} 
                    className="p-3 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{drive.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SN: {drive.serial_number}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/hard-drives/${drive.id}`}>
                        Details
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No hard drives found
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/hard-drives">
                  View All Hard Drives
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Active Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div 
                    key={project.id} 
                    className="p-3 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.type || project.status}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/projects/${project.id}`}>
                        Details
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No projects found
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/projects">
                  View All Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Tabs defaultValue="task-utilization">
          <TabsList>
            <TabsTrigger value="task-utilization">Task Utilization</TabsTrigger>
            <TabsTrigger value="overview">System Overview</TabsTrigger>
          </TabsList>
          <TabsContent value="task-utilization" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskUtilizationTable />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p>System health and statistics dashboard will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
