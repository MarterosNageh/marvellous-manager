import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ProjectGroupedList } from "@/components/ProjectGroupedList";
import { useToast } from "@/components/ui/use-toast";

const CATEGORY_OPTIONS = [
  "Drama",
  "Cinema",
  "TVC",
  "Promotions",
  "Marvellous"
];

const Projects = () => {
  const { projects, getHardDrivesByProject, updateProject } = useData();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  const filteredProjects = projects
    .filter((project) =>
      project.name.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === "all" || project.type === categoryFilter)
    );

  const handleToggleArchive = async (projectId: string, isArchived: boolean) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const updatedStatus = isArchived ? 'unavailable' : 'active';

      await updateProject(projectId, { status: updatedStatus });
      
      toast({
        title: "Success",
        description: `Project ${isArchived ? 'archived' : 'restored'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isArchived ? 'archive' : 'restore'} project`,
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projects</h1>
          <Link to="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:space-x-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORY_OPTIONS.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No projects found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {search || categoryFilter !== "all"
                  ? "Try adjusting your search or category filter"
                  : "Get started by adding your first project."}
              </p>
              {!search && categoryFilter === "all" && (
                <Link to="/projects/new" className="mt-6 inline-block">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <ProjectGroupedList
            projects={filteredProjects}
            getHardDrivesByProject={getHardDrivesByProject}
            onToggleArchive={handleToggleArchive}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Projects;
