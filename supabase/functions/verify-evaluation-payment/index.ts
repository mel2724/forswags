import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("[VERIFY-EVALUATION-PAYMENT] Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("Session ID is required");
    }

    // Validate session ID format
    if (!session_id.startsWith("cs_")) {
      throw new Error("Invalid session ID format. Session IDs must start with 'cs_' (e.g., cs_test_...). You may have entered a payment method ID (pm_) or payment intent ID (pi_) instead.");
    }

    console.log("[VERIFY-EVALUATION-PAYMENT] Verifying session:", session_id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    console.log("[VERIFY-EVALUATION-PAYMENT] Session status:", session.payment_status);

    if (session.payment_status === "paid") {
      const metadata = session.metadata;
      const isReevaluation = metadata!.is_reevaluation === "true";
      const requestedCoachId = metadata!.requested_coach_id || null;

      // Check if requested coach is still active
      let assignedCoachId = null;
      let needsAdminAssignment = false;

      if (requestedCoachId) {
        const { data: coachProfile } = await supabaseClient
          .from("coach_profiles")
          .select("user_id, is_active")
          .eq("user_id", requestedCoachId)
          .single();

        if (coachProfile && coachProfile.is_active) {
          assignedCoachId = requestedCoachId;
          console.log("[VERIFY-EVALUATION-PAYMENT] Assigning to previous coach:", assignedCoachId);
        } else {
          console.log("[VERIFY-EVALUATION-PAYMENT] Previous coach unavailable, needs admin assignment");
          needsAdminAssignment = true;
        }
      }

      // Create evaluation record
      const { data: evaluation, error: evalError } = await supabaseClient
        .from("evaluations")
        .insert({
          athlete_id: metadata!.athlete_id,
          video_url: metadata!.video_url,
          status: "pending",
          is_reevaluation: isReevaluation,
          previous_evaluation_id: metadata!.previous_evaluation_id || null,
          requested_coach_id: requestedCoachId,
          coach_id: assignedCoachId,
          admin_assigned: false,
        })
        .select()
        .single();

      if (evalError) {
        console.error("[VERIFY-EVALUATION-PAYMENT] Error creating evaluation:", evalError);
        throw evalError;
      }

      console.log("[VERIFY-EVALUATION-PAYMENT] Evaluation created:", evaluation.id);

      // Send appropriate notifications
      if (needsAdminAssignment) {
        // Notify admin that coach is unavailable
        await supabaseClient.functions.invoke('notify-admin-coach-unavailable', {
          body: { 
            evaluation_id: evaluation.id,
            athlete_id: metadata!.athlete_id,
            requested_coach_id: requestedCoachId
          }
        });
      } else if (assignedCoachId) {
        // Notify the assigned coach
        await supabaseClient.functions.invoke('notify-coaches-new-evaluation', {
          body: { 
            evaluation_id: evaluation.id,
            is_reevaluation: isReevaluation,
            coach_id: assignedCoachId
          }
        });
      } else {
        // Notify all available coaches
        await supabaseClient.functions.invoke('notify-coaches-new-evaluation', {
          body: { 
            evaluation_id: evaluation.id,
            is_reevaluation: isReevaluation
          }
        });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          evaluation_id: evaluation.id 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[VERIFY-EVALUATION-PAYMENT] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
