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
    const { athleteId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    console.log(`[ADMIN-TRIGGER] Triggering analysis for athlete ${athleteId}`);

    // Update analysis_requested_at
    await supabaseClient
      .from("athletes")
      .update({ 
        analysis_requested_at: new Date().toISOString(),
        analysis_notified_at: null
      })
      .eq("id", athleteId);

    // Trigger analysis
    const { data, error } = await supabaseClient.functions.invoke(
      "analyze-college-match",
      { body: { athleteId } }
    );

    if (error) {
      console.error(`[ADMIN-TRIGGER] Analysis error:`, error);
      throw error;
    }

    console.log(`[ADMIN-TRIGGER] Analysis completed:`, data);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "College match analysis triggered successfully",
        data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ADMIN-TRIGGER] Error:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
