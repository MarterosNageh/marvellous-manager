export const SHIFT_TEMPLATES = {
  DAY_OFF: {
    shift_type: 'day-off',
    title: 'Day Off',
    color: '#FF6B6B', // Red color for day off
    is_all_day: true,
    hours: 0,
  },
  UNPAID_LEAVE: {
    shift_type: 'unpaid',
    title: 'Unpaid Leave',
    color: '#F44336', // Red color for unpaid leave
    is_all_day: true,
    hours: 0,
  },
  EXTRA_DAYS: {
    shift_type: 'extra',
    title: 'Extra Days',
    color: '#4CAF50', // Green color for extra days
    is_all_day: true,
    hours: 0,
  },
  PUBLIC_HOLIDAY: {
    shift_type: 'public-holiday',
    title: 'Public Holiday',
    color: '#757575', // Gray color for public holiday
    is_all_day: true,
    hours: 0,
  },
  SICK_LEAVE: {
    shift_type: 'sick-leave',
    title: 'Sick Leave',
    color: '#FF6B6B', // Red color for sick leave
    is_all_day: true,
    hours: 0,
  },
  ANNUAL_LEAVE: {
    shift_type: 'annual-leave',
    title: 'Annual Leave',
    color: '#4ECDC4', // Teal color for annual leave
    is_all_day: true,
    hours: 0,
  },
};

export const SHIFT_COLORS = {
  DEFAULT: '#6C5CE7', // Purple for regular shifts
  DAY_OFF: '#FF6B6B', // Red for day off
  UNPAID_LEAVE: '#F44336', // Red for unpaid leave
  EXTRA_DAYS: '#4CAF50', // Green for extra days
  PUBLIC_HOLIDAY: '#757575', // Gray for public holiday
  SICK_LEAVE: '#FF6B6B', // Red for sick leave
  ANNUAL_LEAVE: '#4ECDC4', // Teal for annual leave
}; 