import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { milestoneType, athleteName, sport, details, quote } = await req.json();

    if (!milestoneType || !athleteName || !sport || !details) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    console.log("Generating press release with Lovable AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate press release" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const pressRelease = data.choices?.[0]?.message?.content;

    if (!pressRelease) {
      console.error("No press release in response");
      return new Response(
        JSON.stringify({ error: "Failed to generate press release content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
