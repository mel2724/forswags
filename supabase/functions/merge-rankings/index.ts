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

    // Get all external rankings for this sport (start with external data)
    const { data: externalRankings, error: externalError } = await supabase
      .from('external_rankings')
      .select('*')
      .eq('sport', sport);

    if (externalError) throw externalError;

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

    console.log(`Found ${internalRankings?.length || 0} internal rankings, ${externalRankings?.length || 0} external rankings`);

    // Calculate blended scores - process ALL external rankings
    const rankedAthletes = [];
    const processedExternalIds = new Set();

    // SCENARIO A: Process internal athletes (blend internal + external)
    for (const ranking of internalRankings || []) {
      // Skip if manual override and preserveOverrides is true
      if (preserveOverrides && ranking.is_manual_override) {
        rankedAthletes.push({
          ...ranking,
          blended_score: ranking.composite_score,
          is_locked: true,
          is_external_only: false
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

      // Mark these external rankings as processed
      externalMatches.forEach(ext => processedExternalIds.add(ext.id));

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
        is_locked: false,
        is_external_only: false,
        sport: athlete.sport,
        graduation_year: athlete.graduation_year
      });
    }

    // SCENARIO B: Process external-only rankings (no matching athlete)
    const unprocessedExternal = externalRankings?.filter(ext => !processedExternalIds.has(ext.id)) || [];
    
    for (const extRanking of unprocessedExternal) {
      // Convert external rank to score (invert: rank 1 = score 100, rank 100 = score 1)
      const externalScore = Math.max(1, 101 - (extRanking.overall_rank || 100));
      
      rankedAthletes.push({
        athlete_id: null,
        external_athlete_name: extRanking.athlete_name,
        is_external_only: true,
        blended_score: externalScore,
        composite_score: externalScore,
        is_locked: false,
        external_matches: 1,
        sport: extRanking.sport,
        graduation_year: extRanking.graduation_year,
        position: extRanking.position,
        state: extRanking.state,
        high_school: extRanking.high_school,
        committed_school: extRanking.committed_school_name
      });
    }

    // Sort by blended score (highest first)
    rankedAthletes.sort((a, b) => b.blended_score - a.blended_score);

    // Assign new ranks
    const updates: Array<{
      id?: string;
      athlete_id: string | null;
      external_athlete_name?: string;
      is_external_only: boolean;
      overall_rank: number;
      position_rank: number;
      state_rank: number;
      national_rank: number;
      composite_score: number;
      sport: string;
      graduation_year?: number;
      last_calculated_at: string;
    }> = [];
    const byPosition: Record<string, number> = {};
    const byState: Record<string, number> = {};

    rankedAthletes.forEach((athlete, index) => {
      const position = athlete.position || (athlete.athletes?.position) || 'ATH';
      const state = athlete.state || (athlete.athletes?.state) || 'XX';

      // Increment position and state counters
      byPosition[position] = (byPosition[position] || 0) + 1;
      byState[state] = (byState[state] || 0) + 1;

      const updateRecord: any = {
        athlete_id: athlete.athlete_id,
        overall_rank: index + 1,
        position_rank: byPosition[position],
        state_rank: byState[state],
        national_rank: index + 1,
        composite_score: athlete.blended_score,
        sport: athlete.sport,
        graduation_year: athlete.graduation_year,
        last_calculated_at: new Date().toISOString(),
        is_external_only: athlete.is_external_only || false,
      };

      // Add id for existing records, external_athlete_name for external-only
      if (athlete.id) {
        updateRecord.id = athlete.id;
      }
      if (athlete.is_external_only) {
        updateRecord.external_athlete_name = athlete.external_athlete_name;
      }

      updates.push(updateRecord);
    });

    // Delete existing rankings for this sport to avoid conflicts
    const { error: deleteError } = await supabase
      .from('rankings')
      .delete()
      .eq('sport', sport);

    if (deleteError) throw deleteError;

    // Insert all new rankings
    const { error: insertError } = await supabase
      .from('rankings')
      .insert(updates.map(u => {
        const { id, ...record } = u;
        return record;
      }));

    if (insertError) throw insertError;

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
