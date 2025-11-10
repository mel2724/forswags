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

    console.log(`Admin ${user.email} restoring archived media ${archivedMediaId}`);

    // Get the archived media record
    const { data: archivedMedia, error: fetchError } = await supabaseAdmin
      .from('archived_media')
      .select('*')
      .eq('id', archivedMediaId)
      .single();

    if (fetchError || !archivedMedia) {
      return new Response(
        JSON.stringify({ success: false, error: 'Archived media not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cannot restore deleted media
    if (archivedMedia.is_deleted) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot restore permanently deleted media' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a new media_assets record from archived data
    const { error: insertError } = await supabaseAdmin
      .from('media_assets')
      .insert({
        user_id: archivedMedia.user_id,
        athlete_id: archivedMedia.athlete_id,
        media_type: archivedMedia.media_type,
        title: archivedMedia.file_name,
        url: archivedMedia.storage_path,
        file_size: archivedMedia.file_size,
        is_archived: false
      });

    if (insertError) {
      console.error('Error restoring media:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark as restored in archived_media
    const { error: updateError } = await supabaseAdmin
      .from('archived_media')
      .update({ 
        metadata: {
          ...archivedMedia.metadata,
          restored_at: new Date().toISOString(),
          restored_by: user.id
        }
      })
      .eq('id', archivedMediaId);

    if (updateError) {
      console.error('Error updating archived media:', updateError);
    }

    console.log(`Successfully restored archived media ${archivedMediaId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-restore-archived-media:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
