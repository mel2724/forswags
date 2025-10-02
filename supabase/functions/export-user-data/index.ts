import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    console.log(`Exporting data for user: ${user.id}`);

    // Create export request record
    const { data: exportRequest, error: requestError } = await supabase
      .from("data_export_requests")
      .insert({
        user_id: user.id,
        status: "processing",
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Collect all user data
    const userData: any = {
      user_info: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: null,
      athletes: [],
      media_assets: [],
      evaluations: [],
      audit_logs: [],
      notifications: [],
      memberships: [],
    };

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    userData.profile = profile;

    // Fetch athletes
    const { data: athletes } = await supabase
      .from("athletes")
      .select("*")
      .eq("user_id", user.id);
    userData.athletes = athletes || [];

    // Fetch media assets
    const { data: mediaAssets } = await supabase
      .from("media_assets")
      .select("*")
      .eq("user_id", user.id);
    userData.media_assets = mediaAssets || [];

    // Fetch evaluations (for athletes)
    if (athletes && athletes.length > 0) {
      const athleteIds = athletes.map((a: any) => a.id);
      const { data: evaluations } = await supabase
        .from("evaluations")
        .select("*")
        .in("athlete_id", athleteIds);
      userData.evaluations = evaluations || [];
    }

    // Fetch audit logs
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1000);
    userData.audit_logs = auditLogs || [];

    // Fetch notifications
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id);
    userData.notifications = notifications || [];

    // Fetch memberships
    const { data: memberships } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", user.id);
    userData.memberships = memberships || [];

    // Generate JSON export
    const exportData = JSON.stringify(userData, null, 2);
    const exportBlob = new Blob([exportData], { type: "application/json" });

    // In a real implementation, you would upload this to storage
    // For now, we'll just return the data directly
    const exportUrl = `data:application/json;base64,${btoa(exportData)}`;

    // Update export request
    await supabase
      .from("data_export_requests")
      .update({
        status: "completed",
        export_url: exportUrl,
        completed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .eq("id", exportRequest.id);

    // Log the export
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "data_export_completed",
      resource_type: "user_data",
      metadata: {
        export_id: exportRequest.id,
        data_size: exportData.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data export completed",
        export_id: exportRequest.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error exporting user data:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
