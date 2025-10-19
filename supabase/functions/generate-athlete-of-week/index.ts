import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin access
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roles || roles.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { forceGenerate = false } = await req.json().catch(() => ({}));

    // Calculate week dates
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Check if already generated for this week
    if (!forceGenerate) {
      const { data: existing } = await supabaseClient
        .from('athlete_of_week')
        .select('*')
        .eq('week_start_date', startOfWeek.toISOString().split('T')[0])
        .single();

      if (existing) {
        return new Response(JSON.stringify({ 
          message: 'Already generated for this week',
          data: existing 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get selection criteria (rotate weekly)
    const weekNumber = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 604800000);
    const criteriaOptions = [
      { key: 'course_progress', name: 'Playbook for Life Progress', query: 'course_completion' },
      { key: 'stats_updated', name: 'Recent Stats Updates', query: 'stats_activity' },
      { key: 'profile_views', name: 'Profile Engagement', query: 'profile_views' },
      { key: 'media_uploads', name: 'Media Content Activity', query: 'media_activity' },
      { key: 'evaluation_scores', name: 'Evaluation Performance', query: 'evaluation_scores' },
    ];
    const selectedCriteria = criteriaOptions[weekNumber % criteriaOptions.length];

    // Get least featured athletes
    const { data: leastFeatured } = await supabaseClient
      .rpc('get_least_featured_athletes', { limit_count: 20 });

    if (!leastFeatured || leastFeatured.length === 0) {
      return new Response(JSON.stringify({ error: 'No eligible athletes found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Score athletes based on selected criteria
    let selectedAthlete = null;
    let highestScore = -1;

    for (const athlete of leastFeatured) {
      let score = 0;
      
      switch (selectedCriteria.key) {
        case 'course_progress': {
          const { data: progress } = await supabaseClient
            .from('course_progress')
            .select('progress_percentage')
            .eq('user_id', athlete.athlete_id)
            .order('progress_percentage', { ascending: false })
            .limit(1)
            .single();
          score = progress?.progress_percentage || 0;
          break;
        }
        case 'stats_updated': {
          const { data: stats } = await supabaseClient
            .from('athlete_stats')
            .select('updated_at')
            .eq('athlete_id', athlete.athlete_id)
            .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .limit(10);
          score = (stats?.length || 0) * 10;
          break;
        }
        case 'profile_views': {
          const { data: views } = await supabaseClient
            .from('profile_views')
            .select('id')
            .eq('athlete_id', athlete.athlete_id)
            .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
          score = views?.length || 0;
          break;
        }
        case 'media_uploads': {
          const { data: media } = await supabaseClient
            .from('media_assets')
            .select('id')
            .eq('athlete_id', athlete.athlete_id)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
          score = (media?.length || 0) * 15;
          break;
        }
        case 'evaluation_scores': {
          const { data: evals } = await supabaseClient
            .from('evaluations')
            .select('rating')
            .eq('athlete_id', athlete.athlete_id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();
          score = (evals?.rating || 0) * 20;
          break;
        }
      }

      // Bonus for never being featured
      if (!athlete.last_featured_date) {
        score += 50;
      }

      if (score > highestScore) {
        highestScore = score;
        selectedAthlete = athlete;
      }
    }

    if (!selectedAthlete) {
      return new Response(JSON.stringify({ error: 'Could not select athlete' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get full athlete profile
    const { data: athlete } = await supabaseClient
      .from('athletes')
      .select(`
        *,
        profiles:user_id (full_name, email),
        athlete_stats (stat_name, stat_value, season),
        media_assets (url, media_type, title)
      `)
      .eq('id', selectedAthlete.athlete_id)
      .single();

    // Generate copy using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const prompt = `Create an exciting "Athlete of the Week" social media post for ${athlete.profiles.full_name}.

Sport: ${athlete.sport}
Position: ${athlete.position || 'N/A'}
Graduation Year: ${athlete.graduation_year}
Selection Criteria: ${selectedCriteria.name}

Recent highlights:
${athlete.athlete_stats?.slice(0, 3).map((s: any) => `- ${s.stat_name}: ${s.stat_value} (${s.season})`).join('\n') || 'No recent stats'}

Write an engaging 200-250 character post that:
1. Celebrates their achievement
2. Highlights why they were selected
3. Includes a call-to-action for recruiters
4. Is upbeat and motivational

Format: Return ONLY the post text, no hashtags.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    const generatedCopy = aiData.choices[0].message.content;

    const suggestedHashtags = [
      '#AthleteOfTheWeek',
      '#ForSWAGs',
      `#${athlete.sport}Recruit`,
      '#StudentAthlete',
      `#ClassOf${athlete.graduation_year}`,
      '#RecruitMe',
    ];

    const rationale = `Selected based on ${selectedCriteria.name}. ${athlete.profiles.full_name} scored ${highestScore} points in our evaluation. ${
      !selectedAthlete.last_featured_date 
        ? 'This is their first time being featured.' 
        : `Last featured ${selectedAthlete.days_since_feature} days ago.`
    }`;

    // Insert athlete of week
    const { data: aotw, error } = await supabaseClient
      .from('athlete_of_week')
      .insert({
        athlete_id: selectedAthlete.athlete_id,
        week_start_date: startOfWeek.toISOString().split('T')[0],
        week_end_date: endOfWeek.toISOString().split('T')[0],
        selection_criteria: selectedCriteria.name,
        selection_rationale: rationale,
        generated_copy: generatedCopy,
        suggested_hashtags: suggestedHashtags,
        created_by: user.id,
        auto_generated: true,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Generated Athlete of the Week:', aotw);

    return new Response(JSON.stringify({ 
      success: true, 
      data: aotw,
      athlete: {
        name: athlete.profiles.full_name,
        sport: athlete.sport,
        graduation_year: athlete.graduation_year,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating athlete of week:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});