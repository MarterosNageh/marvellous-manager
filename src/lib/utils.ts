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

// Helper function to get shift color based on leave type
export const getShiftColorByLeaveType = (leaveType: LeaveType): string => {
  switch (leaveType) {
    case 'day-off':
      return '#FF9800'; // Orange
    case 'unpaid-leave':
      return '#F44336'; // Red
    case 'public-holiday':
      return '#2196F3'; // Blue
    case 'extra-day':
      return '#9C27B0'; // Purple
    case 'paid':
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
    case 'unpaid-leave':
      return 'Unpaid Leave';
    case 'public-holiday':
      return 'Public Holiday';
    case 'extra-day':
      return 'Extra Day';
    case 'paid':
      return 'Paid Leave';
    default:
      return 'Time Off';
  }
};
