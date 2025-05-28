
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

// VAPID keys for Web Push
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HycWqhiyzysOsqTFHBl4EKbtKWN5s8VawQGJw_ioFQsqZpUJhOsG-2Q-F8'

async function sendWebPushNotification(subscription: PushSubscription, payload: any) {
  console.log('📱 Attempting to send push notification to:', subscription.endpoint.substring(0, 50) + '...')
  
  const webPushPayload = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
    tag: payload.tag || 'default',
    requireInteraction: true,
    vibrate: [200, 100, 200]
  }

  try {
    console.log('📤 Sending to endpoint:', subscription.endpoint)
    
    // Use Web Push protocol for different push services
    let response;
    
    if (subscription.endpoint.includes('fcm.googleapis.com')) {
      // Firebase Cloud Messaging
      response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TTL': '86400',
        },
        body: JSON.stringify({
          to: subscription.endpoint.split('/').pop(),
          notification: webPushPayload
        })
      })
    } else {
      // Standard Web Push
      response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'TTL': '86400',
        },
        body: JSON.stringify(webPushPayload)
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
  console.log('📱 === PUSH NOTIFICATION EDGE FUNCTION CALLED ===')
  console.log('🔗 Request method:', req.method)
  console.log('🔗 Request URL:', req.url)
  
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
    console.log('📱 === PUSH NOTIFICATION REQUEST DETAILS ===')
    console.log('👥 Target users:', userIds)
    console.log('📢 Title:', title)
    console.log('💬 Body:', body)
    console.log('📦 Data:', data)

    // Get push subscriptions for the specified users
    console.log('🔍 Querying push_subscriptions table...')
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('❌ Error fetching subscriptions:', error)
      throw error
    }

    console.log('📱 Query result - subscriptions found:', subscriptions?.length || 0)
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        console.log(`  ${index + 1}. User: ${sub.user_id}, Endpoint: ${sub.endpoint.substring(0, 50)}...`)
      })
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No push subscriptions found for users:', userIds)
      
      // Check if there are ANY subscriptions in the table
      const { data: allSubs, error: allSubsError } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint')
        .limit(10);
        
      if (allSubsError) {
        console.error('❌ Error checking all subscriptions:', allSubsError)
      } else {
        console.log('📊 Total subscriptions in table:', allSubs?.length || 0)
        if (allSubs && allSubs.length > 0) {
          console.log('📋 Existing subscriptions:')
          allSubs.forEach((sub, index) => {
            console.log(`  ${index + 1}. User: ${sub.user_id}, Endpoint: ${sub.endpoint.substring(0, 50)}...`)
          })
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No subscriptions found for target users',
          sentCount: 0,
          targetUsers: userIds.length,
          totalSubscriptionsInDB: allSubs?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send push notifications to all found subscriptions
    console.log('📤 Sending push notifications to', subscriptions.length, 'subscriptions...')
    const pushPromises = subscriptions.map(async (subscription: PushSubscription, index: number) => {
      console.log(`📤 [${index + 1}/${subscriptions.length}] Sending push to user ${subscription.user_id}`)
      
      const result = await sendWebPushNotification(subscription, {
        title,
        body,
        data: data || {},
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: data?.tag || 'default'
      })

      console.log(`📤 [${index + 1}/${subscriptions.length}] Result:`, result.success ? '✅ Success' : `❌ Failed: ${result.error}`)

      return {
        userId: subscription.user_id,
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        ...result
      }
    })

    const results = await Promise.all(pushPromises)
    const successCount = results.filter(r => r.success).length
    
    console.log('📱 === PUSH NOTIFICATION RESULTS SUMMARY ===')
    console.log(`✅ Successful: ${successCount}/${results.length}`)
    console.log(`❌ Failed: ${results.length - successCount}/${results.length}`)
    console.log('📊 Detailed results:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        sentCount: successCount,
        totalSubscriptions: results.length,
        targetUsers: userIds.length,
        message: `Push notifications sent to ${successCount}/${results.length} subscriptions`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: 'Check function logs for more information'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
