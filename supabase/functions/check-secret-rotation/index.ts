import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify CRON secret for scheduled execution
    const cronSecret = Deno.env.get('CRON_SECRET');
    const requestSecret = req.headers.get('X-Cron-Secret');
    
    if (cronSecret && cronSecret !== requestSecret) {
      console.log('Unauthorized: Invalid CRON secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for secrets needing rotation...');

    // Get secrets needing rotation
    const { data: secretsNeedingRotation, error: rotationError } = await supabase
      .rpc('get_secrets_needing_rotation');

    if (rotationError) {
      console.error('Error fetching secrets needing rotation:', rotationError);
      throw rotationError;
    }

    if (!secretsNeedingRotation || secretsNeedingRotation.length === 0) {
      console.log('No secrets need rotation at this time');
      return new Response(
        JSON.stringify({ message: 'No secrets need rotation', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${secretsNeedingRotation.length} secret(s) needing rotation`);

    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id, profiles(email, full_name)')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      throw adminError;
    }

    // Create notifications for each admin
    const notifications = [];
    for (const admin of adminUsers || []) {
      const criticalSecrets = secretsNeedingRotation.filter((s: any) => s.is_critical);
      const nonCriticalSecrets = secretsNeedingRotation.filter((s: any) => !s.is_critical);

      let message = '';
      if (criticalSecrets.length > 0) {
        message = `🔴 CRITICAL: ${criticalSecrets.length} critical secret(s) need rotation immediately! `;
      }
      if (nonCriticalSecrets.length > 0) {
        message += `${nonCriticalSecrets.length} other secret(s) also need rotation.`;
      }

      notifications.push({
        user_id: admin.user_id,
        title: 'Secret Rotation Required',
        message: message.trim(),
        type: criticalSecrets.length > 0 ? 'alert' : 'info',
        link: '/admin/secret-rotation',
        created_at: new Date().toISOString(),
      });
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
        throw notifError;
      }

      console.log(`Created ${notifications.length} notification(s) for admin users`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        secretsNeedingRotation: secretsNeedingRotation.length,
        notificationsCreated: notifications.length,
        secrets: secretsNeedingRotation.map((s: any) => ({
          name: s.secret_name,
          daysOverdue: s.days_overdue,
          isCritical: s.is_critical,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-secret-rotation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check secret rotation status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
