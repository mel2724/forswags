import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY FIX: Verify authentication (JWT enabled in config.toml)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify admin role for this sensitive operation
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Starting rankings recalculation...");

    // Get all athletes with completed evaluations
    const { data: evaluations, error: evalError } = await supabaseAdmin
      .from("evaluations")
      .select(`
        id,
        athlete_id,
        scores,
        rating,
        status,
        athletes (
          id,
          sport,
          position,
          user_id,
          high_school
        )
      `)
      .eq("status", "completed")
      .not("scores", "is", null);

    if (evalError) {
      console.error("Error fetching evaluations:", evalError);
      throw evalError;
    }

    console.log(`Found ${evaluations?.length || 0} completed evaluations`);

    // Get course progress
    const { data: courseProgress, error: courseError } = await supabaseAdmin
      .from("quiz_attempts")
      .select("user_id, passed")
      .eq("passed", true);

    if (courseError) {
      console.error("Error fetching course progress:", courseError);
    }

    // Calculate composite scores for each athlete
    const athleteScores = new Map<string, {
      athlete_id: string;
      composite_score: number;
      sport: string;
      position: string | null;
      user_id: string;
      high_school: string | null;
      evaluation_count: number;
    }>();

    for (const evaluation of evaluations || []) {
      const athleteId = evaluation.athlete_id;
      const athlete = evaluation.athletes as any; // Cast to any to handle Supabase response
      
      if (!athlete) continue;

      // Calculate evaluation score from scores object
      let evaluationScore = 0;
      let scoreCount = 0;

      if (evaluation.scores && typeof evaluation.scores === 'object') {
        const scores = evaluation.scores as Record<string, number>;
        for (const score of Object.values(scores)) {
          if (typeof score === 'number') {
            evaluationScore += score;
            scoreCount++;
          }
        }
      }

      // Average the evaluation scores (normalized to 0-100)
      const avgEvaluationScore = scoreCount > 0 ? evaluationScore / scoreCount : 0;

      // Add rating if available (normalized to 0-100 scale)
      const ratingScore = evaluation.rating ? (evaluation.rating / 5) * 100 : 0;

      // Combine evaluation and rating (70% evaluation, 30% rating)
      const evaluationComponent = (avgEvaluationScore * 0.7) + (ratingScore * 0.3);

      // Get course completion bonus (up to 10 points)
      const coursesCompleted = courseProgress?.filter(
        cp => cp.user_id === athlete.user_id
      ).length || 0;
      const courseBonus = Math.min(coursesCompleted * 2, 10);

      const compositeScore = evaluationComponent + courseBonus;

      const existing = athleteScores.get(athleteId);
      if (existing) {
        // Average multiple evaluations
        const totalScore = (existing.composite_score * existing.evaluation_count) + compositeScore;
        existing.evaluation_count++;
        existing.composite_score = totalScore / existing.evaluation_count;
      } else {
        athleteScores.set(athleteId, {
          athlete_id: athleteId,
          composite_score: compositeScore,
          sport: athlete.sport,
          position: athlete.position,
          user_id: athlete.user_id,
          high_school: athlete.high_school,
          evaluation_count: 1
        });
      }
    }

    console.log(`Calculated scores for ${athleteScores.size} athletes`);

    // Sort athletes by composite score
    const sortedAthletes = Array.from(athleteScores.values())
      .sort((a, b) => b.composite_score - a.composite_score);

    // Calculate ranks by sport and position
    const sportRanks = new Map<string, number>();
    const positionRanks = new Map<string, number>();

    // Group by state (using high school as proxy - in production, use proper state data)
    const stateRanks = new Map<string, number>();

    const rankingsToUpsert = [];

    for (let i = 0; i < sortedAthletes.length; i++) {
      const athlete = sortedAthletes[i];
      const overallRank = i + 1;

      // Calculate position rank
      const positionKey = `${athlete.sport}-${athlete.position || "Unknown"}`;
      const currentPositionRank = (positionRanks.get(positionKey) || 0) + 1;
      positionRanks.set(positionKey, currentPositionRank);

      // Calculate sport rank (state level)
      const stateKey = athlete.high_school || "Unknown";
      const currentStateRank = (stateRanks.get(stateKey) || 0) + 1;
      stateRanks.set(stateKey, currentStateRank);

      // National rank is same as overall for now
      const nationalRank = overallRank <= 100 ? overallRank : null;

      rankingsToUpsert.push({
        athlete_id: athlete.athlete_id,
        overall_rank: overallRank,
        position_rank: currentPositionRank,
        state_rank: currentStateRank,
        national_rank: nationalRank,
        composite_score: Math.round(athlete.composite_score * 10) / 10, // Round to 1 decimal
        last_calculated: new Date().toISOString()
      });
    }

    console.log(`Upserting ${rankingsToUpsert.length} rankings...`);

    // Upsert rankings (update if exists, insert if not)
    for (const ranking of rankingsToUpsert) {
      const { error: upsertError } = await supabaseAdmin
        .from("rankings")
        .upsert(ranking, {
          onConflict: "athlete_id",
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error(`Error upserting ranking for athlete ${ranking.athlete_id}:`, upsertError);
      }
    }

    console.log("Rankings recalculation completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Rankings recalculated successfully",
        athletes_ranked: rankingsToUpsert.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in recalculate-rankings:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
