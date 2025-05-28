
import { supabase } from "@/integrations/supabase/client";

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HycWqhiyzysOsqTFHBl4EKbtKWN5s8VawQGJw_ioFQsqZpUJhOsG-2Q-F8';
  
  async requestPermissionAndSubscribe(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging is not supported');
      return false;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Save subscription to your backend
      await this.saveSubscription(subscription as unknown as PushSubscriptionData);
      
      console.log('Push notification subscription successful');
      return true;
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async saveSubscription(subscription: PushSubscriptionData): Promise<void> {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      const user = JSON.parse(currentUser);
      
      // Use raw SQL query to insert into push_subscriptions table
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            endpoint = EXCLUDED.endpoint,
            p256dh_key = EXCLUDED.p256dh_key,
            auth_key = EXCLUDED.auth_key,
            updated_at = NOW()
        `,
        args: [user.id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
      });

      if (error) {
        console.error('Error saving push subscription:', error);
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription();
        console.log('Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  private async removeSubscription(): Promise<void> {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      const user = JSON.parse(currentUser);
      
      // Use raw SQL query to delete from push_subscriptions table
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'DELETE FROM push_subscriptions WHERE user_id = $1',
        args: [user.id]
      });

      if (error) {
        console.error('Error removing push subscription:', error);
      }
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  }

  async sendPushNotification(userIds: string[], title: string, body: string, data?: any): Promise<void> {
    try {
      console.log('Sending push notification to users:', userIds);
      
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds,
          title,
          body,
          data
        }
      });

      if (error) {
        console.error('Error sending push notification:', error);
      } else {
        console.log('Push notification sent successfully');
      }
    } catch (error) {
      console.error('Error invoking push notification function:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
