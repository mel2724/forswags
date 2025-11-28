import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { callGemini } from "../_shared/geminiHelper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const pressReleaseRequestSchema = z.object({
  milestoneType: z.enum([
    'commitment', 'scholarship', 'championship', 'record', 
    'award', 'signing', 'allstar', 'other'
  ]),
  athleteName: z.string().min(1, "Athlete name is required").max(100, "Athlete name must be less than 100 characters"),
  sport: z.string().min(1, "Sport is required").max(50, "Sport must be less than 50 characters"),
  details: z.string().min(10, "Details must be at least 10 characters").max(2000, "Details must be less than 2000 characters"),
  quote: z.string().max(500, "Quote must be less than 500 characters").optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validationResult = pressReleaseRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { milestoneType, athleteName, sport, details, quote } = validationResult.data;

    const milestoneTypeLabels: Record<string, string> = {
      commitment: "College Commitment",
      scholarship: "Scholarship Award",
      championship: "Championship Win",
      record: "Record Breaking Performance",
      award: "Award/Honor Received",
      signing: "Letter of Intent Signing",
      allstar: "All-Star Selection",
      other: "Athletic Milestone",
    };

    const systemPrompt = `You are a professional sports journalist and press release writer. Create a compelling, professional press release for an athlete's milestone achievement.

Guidelines:
- Use formal, professional journalistic tone
- Follow AP Style guidelines
- Include a strong headline that captures attention
- Lead with the most important information (who, what, when, where)
- Use strong active verbs
- Include relevant statistics and achievements
- Add context about the athlete's journey
- Keep paragraphs concise (2-3 sentences each)
- Total length should be 300-500 words
- End with a brief boilerplate about ForSWAGs if appropriate
${quote ? "- Incorporate the provided athlete quote naturally into the release" : ""}

Structure:
1. Compelling headline (all caps)
2. Subheadline (if needed)
3. Lead paragraph with key facts
4. Supporting paragraphs with details and context
5. Quote from athlete (if provided)
6. Background/achievement context
7. Brief boilerplate: "ForSWAGs is a premier platform connecting student-athletes with college recruiters and providing professional development resources."

Remember: This is a formal press release, not a social media post. Use third person and maintain journalistic objectivity.`;

    const userPrompt = `Create a professional press release for:

Milestone Type: ${milestoneTypeLabels[milestoneType] || milestoneType}
Athlete Name: ${athleteName}
Sport: ${sport}
Details: ${details}
${quote ? `Athlete Quote: "${quote}"` : ""}

Generate a complete, publication-ready press release following all the guidelines.`;

    console.log("Generating press release with Google Gemini...");

    const { content: pressRelease } = await callGemini([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], {
      temperature: 0.7,
      maxOutputTokens: 2048
    });

    console.log("Press release generated successfully");

    return new Response(
      JSON.stringify({ pressRelease }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-press-release function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
