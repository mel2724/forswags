import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const QUESTIONS = [
  // ATHLETICS
  { id: 1, text: "What sport and position do you play?" },
  { id: 2, text: "What college division level? (D1, D2, D3, NAIA, JUCO)" },
  { id: 3, text: "What are your key stats or awards?" },
  { id: 4, text: "Start as a freshman or develop over time?" },
  { id: 5, text: "Do you need athletic scholarships?" },
  
  // ACADEMICS
  { id: 6, text: "What's your GPA?" },
  { id: 7, text: "SAT or ACT score?" },
  { id: 8, text: "What majors interest you?" },
  { id: 9, text: "Need academic support services?" },
  { id: 10, text: "Prefer academically or athletically focused schools?" },
  
  // FINANCES
  { id: 11, text: "Do you need financial aid?" },
  { id: 12, text: "Are you FAFSA or Pell Grant eligible?" },
  { id: 13, text: "Consider private/out-of-state if aid is good?" },
  { id: 14, text: "Willing to work part-time in college?" },
  
  // LOCATION
  { id: 15, text: "Stay close to home or go out of state?" },
  { id: 16, text: "Urban, rural, or suburban campus?" },
  { id: 17, text: "Small, medium, or large school size?" },
  { id: 18, text: "Does weather matter?" },
  
  // LIFESTYLE
  { id: 19, text: "Want a faith-based or values-driven school?" },
  { id: 20, text: "Is campus culture important (diversity, clubs, etc.)?" },
  { id: 21, text: "Care about school prestige or traditions?" },
  { id: 22, text: "Backup career plan if sports don't work out?" }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { athleteId, messages } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current question progress
    const { data: prefs } = await supabase
      .from('college_match_prefs')
      .select('conversation_data, conversation_completed')
      .eq('athlete_id', athleteId)
      .maybeSingle();

    const conversationData = prefs?.conversation_data || { answers: [], currentQuestion: 0 };
    const currentQuestionIndex = conversationData.currentQuestion || 0;

    // Check if all questions are answered
    if (currentQuestionIndex >= QUESTIONS.length) {
      // Generate final recommendations
      const systemPrompt = `You are a College Match Advisor. Based on the student-athlete's answers, provide a warm closing summary and remind them to:
1. Talk to their family and coaches
2. Use ForSWAGs tools to continue their college search
3. Let them know their detailed recommendations are being generated

Keep it brief, encouraging, and coach-like.`;

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
            ...messages
          ],
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) throw new Error('AI API error');
      const aiData = await aiResponse.json();
      const responseMessage = aiData.choices[0].message.content;

      // Mark conversation as complete
      await supabase
        .from('college_match_prefs')
        .upsert({
          athlete_id: athleteId,
          conversation_completed: true,
          conversation_data: conversationData
        }, { onConflict: 'athlete_id' });

      // Trigger recommendations generation
      await supabase.functions.invoke('generate-prime-dime-recommendations', {
        body: { athleteId }
      });

      return new Response(
        JSON.stringify({ 
          message: responseMessage,
          completed: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Continue with questions
    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const lastUserMessage = messages[messages.length - 1];

    // Store the answer if there was a user response
    if (lastUserMessage.role === 'user' && currentQuestionIndex > 0) {
      conversationData.answers.push({
        questionId: QUESTIONS[currentQuestionIndex - 1].id,
        question: QUESTIONS[currentQuestionIndex - 1].text,
        answer: lastUserMessage.content
      });
    }

    // Get AI to ask the next question in a coach-like manner
    const systemPrompt = `You are a College Match Advisor. Ask this question directly and briefly:

"${currentQuestion.text}"

Keep it SHORT - just ask the question with maybe ONE quick sentence of context if needed. No fluff. Be direct and friendly.`;

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
          { role: 'user', content: 'Ask the next question' }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) throw new Error('Rate limit exceeded. Please try again in a moment.');
      if (aiResponse.status === 402) throw new Error('AI service unavailable. Please contact support.');
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const responseMessage = aiData.choices[0].message.content;

    // Update conversation progress
    conversationData.currentQuestion = currentQuestionIndex + 1;
    
    await supabase
      .from('college_match_prefs')
      .upsert({
        athlete_id: athleteId,
        conversation_data: conversationData,
        conversation_completed: false
      }, { onConflict: 'athlete_id' });

    return new Response(
      JSON.stringify({ 
        message: responseMessage,
        completed: false,
        progress: `${currentQuestionIndex + 1}/${QUESTIONS.length}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in prime-dime-advisor:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
