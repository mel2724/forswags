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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roles) {
      throw new Error('Admin access required');
    }

    const { sport, preserveOverrides = true } = await req.json();

    console.log(`Starting merge for sport: ${sport}, preserveOverrides: ${preserveOverrides}`);

    // Get all internal rankings (ForSWAGs members)
    const { data: internalRankings, error: internalError } = await supabase
      .from('rankings')
      .select(`
        *,
        athletes!inner(
          id,
          sport,
          position,
          graduation_year,
          user_id,
          committed_school_id,
          profiles!inner(full_name)
        )
      `)
      .eq('athletes.sport', sport);

    if (internalError) throw internalError;

    // Get all external rankings for this sport
    const { data: externalRankings, error: externalError } = await supabase
      .from('external_rankings')
      .select('*')
      .eq('sport', sport);

    if (externalError) throw externalError;

    console.log(`Found ${internalRankings?.length || 0} internal rankings, ${externalRankings?.length || 0} external rankings`);

    // Calculate blended scores
    const rankedAthletes = [];

    for (const ranking of internalRankings || []) {
      // Skip if manual override and preserveOverrides is true
      if (preserveOverrides && ranking.is_manual_override) {
        rankedAthletes.push({
          ...ranking,
          blended_score: ranking.composite_score,
          is_locked: true
        });
        continue;
      }

      const athlete = ranking.athletes;
      const internalScore = ranking.composite_score || 0;

      // Find external rankings for this athlete (by name matching)
      const externalMatches = externalRankings?.filter(ext => 
        ext.athlete_name.toLowerCase().includes(athlete.profiles.full_name.toLowerCase()) ||
        athlete.profiles.full_name.toLowerCase().includes(ext.athlete_name.toLowerCase())
      ) || [];

      let blendedScore = internalScore;

      if (externalMatches.length > 0) {
        // Calculate average external rank (lower is better)
        const avgExternalRank = externalMatches.reduce((sum, ext) => sum + (ext.overall_rank || 100), 0) / externalMatches.length;
        
        // Convert rank to score (invert: rank 1 = score 100, rank 100 = score 1)
        const externalScore = Math.max(1, 101 - avgExternalRank);
        
        // Blend: 60% external, 40% internal
        blendedScore = (externalScore * 0.6) + (internalScore * 0.4);
      }

      rankedAthletes.push({
        ...ranking,
        blended_score: blendedScore,
        external_matches: externalMatches.length,
        is_locked: false
      });
    }

    // Sort by blended score (highest first)
    rankedAthletes.sort((a, b) => b.blended_score - a.blended_score);

    // Assign new ranks
    const updates: Array<{
      id: string;
      athlete_id: string;
      overall_rank: number;
      position_rank: number;
      state_rank: number;
      national_rank: number;
      composite_score: number;
      last_calculated_at: string;
    }> = [];
    const byPosition: Record<string, number> = {};
    const byState: Record<string, number> = {};

    rankedAthletes.forEach((athlete, index) => {
      const position = athlete.athletes.position || 'ATH';
      const state = athlete.athletes.state || 'XX';

      // Increment position and state counters
      byPosition[position] = (byPosition[position] || 0) + 1;
      byState[state] = (byState[state] || 0) + 1;

      updates.push({
        id: athlete.id,
        athlete_id: athlete.athlete_id,
        overall_rank: index + 1,
        position_rank: byPosition[position],
        state_rank: byState[state],
        national_rank: index + 1,
        composite_score: athlete.blended_score,
        last_calculated_at: new Date().toISOString(),
      });
    });

    // Update rankings in database
    const { error: updateError } = await supabase
      .from('rankings')
      .upsert(updates, { onConflict: 'athlete_id' });

    if (updateError) throw updateError;

    // Log the merge action
    await supabase.rpc('log_audit_event', {
      p_action: 'merge_rankings',
      p_resource_type: 'rankings',
      p_metadata: {
        sport,
        rankings_updated: updates.length,
        preserved_overrides: rankedAthletes.filter(r => r.is_locked).length
      }
    });

    console.log(`Successfully merged ${updates.length} rankings for ${sport}`);

    return new Response(
      JSON.stringify({
        success: true,
        rankings_updated: updates.length,
        preserved_overrides: rankedAthletes.filter(r => r.is_locked).length,
        external_rankings_used: externalRankings?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in merge-rankings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
