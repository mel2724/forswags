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

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-indexed (August = 7)
    
    console.log(`Running graduate transition check for August ${currentYear}`);
    
    // Only run this during August
    if (currentMonth !== 7) {
      return new Response(
        JSON.stringify({ 
          message: "Not August - transition skipped",
          currentMonth: currentMonth + 1 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find all athletes who graduated this year or earlier and haven't been converted
    const { data: graduatingAthletes, error: fetchError } = await supabaseClient
      .from("athletes")
      .select("id, user_id, sport, position, graduation_year, high_school")
      .lte("graduation_year", currentYear)
      .is("converted_to_alumni", null);

    if (fetchError) {
      throw new Error(`Failed to fetch graduating athletes: ${fetchError.message}`);
    }

    console.log(`Found ${graduatingAthletes?.length || 0} athletes to transition`);

    let transitioned = 0;
    let errors: string[] = [];

    for (const athlete of graduatingAthletes || []) {
      try {
        // Get user profile for additional info
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("full_name")
          .eq("id", athlete.user_id)
          .single();

        // Check if alumni record already exists
        const { data: existingAlumni } = await supabaseClient
          .from("alumni")
          .select("id")
          .eq("user_id", athlete.user_id)
          .single();

        if (!existingAlumni) {
          // Create alumni record
          const { error: alumniError } = await supabaseClient
            .from("alumni")
            .insert({
              user_id: athlete.user_id,
              sport: athlete.sport,
              position: athlete.position,
              graduation_year: athlete.graduation_year,
              school_id: null, // Will be populated if we have school matching
              bio: `${profile?.full_name || 'Athlete'} graduated from ${athlete.high_school || 'their high school'} in ${athlete.graduation_year}.`,
              willing_to_mentor: true,
              available_for_calls: false,
            });

          if (alumniError) {
            errors.push(`Failed to create alumni for athlete ${athlete.id}: ${alumniError.message}`);
            continue;
          }
        }

        // Mark athlete as converted (keep all data intact)
        const { error: updateError } = await supabaseClient
          .from("athletes")
          .update({ 
            converted_to_alumni: true,
            converted_at: new Date().toISOString()
          })
          .eq("id", athlete.id);

        if (updateError) {
          errors.push(`Failed to mark athlete ${athlete.id} as converted: ${updateError.message}`);
          continue;
        }

        // Add alumni role if not already present
        const { data: existingRole } = await supabaseClient
          .from("user_roles")
          .select("id")
          .eq("user_id", athlete.user_id)
          .eq("role", "alumni")
          .single();

        if (!existingRole) {
          await supabaseClient
            .from("user_roles")
            .insert({
              user_id: athlete.user_id,
              role: "alumni"
            });
        }

        // Send notification to user
        await supabaseClient
          .from("notifications")
          .insert({
            user_id: athlete.user_id,
            title: "Welcome to Alumni Status! 🎓",
            message: "Congratulations on graduating! Your account has been transitioned to alumni status. You now have access to mentoring features and the alumni network.",
            type: "success",
            link: "/alumni/dashboard"
          });

        transitioned++;
        console.log(`Successfully transitioned athlete ${athlete.id} to alumni`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Error processing athlete ${athlete.id}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transitioned,
        total: graduatingAthletes?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
        year: currentYear
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Transition error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

