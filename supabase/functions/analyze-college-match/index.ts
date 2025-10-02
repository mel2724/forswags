import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { athleteId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch athlete profile and stats
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select(`
        *,
        profiles!inner(*)
      `)
      .eq('id', athleteId)
      .single();

    if (athleteError) throw athleteError;

    // Fetch athlete stats
    const { data: stats } = await supabase
      .from('athlete_stats')
      .select('*')
      .eq('athlete_id', athleteId);

    // Fetch preferences
    const { data: prefs } = await supabase
      .from('college_match_prefs')
      .select('*')
      .eq('athlete_id', athleteId)
      .single();

    // Fetch schools to analyze
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .limit(50); // Analyze top 50 schools

    if (schoolsError) throw schoolsError;

    // Prepare data for AI analysis
    const athleteProfile = {
      sport: athlete.sport,
      position: athlete.position,
      graduation_year: athlete.graduation_year,
      gpa: athlete.gpa,
      sat_score: athlete.sat_score,
      act_score: athlete.act_score,
      height: athlete.height_in,
      weight: athlete.weight_lb,
      stats: stats || [],
      bio: athlete.bio,
      athletic_awards: athlete.athletic_awards,
      academic_achievements: athlete.academic_achievements,
      preferences: prefs || {}
    };

    console.log('Analyzing matches for athlete:', athleteId);

    // Analyze each school using Lovable AI
    const matches = [];
    
    for (const school of schools) {
      const prompt = `Analyze the college fit for this student-athlete profile and school.

Student-Athlete Profile:
${JSON.stringify(athleteProfile, null, 2)}

School Information:
${JSON.stringify(school, null, 2)}

Provide a detailed analysis with scores (0-100) for:
1. Academic Fit - Based on GPA, test scores, academic programs
2. Athletic Fit - Based on sport, position, stats, division level
3. Financial Fit - Based on tuition, scholarships, athlete's preferences
4. Campus Culture Fit - Based on location, size, student life

Return ONLY valid JSON in this exact format:
{
  "academic_fit": <number 0-100>,
  "athletic_fit": <number 0-100>,
  "financial_fit": <number 0-100>,
  "culture_fit": <number 0-100>,
  "overall_score": <number 0-100>,
  "summary": "<brief 2-3 sentence summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "considerations": ["<consideration 1>", "<consideration 2>"]
}`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: 'You are a college recruiting expert. Analyze student-athlete profiles and provide detailed fit assessments. Always respond with valid JSON only, no additional text.' 
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
          }),
        });

        if (!aiResponse.ok) {
          if (aiResponse.status === 429) {
            console.error('Rate limit exceeded');
            continue;
          }
          if (aiResponse.status === 402) {
            console.error('Payment required for Lovable AI');
            throw new Error('Lovable AI credits depleted');
          }
          throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const analysis = JSON.parse(aiData.choices[0].message.content);

        matches.push({
          school_id: school.id,
          athlete_id: athleteId,
          match_score: analysis.overall_score,
          academic_fit: analysis.academic_fit,
          athletic_fit: analysis.athletic_fit,
          financial_fit: analysis.financial_fit,
          notes: JSON.stringify({
            culture_fit: analysis.culture_fit,
            summary: analysis.summary,
            strengths: analysis.strengths,
            considerations: analysis.considerations
          })
        });
      } catch (error) {
        console.error(`Error analyzing school ${school.name}:`, error);
        continue;
      }
    }

    // Store matches in database
    if (matches.length > 0) {
      // Delete existing matches for this athlete
      await supabase
        .from('college_matches')
        .delete()
        .eq('athlete_id', athleteId);

      // Insert new matches
      const { error: insertError } = await supabase
        .from('college_matches')
        .insert(matches);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        matches_analyzed: matches.length,
        message: `Successfully analyzed ${matches.length} college matches`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-college-match:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
