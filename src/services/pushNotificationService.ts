import { supabase } from '@/integrations/supabase/client';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  // Correct VAPID key for marvellous-manager project
  private vapidPublicKey = 'BL7ELSlram2dAgx2Hm1BTEKD9EjvCcxkIqJaUNZjD1HNg_O2zzMiA5d9I5A5mPKZJVk7T2tLWS-4kzRv6fTuwS4';
  
  // State management to prevent multiple concurrent operations
  private isSetupInProgress = false;
  private lastSetupTime = 0;
  private SETUP_COOLDOWN = 10000; // 10 seconds cooldown

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
      
      // Check push_subscriptions table for subscriptions
      const { data: pushSubs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('endpoint', browserSubscription.endpoint);

      const hasDbSubscription = pushSubs && pushSubs.length > 0;
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
    // Prevent multiple concurrent setups
    const now = Date.now();
    if (this.isSetupInProgress || (now - this.lastSetupTime < this.SETUP_COOLDOWN)) {
      console.log('🔍 Setup cooldown active or in progress, skipping...');
      return true; // Return true to avoid showing errors
    }

    this.isSetupInProgress = true;
    this.lastSetupTime = now;

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
        
        // Force re-store the existing subscription to fix database issues
        console.log('🔄 Re-storing existing subscription in database...');
        const stored = await this.storeSubscription(subscription);
        
        if (stored) {
          console.log('✅ === EXISTING SUBSCRIPTION RE-STORED SUCCESSFULLY ===');
          return true;
        } else {
          console.log('⚠️ Failed to store existing subscription, creating new one...');
          // Continue to create new subscription
        }
      }

      // Step 5: Create new subscription if needed
      if (!subscription) {
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
    } finally {
      this.isSetupInProgress = false;
    }
  }

  // Enhanced subscription storage with conflict handling
  private async storeSubscription(subscription: PushSubscription): Promise<boolean> {
    console.log('💾 === STORING PUSH SUBSCRIPTION ===');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.error('❌ No current user found for subscription storage');
        return false;
      }

      const user = JSON.parse(currentUser);
      console.log('👤 Storing for user:', user.id);
      console.log('📍 Endpoint:', subscription.endpoint.substring(0, 50) + '...');

      // Get subscription keys
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        console.error('❌ Missing subscription keys');
        return false;
      }

      console.log('🔑 Keys extracted successfully');
      console.log('🔑 P256DH length:', p256dhKey.byteLength);
      console.log('🔑 Auth length:', authKey.byteLength);

      // Convert keys to base64
      const p256dhBase64 = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)));
      const authBase64 = btoa(String.fromCharCode(...new Uint8Array(authKey)));

      console.log('🔄 Keys converted to base64');
      console.log('🔄 P256DH base64 length:', p256dhBase64.length);
      console.log('🔄 Auth base64 length:', authBase64.length);

      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: p256dhBase64,
        auth_key: authBase64
      };

      console.log('💾 Prepared subscription data for storage');

      // First, delete any existing subscriptions for this user to avoid conflicts
      console.log('🧹 Cleaning up existing subscriptions for user...');
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.warn('⚠️ Warning during cleanup (may be normal):', deleteError.message);
      } else {
        console.log('✅ Cleanup completed');
      }

      // Insert new subscription
      console.log('📝 Inserting new subscription...');
      const { data: insertedData, error: insertError } = await supabase
        .from('push_subscriptions')
        .insert(subscriptionData)
        .select();

      if (insertError) {
        console.error('❌ Error inserting subscription:', insertError);
        console.error('❌ Error details:', insertError.details);
        console.error('❌ Error hint:', insertError.hint);
        return false;
      }

      console.log('✅ Subscription inserted successfully:', insertedData);

      // Verify storage immediately
      console.log('🔍 Verifying storage...');
      const verified = await this.verifySubscriptionStorage(user.id, subscription.endpoint);
      
      if (verified) {
        console.log('✅ === SUBSCRIPTION STORAGE VERIFIED ===');
        return true;
      } else {
        console.error('❌ Storage verification failed');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error in storeSubscription:', error);
      return false;
    }
  }

  // Enhanced subscription verification
  private async verifySubscriptionStorage(userId: string, endpoint: string): Promise<boolean> {
    console.log('🔍 === VERIFYING SUBSCRIPTION STORAGE ===');
    console.log('👤 User ID:', userId);
    console.log('📍 Endpoint:', endpoint.substring(0, 50) + '...');
    
    try {
      const { data: stored, error, count } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('❌ Verification query failed:', error);
        return false;
      }

      console.log('📊 Query results:');
      console.log('📊 Count:', count);
      console.log('📊 Data length:', stored?.length || 0);

      if (stored && stored.length > 0) {
        console.log('✅ Subscription verified in database:');
        stored.forEach((sub, index) => {
          console.log(`  ${index + 1}. ID: ${sub.id}`);
          console.log(`     Created: ${sub.created_at}`);
          console.log(`     Updated: ${sub.updated_at}`);
          console.log(`     Endpoint: ${sub.endpoint.substring(0, 50)}...`);
        });
        return true;
      } else {
        console.error('❌ Subscription not found in database after storage');
        return false;
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
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
