import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LeaveType } from '@/types/schedule';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getShiftColor(shiftType: string): string {
  switch (shiftType) {
    case 'morning':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'night':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'on-call':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function getHardDriveStatusColor(status: string): string {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'unavailable':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'in_use':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'retired':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function getProjectStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'unavailable':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'on_hold':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-green-100 text-green-800 border-green-300'; // Default to active/green
  }
}

// Helper function to get shift color based on leave type
export const getShiftColorByLeaveType = (leaveType: string): string => {
  switch (leaveType) {
    case 'day-off':
      return '#FF9800'; // Orange
    case 'unpaid':
    case 'unpaid-leave':
      return '#F44336'; // Red
    case 'public-holiday':
      return '#757575'; // Grey
    case 'extra':
    case 'extra-days':
    case 'extra-day':
      return '#4CAF50'; // Green
    default:
      return '#757575'; // Grey
  }
};

// Helper function to get shift title based on leave type
export const getShiftTitleByLeaveType = (leaveType: LeaveType): string => {
  switch (leaveType) {
    case 'day-off':
      return 'Day Off';
    case 'unpaid':
      return 'Unpaid Leave';
    case 'public-holiday':
      return 'Public Holiday';
    case 'extra':
      return 'Extra Day';
    default:
      return 'Time Off';
  }
};
