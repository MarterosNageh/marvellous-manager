
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTask } from "@/context/TaskContext";
import { TaskPriority } from "@/types/taskTypes";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
];

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { addTask, projects, users, loading } = useTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [projectId, setProjectId] = useState<string>('none');
  const [assigneeId, setAssigneeId] = useState<string>('none');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    await addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: 'pending',
      due_date: dueDate ? dueDate.toISOString() : undefined,
      project_id: projectId === 'none' ? undefined : projectId,
      created_by: '',
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(undefined);
    setProjectId('none');
    setAssigneeId('none');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this task..."
              rows={3}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Set priority" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Flag className={`h-3 w-3 ${option.color}`} />
                        <span className={option.color}>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                      !dueDate && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? formatDate(dueDate) : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select a project (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Assign to user (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="none">No Assignee</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        {user.username}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !title.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
