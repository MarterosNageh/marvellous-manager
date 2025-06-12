import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Archive, ArchiveRestore } from "lucide-react";
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
import { Project } from "@/types";
import { getProjectStatusColor } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProjectGroupedListProps {
  projects: Project[];
  getHardDrivesByProject: (projectId: string) => any[];
  onToggleArchive?: (projectId: string, isArchived: boolean) => void;
}

const PROJECT_TYPES = ['Cinema', 'Drama', 'TVC', 'Promotions', 'Marvellous'];

export const ProjectGroupedList = ({
  projects,
  getHardDrivesByProject,
  onToggleArchive,
}: ProjectGroupedListProps) => {
  const isMobile = useIsMobile();
  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  // Separate active and archived projects
  const activeProjects = projects.filter(p => p.status !== 'unavailable');
  const archivedProjects = projects.filter(p => p.status === 'unavailable');

  // Group active projects by type
  const activeProjectsByType = activeProjects.reduce((acc, project) => {
    const type = project.type || 'No Type';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(project);
    return acc;
  }, {} as { [key: string]: Project[] });

  // Special handling for Marvellous group - include project named "MARVELLOUS" regardless of type
  const marvellousProjects = activeProjects.filter(project => 
    project.type === 'Marvellous' || project.name === 'MARVELLOUS'
  );

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle archive/unarchive
  const handleToggleArchive = (projectId: string, currentStatus: string) => {
    if (onToggleArchive) {
      const isCurrentlyArchived = currentStatus === 'unavailable';
      onToggleArchive(projectId, !isCurrentlyArchived);
    }
  };

  return (
    <div className="space-y-4">
      {/* Type-based Sections */}
      {PROJECT_TYPES.map((type) => {
        const typeProjects = type === 'Marvellous' 
          ? marvellousProjects 
          : (activeProjectsByType[type] || []);

        return (
          <div key={type} className="border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              onClick={() => toggleSection(type)}
            >
              <div className="flex items-center gap-2">
                {expandedSections[type] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium">{type}</span>
                <Badge variant="secondary" className="ml-2">
                  {typeProjects.length}
                </Badge>
              </div>
            </Button>
            {expandedSections[type] && (
              <div>
                {typeProjects.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        {!isMobile && <TableHead>Status</TableHead>}
                        <TableHead className="hidden sm:table-cell">Creation Date</TableHead>
                        <TableHead className="hidden md:table-cell">Hard Drives</TableHead>
                        <TableHead className="hidden lg:table-cell">Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {typeProjects.map((project) => {
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
                                  {hardDriveCount} drives
                                </div>
                              )}
                            </TableCell>
                            {!isMobile && (
                              <TableCell>
                                <Badge variant="outline" className={`capitalize ${getProjectStatusColor(project.status || "active")}`}>
                                  {project.status || "active"}
                                </Badge>
                              </TableCell>
                            )}
                            <TableCell className="hidden sm:table-cell">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{hardDriveCount}</TableCell>
                            <TableCell className="hidden lg:table-cell max-w-xs truncate">
                              {project.description || "No description"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleArchive(project.id, project.status || 'active')}
                                title="Archive project"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No {type} projects found
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Archive Section */}
      <div className="border rounded-md overflow-hidden">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          onClick={() => toggleSection('Archive')}
        >
          <div className="flex items-center gap-2">
            {expandedSections['Archive'] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">Archive</span>
            <Badge variant="outline" className="ml-2">
              {archivedProjects.length}
            </Badge>
          </div>
        </Button>
        {expandedSections['Archive'] && (
          <div>
            {archivedProjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Project Name</TableHead>
                    {!isMobile && <TableHead>Type</TableHead>}
                    {!isMobile && <TableHead>Status</TableHead>}
                    <TableHead className="hidden sm:table-cell">Creation Date</TableHead>
                    <TableHead className="hidden md:table-cell">Hard Drives</TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedProjects.map((project) => {
                    const hardDriveCount = getHardDrivesByProject(project.id).length;

                    return (
                      <TableRow key={project.id} className="bg-gray-50">
                        <TableCell className="font-medium">
                          <Link
                            to={`/projects/${project.id}`}
                            className="hover:underline text-gray-600"
                          >
                            {project.name}
                          </Link>
                          {isMobile && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {project.type || "No Type"} • {hardDriveCount} drives
                            </div>
                          )}
                        </TableCell>
                        {!isMobile && <TableCell className="text-gray-600">{project.type || "No Type"}</TableCell>}
                        {!isMobile && (
                          <TableCell>
                            <Badge variant="outline" className={`capitalize ${getProjectStatusColor(project.status || "unavailable")}`}>
                              {project.status || "unavailable"}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="hidden sm:table-cell text-gray-600">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-gray-600">{hardDriveCount}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-xs truncate text-gray-600">
                          {project.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleArchive(project.id, project.status || 'unavailable')}
                            title="Restore project"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No archived projects found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 