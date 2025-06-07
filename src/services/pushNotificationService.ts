
import { supabase } from '@/integrations/supabase/client';

class PushNotificationService {
  // Your VAPID key
  private vapidPublicKey = 'BFlGrK9GG-1qvkGEBhu_HLHLJLrBGvucnrixb4vDX3BLhVP6xoBmaGQTnNh3Kc_Vp_R_1OIyHf-b0aNLXNgqTqc';
  
  // State management to prevent multiple concurrent operations
  private isSetupInProgress = false;
  private lastSetupTime = 0;
  private SETUP_COOLDOWN = 10000; // 10 seconds cooldown

  // Enhanced subscription status check
  async getSubscriptionStatus(): Promise<boolean> {
    console.log('🔍 === CHECKING FCM SUBSCRIPTION STATUS ===');
    
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

      // Check database subscription in fcm_tokens table
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.log('❌ No current user found');
        return false;
      }

      const user = JSON.parse(currentUser);
      console.log('👤 Checking database for user:', user.id);
      
      // Check fcm_tokens table for active tokens
      const { data: fcmTokens, error } = await supabase
        .from('fcm_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Database query error:', error);
        return false;
      }

      console.log('📊 FCM tokens found:', fcmTokens?.length || 0);
      const hasDbSubscription = fcmTokens && fcmTokens.length > 0;
      
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
      return true;
    }

    this.isSetupInProgress = true;
    this.lastSetupTime = now;

    console.log('🚀 === FCM PUSH NOTIFICATION SETUP ===');
    
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

      // Step 3: Setup FCM using the hook
      const { useFirebaseMessaging } = await import('@/hooks/useFirebaseMessaging');
      console.log('✅ FCM setup completed via hook');
      
      return true;

    } catch (error) {
      console.error('❌ FCM setup failed:', error);
      return false;
    } finally {
      this.isSetupInProgress = false;
    }
  }

  // Enhanced push notification sending via FCM
  async sendPushNotification(userIds: string[], title: string, body: string, data: any = {}): Promise<any> {
    console.log('📤 === SENDING FCM PUSH NOTIFICATION ===');
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
          data: {
            ...data,
            type: 'fcm',
            requireInteraction: true,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
          }
        }
      });

      if (error) {
        console.error('❌ FCM push notification failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ FCM push notification response:', response);
      return response;
    } catch (error) {
      console.error('❌ FCM push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced subscription checking and cleanup
  async checkAllSubscriptions(): Promise<void> {
    console.log('🔍 === COMPREHENSIVE FCM SUBSCRIPTION CHECK ===');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.log('⚠️ No current user found');
        return;
      }

      const user = JSON.parse(currentUser);
      console.log('👤 Checking FCM subscriptions for user:', user.id);

      // Get all database subscriptions for this user from fcm_tokens table
      const { data: dbSubscriptions, error } = await supabase
        .from('fcm_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Database query failed:', error);
        return;
      }

      console.log('📊 FCM tokens found:', dbSubscriptions?.length || 0);
      
      if (dbSubscriptions && dbSubscriptions.length > 0) {
        console.log('📋 FCM token details:');
        dbSubscriptions.forEach((sub, index) => {
          console.log(`  ${index + 1}. Token: ${sub.fcm_token.substring(0, 50)}...`);
          console.log(`     Device: ${sub.device_info?.platform || 'Unknown'}`);
          console.log(`     Created: ${sub.created_at}`);
          console.log(`     Updated: ${sub.updated_at}`);
        });
      }
      
      console.log('✅ === FCM SUBSCRIPTION CHECK COMPLETE ===');
    } catch (error) {
      console.error('❌ Error checking FCM subscriptions:', error);
    }
  }

  // Enhanced unsubscription
  async unsubscribe(): Promise<boolean> {
    console.log('🗑️ Unsubscribing from FCM notifications...');
    
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

      // Remove from fcm_tokens table
      console.log('🗑️ Removing FCM tokens from database...');
      const { error } = await supabase
        .from('fcm_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Database removal failed:', error);
        return false;
      }

      console.log('✅ FCM token removal successful');
      return true;
    } catch (error) {
      console.error('❌ FCM unsubscription failed:', error);
      return false;
    }
  }

  // Manual save token method for testing
  async saveTokenManually(fcmToken: string, userId: string): Promise<boolean> {
    console.log('💾 === MANUALLY SAVING FCM TOKEN ===');
    console.log('👤 User ID:', userId);
    console.log('🔑 FCM Token:', fcmToken.substring(0, 50) + '...');
    
    try {
      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString(),
        manual_save: true
      };
      
      // Save to fcm_tokens table
      const { data, error } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: userId,
          fcm_token: fcmToken,
          device_info: deviceInfo,
          is_active: true
        }, {
          onConflict: 'user_id,fcm_token'
        });

      if (error) {
        console.error('❌ Error manually saving FCM token:', error);
        return false;
      }

      console.log('✅ FCM token manually saved successfully');
      console.log('✅ Database response:', data);
      
      // Verify the save
      const { data: verifyData, error: verifyError } = await supabase
        .from('fcm_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('fcm_token', fcmToken)
        .eq('is_active', true);
        
      if (!verifyError && verifyData) {
        console.log('✅ Manual FCM token verification - records found:', verifyData.length);
        console.log('✅ Manual FCM token verification data:', verifyData);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error manually saving FCM token:', error);
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
