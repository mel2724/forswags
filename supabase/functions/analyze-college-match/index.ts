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
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { athleteId } = await req.json();
    
    // Validate athleteId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!athleteId || !uuidRegex.test(athleteId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid athlete ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch athlete profile and verify ownership
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select(`
        *,
        profiles!inner(*)
      `)
      .eq('id', athleteId)
      .single();

    if (athleteError || !athlete) {
      return new Response(
        JSON.stringify({ error: 'Athlete not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify user is owner or admin
    const isOwner = athlete.user_id === user.id;
    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    if (!isOwner && !isAdmin) {
      console.log('Authorization failed: User', user.id, 'attempted to analyze athlete', athleteId);
      return new Response(
        JSON.stringify({ error: 'Unauthorized to analyze this athlete' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Rate limiting: Check if analysis was run in last 24 hours
    const { data: recentMatches } = await supabase
      .from('college_matches')
      .select('created_at')
      .eq('athlete_id', athleteId)
      .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      .limit(1);

    if (recentMatches && recentMatches.length > 0) {
      const nextAvailable = new Date(new Date(recentMatches[0].created_at).getTime() + 24*60*60*1000);
      return new Response(
        JSON.stringify({ 
          error: 'Analysis already run in last 24 hours. Please try again later.',
          next_available: nextAvailable.toISOString()
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-college-match:', errorMessage);
    
    // Send error notification to tech support
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ForSWAGs Errors <noreply@updates.forswags.com>',
            to: ['techsupport@forswags.com'],
            subject: 'College Match Analysis Error - ForSWAGs',
            html: `
              <h2>College Match Analysis Error</h2>
              <p><strong>Error:</strong> ${errorMessage}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>Stack:</strong> <pre>${error instanceof Error ? error.stack : 'N/A'}</pre></p>
              <p><strong>Note:</strong> Check if LOVABLE_API_KEY is configured and has sufficient credits.</p>
            `,
          }),
        });
      }
    } catch (notifyError) {
      console.error('Failed to send error notification:', notifyError);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
