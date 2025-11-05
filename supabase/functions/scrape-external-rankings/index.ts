import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: any;
  };
  error?: string;
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
  committed_school_logo_url?: string;
  commitment_date?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

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

    const { sport = 'football' } = await req.json();

    console.log(`Starting scrape for sport: ${sport}`);
    
    const allAthletes: ExternalAthlete[] = [];
    const errors: string[] = [];

    // Scrape MaxPreps
    try {
      console.log('Scraping MaxPreps...');
      const maxprepsUrl = `https://www.maxpreps.com/rankings/${sport.toLowerCase()}/`;
      const maxprepsData = await scrapeMaxPreps(maxprepsUrl, sport, firecrawlApiKey);
      allAthletes.push(...maxprepsData);
      console.log(`MaxPreps: ${maxprepsData.length} athletes scraped`);
    } catch (error) {
      console.error('MaxPreps scraping error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`MaxPreps: ${errorMessage}`);
    }

    // Scrape 247Sports
    try {
      console.log('Scraping 247Sports...');
      const year = new Date().getFullYear();
      const sports247Url = `https://247sports.com/season/${year}-${sport.toLowerCase()}/recruitrankings/?InstitutionGroup=HighSchool`;
      const sports247Data = await scrape247Sports(sports247Url, sport, firecrawlApiKey);
      allAthletes.push(...sports247Data);
      console.log(`247Sports: ${sports247Data.length} athletes scraped`);
    } catch (error) {
      console.error('247Sports scraping error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`247Sports: ${errorMessage}`);
    }

    // Scrape ESPN
    try {
      console.log('Scraping ESPN...');
      const espnUrl = `https://www.espn.com/college-sports/${sport.toLowerCase()}/recruiting/rankings/`;
      const espnData = await scrapeESPN(espnUrl, sport, firecrawlApiKey);
      allAthletes.push(...espnData);
      console.log(`ESPN: ${espnData.length} athletes scraped`);
    } catch (error) {
      console.error('ESPN scraping error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`ESPN: ${errorMessage}`);
    }

    // Store in database
    if (allAthletes.length > 0) {
      const { error: insertError } = await supabase
        .from('external_rankings')
        .upsert(allAthletes, {
          onConflict: 'source,athlete_name,sport,graduation_year',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }
    }

    // Log the scraping action
    await supabase.rpc('log_audit_event', {
      p_action: 'scrape_external_rankings',
      p_resource_type: 'external_rankings',
      p_metadata: {
        sport,
        athletes_count: allAthletes.length,
        errors: errors.length > 0 ? errors : null
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        athletes_imported: allAthletes.length,
        by_source: {
          maxpreps: allAthletes.filter(a => a.source === 'maxpreps').length,
          '247sports': allAthletes.filter(a => a.source === '247sports').length,
          espn: allAthletes.filter(a => a.source === 'espn').length,
        },
        errors: errors.length > 0 ? errors : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-external-rankings:', error);
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

async function scrapeMaxPreps(url: string, sport: string, apiKey: string): Promise<ExternalAthlete[]> {
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
    }),
  });

  if (!response.ok) {
    throw new Error(`MaxPreps scrape failed: ${response.statusText}`);
  }

  const data: FirecrawlResponse = await response.json();
  
  if (!data.success || !data.data?.markdown) {
    throw new Error('MaxPreps: No data returned');
  }

  // Parse markdown to extract athlete data
  // This is a simplified parser - in production, you'd need more robust parsing
  const athletes: ExternalAthlete[] = [];
  const lines = data.data.markdown.split('\n');
  
  let currentRank = 1;
  for (const line of lines) {
    // Look for athlete names in the markdown (adjust pattern based on actual site structure)
    const nameMatch = line.match(/\*\*([A-Za-z\s]+)\*\*/);
    if (nameMatch) {
      athletes.push({
        source: 'maxpreps',
        athlete_name: nameMatch[1].trim(),
        sport: sport,
        overall_rank: currentRank++,
      });
    }
    
    // Limit to top 100
    if (athletes.length >= 100) break;
  }

  return athletes;
}

async function scrape247Sports(url: string, sport: string, apiKey: string): Promise<ExternalAthlete[]> {
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
    }),
  });

  if (!response.ok) {
    throw new Error(`247Sports scrape failed: ${response.statusText}`);
  }

  const data: FirecrawlResponse = await response.json();
  
  if (!data.success || !data.data?.markdown) {
    throw new Error('247Sports: No data returned');
  }

  const athletes: ExternalAthlete[] = [];
  const lines = data.data.markdown.split('\n');
  
  let currentRank = 1;
  for (const line of lines) {
    const nameMatch = line.match(/\*\*([A-Za-z\s]+)\*\*/);
    if (nameMatch) {
      athletes.push({
        source: '247sports',
        athlete_name: nameMatch[1].trim(),
        sport: sport,
        overall_rank: currentRank++,
      });
    }
    
    if (athletes.length >= 100) break;
  }

  return athletes;
}

async function scrapeESPN(url: string, sport: string, apiKey: string): Promise<ExternalAthlete[]> {
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
    }),
  });

  if (!response.ok) {
    throw new Error(`ESPN scrape failed: ${response.statusText}`);
  }

  const data: FirecrawlResponse = await response.json();
  
  if (!data.success || !data.data?.markdown) {
    throw new Error('ESPN: No data returned');
  }

  const athletes: ExternalAthlete[] = [];
  const lines = data.data.markdown.split('\n');
  
  let currentRank = 1;
  for (const line of lines) {
    const nameMatch = line.match(/\*\*([A-Za-z\s]+)\*\*/);
    if (nameMatch) {
      athletes.push({
        source: 'espn',
        athlete_name: nameMatch[1].trim(),
        sport: sport,
        overall_rank: currentRank++,
      });
    }
    
    if (athletes.length >= 100) break;
  }

  return athletes;
}
