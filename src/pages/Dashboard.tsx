import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaskProvider, useTask } from "@/context/TaskContext";
import { TaskUtilizationTable } from "@/components/dashboard/TaskUtilizationTable";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HardDrive, FolderOpen, Plus, CheckSquare, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#9b87f5", "#33C3F0", "#F97316", "#E5DEFF"];

const DashboardContent = () => {
  const { projects, hardDrives } = useData();
  const { tasks, loading: tasksLoading } = useTask();

  const hardDrivesByProject = useMemo(() => {
    const map: { [k: string]: number } = {};
    hardDrives.forEach(hd => {
      map[hd.projectId] = (map[hd.projectId] || 0) + 1;
    });
    return Object.entries(map).map(([projectId, count]) => {
      const project = projects.find(p => p.id === projectId);
      return {
        name: project?.name || "Unassigned",
        value: count
      };
    });
  }, [projects, hardDrives]);

  const hardDriveTypeData = useMemo(() => {
    const typeMap: { [k in string]: number } = {};
    hardDrives.forEach((hd: any) => {
      const type = hd.type || "Unknown";
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    return Object.entries(typeMap).map(([type, count], idx) => ({
      name: type,
      value: count,
      color: COLORS[idx % COLORS.length]
    }));
  }, [hardDrives]);

  const tasksByStatus = useMemo(() => {
    const statusMap: { [key: string]: number } = {
      pending: 0,
      in_progress: 0,
      under_review: 0,
      completed: 0
    };
    
    tasks.forEach(task => {
      statusMap[task.status] = (statusMap[task.status] || 0) + 1;
    });

    return Object.entries(statusMap).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      status
    }));
  }, [tasks]);

  const lowSpaceHardDrives = useMemo(() => {
    return hardDrives.filter(hd => {
      if (!hd.freeSpace || !hd.capacity) return false;
      
      const parseSize = (sizeStr: string): number => {
        const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(GB|TB|MB)$/i);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        switch (unit) {
          case 'TB': return value * 1024;
          case 'GB': return value;
          case 'MB': return value / 1024;
          default: return 0;
        }
      };
      
      const totalCapacity = parseSize(hd.capacity);
      const freeSpace = parseSize(hd.freeSpace);
      
      if (totalCapacity === 0) return false;
      
      const usedSpace = totalCapacity - freeSpace;
      const usagePercentage = (usedSpace / totalCapacity) * 100;
      
      return usagePercentage > 90;
    });
  }, [hardDrives]);

  const percentUsed = projects.length > 0 ? Math.round(hardDrives.length / (projects.length * 10) * 100) : 0;

  return (
    <div className="space-y-6 mx-0 px-[14px]">
      <div className="flex items-center justify-between my-[16px]">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
          <Link to="/hard-drives/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Hard Drive
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active projects in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Hard Drives</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hardDrives.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered hard drives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksLoading ? '...' : tasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Low Space Drives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowSpaceHardDrives.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Drives with less than 10% free space</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hard Drives by Project</CardTitle>
          </CardHeader>
          <CardContent style={{ width: "100%", height: 150 }}>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={hardDrivesByProject} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={48}>
                  {hardDrivesByProject.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hard Drives by Category</CardTitle>
          </CardHeader>
          <CardContent style={{ width: "100%", height: 150 }}>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={hardDriveTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={48}>
                  {hardDriveTypeData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent style={{ width: "100%", height: 150 }}>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={tasksByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={48}>
                  {tasksByStatus.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Storage Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-100 h-5 rounded-lg overflow-hidden flex items-center">
            <div 
              className="bg-primary h-full transition-all" 
              style={{
                width: `${percentUsed}%`,
                minWidth: 8,
                borderRadius: 8
              }} 
              aria-label="Utilization percent" 
            />
            <span className="pl-2 text-xs">{percentUsed}% utilized</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on estimated max 10 drives per project
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Critical Storage Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {lowSpaceHardDrives.length === 0 ? (
            <p className="text-sm text-muted-foreground">All drives have sufficient space</p>
          ) : (
            <div className="space-y-2">
              {lowSpaceHardDrives.slice(0, 3).map(drive => (
                <div key={drive.id} className="flex justify-between items-center">
                  <span className="text-sm truncate">{drive.name}</span>
                  <Badge variant="destructive" className="text-xs">Low Space</Badge>
                </div>
              ))}
              {lowSpaceHardDrives.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{lowSpaceHardDrives.length - 3} more drives need attention
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hard Drive sections first */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Hard Drives</h2>
          <Link to="/hard-drives">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
        
        {hardDrives.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No hard drives found. Register your first hard drive!</p>
              <Link to="/hard-drives/new" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Register Hard Drive
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hardDrives.slice(0, 3).map(hardDrive => (
              <Link key={hardDrive.id} to={`/hard-drives/${hardDrive.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{hardDrive.name}</CardTitle>
                    <CardDescription>
                      S/N: {hardDrive.serialNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      <span className="font-medium">Capacity:</span> {hardDrive.capacity}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Free Space:</span> {hardDrive.freeSpace}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Projects</h2>
          <Link to="/projects">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No projects found. Create your first project!</p>
              <Link to="/projects/new" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map(project => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>
                      Created on {new Date(project.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description || "No description"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Tasks</h2>
          <Link to="/task-manager">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
        
        {tasksLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Loading tasks...</p>
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No tasks found. Create your first task!</p>
              <Link to="/task-manager" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.slice(0, 3).map(task => (
              <Link key={task.id} to="/task-manager">
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{task.title}</CardTitle>
                    <CardDescription>
                      <Badge variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'in_progress' ? 'secondary' :
                        task.status === 'under_review' ? 'outline' : 'destructive'
                      }>
                        {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description || "No description"}
                    </p>
                    {task.assignees && task.assignees.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Assigned to: {task.assignees.map(a => a.username).join(', ')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Task Utilization Table at the end */}
      <TaskUtilizationTable />
    </div>
  );
};

const Dashboard = () => {
  return (
    <TaskProvider>
      <MainLayout>
        <DashboardContent />
      </MainLayout>
    </TaskProvider>
  );
};

export default Dashboard;
