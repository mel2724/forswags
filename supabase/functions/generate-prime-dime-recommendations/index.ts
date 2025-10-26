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
    console.log('[GENERATE-RECOMMENDATIONS] Function invoked');
    const body = await req.json();
    console.log('[GENERATE-RECOMMENDATIONS] Request body:', JSON.stringify(body));
    const { athleteId } = body;
    
    console.log('[GENERATE-RECOMMENDATIONS] Processing for athlete ID:', athleteId);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation data
    console.log('[GENERATE-RECOMMENDATIONS] Fetching conversation data');
    const { data: prefs, error: prefsError } = await supabase
      .from('college_match_prefs')
      .select('conversation_data')
      .eq('athlete_id', athleteId)
      .single();

    if (prefsError) {
      console.error('[GENERATE-RECOMMENDATIONS] Error fetching prefs:', prefsError);
      throw prefsError;
    }

    console.log('[GENERATE-RECOMMENDATIONS] Conversation data retrieved, answers count:', prefs.conversation_data?.answers?.length || 0);
    const answers = prefs.conversation_data?.answers || [];

    // Build comprehensive prompt from all answers
    const answersText = answers.map((a: any) => 
      `Q: ${a.question}\nA: ${a.answer}`
    ).join('\n\n');

    const systemPrompt = `You are an expert college recruiting advisor. Based on the student-athlete's answers, recommend 10 specific colleges that would be the best fit.

For each college recommendation, provide:
1. College name
2. Division level
3. Location (City, State)
4. Why it's a good fit (2-3 sentences)
5. Twitter handle for the appropriate sport's recruiting coordinator (format: @username)

Consider:
- Athletic level and competition
- Academic programs and GPA fit
- Financial considerations
- Location preferences
- Campus culture fit
- Career goals

Return your response in this exact JSON format:
{
  "summary": "Brief 2-3 sentence summary of their ideal college profile",
  "colleges": [
    {
      "name": "College Name",
      "division": "D1/D2/D3/NAIA/JUCO",
      "location": "City, State",
      "fit_reason": "Why this is a great match",
      "recruiter_twitter": "@username"
    }
  ],
  "next_steps": "Advice on next steps and using ForSWAGs tools"
}`;

    console.log('[GENERATE-RECOMMENDATIONS] Calling AI with answers text length:', answersText.length);
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here are the student-athlete's answers:\n\n${answersText}\n\nPlease provide 10 college recommendations with Twitter handles for recruiters.` }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[GENERATE-RECOMMENDATIONS] AI API error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) throw new Error('Rate limit exceeded');
      if (aiResponse.status === 402) throw new Error('AI credits depleted');
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    console.log('[GENERATE-RECOMMENDATIONS] AI response received');
    const aiData = await aiResponse.json();
    let recommendations;
    
    try {
      recommendations = JSON.parse(aiData.choices[0].message.content);
    } catch (e) {
      // If JSON parsing fails, try to extract JSON from the response
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Store recommendations
    console.log('[GENERATE-RECOMMENDATIONS] Storing recommendations in database');
    const { error: insertError } = await supabase
      .from('college_recommendations')
      .upsert({
        athlete_id: athleteId,
        recommendations: recommendations,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'athlete_id',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('[GENERATE-RECOMMENDATIONS] Error storing recommendations:', insertError);
      throw insertError;
    }

    console.log('[GENERATE-RECOMMENDATIONS] Recommendations stored successfully');

    // Send notification email
    try {
      await supabase.functions.invoke('notify-prime-dime-ready', {
        body: { athleteId }
      });
    } catch (emailError) {
      console.error('Failed to send notification:', emailError);
      // Don't fail the whole request if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        recommendations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating recommendations:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
