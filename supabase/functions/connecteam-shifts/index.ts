
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the API key from Supabase secrets
    const apiKey = Deno.env.get('CONNECTEAM_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Format dates for the API request (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];

    console.log(`Fetching shifts from Connecteam from ${fromDate} to ${toDate}`);

    // Call the Connecteam API
    const response = await fetch(
      `https://api.connecteam.com/api/v2/shifts?fromDate=${fromDate}&toDate=${toDate}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      }
    );

    if (!response.ok) {
      // Try to get error details
      let errorDetails;
      try {
        // Attempt to parse as JSON first
        errorDetails = await response.json();
      } catch (e) {
        // If not JSON, get as text
        errorDetails = await response.text();
        console.error('Non-JSON error response:', errorDetails);
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch shifts', 
          status: response.status,
          statusText: response.statusText,
          details: typeof errorDetails === 'string' ? errorDetails.substring(0, 1000) : errorDetails 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Attempt to parse response as JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      const textResponse = await response.text();
      console.error('Raw response:', textResponse.substring(0, 500)); // Log the first 500 chars
      return new Response(
        JSON.stringify({ error: 'Invalid JSON response from Connecteam API', details: parseError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Successfully fetched ${data.shifts?.length || 0} shifts from Connecteam`);
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
