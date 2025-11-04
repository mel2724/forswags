import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logAIUsage } from '../_shared/logAIUsage.ts';

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
      console.error('No authenticated user found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Checking admin access for user:', user.id);

    // Use the has_role function for proper security
    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError) {
      console.error('Error checking admin role:', roleError);
      return new Response(JSON.stringify({ error: 'Failed to verify admin access' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAdmin) {
      console.error('User is not an admin:', user.id);
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Admin access verified');

    const { weeksAhead = 4 } = await req.json().catch(() => ({}));

    // Get least featured athletes for upcoming weeks
    const { data: athletes } = await supabaseClient
      .rpc('get_least_featured_athletes', { limit_count: weeksAhead * 7 });

    if (!athletes || athletes.length === 0) {
      return new Response(JSON.stringify({ error: 'No eligible athletes found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const scheduledPosts = [];
    
    // Generate posts for next N weeks (one per day)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start from tomorrow

    for (let i = 0; i < Math.min(athletes.length, weeksAhead * 7); i++) {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + i);

      // Check if already scheduled
      const { data: existing } = await supabaseClient
        .from('social_media_calendar')
        .select('id')
        .eq('athlete_id', athletes[i].athlete_id)
        .eq('scheduled_date', scheduledDate.toISOString().split('T')[0])
        .single();

      if (existing) continue;

      // Get athlete details
      const { data: athlete } = await supabaseClient
        .from('athletes')
        .select(`
          *,
          profiles:user_id (full_name),
          athlete_stats (stat_name, stat_value, season)
        `)
        .eq('id', athletes[i].athlete_id)
        .single();

      if (!athlete) continue;

      // Generate engaging copy
      const dayOfWeek = scheduledDate.toLocaleDateString('en-US', { weekday: 'long' });
      const prompt = `Create a hype social media post for student athlete ${athlete.profiles.full_name}.

Sport: ${athlete.sport}
Position: ${athlete.position || 'N/A'}
Class: ${athlete.graduation_year}
Day: ${dayOfWeek}

Write a 180-220 character engaging post that:
1. Introduces the athlete with energy
2. Highlights their position/sport
3. Includes a recruiter call-to-action
4. Matches ${dayOfWeek} vibes (e.g., Monday motivation, Friday celebration)

Return ONLY the post text, no hashtags.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          max_completion_tokens: 250,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const generatedCopy = aiData.choices[0].message.content;

        // Log AI usage
        await logAIUsage(supabaseClient, {
          function_name: 'generate-social-calendar',
          model_used: 'google/gemini-2.5-flash',
          user_id: user.id,
          request_type: 'social_calendar_generation',
          status: 'success',
        });

        const suggestedHashtags = [
          '#ForSWAGs',
          `#${athlete.sport}Recruit`,
          '#StudentAthlete',
          `#ClassOf${athlete.graduation_year}`,
          `#${dayOfWeek}Motivation`,
          '#RecruitmentSeason',
        ];

        const { data: scheduled } = await supabaseClient
          .from('social_media_calendar')
          .insert({
            athlete_id: athletes[i].athlete_id,
            scheduled_date: scheduledDate.toISOString().split('T')[0],
            promotion_type: 'daily_feature',
            generated_copy: generatedCopy,
            suggested_hashtags: suggestedHashtags,
            status: 'scheduled',
            created_by: user.id,
          })
          .select()
          .single();

        if (scheduled) {
          scheduledPosts.push({
            ...scheduled,
            athlete_name: athlete.profiles.full_name,
          });
        }
      }

      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Generated ${scheduledPosts.length} social media posts`);

    return new Response(JSON.stringify({ 
      success: true, 
      count: scheduledPosts.length,
      posts: scheduledPosts 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating social calendar:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});