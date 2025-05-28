

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
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
        console.log('📱 New push subscription created');
      } else {
        console.log('📱 Using existing push subscription');
      }

      // Save subscription to your backend
      await this.saveSubscription(subscription as unknown as PushSubscriptionData);
      
      console.log('📱 Push notification subscription successful');
      return true;
    } catch (error) {
      console.error('❌ Error setting up push notifications:', error);
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
      if (!currentUser) {
        console.log('❌ No current user found, cannot save push subscription');
        return;
      }

      const user = JSON.parse(currentUser);
      console.log('💾 Saving push subscription for user:', user.id);
      
      // Use Supabase client to upsert push subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ Error saving push subscription:', error);
      } else {
        console.log('✅ Push subscription saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving subscription:', error);
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
      
      // Use Supabase client to delete push subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing push subscription:', error);
      }
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  }

  async sendPushNotification(userIds: string[], title: string, body: string, data?: any): Promise<void> {
    try {
      console.log('📱 === SENDING PUSH TO ALL DEVICES ===');
      console.log('📱 Target users:', userIds);
      console.log('📱 Title:', title);
      console.log('📱 Body:', body);
      
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds,
          title,
          body,
          data
        }
      });

      if (error) {
        console.error('❌ Error sending push notification:', error);
      } else {
        console.log('✅ Push notification sent to all devices successfully');
      }
    } catch (error) {
      console.error('❌ Error invoking push notification function:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();

