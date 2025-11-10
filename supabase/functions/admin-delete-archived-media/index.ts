import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { archivedMediaId } = await req.json();

    if (!archivedMediaId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Archived media ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.email} permanently deleting archived media ${archivedMediaId}`);

    // Get the archived media record to get the storage path
    const { data: archivedMedia, error: fetchError } = await supabaseAdmin
      .from('archived_media')
      .select('storage_bucket, storage_path')
      .eq('id', archivedMediaId)
      .single();

    if (fetchError) {
      console.error('Error fetching archived media:', fetchError);
    }

    // Delete from storage if we have the path
    if (archivedMedia?.storage_bucket && archivedMedia?.storage_path) {
      const { error: storageError } = await supabaseAdmin
        .storage
        .from(archivedMedia.storage_bucket)
        .remove([archivedMedia.storage_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue anyway - the file might already be gone
      }
    }

    // Delete the archived media record
    const { error: deleteError } = await supabaseAdmin
      .from('archived_media')
      .delete()
      .eq('id', archivedMediaId);

    if (deleteError) {
      console.error('Error deleting archived media record:', deleteError);
      return new Response(
        JSON.stringify({ success: false, error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted archived media ${archivedMediaId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-delete-archived-media:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
