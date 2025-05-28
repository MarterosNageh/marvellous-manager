
import { useEffect } from 'react';
import { notificationService } from '@/services/notificationService';

export const useNotifications = () => {
  useEffect(() => {
    // Initialize notification service
    notificationService.init();

    // Request permission on first load
    notificationService.requestPermission();
  }, []);

  return { notificationService };
};
