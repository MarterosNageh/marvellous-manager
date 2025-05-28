
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
    console.log('Sending push notifications to:', userIds)

    // Get push subscriptions for the specified users
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)

    if (error) {
      console.error('Error fetching subscriptions:', error)
      throw error
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for users:', userIds)
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send push notifications to each subscription
    const pushPromises = subscriptions.map(async (subscription: PushSubscription) => {
      try {
        const pushPayload = {
          title,
          body,
          data: data || {},
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        }

        // For demo purposes, we'll use the Web Push Protocol
        // In production, you'd use a service like Firebase Cloud Messaging, OneSignal, etc.
        console.log('Would send push notification to:', subscription.endpoint)
        console.log('Payload:', pushPayload)
        
        // Here you would implement actual push sending using web-push library
        // For now, we'll just log the attempt
        return { success: true, endpoint: subscription.endpoint }
      } catch (error) {
        console.error('Error sending to subscription:', error)
        return { success: false, endpoint: subscription.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(pushPromises)
    console.log('Push notification results:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Push notifications processed for ${results.length} subscriptions`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
