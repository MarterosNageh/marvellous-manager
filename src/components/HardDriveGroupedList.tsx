import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { HardDrive, Project } from "@/types";

interface HardDriveGroupedListProps {
  hardDrives: HardDrive[];
  projects: Project[];
  isMobile: boolean;
}

export const HardDriveGroupedList = ({
  hardDrives,
  projects,
  isMobile,
}: HardDriveGroupedListProps) => {
  const navigate = useNavigate();
  // State to track which project sections are expanded
  const [expandedProjects, setExpandedProjects] = useState<{ [key: string]: boolean }>({});

  // Group hard drives by project
  const hardDrivesByProject = hardDrives.reduce((acc, hardDrive) => {
    const projectId = hardDrive.projectId || 'no-project';
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(hardDrive);
    return acc;
  }, {} as { [key: string]: HardDrive[] });

  // Toggle project section expansion
  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Handle print for a project
  const handlePrint = (projectId: string) => {
    navigate('/print', {
      state: {
        type: 'all-hards',
        projectId: projectId === 'no-project' ? null : projectId,
        projectName: projectId === 'no-project' ? 'No Project' : projects.find(p => p.id === projectId)?.name
      }
    });
  };

  // Handle print for individual hard drive
  const handlePrintHardDrive = (hardDriveId: string) => {
    navigate(`/print`, {
      state: {
        type: 'hard-out',
        hardDriveId
      }
    });
  };

  // Check if hard drive has low space
  const hasLowSpace = (hardDrive: HardDrive) => {
    if (hardDrive.driveType !== 'backup' || !hardDrive.freeSpace || !hardDrive.capacity) return false;
    
    // Extract numbers and convert to GB for comparison
    const parseSize = (size: string) => {
      const match = size.match(/^(\d+(?:\.\d+)?)\s*(TB|GB|MB)?$/i);
      if (!match) return 0;
      
      const value = parseFloat(match[1]);
      const unit = (match[2] || 'GB').toUpperCase();
      
      switch (unit) {
        case 'TB': return value * 1024;
        case 'MB': return value / 1024;
        default: return value;
      }
    };

    const freeSpaceGB = parseSize(hardDrive.freeSpace);
    const capacityGB = parseSize(hardDrive.capacity);
    
    if (capacityGB > 0 && freeSpaceGB > 0) {
      const usagePercent = ((capacityGB - freeSpaceGB) / capacityGB) * 100;
      return usagePercent > 85; // More than 85% used
    }
    return false;
  };

  // Get project name helper
  const getProjectName = (projectId: string | null) => {
    if (!projectId) return "No Project";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "No Project";
  };

  return (
    <div className="space-y-4">
      {/* No Project Section */}
      {hardDrivesByProject['no-project'] && (
        <div className="border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            onClick={() => toggleProject('no-project')}
          >
            <div className="flex items-center gap-2">
              {expandedProjects['no-project'] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-medium">No Project</span>
              <Badge variant="secondary" className="ml-2">
                {hardDrivesByProject['no-project'].length}
              </Badge>
            </div>
          </Button>
          {expandedProjects['no-project'] && (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Drive Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Creation Date</TableHead>
                    <TableHead className="hidden md:table-cell">Capacity</TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hardDrivesByProject['no-project'].map((hardDrive) => (
                    <TableRow key={hardDrive.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/hard-drives/${hardDrive.id}`}
                            className="hover:underline"
                          >
                            {hardDrive.name}
                          </Link>
                          {hasLowSpace(hardDrive) && (
                            <Badge variant="destructive" className="text-xs">
                              Low Space
                            </Badge>
                          )}
                        </div>
                      </TableCell>
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
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintHardDrive(hardDrive.id)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t bg-gray-50">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handlePrint('no-project')}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print All Hard Drives
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Sections */}
      {projects.map((project) => {
        const projectHardDrives = hardDrivesByProject[project.id] || [];
        if (projectHardDrives.length === 0) return null;

        return (
          <div key={project.id} className="border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              onClick={() => toggleProject(project.id)}
            >
              <div className="flex items-center gap-2">
                {expandedProjects[project.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium">{project.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {projectHardDrives.length}
                </Badge>
              </div>
            </Button>
            {expandedProjects[project.id] && (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Drive Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Creation Date</TableHead>
                      <TableHead className="hidden md:table-cell">Capacity</TableHead>
                      <TableHead className="hidden lg:table-cell">Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectHardDrives.map((hardDrive) => (
                      <TableRow key={hardDrive.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/hard-drives/${hardDrive.id}`}
                              className="hover:underline"
                            >
                              {hardDrive.name}
                            </Link>
                            {hasLowSpace(hardDrive) && (
                              <Badge variant="destructive" className="text-xs">
                                Low Space
                              </Badge>
                            )}
                          </div>
                        </TableCell>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintHardDrive(hardDrive.id)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t bg-gray-50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handlePrint(project.id)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print All Hard Drives
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 