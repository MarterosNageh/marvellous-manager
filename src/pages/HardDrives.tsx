import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Plus, Search, HardDrive as HardDriveIcon, Printer } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const HardDrives = () => {
  const { hardDrives, projects, getProject } = useData();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [isMobile, setIsMobile] = useState(false);

  const filteredHardDrives = hardDrives.filter((hardDrive) => {
    const matchesSearch =
      hardDrive.name.toLowerCase().includes(search.toLowerCase()) ||
      hardDrive.serialNumber.toLowerCase().includes(search.toLowerCase());
      
    const matchesProject = projectFilter === "all"
      ? true
      : hardDrive.projectId === projectFilter;
      
    return matchesSearch && matchesProject;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Hard Drives</h1>
          <Link to="/hard-drives/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Hard Drive
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={projectFilter}
            onValueChange={setProjectFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredHardDrives.length === 0 ? (
          <div className="text-center p-12 border rounded-lg">
            <HardDriveIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No hard drives found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {search || projectFilter !== "all"
                ? "Try adjusting your search or filter"
                : "Get started by adding your first hard drive."}
            </p>
            {!search && projectFilter === "all" && (
              <Link to="/hard-drives/new" className="mt-6 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Hard Drive
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {!isMobile && <TableHead>Project</TableHead>}
                  <TableHead>Drive Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Creation Date</TableHead>
                  <TableHead className="hidden md:table-cell">Capacity</TableHead>
                  <TableHead className="hidden lg:table-cell">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHardDrives.map((hardDrive) => {
                  const project = getProject(hardDrive.projectId);
                  return (
                    <TableRow key={hardDrive.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/hard-drives/${hardDrive.id}`}
                          className="hover:underline"
                        >
                          {hardDrive.name}
                        </Link>
                        {isMobile && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {project?.name || "No Project"} • {hardDrive.driveType}
                          </div>
                        )}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>{project?.name || "No Project"}</TableCell>
                      )}
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {hardDrive.driveType}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {new Date(hardDrive.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {hardDrive.capacity || "N/A"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs truncate">
                        {hardDrive.data || "No description"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default HardDrives;
