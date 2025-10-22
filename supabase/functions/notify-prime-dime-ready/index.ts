import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-PRIME-DIME] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Cron job started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovableproject.com") || "https://forswags.com";

    // Find athletes who requested analysis 24+ hours ago and haven't been notified
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: athletes, error: athletesError } = await supabaseClient
      .from("athletes")
      .select(`
        id,
        user_id,
        analysis_requested_at,
        analysis_notified_at,
        profiles!athletes_user_id_fkey (
          full_name,
          email
        )
      `)
      .not("analysis_requested_at", "is", null)
      .is("analysis_notified_at", null)
      .lt("analysis_requested_at", twentyFourHoursAgo);

    if (athletesError) throw athletesError;

    logStep(`Found ${athletes?.length || 0} athletes to notify`);

    if (!athletes || athletes.length === 0) {
      return new Response(
        JSON.stringify({ message: "No athletes to notify" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    let notifiedCount = 0;
    let errorCount = 0;

    for (const athlete of athletes) {
      try {
        const profile = Array.isArray(athlete.profiles) ? athlete.profiles[0] : athlete.profiles;
        
        if (!profile?.email) {
          logStep("Skipping athlete - no email", { athleteId: athlete.id });
          continue;
        }

        // Check if they have matches
        const { data: matches, error: matchesError } = await supabaseClient
          .from("college_matches")
          .select("id")
          .eq("athlete_id", athlete.id)
          .limit(1);

        if (matchesError || !matches || matches.length === 0) {
          logStep("No matches found for athlete", { athleteId: athlete.id });
          continue;
        }

        // Count total matches
        const { count: matchCount } = await supabaseClient
          .from("college_matches")
          .select("id", { count: "exact", head: true })
          .eq("athlete_id", athlete.id);

        logStep("Sending email", { email: profile.email, athleteId: athlete.id });

        // Load email template
        const templatePath = new URL("../_templates/college_match_ready.html", import.meta.url);
        const templateResponse = await fetch(templatePath);
        let emailHtml = await templateResponse.text();

        // Replace template variables
        emailHtml = emailHtml
          .replace(/{{athlete_name}}/g, profile.full_name || "Athlete")
          .replace(/{{match_count}}/g, String(matchCount || 10))
          .replace(/{{app_url}}/g, appUrl);

        // Send email
        const { error: emailError } = await resend.emails.send({
          from: "ForSWAGs <notifications@forswags.com>",
          to: [profile.email],
          subject: "🏆 Your Prime Dime College Matches Are Ready!",
          html: emailHtml,
        });

        if (emailError) {
          logStep("Email error", { error: emailError, athleteId: athlete.id });
          errorCount++;
          continue;
        }

        logStep("Email sent successfully", { email: profile.email });

        // Create in-app notification
        await supabaseClient
          .from("notifications")
          .insert({
            user_id: athlete.user_id,
            title: "Your Prime Dime is Ready! 🏆",
            message: "Our expert team has completed your college match analysis. View your personalized top 10 college recommendations now!",
            type: "college_match",
            link: "/prime-dime",
          });

        logStep("In-app notification created");

        // Update athlete record
        await supabaseClient
          .from("athletes")
          .update({ analysis_notified_at: new Date().toISOString() })
          .eq("id", athlete.id);

        logStep("Athlete record updated");
        notifiedCount++;

      } catch (athleteError) {
        logStep("Error processing athlete", { 
          error: athleteError instanceof Error ? athleteError.message : String(athleteError),
          athleteId: athlete.id 
        });
        errorCount++;
      }
    }

    logStep("Notification job completed", { notifiedCount, errorCount });

    return new Response(
      JSON.stringify({ 
        success: true,
        notified: notifiedCount,
        errors: errorCount,
        message: `Notified ${notifiedCount} athletes, ${errorCount} errors`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    // Send error notification to tech support
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      await resend.emails.send({
        from: "ForSWAGs Errors <noreply@updates.forswags.com>",
        to: ["techsupport@forswags.com"],
        subject: "Prime Dime Notification Error - ForSWAGs",
        html: `
          <h2>Prime Dime Notification Error</h2>
          <p><strong>Error:</strong> ${errorMessage}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Stack:</strong> <pre>${error instanceof Error ? error.stack : 'N/A'}</pre></p>
        `,
      });
    } catch (notifyError) {
      console.error("Failed to send error notification:", notifyError);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
