import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Printer, Archive, ArchiveRestore } from "lucide-react";
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
import { getHardDriveStatusColor } from "@/lib/utils";

interface HardDriveGroupedListProps {
  hardDrives: HardDrive[];
  projects: Project[];
  isMobile: boolean;
  onToggleArchive?: (hardDriveId: string, isArchived: boolean) => void;
}

export const HardDriveGroupedList = ({
  hardDrives,
  projects,
  isMobile,
  onToggleArchive,
}: HardDriveGroupedListProps) => {
  const navigate = useNavigate();
  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  // State to track which archived project groups are expanded
  const [expandedArchivedProjects, setExpandedArchivedProjects] = useState<{ [key: string]: boolean }>({});
  // State for sorting
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Separate active and archived hard drives
  const activeHardDrives = hardDrives.filter(h => {
    // Check if the hard drive's project is unavailable
    if (h.projectId) {
      const project = projects.find(p => p.id === h.projectId);
      return project?.status !== 'unavailable';
    }
    // If no project, consider it active
    return true;
  });
  
  const archivedHardDrives = hardDrives.filter(h => {
    // Check if the hard drive's project is unavailable
    if (h.projectId) {
      const project = projects.find(p => p.id === h.projectId);
      return project?.status === 'unavailable';
    }
    // If no project, consider it active
    return false;
  });

  // Group active hard drives by project
  const activeHardDrivesByProject = activeHardDrives.reduce((acc, hardDrive) => {
    const projectId = hardDrive.projectId || 'no-project';
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(hardDrive);
    return acc;
  }, {} as { [key: string]: HardDrive[] });

  // Sort function
  const sortData = (data: HardDrive[], key: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'driveType':
          aValue = a.driveType.toLowerCase();
          bValue = b.driveType.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'capacity':
          aValue = a.capacity || '';
          bValue = b.capacity || '';
          break;
        case 'data':
          aValue = a.data || '';
          bValue = b.data || '';
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Handle sort
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Get sorted data for a project
  const getSortedProjectData = (projectData: HardDrive[]) => {
    if (!sortConfig) return projectData;
    return sortData(projectData, sortConfig.key, sortConfig.direction);
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toggle archived project group expansion
  const toggleArchivedProject = (projectId: string) => {
    setExpandedArchivedProjects(prev => ({
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

  // Handle archive/unarchive for hard drive
  const handleToggleArchive = (hardDriveId: string, isArchived: boolean) => {
    if (onToggleArchive) {
      onToggleArchive(hardDriveId, isArchived);
    }
  };

  // Check if project is unavailable
  const isProjectUnavailable = (projectId: string | null) => {
    if (!projectId) return false;
    const project = projects.find(p => p.id === projectId);
    return project?.status === 'unavailable';
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
      return usagePercent > 80; // More than 80% used (less than 20% free)
    }
    return false;
  };

  // Get project name helper
  const getProjectName = (projectId: string | null) => {
    if (!projectId) return "No Project";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "No Project";
  };

  // Check if this is the most recent backup drive that should show low space
  const shouldShowLowSpace = (hardDrive: HardDrive, projectDrives: HardDrive[]) => {
    if (!hasLowSpace(hardDrive)) return false;
    
    // Get all backup drives for this project, sorted by creation date (newest first)
    const backupDrives = projectDrives
      .filter(drive => drive.driveType === 'backup')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Only show low space on the most recent backup drive
    return backupDrives.length > 0 && backupDrives[0].id === hardDrive.id;
  };

  return (
    <div className="space-y-4">
      {/* No Project Section */}
      {activeHardDrivesByProject['no-project'] && (
        <div className="border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            onClick={() => toggleSection('no-project')}
          >
            <div className="flex items-center gap-2">
              {expandedSections['no-project'] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-medium">No Project</span>
              <Badge variant="secondary" className="ml-2">
                {activeHardDrivesByProject['no-project'].length}
              </Badge>
            </div>
          </Button>
          {expandedSections['no-project'] && (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {sortConfig?.key === 'name' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('driveType')}
                    >
                      <div className="flex items-center gap-1">
                        Drive Type
                        {sortConfig?.key === 'driveType' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortConfig?.key === 'status' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="hidden sm:table-cell cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        Creation Date
                        {sortConfig?.key === 'createdAt' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="hidden md:table-cell cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('capacity')}
                    >
                      <div className="flex items-center gap-1">
                        Capacity
                        {sortConfig?.key === 'capacity' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="hidden lg:table-cell cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('data')}
                    >
                      <div className="flex items-center gap-1">
                        Description
                        {sortConfig?.key === 'data' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedProjectData(activeHardDrivesByProject['no-project']).map((hardDrive) => (
                    <TableRow key={hardDrive.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/hard-drives/${hardDrive.id}`}
                            className="hover:underline"
                          >
                            {hardDrive.name}
                          </Link>
                          {shouldShowLowSpace(hardDrive, activeHardDrivesByProject['no-project']) && (
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
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${getHardDriveStatusColor(hardDrive.status)}`}>
                          {hardDrive.status}
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
        const projectHardDrives = activeHardDrivesByProject[project.id] || [];
        if (projectHardDrives.length === 0) return null;

        return (
          <div key={project.id} className="border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              onClick={() => toggleSection(project.id)}
            >
              <div className="flex items-center gap-2">
                {expandedSections[project.id] ? (
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
            {expandedSections[project.id] && (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortConfig?.key === 'name' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('driveType')}
                      >
                        <div className="flex items-center gap-1">
                          Drive Type
                          {sortConfig?.key === 'driveType' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortConfig?.key === 'status' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="hidden sm:table-cell cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          Creation Date
                          {sortConfig?.key === 'createdAt' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="hidden md:table-cell cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('capacity')}
                      >
                        <div className="flex items-center gap-1">
                          Capacity
                          {sortConfig?.key === 'capacity' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="hidden lg:table-cell cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('data')}
                      >
                        <div className="flex items-center gap-1">
                          Description
                          {sortConfig?.key === 'data' && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedProjectData(projectHardDrives).map((hardDrive) => (
                      <TableRow key={hardDrive.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/hard-drives/${hardDrive.id}`}
                              className="hover:underline"
                            >
                              {hardDrive.name}
                            </Link>
                            {shouldShowLowSpace(hardDrive, projectHardDrives) && (
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
                        <TableCell>
                          <Badge variant="outline" className={`capitalize ${getHardDriveStatusColor(hardDrive.status)}`}>
                            {hardDrive.status}
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

      {/* Archive Section */}
      {archivedHardDrives.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            onClick={() => toggleSection('archive')}
          >
            <div className="flex items-center gap-2">
              {expandedSections['archive'] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-medium">Archive</span>
              <Badge variant="outline" className="ml-2">
                {archivedHardDrives.length}
              </Badge>
            </div>
          </Button>
          {expandedSections['archive'] && (
            <div>
              {/* Group archived hard drives by project */}
              {(() => {
                const archivedByProject = archivedHardDrives.reduce((acc, hardDrive) => {
                  const projectId = hardDrive.projectId || 'no-project';
                  if (!acc[projectId]) {
                    acc[projectId] = [];
                  }
                  acc[projectId].push(hardDrive);
                  return acc;
                }, {} as { [key: string]: HardDrive[] });

                return Object.entries(archivedByProject).map(([projectId, projectHardDrives]) => {
                  const project = projects.find(p => p.id === projectId);
                  const projectName = project?.name || (projectId === 'no-project' ? 'No Project' : 'Unknown Project');
                  const isExpanded = expandedArchivedProjects[projectId] === true; // Default to collapsed

                  return (
                    <div key={projectId} className="border-t first:border-t-0">
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 bg-gray-100"
                        onClick={() => toggleArchivedProject(projectId)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <h4 className="text-sm font-medium text-gray-700">{projectName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {projectHardDrives.length}
                          </Badge>
                        </div>
                      </Button>
                      {isExpanded && (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('name')}
                              >
                                <div className="flex items-center gap-1">
                                  Name
                                  {sortConfig?.key === 'name' && (
                                    <span className="text-xs">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('driveType')}
                              >
                                <div className="flex items-center gap-1">
                                  Drive Type
                                  {sortConfig?.key === 'driveType' && (
                                    <span className="text-xs">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('status')}
                              >
                                <div className="flex items-center gap-1">
                                  Status
                                  {sortConfig?.key === 'status' && (
                                    <span className="text-xs">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="hidden sm:table-cell cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('createdAt')}
                              >
                                <div className="flex items-center gap-1">
                                  Creation Date
                                  {sortConfig?.key === 'createdAt' && (
                                    <span className="text-xs">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="hidden md:table-cell cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('capacity')}
                              >
                                <div className="flex items-center gap-1">
                                  Capacity
                                  {sortConfig?.key === 'capacity' && (
                                    <span className="text-xs">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="hidden lg:table-cell cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('data')}
                              >
                                <div className="flex items-center gap-1">
                                  Description
                                  {sortConfig?.key === 'data' && (
                                    <span className="text-xs">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getSortedProjectData(projectHardDrives).map((hardDrive) => (
                              <TableRow key={hardDrive.id} className="bg-gray-50">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Link
                                      to={`/hard-drives/${hardDrive.id}`}
                                      className="hover:underline text-gray-600"
                                    >
                                      {hardDrive.name}
                                    </Link>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="capitalize">
                                    {hardDrive.driveType}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`capitalize ${getHardDriveStatusColor(hardDrive.status)}`}>
                                    {hardDrive.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-gray-600">
                                  {new Date(hardDrive.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-gray-600">
                                  {hardDrive.capacity || "N/A"}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell max-w-xs truncate text-gray-600">
                                  {hardDrive.data || "No description"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePrintHardDrive(hardDrive.id)}
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                    {project && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleArchive(hardDrive.id, true)}
                                        title="Restore project"
                                      >
                                        <ArchiveRestore className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 