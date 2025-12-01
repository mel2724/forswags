import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const twitterPostSchema = z.object({
  text: z.string().min(1, "Tweet text is required").max(280, "Tweet must be 280 characters or less"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validationResult = twitterPostSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { text } = validationResult.data;

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

    // Get encrypted Twitter tokens (SECURITY FIX: using encrypted storage)
    const { data: account, error: accountError } = await supabaseClient
      .from('connected_accounts')
      .select('encrypted_access_token, encrypted_refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('platform', 'twitter')
      .single();

    if (accountError || !account) {
      throw new Error('Twitter account not connected');
    }

    // Decrypt access token
    const { data: decryptedAccess, error: decryptError } = await supabaseClient
      .rpc('decrypt_oauth_token', { encrypted_token: account.encrypted_access_token });

    if (decryptError || !decryptedAccess) {
      console.error('Decryption error:', decryptError);
      throw new Error('Failed to decrypt token');
    }

    // Check if token needs refresh
    let accessToken = decryptedAccess;
    if (new Date(account.expires_at) <= new Date()) {
      // Token expired, decrypt refresh token and refresh it
      const { data: decryptedRefresh, error: refreshDecryptError } = await supabaseClient
        .rpc('decrypt_oauth_token', { encrypted_token: account.encrypted_refresh_token });

      if (refreshDecryptError || !decryptedRefresh) {
        throw new Error('Failed to decrypt refresh token');
      }

      const refreshResponse = await refreshTwitterToken(decryptedRefresh);
      accessToken = refreshResponse.access_token;
      
      // Encrypt and update stored tokens
      const { data: newEncryptedAccess } = await supabaseClient
        .rpc('encrypt_oauth_token', { token: refreshResponse.access_token });
      const { data: newEncryptedRefresh } = await supabaseClient
        .rpc('encrypt_oauth_token', { token: refreshResponse.refresh_token });

      await supabaseClient
        .from('connected_accounts')
        .update({
          encrypted_access_token: newEncryptedAccess,
          encrypted_refresh_token: newEncryptedRefresh,
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
    // Return generic error to client (SECURITY FIX: don't expose internal details)
    return new Response(
      JSON.stringify({ error: 'Failed to post tweet. Please try again or reconnect your account.' }),
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
