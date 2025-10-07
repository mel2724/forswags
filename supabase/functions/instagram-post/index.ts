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
    const { caption, imageUrl } = await req.json();
    
    if (!caption || !imageUrl) {
      throw new Error('Caption and image URL are required');
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

    // Get encrypted Instagram token (SECURITY FIX: using encrypted storage)
    const { data: account, error: accountError } = await supabaseClient
      .from('connected_accounts')
      .select('encrypted_access_token')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .single();

    if (accountError || !account) {
      throw new Error('Instagram account not connected');
    }

    // Decrypt access token
    const { data: accessToken, error: decryptError } = await supabaseClient
      .rpc('decrypt_oauth_token', { encrypted_token: account.encrypted_access_token });

    if (decryptError || !accessToken) {
      console.error('Decryption error:', decryptError);
      throw new Error('Failed to decrypt token');
    }

    // Get Instagram Business Account ID
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();
    
    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook pages found');
    }

    const pageId = pagesData.data[0].id;
    const igResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
    );
    const igData = await igResponse.json();
    
    if (!igData.instagram_business_account) {
      throw new Error('No Instagram Business Account linked');
    }

    const igAccountId = igData.instagram_business_account.id;

    // Create media container
    const containerUrl = new URL(`https://graph.facebook.com/v18.0/${igAccountId}/media`);
    containerUrl.searchParams.set('image_url', imageUrl);
    containerUrl.searchParams.set('caption', caption);
    containerUrl.searchParams.set('access_token', accessToken);

    const containerResponse = await fetch(containerUrl.toString(), {
      method: 'POST',
    });

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text();
      console.error('Instagram container error:', errorText);
      throw new Error('Failed to create media container');
    }

    const containerData = await containerResponse.json();
    const creationId = containerData.id;

    // Publish media
    const publishUrl = new URL(`https://graph.facebook.com/v18.0/${igAccountId}/media_publish`);
    publishUrl.searchParams.set('creation_id', creationId);
    publishUrl.searchParams.set('access_token', accessToken);

    const publishResponse = await fetch(publishUrl.toString(), {
      method: 'POST',
    });

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error('Instagram publish error:', errorText);
      throw new Error('Failed to publish post');
    }

    const publishData = await publishResponse.json();

    return new Response(
      JSON.stringify({ success: true, postId: publishData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Instagram post error:', error);
    // Return generic error to client (SECURITY FIX: don't expose internal details)
    return new Response(
      JSON.stringify({ error: 'Failed to post to Instagram. Please try again or reconnect your account.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
