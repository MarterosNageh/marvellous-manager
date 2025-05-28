
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
      console.log('❌ Push messaging is not supported');
      return false;
    }

    try {
      console.log('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('❌ Notification permission denied');
        return false;
      }

      console.log('⚙️ Getting service worker registration...');
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('📝 Creating new push subscription...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
        console.log('✅ New push subscription created');
      } else {
        console.log('♻️ Using existing push subscription');
      }

      // Save subscription to Supabase
      const saved = await this.saveSubscription(subscription as unknown as PushSubscriptionData);
      
      if (saved) {
        console.log('✅ Push notification subscription successful');
        return true;
      } else {
        console.log('❌ Failed to save push subscription');
        return false;
      }
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

  private async saveSubscription(subscription: PushSubscriptionData): Promise<boolean> {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.log('❌ No current user found, cannot save push subscription');
        return false;
      }

      const user = JSON.parse(currentUser);
      console.log('💾 Saving push subscription for user:', user.id);
      console.log('📱 Subscription endpoint:', subscription.endpoint);
      
      // Use upsert to handle existing subscriptions
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth
        }, {
          onConflict: 'user_id,endpoint'
        })
        .select();

      if (error) {
        console.error('❌ Error saving push subscription:', error);
        return false;
      } else {
        console.log('✅ Push subscription saved successfully:', data);
        
        // Verify subscription was saved by checking the database
        const { data: verification, error: verifyError } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id);
          
        if (verifyError) {
          console.error('❌ Error verifying subscription:', verifyError);
        } else {
          console.log('🔍 Verified subscriptions for user:', verification);
        }
        
        return true;
      }
    } catch (error) {
      console.error('❌ Error saving subscription:', error);
      return false;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription();
        console.log('✅ Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error unsubscribing:', error);
      return false;
    }
  }

  private async removeSubscription(): Promise<void> {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      const user = JSON.parse(currentUser);
      
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error removing push subscription:', error);
      } else {
        console.log('✅ Push subscription removed from database');
      }
    } catch (error) {
      console.error('❌ Error removing subscription:', error);
    }
  }

  async sendPushNotification(userIds: string[], title: string, body: string, data?: any): Promise<void> {
    try {
      console.log('📱 === SENDING PUSH NOTIFICATIONS VIA SUPABASE ===');
      console.log('👥 Target users:', userIds);
      console.log('📢 Title:', title);
      console.log('💬 Body:', body);
      
      // First, check how many subscriptions exist for these users
      const { data: subscriptionCheck, error: checkError } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint')
        .in('user_id', userIds);
        
      if (checkError) {
        console.error('❌ Error checking subscriptions:', checkError);
      } else {
        console.log('🔍 Found subscriptions before sending:', subscriptionCheck);
      }
      
      const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds,
          title,
          body,
          data
        }
      });

      if (error) {
        console.error('❌ Error invoking push notification function:', error);
      } else {
        console.log('✅ Push notification function response:', result);
        console.log(`📊 Sent to ${result?.sentCount || 0}/${result?.totalSubscriptions || 0} subscriptions`);
      }
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
    }
  }

  async getSubscriptionStatus(): Promise<boolean> {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return false;

      const user = JSON.parse(currentUser);
      
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('❌ Error checking subscription status:', error);
        return false;
      }
      
      console.log('🔍 Current subscriptions for user:', data);
      return (data && data.length > 0);
    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
