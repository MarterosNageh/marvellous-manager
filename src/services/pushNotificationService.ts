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
    console.log('🔍 === CHECKING COMPREHENSIVE SUBSCRIPTION STATUS ===');
    
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
      console.log('👤 Checking database for user:', user.id);
      
      // Check push_subscriptions table for subscriptions
      const { data: pushSubs, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Database query error:', error);
        return false;
      }

      console.log('📊 Database subscriptions found:', pushSubs?.length || 0);
      if (pushSubs && pushSubs.length > 0) {
        console.log('📋 Database subscription details:');
        pushSubs.forEach((sub, index) => {
          console.log(`  ${index + 1}. Endpoint: ${sub.endpoint.substring(0, 50)}...`);
          console.log(`     Created: ${sub.created_at}`);
        });
      }

      const hasDbSubscription = pushSubs && pushSubs.length > 0;
      
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

    console.log('🚀 === COMPLETE PUSH NOTIFICATION SETUP ===');
    
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

      // Step 4: Check for existing subscription and unsubscribe first
      console.log('🔍 Checking for existing subscription...');
      let existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        console.log('🗑️ Unsubscribing from existing subscription...');
        await existingSubscription.unsubscribe();
        console.log('✅ Unsubscribed from existing subscription');
      }

      // Step 5: Create fresh subscription
      console.log('📱 Creating fresh push subscription...');
      console.log('🔑 Using VAPID key:', this.vapidPublicKey.substring(0, 20) + '...');
      
      let subscription: PushSubscription;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
        console.log('✅ Fresh subscription created:', subscription.endpoint.substring(0, 50) + '...');
      } catch (subscribeError) {
        console.error('❌ Failed to create subscription:', subscribeError);
        return false;
      }

      // Step 6: Store subscription in database with retry logic
      console.log('💾 Storing subscription in database...');
      const stored = await this.storeSubscriptionWithRetry(subscription, 3);
      
      if (stored) {
        console.log('✅ === PUSH NOTIFICATION SETUP COMPLETE ===');
        return true;
      } else {
        console.error('❌ Failed to store subscription in database after retries');
        return false;
      }

    } catch (error) {
      console.error('❌ Push notification setup failed:', error);
      return false;
    } finally {
      this.isSetupInProgress = false;
    }
  }

  // Store subscription with retry logic
  private async storeSubscriptionWithRetry(subscription: PushSubscription, maxRetries: number): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`💾 Storage attempt ${attempt}/${maxRetries}`);
      
      const success = await this.storeSubscription(subscription);
      if (success) {
        return true;
      }
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return false;
  }

  // Enhanced subscription storage with complete cleanup and verification
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

      // Convert keys to base64
      const p256dhBase64 = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)));
      const authBase64 = btoa(String.fromCharCode(...new Uint8Array(authKey)));

      console.log('🔄 Keys converted to base64');

      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: p256dhBase64,
        auth_key: authBase64
      };

      console.log('💾 Prepared subscription data for storage');

      // First, completely clean up existing subscriptions for this user
      console.log('🧹 === CLEANING UP EXISTING SUBSCRIPTIONS ===');
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('❌ Error during cleanup:', deleteError);
        // Continue anyway as this might be expected if no existing subscriptions
      } else {
        console.log('✅ Cleanup completed successfully');
      }

      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Insert new subscription
      console.log('📝 === INSERTING NEW SUBSCRIPTION ===');
      const { data: insertedData, error: insertError } = await supabase
        .from('push_subscriptions')
        .insert(subscriptionData)
        .select();

      if (insertError) {
        console.error('❌ Error inserting subscription:', insertError);
        console.error('❌ Error code:', insertError.code);
        console.error('❌ Error message:', insertError.message);
        console.error('❌ Error details:', insertError.details);
        console.error('❌ Error hint:', insertError.hint);
        return false;
      }

      console.log('✅ Subscription inserted successfully:', insertedData);

      // Verify storage immediately with detailed logging
      console.log('🔍 === VERIFYING STORAGE ===');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for database consistency
      
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

  // Enhanced subscription verification with detailed logging
  private async verifySubscriptionStorage(userId: string, endpoint: string): Promise<boolean> {
    console.log('🔍 === VERIFYING SUBSCRIPTION STORAGE ===');
    console.log('👤 User ID:', userId);
    console.log('📍 Endpoint:', endpoint.substring(0, 50) + '...');
    
    try {
      // First check by user ID only
      const { data: allUserSubs, error: userError, count: userCount } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (userError) {
        console.error('❌ User verification query failed:', userError);
        return false;
      }

      console.log('📊 All subscriptions for user:');
      console.log('📊 Count:', userCount);
      console.log('📊 Data length:', allUserSubs?.length || 0);

      if (allUserSubs && allUserSubs.length > 0) {
        console.log('📋 User subscriptions:');
        allUserSubs.forEach((sub, index) => {
          console.log(`  ${index + 1}. ID: ${sub.id}`);
          console.log(`     Created: ${sub.created_at}`);
          console.log(`     Endpoint: ${sub.endpoint.substring(0, 50)}...`);
          console.log(`     Matches: ${sub.endpoint === endpoint}`);
        });
      }

      // Now check for exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (exactError) {
        console.error('❌ Exact match verification failed:', exactError);
        return false;
      }

      const hasExactMatch = exactMatch && exactMatch.length > 0;
      console.log('🎯 Exact endpoint match:', hasExactMatch);

      if (hasExactMatch) {
        console.log('✅ Subscription verified in database');
        return true;
      } else {
        console.error('❌ No exact endpoint match found');
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
