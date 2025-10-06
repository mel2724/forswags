import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || text.length > 280) {
      throw new Error('Tweet text is required and must be 280 characters or less');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user');
    }

    // Get Twitter access token
    const { data: account, error: accountError } = await supabaseClient
      .from('connected_accounts')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('platform', 'twitter')
      .single();

    if (accountError || !account) {
      throw new Error('Twitter account not connected');
    }

    // Check if token needs refresh
    let accessToken = account.access_token;
    if (new Date(account.expires_at) <= new Date()) {
      // Token expired, refresh it
      const refreshResponse = await refreshTwitterToken(account.refresh_token);
      accessToken = refreshResponse.access_token;
      
      // Update stored tokens
      await supabaseClient
        .from('connected_accounts')
        .update({
          access_token: refreshResponse.access_token,
          refresh_token: refreshResponse.refresh_token,
          expires_at: new Date(Date.now() + refreshResponse.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('platform', 'twitter');
    }

    // Post tweet
    const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!tweetResponse.ok) {
      const errorText = await tweetResponse.text();
      console.error('Twitter post error:', errorText);
      throw new Error('Failed to post tweet');
    }

    const result = await tweetResponse.json();

    return new Response(
      JSON.stringify({ success: true, tweetId: result.data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Twitter post error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshTwitterToken(refreshToken: string) {
  const TWITTER_CLIENT_ID = Deno.env.get('TWITTER_CLIENT_ID');
  
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: TWITTER_CLIENT_ID!,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Twitter token');
  }

  return await response.json();
}
