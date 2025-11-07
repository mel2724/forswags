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

// Common validation helpers
function isValidPersonName(name: string): boolean {
  // Filter out common false positives
  const invalidPatterns = [
    /fighting/i,
    /recruits/i,
    /rankings/i,
    /top \d+/i,
    /class of/i,
    /notre dame/i,
    /university/i,
    /college/i,
    /high school/i,
    /composite/i,
    /overall/i
  ];
  
  if (invalidPatterns.some(pattern => pattern.test(name))) {
    return false;
  }
  
  // Must be at least 2 words, each at least 2 characters
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return false;
  if (words.some(w => w.length < 2)) return false;
  
  // Must have proper capitalization (not all caps unless abbreviation)
  if (name === name.toUpperCase() && name.length > 4) return false;
  
  return true;
}

function parseHeightWeight(text: string): { height_feet?: number; height_inches?: number; weight?: number } {
  const result: { height_feet?: number; height_inches?: number; weight?: number } = {};
  
  // Height pattern: 6-2, 6'2", etc.
  const heightMatch = text.match(/(\d)\s*[-']\s*(\d{1,2})/);
  if (heightMatch) {
    result.height_feet = parseInt(heightMatch[1]);
    result.height_inches = parseInt(heightMatch[2]);
  }
  
  // Weight pattern: 215, 215 lbs, etc.
  const weightMatch = text.match(/(\d{3})\s*(?:lbs?)?/);
  if (weightMatch) {
    result.weight = parseInt(weightMatch[1]);
  }
  
  return result;
}

function extractGraduationYear(text: string): number | undefined {
  // Look for year patterns: 2025, '25, Class of 2025, etc.
  const yearMatch = text.match(/(?:class of |')?(\d{2,4})/i);
  if (yearMatch) {
    let year = parseInt(yearMatch[1]);
    // Convert 2-digit to 4-digit year
    if (year < 100) {
      year += 2000;
    }
    // Validate it's a reasonable graduation year
    if (year >= 2024 && year <= 2030) {
      return year;
    }
  }
  return undefined;
}

async function scrapeMaxPreps(url: string, sport: string, apiKey: string): Promise<ExternalAthlete[]> {
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['html', 'markdown'],
    }),
  });

  if (!response.ok) {
    throw new Error(`MaxPreps scrape failed: ${response.statusText}`);
  }

  const data: FirecrawlResponse = await response.json();
  
  if (!data.success || !data.data?.html) {
    throw new Error('MaxPreps: No data returned');
  }

  const html = data.data.html;
  const markdown = data.data.markdown || '';
  
  console.log(`MaxPreps HTML length: ${html.length}, markdown length: ${markdown.length}`);
  
  const athletes: ExternalAthlete[] = [];
  
  // Extract from HTML using regex patterns for ranking tables
  // Look for player card/row structures with data attributes
  const playerRowRegex = /<tr[^>]*class="[^"]*player[^"]*"[^>]*>(.*?)<\/tr>/gis;
  const nameRegex = /<(?:a|span)[^>]*class="[^"]*(?:player-name|name)[^"]*"[^>]*>([^<]+)<\/(?:a|span)>/i;
  const positionRegex = /<(?:span|div)[^>]*class="[^"]*(?:position|pos)[^"]*"[^>]*>([A-Z]{1,3})<\/(?:span|div)>/i;
  const heightWeightRegex = /(\d-\d{1,2})\s*\/\s*(\d{3})/;
  const schoolRegex = /<(?:span|div)[^>]*class="[^"]*(?:school|commitment)[^"]*"[^>]*>([^<]+)<\/(?:span|div)>/i;
  
  const rows = html.match(playerRowRegex) || [];
  let rank = 1;
  
  for (const row of rows) {
    const nameMatch = row.match(nameRegex);
    if (!nameMatch) continue;
    
    const name = nameMatch[1].trim();
    if (!isValidPersonName(name)) continue;
    
    const athlete: ExternalAthlete = {
      source: 'maxpreps',
      athlete_name: name,
      sport: sport,
      overall_rank: rank++,
    };
    
    // Extract position
    const posMatch = row.match(positionRegex);
    if (posMatch) {
      athlete.position = posMatch[1];
    }
    
    // Extract height/weight
    const hwMatch = row.match(heightWeightRegex);
    if (hwMatch) {
      const hw = parseHeightWeight(hwMatch[0]);
      Object.assign(athlete, hw);
    }
    
    // Extract committed school
    const schoolMatch = row.match(schoolRegex);
    if (schoolMatch) {
      athlete.committed_school_name = schoolMatch[1].trim();
    }
    
    // Extract graduation year from row
    const gradYear = extractGraduationYear(row);
    if (gradYear) {
      athlete.graduation_year = gradYear;
    }
    
    athletes.push(athlete);
    if (athletes.length >= 100) break;
  }

  console.log(`MaxPreps extracted ${athletes.length} athletes`);
  if (athletes.length > 0) {
    console.log(`Sample: ${JSON.stringify(athletes[0], null, 2)}`);
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
      formats: ['html', 'markdown'],
    }),
  });

  if (!response.ok) {
    throw new Error(`247Sports scrape failed: ${response.statusText}`);
  }

  const data: FirecrawlResponse = await response.json();
  
  if (!data.success || !data.data?.html) {
    throw new Error('247Sports: No data returned');
  }

  const html = data.data.html;
  console.log(`247Sports HTML length: ${html.length}`);
  
  const athletes: ExternalAthlete[] = [];
  
  // 247Sports has recruit cards with specific structure
  const recruitCardRegex = /<li[^>]*class="[^"]*(?:recruit|ranking-item)[^"]*"[^>]*>(.*?)<\/li>/gis;
  const nameRegex = /<a[^>]*class="[^"]*(?:name|player)[^"]*"[^>]*>([^<]+)<\/a>/i;
  const positionRegex = /<span[^>]*class="[^"]*position[^"]*"[^>]*>([A-Z]{1,3})<\/span>/i;
  const metricsRegex = /(\d-\d{1,2})\s*\/\s*(\d{3})/;
  const commitmentRegex = /<img[^>]*alt="([^"]+)"[^>]*class="[^"]*(?:commit|logo)[^"]*"/i;
  
  const cards = html.match(recruitCardRegex) || [];
  let rank = 1;
  
  for (const card of cards) {
    const nameMatch = card.match(nameRegex);
    if (!nameMatch) continue;
    
    const name = nameMatch[1].trim();
    if (!isValidPersonName(name)) continue;
    
    const athlete: ExternalAthlete = {
      source: '247sports',
      athlete_name: name,
      sport: sport,
      overall_rank: rank++,
    };
    
    const posMatch = card.match(positionRegex);
    if (posMatch) {
      athlete.position = posMatch[1];
    }
    
    const metricsMatch = card.match(metricsRegex);
    if (metricsMatch) {
      const hw = parseHeightWeight(metricsMatch[0]);
      Object.assign(athlete, hw);
    }
    
    const commitMatch = card.match(commitmentRegex);
    if (commitMatch) {
      athlete.committed_school_name = commitMatch[1].trim();
    }
    
    const gradYear = extractGraduationYear(card);
    if (gradYear) {
      athlete.graduation_year = gradYear;
    }
    
    athletes.push(athlete);
    if (athletes.length >= 100) break;
  }

  console.log(`247Sports extracted ${athletes.length} athletes`);
  if (athletes.length > 0) {
    console.log(`Sample: ${JSON.stringify(athletes[0], null, 2)}`);
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
      formats: ['html', 'markdown'],
    }),
  });

  if (!response.ok) {
    throw new Error(`ESPN scrape failed: ${response.statusText}`);
  }

  const data: FirecrawlResponse = await response.json();
  
  if (!data.success || !data.data?.html) {
    throw new Error('ESPN: No data returned');
  }

  const html = data.data.html;
  console.log(`ESPN HTML length: ${html.length}`);
  
  const athletes: ExternalAthlete[] = [];
  
  // ESPN uses table rows for rankings
  const tableRowRegex = /<tr[^>]*class="[^"]*(?:Table__TR|recruit-row)[^"]*"[^>]*>(.*?)<\/tr>/gis;
  const nameRegex = /<a[^>]*>([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)<\/a>/i;
  const positionRegex = /<td[^>]*>([A-Z]{1,3})<\/td>/i;
  const statsRegex = /(\d-\d{1,2})\s*,\s*(\d{3})/;
  
  const rows = html.match(tableRowRegex) || [];
  let rank = 1;
  
  for (const row of rows) {
    const nameMatch = row.match(nameRegex);
    if (!nameMatch) continue;
    
    const name = nameMatch[1].trim();
    if (!isValidPersonName(name)) continue;
    
    const athlete: ExternalAthlete = {
      source: 'espn',
      athlete_name: name,
      sport: sport,
      overall_rank: rank++,
    };
    
    const posMatch = row.match(positionRegex);
    if (posMatch) {
      athlete.position = posMatch[1];
    }
    
    const statsMatch = row.match(statsRegex);
    if (statsMatch) {
      const hw = parseHeightWeight(statsMatch[0]);
      Object.assign(athlete, hw);
    }
    
    const gradYear = extractGraduationYear(row);
    if (gradYear) {
      athlete.graduation_year = gradYear;
    }
    
    athletes.push(athlete);
    if (athletes.length >= 100) break;
  }

  console.log(`ESPN extracted ${athletes.length} athletes`);
  if (athletes.length > 0) {
    console.log(`Sample: ${JSON.stringify(athletes[0], null, 2)}`);
  }
  
  return athletes;
}
