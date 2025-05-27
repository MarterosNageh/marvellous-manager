
import { useTask } from "@/context/TaskContext";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { TaskStatus } from "@/types/taskTypes";

const statusSections = [
  { status: 'pending' as TaskStatus, title: 'Pending', color: 'bg-gray-50' },
  { status: 'in_progress' as TaskStatus, title: 'In Progress', color: 'bg-blue-50' },
  { status: 'under_review' as TaskStatus, title: 'Under Review', color: 'bg-purple-50' },
  { status: 'completed' as TaskStatus, title: 'Completed', color: 'bg-green-50' },
];

export const TaskList = () => {
  const { tasks, projects, users, loading } = useTask();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesProject = projectFilter === "all" || task.project_id === projectFilter;
      
      const matchesAssignee = assigneeFilter === "all" || 
        task.assignees?.some(assignee => assignee.id === assigneeFilter);

      return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter, projectFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
          </span>
          {(searchQuery || statusFilter !== "all" || priorityFilter !== "all" || 
            assigneeFilter !== "all" || projectFilter !== "all") && (
            <Badge variant="secondary" className="text-xs">
              Filtered
            </Badge>
          )}
        </div>
      </div>

      {/* Task Sections by Status */}
      <div className="grid gap-6">
        {statusSections.map((section) => {
          const sectionTasks = filteredTasks.filter(task => task.status === section.status);
          
          return (
            <Card key={section.status} className="overflow-hidden">
              <CardHeader className={`${section.color} pb-3`}>
                <CardTitle className="flex items-center justify-between text-lg">
                  {section.title}
                  <Badge variant="secondary" className="ml-2">
                    {sectionTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {sectionTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No tasks in {section.title.toLowerCase()}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sectionTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
