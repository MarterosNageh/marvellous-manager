
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

    // First try to call the /me endpoint to test API connectivity
    console.log('Testing API connectivity with /me endpoint');
    
    const meResponse = await fetch(
      'https://api.connecteam.com/me',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
      }
    );
    
    console.log(`/me endpoint response status: ${meResponse.status}`);
    
    let meData;
    try {
      meData = await meResponse.json();
      console.log('ME endpoint response:', JSON.stringify(meData).substring(0, 200));
    } catch (error) {
      console.error('Error parsing /me response:', error);
      const meText = await meResponse.text();
      console.log('Raw /me response:', meText.substring(0, 200));
    }

    // If me endpoint doesn't work, we'll know it's an authentication/API key issue
    if (!meResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to authenticate with Connecteam API',
          meEndpointStatus: meResponse.status,
          meEndpointResponse: meData || 'Could not parse response',
          details: 'Please verify your API key is correct and has the necessary permissions'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // If me endpoint works, proceed with shifts endpoint
    // Format dates for the API request (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];

    console.log(`Fetching shifts from Connecteam from ${fromDate} to ${toDate}`);
    
    // Call the Connecteam API with more detailed logging
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

    console.log(`Shifts API Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorDetails;
      try {
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
          details: typeof errorDetails === 'string' ? errorDetails.substring(0, 1000) : errorDetails,
          meEndpointWorking: true
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
        JSON.stringify({ 
          error: 'Invalid JSON response from Connecteam API', 
          details: parseError.message,
          rawResponse: textResponse.substring(0, 200),
          meEndpointWorking: true
        }),
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
