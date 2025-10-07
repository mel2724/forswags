import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Get memberships expiring in 30, 7, or 1 days
    const { data: expiringMemberships, error: fetchError } = await supabaseClient
      .from('memberships')
      .select(`
        id,
        user_id,
        plan,
        end_date,
        profiles!inner(email, full_name)
      `)
      .in('status', ['active', 'trialing'])
      .not('end_date', 'is', null)
      .gte('end_date', new Date().toISOString())
      .lte('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

    if (fetchError) throw fetchError;

    let remindersSent = 0;

    for (const membership of expiringMemberships || []) {
      const daysUntilExpiry = Math.ceil(
        (new Date(membership.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      let reminderType: '30_days' | '7_days' | '1_day' | null = null;
      if (daysUntilExpiry === 30) reminderType = '30_days';
      else if (daysUntilExpiry === 7) reminderType = '7_days';
      else if (daysUntilExpiry === 1) reminderType = '1_day';

      if (!reminderType) continue;

      // Check if reminder already sent
      const { data: existingReminder } = await supabaseClient
        .from('membership_renewal_reminders')
        .select('id')
        .eq('membership_id', membership.id)
        .eq('reminder_type', reminderType)
        .maybeSingle();

      if (existingReminder) continue;

      // Send email via Resend API
      const profile = membership.profiles as any;
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ForSWAGs <onboarding@resend.dev>',
          to: [profile.email],
          subject: `Your ForSWAGs Membership Expires in ${daysUntilExpiry} Day${daysUntilExpiry === 1 ? '' : 's'}`,
          html: `
            <h2>Membership Renewal Reminder</h2>
            <p>Hi ${profile.full_name || 'there'},</p>
            <p>Your ForSWAGs ${membership.plan} membership will expire in <strong>${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}</strong> on ${new Date(membership.end_date).toLocaleDateString()}.</p>
            <p>To continue enjoying all premium features, please renew your membership.</p>
            <p><a href="${Deno.env.get('SUPABASE_URL')}/membership">Renew Now</a></p>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error(`Failed to send email to ${profile.email}`);
        continue;
      }

      // Record reminder sent
      await supabaseClient
        .from('membership_renewal_reminders')
        .insert({
          user_id: membership.user_id,
          membership_id: membership.id,
          reminder_type: reminderType,
        });

      remindersSent++;
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: remindersSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error sending renewal reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
