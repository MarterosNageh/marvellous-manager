
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

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*');
        if (projectsError) throw projectsError;
        setProjects(projectsData);

        // Fetch hard drives
        const { data: hardDrivesData, error: hardDrivesError } = await supabase
          .from('hard_drives')
          .select('*');
        if (hardDrivesError) throw hardDrivesError;
        setHardDrives(hardDrivesData);

        // Fetch print history
        const { data: historyData, error: historyError } = await supabase
          .from('print_history')
          .select('*');
        if (historyError) throw historyError;
        setPrintHistory(historyData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      }
    };

    fetchData();

    // Subscribe to real-time changes
    const projectsSubscription = supabase
      .channel('public:projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProjects(current => [...current, payload.new as Project]);
          } else if (payload.eventType === 'UPDATE') {
            setProjects(current => 
              current.map(p => p.id === payload.new.id ? payload.new as Project : p)
            );
          } else if (payload.eventType === 'DELETE') {
            setProjects(current => current.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const hardDrivesSubscription = supabase
      .channel('public:hard_drives')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hard_drives' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setHardDrives(current => [...current, payload.new as HardDrive]);
          } else if (payload.eventType === 'UPDATE') {
            setHardDrives(current => 
              current.map(h => h.id === payload.new.id ? payload.new as HardDrive : h)
            );
          } else if (payload.eventType === 'DELETE') {
            setHardDrives(current => current.filter(h => h.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      projectsSubscription.unsubscribe();
      hardDrivesSubscription.unsubscribe();
    };
  }, [toast]);

  const addProject = async (project: Omit<Project, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
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

    return data.id;
  };

  const updateProject = async (project: Project) => {
    const { error } = await supabase
      .from('projects')
      .update(project)
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
  };

  const addHardDrive = async (hardDrive: Omit<HardDrive, "id" | "createdAt" | "updatedAt">) => {
    const { data, error } = await supabase
      .from('hard_drives')
      .insert([hardDrive])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create hard drive",
        variant: "destructive",
      });
      throw error;
    }

    return data.id;
  };

  const updateHardDrive = async (hardDrive: HardDrive) => {
    const { error } = await supabase
      .from('hard_drives')
      .update(hardDrive)
      .eq('id', hardDrive.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update hard drive",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteHardDrive = async (id: string) => {
    const { error } = await supabase
      .from('hard_drives')
      .delete()
      .eq('id', id);

    if (error) {
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

  const addPrintHistory = async (
    history: Omit<PrintHistory, "id" | "timestamp">
  ) => {
    const { error } = await supabase
      .from('print_history')
      .insert([history])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save print history",
        variant: "destructive",
      });
      throw error;
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
