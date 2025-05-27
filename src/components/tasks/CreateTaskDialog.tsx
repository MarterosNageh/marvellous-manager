
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTask } from "@/context/TaskContext";
import { TaskPriority, TaskStatus } from "@/types/taskTypes";
import { CalendarIcon, ChevronDown, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTaskDialog = ({ open, onOpenChange }: CreateTaskDialogProps) => {
  const { addTask, projects, users } = useTask();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoading(true);
      
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        project_id: projectId || undefined,
        due_date: dueDate?.toISOString(),
        assignees: [],
        tags: [],
        subtasks: subtasks.filter(s => s.trim()).map((subtaskTitle, index) => ({
          id: '',
          parent_task_id: '',
          title: subtaskTitle.trim(),
          completed: false,
          created_at: '',
          order_index: index
        })),
        created_by: '',
      };

      await addTask(taskData, selectedAssignees);
      
      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("pending");
      setProjectId("");
      setDueDate(undefined);
      setSelectedAssignees([]);
      setSubtasks([""]);
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssigneeToggle = (userId: string) => {
    setSelectedAssignees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getSelectedUsernames = () => {
    if (selectedAssignees.length === 0) return "Select assignees";
    if (selectedAssignees.length === 1) {
      const user = users.find(u => u.id === selectedAssignees[0]);
      return user?.username || "Unknown user";
    }
    return `${selectedAssignees.length} users selected`;
  };

  const addSubtask = () => {
    setSubtasks(prev => [...prev, ""]);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubtask = (index: number, value: string) => {
    setSubtasks(prev => prev.map((subtask, i) => i === index ? value : subtask));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project (optional)" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Assign to Users</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  type="button"
                >
                  {getSelectedUsernames()}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full bg-white border shadow-lg z-50">
                {users.map((user) => (
                  <DropdownMenuCheckboxItem
                    key={user.id}
                    checked={selectedAssignees.includes(user.id)}
                    onCheckedChange={() => handleAssigneeToggle(user.id)}
                  >
                    {user.username} {user.role === 'admin' && '(Admin)'}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedAssignees.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedAssignees.length} user(s) selected
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Subtasks</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSubtask}>
                <Plus className="h-4 w-4 mr-1" />
                Add Subtask
              </Button>
            </div>
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={subtask}
                    onChange={(e) => updateSubtask(index, e.target.value)}
                    placeholder={`Subtask ${index + 1}`}
                    className="flex-1"
                  />
                  {subtasks.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSubtask(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
