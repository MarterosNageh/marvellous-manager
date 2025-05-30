
import { supabase } from '@/integrations/supabase/client';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private vapidPublicKey = 'BL7ELSlram2dAgx2Hm1BTEKD9EjvCcxkIqJaUNZjD1HNg_O2zzMiA5d9I5A5mPKZJVk7T2tLWS-4kzRv6fTuwS4';

  // Enhanced subscription status check
  async getSubscriptionStatus(): Promise<boolean> {
    console.log('🔍 Checking comprehensive subscription status...');
    
    try {
      // Check browser subscription
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('❌ Browser does not support push notifications');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const browserSubscription = await registration.pushManager.getSubscription();
      console.log('🔍 Browser subscription:', browserSubscription ? 'Found' : 'None');
      
      if (!browserSubscription) {
        console.log('❌ No browser subscription found');
        return false;
      }

      // Check database subscription
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.log('❌ No current user found');
        return false;
      }

      const user = JSON.parse(currentUser);
      const { data: dbSubscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('endpoint', browserSubscription.endpoint);

      if (error) {
        console.error('❌ Database subscription check failed:', error);
        return false;
      }

      const hasDbSubscription = dbSubscriptions && dbSubscriptions.length > 0;
      console.log('🔍 Database subscription match:', hasDbSubscription ? 'Found' : 'None');
      
      // Both browser and database must have matching subscription
      const isFullySubscribed = !!(browserSubscription && hasDbSubscription);
      console.log('🔍 Full subscription status:', isFullySubscribed);
      
      return isFullySubscribed;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return false;
    }
  }

  // Enhanced permission and subscription request
  async requestPermissionAndSubscribe(): Promise<boolean> {
    console.log('🚀 === ENHANCED PUSH NOTIFICATION SETUP ===');
    
    try {
      // Step 1: Check browser support
      if (!('serviceWorker' in navigator)) {
        console.error('❌ Service Worker not supported');
        return false;
      }

      if (!('PushManager' in window)) {
        console.error('❌ Push Manager not supported');
        return false;
      }

      if (!('Notification' in window)) {
        console.error('❌ Notifications not supported');
        return false;
      }

      // Step 2: Request notification permission
      console.log('🔔 Requesting notification permission...');
      console.log('🔔 Current permission:', Notification.permission);
      
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
        console.log('🔔 Permission after request:', permission);
      }

      if (permission !== 'granted') {
        console.error('❌ Notification permission denied');
        return false;
      }

      // Step 3: Wait for service worker to be ready
      console.log('⏳ Waiting for service worker...');
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready:', registration.scope);

      // Step 4: Check for existing subscription
      console.log('🔍 Checking for existing subscription...');
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('✅ Existing subscription found:', subscription.endpoint.substring(0, 50) + '...');
      } else {
        // Step 5: Create new subscription
        console.log('📱 Creating new push subscription...');
        console.log('🔑 Using VAPID key:', this.vapidPublicKey.substring(0, 20) + '...');
        
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
          });
          console.log('✅ New subscription created:', subscription.endpoint.substring(0, 50) + '...');
        } catch (subscribeError) {
          console.error('❌ Failed to create subscription:', subscribeError);
          return false;
        }
      }

      // Step 6: Store subscription in database
      console.log('💾 Storing subscription in database...');
      const stored = await this.storeSubscription(subscription);
      
      if (stored) {
        console.log('✅ === PUSH NOTIFICATION SETUP COMPLETE ===');
        return true;
      } else {
        console.error('❌ Failed to store subscription in database');
        return false;
      }

    } catch (error) {
      console.error('❌ Push notification setup failed:', error);
      return false;
    }
  }

  // Enhanced subscription storage with conflict handling
  private async storeSubscription(subscription: PushSubscription): Promise<boolean> {
    console.log('💾 Storing push subscription...');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.error('❌ No current user found for subscription storage');
        return false;
      }

      const user = JSON.parse(currentUser);
      console.log('👤 Storing for user:', user.id);

      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        console.error('❌ Missing subscription keys');
        return false;
      }

      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
        auth_key: btoa(String.fromCharCode(...new Uint8Array(authKey)))
      };

      console.log('💾 Subscription data:', {
        user_id: subscriptionData.user_id,
        endpoint: subscriptionData.endpoint.substring(0, 50) + '...',
        p256dh_length: subscriptionData.p256dh_key.length,
        auth_length: subscriptionData.auth_key.length
      });

      // Check for existing subscription with same endpoint
      const { data: existing, error: checkError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      if (checkError) {
        console.error('❌ Error checking existing subscription:', checkError);
        return false;
      }

      if (existing && existing.length > 0) {
        console.log('🔄 Updating existing subscription...');
        const { error: updateError } = await supabase
          .from('push_subscriptions')
          .update({
            p256dh_key: subscriptionData.p256dh_key,
            auth_key: subscriptionData.auth_key,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing[0].id);

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError);
          return false;
        }
        console.log('✅ Subscription updated successfully');
      } else {
        console.log('📝 Creating new subscription record...');
        const { error: insertError } = await supabase
          .from('push_subscriptions')
          .insert(subscriptionData);

        if (insertError) {
          console.error('❌ Error storing subscription:', insertError);
          return false;
        }
        console.log('✅ Subscription stored successfully');
      }

      // Verify storage
      await this.verifySubscriptionStorage(user.id, subscription.endpoint);
      
      return true;
    } catch (error) {
      console.error('❌ Error in storeSubscription:', error);
      return false;
    }
  }

  // Enhanced subscription verification
  private async verifySubscriptionStorage(userId: string, endpoint: string): Promise<void> {
    console.log('🔍 Verifying subscription storage...');
    
    try {
      const { data: stored, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('❌ Verification query failed:', error);
        return;
      }

      if (stored && stored.length > 0) {
        console.log('✅ Subscription verified in database:', {
          id: stored[0].id,
          created_at: stored[0].created_at,
          updated_at: stored[0].updated_at
        });
      } else {
        console.error('❌ Subscription not found in database after storage');
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
    }
  }

  // Enhanced subscription checking and cleanup
  async checkAllSubscriptions(): Promise<void> {
    console.log('🔍 === COMPREHENSIVE SUBSCRIPTION CHECK ===');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.log('⚠️ No current user found');
        return;
      }

      const user = JSON.parse(currentUser);
      console.log('👤 Checking subscriptions for user:', user.id);

      // Get all database subscriptions for this user
      const { data: dbSubscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Database query failed:', error);
        return;
      }

      console.log('📊 Database subscriptions found:', dbSubscriptions?.length || 0);
      
      if (dbSubscriptions && dbSubscriptions.length > 0) {
        console.log('📋 Database subscription details:');
        dbSubscriptions.forEach((sub, index) => {
          console.log(`  ${index + 1}. ID: ${sub.id}`);
          console.log(`     Endpoint: ${sub.endpoint.substring(0, 50)}...`);
          console.log(`     Created: ${sub.created_at}`);
          console.log(`     Updated: ${sub.updated_at}`);
        });
      }

      // Get current browser subscription
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const browserSubscription = await registration.pushManager.getSubscription();
        
        if (browserSubscription) {
          console.log('🌐 Current browser subscription:', browserSubscription.endpoint.substring(0, 50) + '...');
          
          // Check if browser subscription matches any database subscription
          const matches = dbSubscriptions?.filter(sub => sub.endpoint === browserSubscription.endpoint) || [];
          console.log('🔗 Matching database records:', matches.length);
          
          if (matches.length === 0) {
            console.log('⚠️ Browser subscription not found in database - may need to re-register');
          }
        } else {
          console.log('🌐 No current browser subscription');
        }
      }
      
      console.log('✅ === SUBSCRIPTION CHECK COMPLETE ===');
    } catch (error) {
      console.error('❌ Error checking subscriptions:', error);
    }
  }

  // Enhanced unsubscription
  async unsubscribe(): Promise<boolean> {
    console.log('🗑️ Unsubscribing from push notifications...');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.error('❌ No current user found');
        return false;
      }

      const user = JSON.parse(currentUser);

      // Unsubscribe from browser
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          console.log('🗑️ Unsubscribing from browser...');
          await subscription.unsubscribe();
          console.log('✅ Browser unsubscription successful');
        }
      }

      // Remove from database
      console.log('🗑️ Removing from database...');
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Database removal failed:', error);
        return false;
      }

      console.log('✅ Database removal successful');
      return true;
    } catch (error) {
      console.error('❌ Unsubscription failed:', error);
      return false;
    }
  }

  // Enhanced push notification sending
  async sendPushNotification(userIds: string[], title: string, body: string, data: any = {}): Promise<any> {
    console.log('📤 === SENDING PUSH NOTIFICATION ===');
    console.log('👥 Target users:', userIds);
    console.log('📢 Title:', title);
    console.log('💬 Body:', body);
    console.log('📦 Data:', data);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds,
          title,
          body,
          data
        }
      });

      if (error) {
        console.error('❌ Push notification failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Push notification response:', response);
      return response;
    } catch (error) {
      console.error('❌ Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility function to convert VAPID key
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
}

export const pushNotificationService = new PushNotificationService();
