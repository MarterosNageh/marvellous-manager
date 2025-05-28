
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
    console.log('🔔 === STARTING PUSH NOTIFICATION SETUP ===');
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('❌ Push messaging is not supported');
      return false;
    }

    try {
      console.log('🔔 Step 1: Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('🔔 Permission result:', permission);
      
      if (permission !== 'granted') {
        console.log('❌ Notification permission denied');
        return false;
      }

      console.log('⚙️ Step 2: Getting service worker registration...');
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      console.log('🔍 Existing subscription:', subscription ? 'Found' : 'None');
      
      if (!subscription) {
        console.log('📝 Step 3: Creating new push subscription...');
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
          });
          console.log('✅ New push subscription created:', subscription.endpoint);
        } catch (subscribeError) {
          console.error('❌ Failed to create push subscription:', subscribeError);
          return false;
        }
      } else {
        console.log('♻️ Using existing push subscription:', subscription.endpoint);
      }

      // Save subscription to Supabase
      console.log('💾 Step 4: Saving subscription to database...');
      const saved = await this.saveSubscription(subscription as unknown as PushSubscriptionData);
      
      if (saved) {
        console.log('✅ Push notification subscription completed successfully');
        
        // Verify the subscription was actually saved
        await this.verifySubscriptionSaved();
        return true;
      } else {
        console.log('❌ Failed to save push subscription to database');
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
      console.log('📱 Subscription details:');
      console.log('  - Endpoint:', subscription.endpoint);
      console.log('  - p256dh key length:', subscription.keys.p256dh.length);
      console.log('  - auth key length:', subscription.keys.auth.length);
      
      // First check if subscription already exists
      const { data: existingSubscription, error: checkError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing subscription:', checkError);
      }

      if (existingSubscription) {
        console.log('ℹ️ Subscription already exists, updating...');
        const { data, error } = await supabase
          .from('push_subscriptions')
          .update({
            p256dh_key: subscription.keys.p256dh,
            auth_key: subscription.keys.auth,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)
          .select();

        if (error) {
          console.error('❌ Error updating existing subscription:', error);
          return false;
        } else {
          console.log('✅ Existing subscription updated successfully:', data);
          return true;
        }
      } else {
        console.log('➕ Creating new subscription...');
        const { data, error } = await supabase
          .from('push_subscriptions')
          .insert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh_key: subscription.keys.p256dh,
            auth_key: subscription.keys.auth
          })
          .select();

        if (error) {
          console.error('❌ Error creating new subscription:', error);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
          return false;
        } else {
          console.log('✅ New subscription saved successfully:', data);
          return true;
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error saving subscription:', error);
      return false;
    }
  }

  private async verifySubscriptionSaved(): Promise<void> {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return;

      const user = JSON.parse(currentUser);
      
      console.log('🔍 Verifying subscription was saved...');
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('❌ Error verifying subscription:', error);
      } else {
        console.log('🔍 Current subscriptions in database:', subscriptions);
        console.log(`📊 Total subscriptions for user ${user.id}:`, subscriptions?.length || 0);
        
        if (subscriptions && subscriptions.length > 0) {
          subscriptions.forEach((sub, index) => {
            console.log(`  ${index + 1}. ID: ${sub.id}, Endpoint: ${sub.endpoint.substring(0, 50)}...`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error during verification:', error);
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
        console.log(`📊 Total subscriptions found: ${subscriptionCheck?.length || 0}`);
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

  async checkAllSubscriptions(): Promise<void> {
    try {
      console.log('🔍 === CHECKING ALL PUSH SUBSCRIPTIONS ===');
      const { data: allSubscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*');
        
      if (error) {
        console.error('❌ Error fetching all subscriptions:', error);
      } else {
        console.log(`📊 Total subscriptions in database: ${allSubscriptions?.length || 0}`);
        if (allSubscriptions && allSubscriptions.length > 0) {
          allSubscriptions.forEach((sub, index) => {
            console.log(`  ${index + 1}. User: ${sub.user_id}, Endpoint: ${sub.endpoint.substring(0, 50)}...`);
          });
        } else {
          console.log('⚠️ No push subscriptions found in database!');
        }
      }
    } catch (error) {
      console.error('❌ Error checking all subscriptions:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
