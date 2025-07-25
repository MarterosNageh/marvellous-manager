export type RecurrenceAction = 'this' | 'future' | 'previous';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'senior' | 'operator' | 'producer';
  title?: string;
  balance?: number;
  isAdmin?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  type?: string;
  status?: string;
}

export interface HardDrive {
  id: string;
  name: string;
  serialNumber: string;
  projectId: string;
  capacity: string;
  freeSpace: string;
  data: string;
  driveType: 'backup' | 'taxi' | 'passport';
  status: string;
  cables: {
    thunderbolt3: boolean;
    typeC: boolean;
    power: boolean;
    usb3: boolean;
    passport: boolean;
    other: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type PrintType = 'hard-out' | 'hard-in' | 'all-hards' | 'label' | 'hard-label';

export interface PrintData {
  type: PrintType;
  hardDriveId?: string;
  projectId?: string;
  operatorName: string;
}

export interface PrintHistory {
  id: string;
  type: PrintType;
  hardDriveId: string | null;
  projectId: string | null;
  operatorName: string;
  timestamp: string;
}

export interface Shift {
  id: string;
  user_id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  title?: string;
  description?: string;
  notes?: string;
  status?: 'active' | 'inactive';
  created_by?: string;
  repeat_days?: number[];
  created_at?: string;
  updated_at?: string;
}
