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
    const INSTAGRAM_CLIENT_ID = Deno.env.get('INSTAGRAM_CLIENT_ID');
    const INSTAGRAM_CLIENT_SECRET = Deno.env.get('INSTAGRAM_CLIENT_SECRET');
    
    if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
      throw new Error('Instagram credentials not configured');
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

    // Exchange code for token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', INSTAGRAM_CLIENT_ID);
    tokenUrl.searchParams.set('client_secret', INSTAGRAM_CLIENT_SECRET);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);

    const tokenResponse = await fetch(tokenUrl.toString());

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Instagram token error:', errorText);
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await tokenResponse.json();
    
    // Get long-lived token
    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', INSTAGRAM_CLIENT_ID);
    longLivedUrl.searchParams.set('client_secret', INSTAGRAM_CLIENT_SECRET);
    longLivedUrl.searchParams.set('fb_exchange_token', tokens.access_token);

    const longLivedResponse = await fetch(longLivedUrl.toString());
    const longLivedTokens = await longLivedResponse.json();

    // Get user's Instagram Business Account
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedTokens.access_token}`
    );
    const pagesData = await pagesResponse.json();
    
    let instagramAccountId = '';
    let username = 'Unknown';
    
    if (pagesData.data && pagesData.data.length > 0) {
      const pageId = pagesData.data[0].id;
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${longLivedTokens.access_token}`
      );
      const igData = await igResponse.json();
      
      if (igData.instagram_business_account) {
        instagramAccountId = igData.instagram_business_account.id;
        
        // Get username
        const usernameResponse = await fetch(
          `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username&access_token=${longLivedTokens.access_token}`
        );
        const usernameData = await usernameResponse.json();
        username = usernameData.username || 'Unknown';
      }
    }

    // Store tokens in connected_accounts
    const expiresAt = new Date(Date.now() + (longLivedTokens.expires_in || 5184000) * 1000);
    
    const { error: insertError } = await supabaseClient
      .from('connected_accounts')
      .upsert({
        user_id: user.id,
        platform: 'instagram',
        account_name: username,
        access_token: longLivedTokens.access_token,
        expires_at: expiresAt.toISOString(),
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
      .eq('platform', 'instagram');

    return new Response(
      JSON.stringify({ success: true, username, accountId: instagramAccountId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
