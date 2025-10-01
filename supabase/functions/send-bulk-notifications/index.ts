import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roles) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { title, message, type, link, targetUserTypes } = await req.json();

    console.log('[SEND-BULK-NOTIFICATIONS] Request:', { title, type, targetUserTypes });

    // Get target user IDs based on user types
    let targetUserIds: string[] = [];

    if (targetUserTypes.includes('athlete')) {
      const { data: athletes } = await supabaseClient
        .from('athletes')
        .select('user_id');
      
      if (athletes) {
        targetUserIds.push(...athletes.map(a => a.user_id));
      }
    }

    if (targetUserTypes.includes('coach')) {
      const { data: coaches } = await supabaseClient
        .from('coach_profiles')
        .select('user_id');
      
      if (coaches) {
        targetUserIds.push(...coaches.map(c => c.user_id));
      }
    }

    if (targetUserTypes.includes('recruiter')) {
      const { data: recruiters } = await supabaseClient
        .from('recruiter_profiles')
        .select('user_id');
      
      if (recruiters) {
        targetUserIds.push(...recruiters.map(r => r.user_id));
      }
    }

    if (targetUserTypes.includes('parent')) {
      const { data: athletes } = await supabaseClient
        .from('athletes')
        .select('parent_id')
        .not('parent_id', 'is', null);
      
      if (athletes) {
        targetUserIds.push(...athletes.map(a => a.parent_id).filter(Boolean) as string[]);
      }
    }

    // Remove duplicates
    targetUserIds = [...new Set(targetUserIds)];

    console.log('[SEND-BULK-NOTIFICATIONS] Sending to users:', targetUserIds.length);

    // Create notification records for all target users
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      link: link || null,
      is_read: false,
    }));

    const { error: insertError } = await supabaseClient
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      throw insertError;
    }

    console.log('[SEND-BULK-NOTIFICATIONS] Successfully sent notifications');

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: targetUserIds.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[SEND-BULK-NOTIFICATIONS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
