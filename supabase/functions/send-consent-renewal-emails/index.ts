import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConsentRenewalRequest {
  athlete_id?: string; // Optional: send to specific athlete
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify cron secret for scheduled function authentication
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  
  if (!cronSecret || cronSecret !== expectedSecret) {
    console.error('[CONSENT-RENEWAL] Unauthorized: Invalid or missing cron secret');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[CONSENT-RENEWAL] Starting consent renewal email process');

    // Get notifications that need to be sent
    const { data: notifications, error: notificationsError } = await supabase
      .from('consent_renewal_notifications')
      .select(`
        id,
        athlete_id,
        parent_email,
        expires_at,
        notification_type,
        athletes!inner(
          user_id,
          profiles!inner(full_name, email)
        )
      `)
      .eq('notification_type', 'expiring_soon')
      .is('email_sent_at', null);

    if (notificationsError) {
      console.error('[CONSENT-RENEWAL] Error fetching notifications:', notificationsError);
      throw notificationsError;
    }

    console.log(`[CONSENT-RENEWAL] Found ${notifications?.length || 0} notifications to send`);

    const emailResults = [];

    for (const notification of notifications || []) {
      try {
        const athleteData = notification.athletes as any;
        const athleteName = athleteData?.profiles?.full_name || 'Athlete';
        const expirationDate = new Date(notification.expires_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        console.log(`[CONSENT-RENEWAL] Sending email for athlete: ${athleteName}`);

        // Send email via send-notification-email function
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-notification-email', {
          body: {
            to: notification.parent_email,
            template: 'consent_renewal_reminder',
            variables: {
              athlete_name: athleteName,
              expiration_date: expirationDate,
              renewal_link: `${supabaseUrl.replace('supabase.co', 'lovable.app')}/profile?renew_consent=true`
            }
          }
        });

        if (emailError) {
          console.error(`[CONSENT-RENEWAL] Email error for ${notification.parent_email}:`, emailError);
          emailResults.push({
            notification_id: notification.id,
            success: false,
            error: emailError.message
          });
          continue;
        }

        // Mark notification as sent
        await supabase
          .from('consent_renewal_notifications')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', notification.id);

        console.log(`[CONSENT-RENEWAL] Successfully sent email to ${notification.parent_email}`);
        
        emailResults.push({
          notification_id: notification.id,
          success: true,
          recipient: notification.parent_email
        });

      } catch (error) {
        console.error('[CONSENT-RENEWAL] Error processing notification:', error);
        emailResults.push({
          notification_id: notification.id,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: emailResults.length,
        results: emailResults
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[CONSENT-RENEWAL] Error:', error);
    
    // Send error notification to tech support
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.functions.invoke('send-notification-email', {
        body: {
          to: 'techsupport@forswags.com',
          template: 'badge_earned', // Using existing template for error format
          subject: 'Consent Renewal Email Error - ForSWAGs',
          variables: {
            first_name: 'Tech Support',
            badge_name: `Error: ${error.message}`,
            dashboard_url: '#',
            profile_url: '#'
          }
        }
      });
    } catch (notifyError) {
      console.error('[CONSENT-RENEWAL] Failed to send error notification:', notifyError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
