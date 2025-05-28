
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

// VAPID keys for Web Push (these should match your client-side keys)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HycWqhiyzysOsqTFHBl4EKbtKWN5s8VawQGJw_ioFQsqZpUJhOsG-2Q-F8'
const VAPID_PRIVATE_KEY = 'your-vapid-private-key' // This should be stored as a secret

async function sendWebPushNotification(subscription: PushSubscription, payload: any) {
  const webPushPayload = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
    tag: payload.tag || 'default',
    requireInteraction: true
  }

  try {
    // Use fetch to send the push notification via Web Push API
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400', // 24 hours
      },
      body: JSON.stringify(webPushPayload)
    })

    if (!response.ok) {
      console.error('Push notification failed:', response.status, response.statusText)
      return { success: false, error: `HTTP ${response.status}` }
    }

    console.log('✅ Push notification sent successfully to:', subscription.endpoint)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending push notification:', error)
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { userIds, title, body, data } = await req.json()
    console.log('📱 === PUSH NOTIFICATION REQUEST ===')
    console.log('👥 Target users:', userIds)
    console.log('📢 Title:', title)
    console.log('💬 Body:', body)

    // Get push subscriptions for the specified users
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('❌ Error fetching subscriptions:', error)
      throw error
    }

    console.log('📱 Found subscriptions:', subscriptions?.length || 0)

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No push subscriptions found for users:', userIds)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No subscriptions found',
          sentCount: 0,
          targetUsers: userIds.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send push notifications to all found subscriptions
    const pushPromises = subscriptions.map(async (subscription: PushSubscription) => {
      console.log(`📤 Sending push to user ${subscription.user_id} via ${subscription.endpoint}`)
      
      const result = await sendWebPushNotification(subscription, {
        title,
        body,
        data: data || {},
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: data?.tag || 'default'
      })

      return {
        userId: subscription.user_id,
        endpoint: subscription.endpoint,
        ...result
      }
    })

    const results = await Promise.all(pushPromises)
    const successCount = results.filter(r => r.success).length
    
    console.log('📱 === PUSH NOTIFICATION RESULTS ===')
    console.log(`✅ Successful: ${successCount}/${results.length}`)
    console.log('📊 Results:', results)

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
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
