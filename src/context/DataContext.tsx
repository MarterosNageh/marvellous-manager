
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Project, HardDrive, PrintType } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';
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
  hardDrives: HardDrive[];
  projects: Project[];
  printHistory: PrintHistory[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getHardDrive: (id: string) => HardDrive | undefined;
  getProject: (id: string) => Project | undefined;
  getHardDrivesByProject: (projectId: string) => HardDrive[];
  addHardDrive: (hardDrive: Omit<HardDrive, 'id' | 'createdAt'>) => Promise<string>;
  updateHardDrive: (id: string, updates: Partial<HardDrive>) => Promise<void>;
  deleteHardDrive: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addPrintHistory: (printRecord: Omit<PrintHistory, 'id' | 'timestamp'>) => Promise<void>;
  setUserContext: (userId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [hardDrives, setHardDrives] = useState<HardDrive[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [printHistory, setPrintHistory] = useState<PrintHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const setUserContext = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('set_config', {
        setting_name: 'app.current_user_id',
        new_value: userId,
        is_local: false
      });
      if (error) console.warn('Failed to set user context:', error);
    } catch (error) {
      console.warn('Failed to set user context for history tracking:', error);
    }
  };

  const getHardDrive = (id: string): HardDrive | undefined => {
    return hardDrives.find(hd => hd.id === id);
  };

  const getProject = (id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  };

  const getHardDrivesByProject = (projectId: string): HardDrive[] => {
    return hardDrives.filter(hd => hd.projectId === projectId);
  };

  const loadHardDrives = async () => {
    try {
      const { data, error } = await supabase
        .from('hard_drives')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData: HardDrive[] = (data || []).map(hd => ({
        id: hd.id,
        name: hd.name,
        serialNumber: hd.serial_number,
        driveType: hd.drive_type as 'backup' | 'taxi' | 'passport',
        projectId: hd.project_id,
        status: hd.status as 'available' | 'in-use' | 'maintenance' | 'retired',
        capacity: hd.capacity,
        freeSpace: hd.free_space,
        data: hd.data,
        cables: hd.cables as any,
        createdAt: hd.created_at,
        updatedAt: hd.updated_at,
      }));

      setHardDrives(transformedData);
    } catch (error) {
      console.error('Error loading hard drives:', error);
      setError('Failed to load hard drives');
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData: Project[] = (data || []).map(project => ({
        id: project.id,
        name: project.name,
        type: project.type,
        description: project.description,
        status: project.status as 'active' | 'completed' | 'on-hold' | 'cancelled' | 'unavailable',
        createdAt: project.created_at,
      }));

      setProjects(transformedData);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Failed to load projects');
    }
  };

  const loadPrintHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('print_history')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const transformedData: PrintHistory[] = (data || []).map(record => ({
        id: record.id,
        type: record.type as PrintType,
        hardDriveId: record.hard_drive_id,
        projectId: record.project_id,
        operatorName: record.operator_name,
        timestamp: record.timestamp,
      }));

      setPrintHistory(transformedData);
    } catch (error) {
      console.error('Error loading print history:', error);
      setError('Failed to load print history');
    }
  };

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    if (currentUser) {
      await setUserContext(currentUser.id);
    }
    
    await Promise.all([
      loadHardDrives(),
      loadProjects(),
      loadPrintHistory(),
    ]);
    
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addHardDrive = async (hardDriveData: Omit<HardDrive, 'id' | 'createdAt'>): Promise<string> => {
    if (currentUser) {
      await setUserContext(currentUser.id);
    }

    const { data, error } = await supabase
      .from('hard_drives')
      .insert([{
        name: hardDriveData.name,
        serial_number: hardDriveData.serialNumber,
        drive_type: hardDriveData.driveType,
        project_id: hardDriveData.projectId,
        status: hardDriveData.status,
        capacity: hardDriveData.capacity,
        free_space: hardDriveData.freeSpace,
        data: hardDriveData.data,
        cables: hardDriveData.cables,
      }])
      .select()
      .single();

    if (error) throw error;
    await refreshData();
    return data.id;
  };

  const updateHardDrive = async (id: string, updates: Partial<HardDrive>) => {
    if (currentUser) {
      await setUserContext(currentUser.id);
    }

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.serialNumber !== undefined) updateData.serial_number = updates.serialNumber;
    if (updates.driveType !== undefined) updateData.drive_type = updates.driveType;
    if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.freeSpace !== undefined) updateData.free_space = updates.freeSpace;
    if (updates.data !== undefined) updateData.data = updates.data;
    if (updates.cables !== undefined) updateData.cables = updates.cables;

    const { error } = await supabase
      .from('hard_drives')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    await refreshData();
  };

  const deleteHardDrive = async (id: string) => {
    if (currentUser) {
      await setUserContext(currentUser.id);
    }

    const { error } = await supabase
      .from('hard_drives')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await refreshData();
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt'>): Promise<string> => {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name: projectData.name,
        type: projectData.type,
        description: projectData.description,
        status: projectData.status,
      }])
      .select()
      .single();

    if (error) throw error;
    await refreshData();
    return data.id;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    await refreshData();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await refreshData();
  };

  const addPrintHistory = async (printData: Omit<PrintHistory, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase
      .from('print_history')
      .insert([{
        type: printData.type,
        hard_drive_id: printData.hardDriveId,
        project_id: printData.projectId,
        operator_name: printData.operatorName,
      }])
      .select()
      .single();

    if (error) throw error;
    await refreshData();
  };

  const value: DataContextType = {
    hardDrives,
    projects,
    printHistory,
    loading,
    error,
    refreshData,
    getHardDrive,
    getProject,
    getHardDrivesByProject,
    addHardDrive,
    updateHardDrive,
    deleteHardDrive,
    addProject,
    updateProject,
    deleteProject,
    addPrintHistory,
    setUserContext,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
