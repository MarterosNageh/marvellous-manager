export const SHIFT_TEMPLATES = {
  DAY_OFF: {
    shift_type: 'day-off',
    title: 'Day Off',
    color: '#FF6B6B', // Red color for day off
    is_all_day: true,
    hours: 0,
  },
  PUBLIC_HOLIDAY: {
    shift_type: 'public-holiday',
    title: 'Public Holiday',
    color: '#FFD93D', // Yellow color for public holiday
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
  PUBLIC_HOLIDAY: '#FFD93D', // Yellow for public holiday
  SICK_LEAVE: '#FF6B6B', // Red for sick leave
  ANNUAL_LEAVE: '#4ECDC4', // Teal for annual leave
}; 