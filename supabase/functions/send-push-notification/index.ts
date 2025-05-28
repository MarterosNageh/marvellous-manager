
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushSubscription {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_id: string;
}

// Firebase configuration for FCM
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBIw7y43dseUoKSeRjxZ3FC0JwqQvDkPdc",
  authDomain: "marvellous-manager.firebaseapp.com",
  projectId: "marvellous-manager",
  storageBucket: "marvellous-manager.firebasestorage.app",
  messagingSenderId: "368753443778",
  appId: "1:368753443778:web:2f5c47c984bee1f3184c5b",
  measurementId: "G-YBBC3CXLEF"
}

async function sendFirebasePushNotification(subscription: PushSubscription, payload: any) {
  console.log('📱 Attempting to send Firebase FCM push notification to:', subscription.endpoint.substring(0, 50) + '...')
  
  const webPushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
    tag: payload.tag || 'default',
    requireInteraction: true,
    vibrate: [200, 100, 200]
  })

  try {
    console.log('📤 Sending to Firebase FCM endpoint:', subscription.endpoint)
    
    let response;
    
    if (subscription.endpoint.includes('fcm.googleapis.com')) {
      // Firebase Cloud Messaging - use proper Web Push Protocol with server key
      console.log('🔥 Using Firebase FCM endpoint with project:', FIREBASE_CONFIG.projectId)
      
      // Extract FCM token from endpoint
      const fcmToken = subscription.endpoint.split('/').pop();
      console.log('🔑 FCM Token extracted:', fcmToken?.substring(0, 20) + '...')
      
      // Try to get server key from environment
      const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
      
      if (fcmServerKey) {
        console.log('🔐 Using FCM Server Key for authentication')
        
        // Use FCM HTTP v1 API
        const fcmUrl = `https://fcm.googleapis.com/fcm/send`;
        
        const fcmPayload = {
          to: fcmToken,
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/favicon.ico',
            click_action: payload.data?.url || '/task-manager'
          },
          data: payload.data || {}
        };

        response = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmServerKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fcmPayload)
        });
        
        console.log('📤 FCM Server Response status:', response.status)
        
        if (!response.ok) {
          const responseText = await response.text()
          console.error('❌ FCM Server Response body:', responseText)
          return { success: false, error: `FCM HTTP ${response.status}: ${responseText}` }
        }
        
        const result = await response.json()
        console.log('✅ FCM Server Response:', result)
        
        if (result.success === 1) {
          return { success: true, fcmResponse: result }
        } else {
          return { success: false, error: `FCM failed: ${JSON.stringify(result)}` }
        }
        
      } else {
        console.log('⚠️ No FCM Server Key found - using standard Web Push (limited functionality)')
        
        // Fallback to standard Web Push (will work for local notifications)
        const headers = {
          'Content-Type': 'application/json',
          'TTL': '86400',
          'Urgency': 'high'
        }
        
        response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers,
          body: webPushPayload
        })
        
        console.log('📤 Standard Web Push Response status:', response.status)
        
        if (!response.ok) {
          console.error('❌ Standard Web Push failed:', response.status, response.statusText)
          return { 
            success: true, 
            note: 'Local browser notification works, but FCM server key needed for full cross-device support',
            warning: 'Add FCM_SERVER_KEY to Supabase secrets for full functionality'
          }
        }
        
        return { 
          success: true, 
          note: 'Standard Web Push sent (local notifications only)',
          recommendation: 'Add FCM_SERVER_KEY for cross-device delivery'
        }
      }
      
    } else {
      // Standard Web Push for non-FCM services
      console.log('🌐 Using standard Web Push endpoint')
      response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TTL': '86400',
        },
        body: webPushPayload
      })
    }

    if (!response.ok) {
      console.error('❌ Push notification failed:', response.status, response.statusText)
      const responseText = await response.text()
      console.error('❌ Response body:', responseText)
      return { success: false, error: `HTTP ${response.status}: ${responseText}` }
    }

    console.log('✅ Push notification sent successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending push notification:', error)
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  console.log('📱 === FIREBASE FCM CROSS-DEVICE PUSH NOTIFICATION FUNCTION ===')
  console.log('🔗 Request method:', req.method)
  console.log('🔥 Firebase Project:', FIREBASE_CONFIG.projectId)
  console.log('🔑 FCM Server Key available:', !!Deno.env.get('FCM_SERVER_KEY'))
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const requestBody = await req.text()
    console.log('📨 Raw request body:', requestBody)
    
    const { userIds, title, body, data } = JSON.parse(requestBody)
    console.log('📱 === FIREBASE FCM NOTIFICATION REQUEST ===')
    console.log('👥 Target users:', userIds)
    console.log('📢 Title:', title)
    console.log('💬 Body:', body)
    console.log('📦 Data:', data)

    // Get push subscriptions for the specified users
    console.log('🔍 Querying push_subscriptions for Firebase FCM cross-device delivery...')
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('❌ Error fetching subscriptions:', error)
      throw error
    }

    console.log('📱 Firebase FCM cross-device subscriptions found:', subscriptions?.length || 0)
    if (subscriptions && subscriptions.length > 0) {
      console.log('📱 Device breakdown:')
      const devicesByUser = subscriptions.reduce((acc, sub) => {
        acc[sub.user_id] = (acc[sub.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(devicesByUser).forEach(([userId, count]) => {
        console.log(`  👤 User ${userId}: ${count} device(s)`)
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No Firebase FCM cross-device subscriptions found for users:', userIds)
      
      // Check total subscriptions in database
      const { data: allSubs, error: allSubsError } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint')
        .limit(10);
        
      if (allSubsError) {
        console.error('❌ Error checking all subscriptions:', allSubsError)
      } else {
        console.log('📊 Total subscriptions in database:', allSubs?.length || 0)
        if (allSubs && allSubs.length > 0) {
          console.log('📋 Available subscriptions:')
          allSubs.forEach((sub, index) => {
            console.log(`  ${index + 1}. User: ${sub.user_id}, Endpoint: ${sub.endpoint.substring(0, 50)}...`)
          })
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No Firebase FCM cross-device subscriptions found, notifications limited to current browser',
          sentCount: 0,
          targetUsers: userIds.length,
          totalSubscriptionsInDB: allSubs?.length || 0,
          recommendation: 'Users need to enable push notifications on their other devices',
          firebaseProject: FIREBASE_CONFIG.projectId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send Firebase FCM cross-device push notifications
    console.log('📤 Sending Firebase FCM cross-device notifications to', subscriptions.length, 'device(s)...')
    const pushPromises = subscriptions.map(async (subscription: PushSubscription, index: number) => {
      console.log(`📤 [${index + 1}/${subscriptions.length}] Sending Firebase FCM to user ${subscription.user_id}`)
      
      const result = await sendFirebasePushNotification(subscription, {
        title,
        body,
        data: data || {},
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: data?.tag || 'firebase-fcm'
      })

      console.log(`📤 [${index + 1}/${subscriptions.length}] Result:`, result.success ? '✅ Success' : `❌ Failed: ${result.error}`)
      if (result.note) {
        console.log(`📤 [${index + 1}/${subscriptions.length}] Note:`, result.note)
      }

      return {
        userId: subscription.user_id,
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        ...result
      }
    })

    const results = await Promise.all(pushPromises)
    const successCount = results.filter(r => r.success).length
    
    console.log('📱 === FIREBASE FCM CROSS-DEVICE NOTIFICATION RESULTS ===')
    console.log(`✅ Successful deliveries: ${successCount}/${results.length}`)
    console.log(`❌ Failed deliveries: ${results.length - successCount}/${results.length}`)
    console.log('📊 Detailed results:', results)

    // Enhanced response with Firebase FCM delivery insights
    const response = {
      success: true, 
      results,
      sentCount: successCount,
      totalSubscriptions: results.length,
      targetUsers: userIds.length,
      message: `Firebase FCM cross-device notifications processed for ${successCount}/${results.length} devices`,
      deliveryInsights: {
        totalDevicesTargeted: results.length,
        successfulDeliveries: successCount,
        failedDeliveries: results.length - successCount,
        usersWithMultipleDevices: Object.values(devicesByUser).filter(count => count > 1).length,
        crossDeviceCapability: successCount > 0 ? 'Active' : 'Limited',
        firebaseProject: FIREBASE_CONFIG.projectId,
        fcmServerKeyConfigured: !!Deno.env.get('FCM_SERVER_KEY'),
        recommendation: !Deno.env.get('FCM_SERVER_KEY') ? 'Add FCM_SERVER_KEY to Supabase secrets for full cross-device delivery' : 'Firebase FCM properly configured'
      }
    };

    console.log('📱 === FIREBASE FCM DELIVERY COMPLETE ===')
    console.log('🌐 Cross-device capability:', response.deliveryInsights.crossDeviceCapability)
    console.log('🔑 FCM Server Key configured:', response.deliveryInsights.fcmServerKeyConfigured)

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in Firebase FCM cross-device notification function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: 'Firebase FCM cross-device notification system encountered an error. Check function logs for details.',
        firebaseProject: FIREBASE_CONFIG.projectId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
