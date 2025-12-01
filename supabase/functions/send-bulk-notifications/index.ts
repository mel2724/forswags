import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

    // Define validation schema
    const notificationSchema = z.object({
      title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
      message: z.string().trim().min(1, 'Message is required').max(500, 'Message must be less than 500 characters'),
      type: z.enum(['info', 'warning', 'success', 'announcement', 'reminder', 'feature', 'update'], {
        errorMap: () => ({ message: 'Invalid notification type' })
      }),
      link: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
      targetUserTypes: z.array(
        z.enum(['athlete', 'coach', 'recruiter', 'parent'], {
          errorMap: () => ({ message: 'Invalid user type' })
        })
      ).min(1, 'At least one target user type is required')
    });

    // Parse and validate request body
    const requestData = await req.json();
    const validationResult = notificationSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      console.error('[SEND-BULK-NOTIFICATIONS] Validation error:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const { title, message, type, link, targetUserTypes } = validationResult.data;

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

    // Create campaign ID for tracking
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add batch size limit to prevent database overload
    if (targetUserIds.length > 10000) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many recipients',
          details: 'Maximum 10,000 recipients allowed per bulk notification'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Ensure at least one recipient
    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No recipients found',
          details: 'The selected user types have no matching users'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Create notification records for all target users
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      link: link || null,
      is_read: false,
      campaign_id: campaignId,
    }));

    const { error: insertError } = await supabaseClient
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      throw insertError;
    }

    // Create campaign tracking record
    const { error: campaignError } = await supabaseClient
      .from('notification_campaigns')
      .insert({
        campaign_id: campaignId,
        title,
        message,
        type,
        link: link || null,
        target_user_types: targetUserTypes,
        sent_count: targetUserIds.length,
      });

    if (campaignError) {
      console.error('[SEND-BULK-NOTIFICATIONS] Campaign tracking error:', campaignError);
      // Don't fail the request if campaign tracking fails
    }

    console.log('[SEND-BULK-NOTIFICATIONS] Successfully sent notifications');

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: targetUserIds.length,
        campaign_id: campaignId
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
