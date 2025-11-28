import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { callGemini } from "../_shared/geminiHelper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const captionRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(1000, "Prompt must be less than 1000 characters"),
  context: z.string().max(500, "Context must be less than 500 characters").optional(),
  tone: z.enum(['professional', 'casual', 'energetic', 'inspirational', 'motivational']).default('professional'),
  maxLength: z.number().int().min(50).max(500).default(280),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validationResult = captionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, context, tone, maxLength } = validationResult.data;

    const systemPrompt = `You are an expert social media content creator specializing in athletic recruitment and sports marketing.
Generate engaging, authentic captions that help student athletes showcase their achievements and connect with coaches and recruiters.

Guidelines:
- Tone: ${tone}
- Max length: ${maxLength} characters
- Include relevant hashtags naturally
- Be authentic and engaging
- Focus on the athlete's story and achievements
- Avoid overly promotional language
- Use emojis sparingly and appropriately
${context ? `\nContext: ${context}` : ''}`;

    const { content: caption } = await callGemini([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.8,
      maxOutputTokens: 500
    });

    return new Response(
      JSON.stringify({ caption }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating caption:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate caption' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
