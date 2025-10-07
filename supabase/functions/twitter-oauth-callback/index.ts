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
    const TWITTER_CLIENT_ID = Deno.env.get('TWITTER_CLIENT_ID');
    if (!TWITTER_CLIENT_ID) {
      throw new Error('TWITTER_CLIENT_ID not configured');
    }

    const { code, redirectUri } = await req.json();
    
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

    // Get code verifier from database
    const { data: oauthState, error: stateError } = await supabaseClient
      .from('oauth_state')
      .select('code_verifier')
      .eq('user_id', user.id)
      .eq('platform', 'twitter')
      .single();

    if (stateError || !oauthState) {
      throw new Error('OAuth state not found');
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: redirectUri,
        code_verifier: oauthState.code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Twitter token error:', errorText);
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await tokenResponse.json();
    
    // Get user info
    const userInfoResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();
    const username = userInfo.data?.username || 'Unknown';

    // Encrypt and store tokens in connected_accounts (SECURITY FIX)
    const { data: encryptedAccess, error: encryptError1 } = await supabaseClient
      .rpc('encrypt_oauth_token', { token: tokens.access_token });
    
    const { data: encryptedRefresh, error: encryptError2 } = tokens.refresh_token
      ? await supabaseClient.rpc('encrypt_oauth_token', { token: tokens.refresh_token })
      : { data: null, error: null };

    if (encryptError1 || encryptError2) {
      console.error('Encryption error:', encryptError1 || encryptError2);
      throw new Error('Failed to encrypt tokens');
    }

    const { error: insertError } = await supabaseClient
      .from('connected_accounts')
      .upsert({
        user_id: user.id,
        platform: 'twitter',
        account_name: username,
        encrypted_access_token: encryptedAccess,
        encrypted_refresh_token: encryptedRefresh,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing tokens:', insertError);
      throw new Error('Failed to store tokens');
    }

    // Clean up oauth state
    await supabaseClient
      .from('oauth_state')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', 'twitter');

    return new Response(
      JSON.stringify({ success: true, username }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    // Return generic error to client (SECURITY FIX: don't expose internal details)
    return new Response(
      JSON.stringify({ error: 'Failed to connect Twitter account. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
