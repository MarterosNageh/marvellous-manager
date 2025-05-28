
import { useEffect } from 'react';
import { notificationService } from '@/services/notificationService';

export const useNotifications = () => {
  useEffect(() => {
    const initNotifications = async () => {
      // Initialize notification service
      await notificationService.init();
      
      // Request permission immediately
      const hasPermission = await notificationService.requestPermission();
      
      if (hasPermission) {
        console.log('Notifications enabled successfully');
      } else {
        console.log('Notifications permission denied or unavailable');
      }
    };

    initNotifications();
  }, []);

  return { notificationService };
};
