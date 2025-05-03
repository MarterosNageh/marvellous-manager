
export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  type?: string;
}

export interface HardDrive {
  id: string;
  name: string;
  serialNumber: string;
  projectId: string;
  capacity: string;
  freeSpace: string;
  data: string;
  cables: {
    thunderbolt3: boolean;
    typeC: boolean;
    power: boolean;
    usb3: boolean;
    other: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type PrintType = 'hard-out' | 'hard-in' | 'all-hards' | 'label';

export interface PrintData {
  type: PrintType;
  hardDriveId?: string;
  projectId?: string;
  operatorName: string;
}
