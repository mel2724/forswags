import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileViewNotification {
  profile_view_id: string;
  athlete_id: string;
  viewer_id: string;
  viewer_type: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ForSWAGs <notifications@forswags.com>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile_view_id, athlete_id, viewer_id, viewer_type }: ProfileViewNotification = await req.json();

    console.log('[Profile View Notification] Processing:', { athlete_id, viewer_type });

    // Only send notifications for recruiter views
    if (viewer_type !== 'recruiter') {
      console.log('[Profile View Notification] Skipping non-recruiter view');
      return new Response(
        JSON.stringify({ success: true, message: 'Non-recruiter view, no notification sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if viewer is a paid recruiter
    const { data: membership } = await supabase
      .from('memberships')
      .select('status, tier')
      .eq('user_id', viewer_id)
      .eq('status', 'active')
      .in('tier', ['college_scout', 'recruiter', 'premium'])
      .maybeSingle();

    if (!membership) {
      console.log('[Profile View Notification] Viewer is not a paid recruiter, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'Unpaid recruiter, no notification sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get athlete and profile information
    const { data: athlete } = await supabase
      .from('athletes')
      .select('user_id, parent_email, date_of_birth')
      .eq('id', athlete_id)
      .single();

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', athlete.user_id)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Check if athlete is a minor
    const isMinor = athlete.date_of_birth
      ? new Date().getFullYear() - new Date(athlete.date_of_birth).getFullYear() < 18
      : false;

    console.log('[Profile View Notification] Athlete info:', { 
      name: profile.full_name, 
      isMinor,
      hasParentEmail: !!athlete.parent_email 
    });

    // Send in-app notification to athlete
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: athlete.user_id,
        title: '👀 Profile Viewed by College Scout',
        message: 'A college recruiter checked out your profile! Keep your stats and media updated to maintain their interest.',
        type: 'profile_view',
        link: '/dashboard',
      });

    if (notificationError) {
      console.error('[Profile View Notification] Error creating notification:', notificationError);
    }

    // Prepare email data
    const firstName = profile.full_name.split(' ')[0];
    const profileUrl = `${supabaseUrl.replace('supabase.co', 'lovable.app')}/profile/${athlete_id}`;
    const dashboardUrl = `${supabaseUrl.replace('supabase.co', 'lovable.app')}/dashboard`;

    // Send email to athlete
    try {
      await sendEmail(
        profile.email,
        '👀 A College Scout Viewed Your Profile!',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #9B51E0;">Heads up, ${firstName}!</h2>
            <p>Great news! A college scout just checked out your profile on ForSWAGs.</p>
            <p>This is a great opportunity to make a strong impression. Make sure your profile is up to date:</p>
            <ul>
              <li>Keep your stats current</li>
              <li>Upload recent game highlights</li>
              <li>Update your academic information</li>
            </ul>
            <p style="margin-top: 20px;">
              <a href="${profileUrl}" style="background-color: #9B51E0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Your Profile</a>
              <a href="${dashboardUrl}" style="background-color: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-left: 10px;">Go to Dashboard</a>
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;"/>
            <small style="color: #666;">ForSWAGs educates & exposes athletes to opportunities. We are not college scouts.</small>
          </div>
        `
      );
      console.log('[Profile View Notification] Email sent to athlete:', profile.email);
    } catch (emailError) {
      console.error('[Profile View Notification] Error sending athlete email:', emailError);
    }

    // Send email to parent if athlete is a minor and parent email exists
    if (isMinor && athlete.parent_email) {
      try {
        await sendEmail(
          athlete.parent_email,
          `🎓 College Scout Viewed ${profile.full_name}'s Profile`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #9B51E0;">Great News!</h2>
              <p>A college scout just viewed ${profile.full_name}'s ForSWAGs profile!</p>
              <p>This shows that recruiters are actively looking at your student-athlete's profile. Here's how you can help them stand out:</p>
              <ul>
                <li>Encourage them to keep their stats updated</li>
                <li>Help them upload recent game highlights</li>
                <li>Ensure academic information is current</li>
              </ul>
              <p style="margin-top: 20px;">
                <a href="${profileUrl}" style="background-color: #9B51E0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Profile</a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;"/>
              <small style="color: #666;">ForSWAGs educates & exposes athletes to opportunities. We are not college scouts.</small>
            </div>
          `
        );
        console.log('[Profile View Notification] Email sent to parent:', athlete.parent_email);
      } catch (emailError) {
        console.error('[Profile View Notification] Error sending parent email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notifications sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Profile View Notification] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
