import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Project, HardDrive, PrintType } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface PrintHistory {
  id: string;
  type: PrintType;
  hardDriveId: string | null;
  projectId: string | null;
  operatorName: string;
  timestamp: string;
}

interface DataContextType {
  projects: Project[];
  hardDrives: HardDrive[];
  addProject: (project: Omit<Project, "id" | "createdAt">) => Promise<string>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addHardDrive: (hardDrive: Omit<HardDrive, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateHardDrive: (hardDrive: HardDrive) => Promise<void>;
  deleteHardDrive: (id: string) => Promise<void>;
  getHardDrive: (id: string) => HardDrive | undefined;
  getProject: (id: string) => Project | undefined;
  getHardDrivesByProject: (projectId: string) => HardDrive[];
  printHistory: PrintHistory[];
  addPrintHistory: (history: Omit<PrintHistory, "id" | "timestamp">) => Promise<void>;
  getPrintHistory: () => PrintHistory[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hardDrives, setHardDrives] = useState<HardDrive[]>([]);
  const [printHistory, setPrintHistory] = useState<PrintHistory[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      if (projectsError) throw projectsError;
      
      setProjects(projectsData.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || undefined,
        createdAt: p.created_at,
        type: p.type || undefined,
      })));

      const { data: hardDrivesData, error: hardDrivesError } = await supabase
        .from('hard_drives')
        .select('*');
      if (hardDrivesError) throw hardDrivesError;
      
      setHardDrives(hardDrivesData.map(h => ({
        id: h.id,
        name: h.name,
        serialNumber: h.serial_number,
        projectId: h.project_id || "",
        capacity: h.capacity || "",
        freeSpace: h.free_space || "",
        data: h.data || "",
        driveType: (h.drive_type as HardDrive["driveType"]) || "backup",
        cables: h.cables as HardDrive["cables"],
        createdAt: h.created_at,
        updatedAt: h.updated_at,
      })));

      const { data: historyData, error: historyError } = await supabase
        .from('print_history')
        .select('*');
      if (historyError) throw historyError;
      
      setPrintHistory(historyData.map(h => ({
        id: h.id,
        type: h.type as PrintType,
        hardDriveId: h.hard_drive_id,
        projectId: h.project_id,
        operatorName: h.operator_name,
        timestamp: h.timestamp,
      })));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions with proper error handling
    const channel = supabase
      .channel('data-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, 
        () => {
          fetchData();
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hard_drives' },
        () => {
          fetchData();
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'print_history' },
        () => {
          fetchData();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to data updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error:', err);
          // Implement exponential backoff for retries
          let retryCount = 0;
          const maxRetries = 3;
          const retrySubscription = () => {
            if (retryCount < maxRetries) {
              retryCount++;
              const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setTimeout(() => {
                console.log(`🔄 Retrying subscription (attempt ${retryCount}/${maxRetries})...`);
            channel.unsubscribe();
                channel.subscribe();
              }, delay);
            } else {
              console.error('❌ Max retry attempts reached for data updates subscription');
              toast({
                title: "Connection Error",
                description: "Failed to establish real-time connection. Please refresh the page.",
                variant: "destructive",
              });
            }
          };
          retrySubscription();
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [toast]);

  const addProject = async (project: Omit<Project, "id" | "createdAt">) => {
    const dbProject = {
      name: project.name,
      description: project.description,
      type: project.type
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([dbProject])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
      throw error;
    }

    const newProject: Project = {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      createdAt: data.created_at,
      type: data.type || undefined,
    };

    setProjects(currentProjects => [...currentProjects, newProject]);

    return data.id;
  };

  const updateProject = async (project: Project) => {
    const dbProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type
    };

    const { error } = await supabase
      .from('projects')
      .update(dbProject)
      .eq('id', project.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
      throw error;
    }

    setProjects(currentProjects => currentProjects.filter(p => p.id !== id));
    
    setHardDrives(currentHardDrives => currentHardDrives.filter(h => h.projectId !== id));
  };

  const addHardDrive = async (hardDrive: Omit<HardDrive, "id" | "createdAt" | "updatedAt">) => {
    try {
      const dbHardDrive = {
        name: hardDrive.name,
        serial_number: hardDrive.serialNumber,
        project_id: hardDrive.projectId || null,
        capacity: hardDrive.capacity,
        free_space: hardDrive.freeSpace,
        data: hardDrive.data,
        drive_type: hardDrive.driveType,
        cables: hardDrive.cables
      };

      const { data, error } = await supabase
        .from('hard_drives')
        .insert([dbHardDrive])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newHardDrive: HardDrive = {
        id: data.id,
        name: data.name,
        serialNumber: data.serial_number,
        projectId: data.project_id || "",
        capacity: data.capacity || "",
        freeSpace: data.free_space || "",
        data: data.data || "",
        driveType: (data.drive_type as HardDrive["driveType"]) || "backup",
        cables: data.cables as HardDrive["cables"],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setHardDrives(currentHardDrives => [...currentHardDrives, newHardDrive]);

      toast({
        title: "Success",
        description: "Hard drive added successfully",
      });

      return data.id;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add hard drive",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateHardDrive = async (hardDrive: HardDrive) => {
    try {
      const dbHardDrive = {
        name: hardDrive.name,
        serial_number: hardDrive.serialNumber,
        project_id: hardDrive.projectId || null,
        capacity: hardDrive.capacity,
        free_space: hardDrive.freeSpace,
        data: hardDrive.data,
        drive_type: hardDrive.driveType,
        cables: hardDrive.cables
      };

      const { error } = await supabase
        .from('hard_drives')
        .update(dbHardDrive)
        .eq('id', hardDrive.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Hard drive updated successfully",
      });
      
      // Force refetch to ensure we have the latest data
      await fetchData();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update hard drive",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteHardDrive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hard_drives')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Hard drive deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete hard drive",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getHardDrive = (id: string) => {
    return hardDrives.find((h) => h.id === id);
  };

  const getProject = (id: string) => {
    return projects.find((p) => p.id === id);
  };

  const getHardDrivesByProject = (projectId: string) => {
    return hardDrives.filter((h) => h.projectId === projectId);
  };

  const addPrintHistory = async (history: Omit<PrintHistory, "id" | "timestamp">) => {
    const dbHistory = {
      type: history.type,
      hard_drive_id: history.hardDriveId,
      project_id: history.projectId,
      operator_name: history.operatorName
    };

    const { error, data } = await supabase
      .from('print_history')
      .insert([dbHistory])
      .select();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save print history",
        variant: "destructive",
      });
      throw error;
    }

    if (data && data.length > 0) {
      const newPrintHistory: PrintHistory = {
        id: data[0].id,
        type: data[0].type as PrintType,
        hardDriveId: data[0].hard_drive_id,
        projectId: data[0].project_id,
        operatorName: data[0].operator_name,
        timestamp: data[0].timestamp,
      };

      // Update the local state immediately
      setPrintHistory(currentHistory => [...currentHistory, newPrintHistory]);
    }
  };

  const getPrintHistory = () => {
    return printHistory;
  };

  const value = {
    projects,
    hardDrives,
    addProject,
    updateProject,
    deleteProject,
    addHardDrive,
    updateHardDrive,
    deleteHardDrive,
    getHardDrive,
    getProject,
    getHardDrivesByProject,
    printHistory,
    addPrintHistory,
    getPrintHistory,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
