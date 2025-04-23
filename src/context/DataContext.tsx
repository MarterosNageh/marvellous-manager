import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Project, HardDrive, PrintType } from "@/types";

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
  addProject: (project: Omit<Project, "id" | "createdAt">) => string;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addHardDrive: (hardDrive: Omit<HardDrive, "id" | "createdAt" | "updatedAt">) => string;
  updateHardDrive: (hardDrive: HardDrive) => void;
  deleteHardDrive: (id: string) => void;
  getHardDrive: (id: string) => HardDrive | undefined;
  getProject: (id: string) => Project | undefined;
  getHardDrivesByProject: (projectId: string) => HardDrive[];
  printHistory: PrintHistory[];
  addPrintHistory: (history: Omit<PrintHistory, "id" | "timestamp">) => void;
  getPrintHistory: () => PrintHistory[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const storedProjects = localStorage.getItem("projects");
    return storedProjects ? JSON.parse(storedProjects) : [];
  });

  const [hardDrives, setHardDrives] = useState<HardDrive[]>(() => {
    const storedHardDrives = localStorage.getItem("hardDrives");
    return storedHardDrives ? JSON.parse(storedHardDrives) : [];
  });

  const [printHistory, setPrintHistory] = useState<PrintHistory[]>(() => {
    const stored = localStorage.getItem("printHistory");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("hardDrives", JSON.stringify(hardDrives));
  }, [hardDrives]);

  useEffect(() => {
    localStorage.setItem("printHistory", JSON.stringify(printHistory));
  }, [printHistory]);

  const addProject = (project: Omit<Project, "id" | "createdAt">) => {
    const id = `project-${Date.now()}`;
    const newProject: Project = {
      ...project,
      id,
      createdAt: new Date().toISOString(),
    };
    
    setProjects((prev) => [...prev, newProject]);
    return id;
  };

  const updateProject = (project: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? project : p))
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setHardDrives((prev) => prev.filter((h) => h.projectId !== id));
  };

  const addHardDrive = (hardDrive: Omit<HardDrive, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const id = `hard-${Date.now()}`;
    const newHardDrive: HardDrive = {
      ...hardDrive,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    setHardDrives((prev) => [...prev, newHardDrive]);
    return id;
  };

  const updateHardDrive = (hardDrive: HardDrive) => {
    const updatedHardDrive = {
      ...hardDrive,
      updatedAt: new Date().toISOString(),
    };
    
    setHardDrives((prev) =>
      prev.map((h) => (h.id === hardDrive.id ? updatedHardDrive : h))
    );
  };

  const deleteHardDrive = (id: string) => {
    setHardDrives((prev) => prev.filter((h) => h.id !== id));
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

  const addPrintHistory = (
    history: Omit<PrintHistory, "id" | "timestamp">
  ) => {
    const newHistory: PrintHistory = {
      ...history,
      id: `print-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setPrintHistory((prev) => [...prev, newHistory]);
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
