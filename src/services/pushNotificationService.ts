
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
    console.log('🔔 === STARTING ENHANCED PUSH NOTIFICATION SETUP ===');
    
    // Check browser support
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Worker not supported');
      return false;
    }
    
    if (!('PushManager' in window)) {
      console.log('❌ Push Manager not supported');
      return false;
    }
    
    if (!('Notification' in window)) {
      console.log('❌ Notifications not supported');
      return false;
    }

    try {
      console.log('🔔 Step 1: Checking notification permission...');
      console.log('🔔 Current permission:', Notification.permission);
      
      if (Notification.permission === 'denied') {
        console.log('❌ Notifications are blocked. User must enable them manually.');
        return false;
      }
      
      if (Notification.permission !== 'granted') {
        console.log('🔔 Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('🔔 Permission result:', permission);
        
        if (permission !== 'granted') {
          console.log('❌ Notification permission denied');
          return false;
        }
      }

      console.log('⚙️ Step 2: Getting service worker registration...');
      let registration;
      try {
        registration = await navigator.serviceWorker.ready;
        console.log('✅ Service worker ready');
      } catch (swError) {
        console.error('❌ Service worker error:', swError);
        
        // Try to register service worker
        console.log('🔄 Attempting to register service worker...');
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        console.log('✅ Service worker registered and ready');
      }
      
      // Check if already subscribed
      console.log('🔍 Step 3: Checking existing subscription...');
      let subscription = await registration.pushManager.getSubscription();
      console.log('🔍 Existing subscription:', subscription ? 'Found' : 'None');
      
      if (subscription) {
        console.log('🔍 Existing subscription endpoint:', subscription.endpoint);
        // Verify this subscription exists in database
        const dbHasSubscription = await this.verifySubscriptionInDatabase(subscription.endpoint);
        if (dbHasSubscription) {
          console.log('✅ Subscription already exists in database');
          return true;
        } else {
          console.log('⚠️ Subscription exists in browser but not in database, re-saving...');
        }
      }
      
      if (!subscription) {
        console.log('📝 Step 4: Creating new push subscription...');
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
          });
          console.log('✅ New push subscription created');
          console.log('📱 Subscription endpoint:', subscription.endpoint);
        } catch (subscribeError) {
          console.error('❌ Failed to create push subscription:', subscribeError);
          
          // More detailed error handling
          if (subscribeError.name === 'NotSupportedError') {
            console.error('❌ Push messaging is not supported');
          } else if (subscribeError.name === 'NotAllowedError') {
            console.error('❌ Permission denied for push notifications');
          } else if (subscribeError.name === 'InvalidStateError') {
            console.error('❌ Service worker is not in a valid state');
          }
          
          return false;
        }
      }

      // Save subscription to Supabase
      console.log('💾 Step 5: Saving subscription to database...');
      const saved = await this.saveSubscription(subscription);
      
      if (saved) {
        console.log('✅ Push notification subscription completed successfully');
        
        // Verify the subscription was actually saved
        await this.verifySubscriptionSaved();
        
        // Test the subscription immediately
        console.log('🧪 Step 6: Testing the subscription...');
        await this.testSubscription();
        
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

  private async verifySubscriptionInDatabase(endpoint: string): Promise<boolean> {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return false;

      const user = JSON.parse(currentUser);
      
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', endpoint)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error verifying subscription:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('❌ Error verifying subscription in database:', error);
      return false;
    }
  }

  private async testSubscription(): Promise<void> {
    try {
      console.log('🧪 Testing push subscription...');
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.log('❌ No current user for testing');
        return;
      }

      const user = JSON.parse(currentUser);
      
      // Send a test notification via the edge function
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds: [user.id],
          title: '🎉 Push Notifications Active!',
          body: 'This test confirms your push notifications are working correctly!',
          data: { 
            test: true, 
            timestamp: Date.now(),
            tag: 'setup-test'
          }
        }
      });

      if (error) {
        console.error('❌ Test notification failed:', error);
      } else {
        console.log('✅ Test notification sent:', data);
      }
    } catch (error) {
      console.error('❌ Error testing subscription:', error);
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

  private async saveSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.log('❌ No current user found, cannot save push subscription');
        return false;
      }

      const user = JSON.parse(currentUser);
      console.log('💾 Saving push subscription for user:', user.id);
      console.log('📱 Raw subscription object:', subscription);
      
      // Extract keys from the subscription object
      const subscriptionJSON = subscription.toJSON();
      console.log('📱 Subscription JSON:', subscriptionJSON);
      
      if (!subscriptionJSON.keys || !subscriptionJSON.keys.p256dh || !subscriptionJSON.keys.auth) {
        console.error('❌ Subscription keys are missing or invalid:', subscriptionJSON.keys);
        return false;
      }
      
      console.log('📱 Subscription details:');
      console.log('  - Endpoint:', subscriptionJSON.endpoint);
      console.log('  - p256dh key length:', subscriptionJSON.keys.p256dh.length);
      console.log('  - auth key length:', subscriptionJSON.keys.auth.length);
      
      // First, remove any existing subscriptions for this user to avoid duplicates
      console.log('🧹 Cleaning up existing subscriptions for user...');
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('⚠️ Error cleaning up existing subscriptions:', deleteError);
        // Continue anyway, as this might just mean no existing subscriptions
      }

      // Insert the new subscription
      console.log('➕ Creating new subscription...');
      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          endpoint: subscriptionJSON.endpoint,
          p256dh_key: subscriptionJSON.keys.p256dh,
          auth_key: subscriptionJSON.keys.auth
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
      console.log('🔄 Unsubscribing from push notifications...');
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Browser subscription removed');
      }
      
      await this.removeSubscription();
      console.log('✅ Unsubscribed from push notifications');
      return true;
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
      console.log('📱 === SENDING PUSH NOTIFICATIONS VIA ENHANCED SUPABASE ===');
      console.log('👥 Target users:', userIds);
      console.log('📢 Title:', title);
      console.log('💬 Body:', body);
      
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
