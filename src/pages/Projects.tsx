
import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

const CATEGORY_OPTIONS = [
  "Drama",
  "Cinema",
  "TVC",
  "Promotions"
];

const Projects = () => {
  const { projects, getHardDrivesByProject } = useData();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const isMobile = useIsMobile();

  const filteredProjects = projects
    .filter((project) =>
      project.name.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === "all" || project.type === categoryFilter)
    );

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
          <select
            className="border rounded bg-white h-10 text-sm px-2 w-full sm:w-auto"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
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
          <div className="overflow-x-auto">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    {!isMobile && <TableHead>Type</TableHead>}
                    <TableHead className="hidden sm:table-cell">Creation Date</TableHead>
                    <TableHead className="hidden md:table-cell">Hard Drives</TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => {
                    const hardDriveCount = getHardDrivesByProject(project.id).length;

                    return (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          <Link
                            to={`/projects/${project.id}`}
                            className="hover:underline"
                          >
                            {project.name}
                          </Link>
                          {isMobile && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {project.type || "N/A"} • {hardDriveCount} drives
                            </div>
                          )}
                        </TableCell>
                        {!isMobile && <TableCell>{project.type || "N/A"}</TableCell>}
                        <TableCell className="hidden sm:table-cell">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{hardDriveCount}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-xs truncate">
                          {project.description || "No description"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Projects;
