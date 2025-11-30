import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ESPNAthlete {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  school?: {
    name?: string;
    state?: string;
  };
  rankings?: {
    overall?: number;
    position?: number;
    state?: number;
  };
  rating?: number;
  classYear?: number;
  height?: string;
  weight?: number;
  commitment?: {
    school?: string;
    date?: string;
  };
  imageUrl?: string;
}

interface ExternalAthlete {
  source: string;
  athlete_name: string;
  sport: string;
  position?: string;
  graduation_year?: number;
  state?: string;
  high_school?: string;
  overall_rank?: number;
  position_rank?: number;
  state_rank?: number;
  rating?: number;
  profile_url?: string;
  image_url?: string;
  committed_school_name?: string;
  commitment_date?: string;
  height_feet?: number;
  height_inches?: number;
  weight?: number;
}

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

    const { sport = 'football', year = new Date().getFullYear() } = await req.json();

    console.log(`Fetching ESPN rankings for ${sport}, year ${year}`);
    
    const athletes: ExternalAthlete[] = [];
    const errors: string[] = [];

    // Create scraping history record
    const { data: historyRecord, error: historyError } = await supabase
      .from('scraping_history')
      .insert({
        sport,
        status: 'pending',
        initiated_by: user.id,
        sources_attempted: ['ESPN-API'],
        sources_succeeded: [],
        athletes_scraped: 0,
        athletes_imported: 0,
        athletes_skipped: 0,
        errors: []
      })
      .select()
      .single();

    if (historyError) {
      console.error('Failed to create history record:', historyError);
    }

    const historyId = historyRecord?.id;

    // ESPN's hidden API endpoints (reverse-engineered)
    const espnEndpoints = [
      // Top 300 recruits
      `https://site.api.espn.com/apis/fitt/v3/sports/${sport}/recruiting/rankings/${year}?limit=300`,
      // State rankings
      `https://site.api.espn.com/apis/fitt/v3/sports/${sport}/recruiting/state-rankings/${year}`,
    ];

    for (const endpoint of espnEndpoints) {
      try {
        console.log(`Fetching from: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; RecruitingBot/1.0)',
          },
        });

        if (!response.ok) {
          console.error(`ESPN API error: ${response.status} ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        console.log(`ESPN API response structure:`, Object.keys(data));

        // Parse ESPN's response format
        const recruits = data.athletes || data.items || data.recruits || [];
        
        for (const recruit of recruits) {
          try {
            const athlete = parseESPNAthlete(recruit, sport);
            if (athlete) {
              athletes.push(athlete);
            }
          } catch (parseError) {
            console.error('Error parsing athlete:', parseError);
          }
        }

        console.log(`Parsed ${athletes.length} athletes from ESPN`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error fetching from ${endpoint}:`, errorMessage);
        errors.push(`ESPN API: ${errorMessage}`);
      }
    }

    // Remove duplicates (same athlete from different endpoints)
    const uniqueAthletes = deduplicateAthletes(athletes);
    console.log(`Unique athletes after deduplication: ${uniqueAthletes.length}`);

    // Store in database
    let importedCount = 0;
    if (uniqueAthletes.length > 0) {
      const { error: insertError } = await supabase
        .from('external_rankings')
        .upsert(uniqueAthletes, {
          onConflict: 'source,athlete_name,sport,graduation_year',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        errors.push(`Database: ${insertError.message}`);
      } else {
        importedCount = uniqueAthletes.length;
      }
    }

    // Update scraping history with results
    if (historyId) {
      await supabase
        .from('scraping_history')
        .update({
          status: errors.length > 0 && importedCount === 0 ? 'failed' : 'completed',
          athletes_scraped: uniqueAthletes.length,
          athletes_imported: importedCount,
          athletes_skipped: 0,
          sources_attempted: ['ESPN-API'],
          sources_succeeded: importedCount > 0 ? ['ESPN-API'] : [],
          errors: errors,
          completed_at: new Date().toISOString(),
          metadata: {
            year,
            endpoints_tried: espnEndpoints.length
          }
        })
        .eq('id', historyId);
    }

    // Log the operation
    await supabase.rpc('log_audit_event', {
      p_action: 'fetch_espn_rankings',
      p_resource_type: 'external_rankings',
      p_metadata: {
        sport,
        year,
        athletes_count: importedCount,
        errors: errors.length > 0 ? errors : null
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        athletes_imported: importedCount,
        source: 'ESPN Hidden API',
        errors: errors.length > 0 ? errors : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-espn-rankings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error to scraping history if we have access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          await supabase
            .from('scraping_history')
            .insert({
              sport: 'unknown',
              status: 'failed',
              sources_attempted: ['ESPN-API'],
              sources_succeeded: [],
              athletes_scraped: 0,
              athletes_imported: 0,
              athletes_skipped: 0,
              errors: [errorMessage],
              completed_at: new Date().toISOString(),
              initiated_by: user.id
            });
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function parseESPNAthlete(recruit: any, sport: string): ExternalAthlete | null {
  try {
    const firstName = recruit.firstName || recruit.first_name || '';
    const lastName = recruit.lastName || recruit.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (!fullName) {
      return null;
    }

    const height = parseHeight(recruit.height || recruit.measurements?.height);
    
    return {
      source: 'espn',
      athlete_name: fullName,
      sport: sport,
      position: recruit.position?.abbreviation || recruit.position || undefined,
      graduation_year: recruit.classYear || recruit.class_year || new Date().getFullYear(),
      state: recruit.school?.state || recruit.hometown?.state || undefined,
      high_school: recruit.school?.name || recruit.highSchool?.name || undefined,
      overall_rank: recruit.rankings?.overall || recruit.rank || undefined,
      position_rank: recruit.rankings?.position || recruit.position_rank || undefined,
      state_rank: recruit.rankings?.state || recruit.state_rank || undefined,
      rating: recruit.rating || recruit.stars || undefined,
      profile_url: recruit.links?.profile || recruit.url || undefined,
      image_url: recruit.imageUrl || recruit.image || recruit.headshot?.href || undefined,
      committed_school_name: recruit.commitment?.school || recruit.commitment?.name || undefined,
      commitment_date: recruit.commitment?.date || undefined,
      height_feet: height.feet,
      height_inches: height.inches,
      weight: recruit.weight || recruit.measurements?.weight || undefined,
    };
  } catch (error) {
    console.error('Error parsing ESPN athlete:', error);
    return null;
  }
}

function parseHeight(heightStr: string | undefined): { feet?: number; inches?: number } {
  if (!heightStr) return {};
  
  // Handle formats like "6-2", "6'2\"", "6 ft 2 in"
  const match = heightStr.match(/(\d+)[-'\s]*(\d+)?/);
  if (match) {
    return {
      feet: parseInt(match[1]),
      inches: match[2] ? parseInt(match[2]) : undefined
    };
  }
  
  return {};
}

function deduplicateAthletes(athletes: ExternalAthlete[]): ExternalAthlete[] {
  const seen = new Set<string>();
  const unique: ExternalAthlete[] = [];
  
  for (const athlete of athletes) {
    const key = `${athlete.athlete_name.toLowerCase()}_${athlete.graduation_year}_${athlete.sport}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(athlete);
    }
  }
  
  return unique;
}
