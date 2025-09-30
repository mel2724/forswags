import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  template: string;
  variables: Record<string, string>;
  subject?: string;
}

const templateSubjects: Record<string, string> = {
  badge_earned: "New Badge Unlocked! 🎖️",
  college_match_ready: "Your Top College Matches Are Ready 🎯",
  eval_complete: "Your Evaluation is Complete 🔍",
  eval_started: "Your Evaluation Has Started",
  membership_renewal: "Membership Renewal Reminder",
  payment_receipt: "Payment Receipt - ForSWAGs",
  profile_nudge: "Complete Your Profile",
  profile_viewed: "Your Profile Was Viewed 👀",
  quiz_passed: "Quiz Passed! ✅",
  ranking_updated: "Your Ranking Has Been Updated 📊",
  recruiter_daily_digest: "ForSWAGs Daily Recruiter Digest",
  recruiter_weekly_digest: "ForSWAGs Weekly Recruiter Digest",
  social_post_ready: "Your Social Post is Ready 🚀",
};

async function loadTemplate(templateName: string): Promise<string> {
  try {
    const path = new URL(`../_templates/${templateName}.html`, import.meta.url);
    const response = await fetch(path);
    return await response.text();
  } catch (error) {
    console.error(`Failed to load template ${templateName}:`, error);
    throw new Error(`Template ${templateName} not found`);
  }
}

function substituteVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

function wrapInLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      background-color: #0F1117;
      color: #F1F1F1;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .content {
      background-color: #1A1F2E;
      border-radius: 8px;
      padding: 32px;
      border: 1px solid #2D3748;
    }
    h2 {
      margin-top: 0;
      font-size: 24px;
    }
    a {
      color: #FFD623;
      text-decoration: none;
      font-weight: 600;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 1px solid #2D3748;
      margin: 20px 0;
    }
    small {
      color: #A0A0A0;
      font-size: 12px;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      color: #A0A0A0;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ForSWAGs. All rights reserved.</p>
      <p>Questions? Contact us at support@forswags.com</p>
    </div>
  </div>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, template, variables, subject }: EmailRequest = await req.json();

    if (!to || !template) {
      throw new Error("Missing required fields: to, template");
    }

    console.log(`Sending ${template} email to ${to}`);

    // Load and process template
    const templateContent = await loadTemplate(template);
    const processedContent = substituteVariables(templateContent, variables);
    const htmlContent = wrapInLayout(processedContent);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "ForSWAGs <notifications@forswags.com>",
      to: [to],
      subject: subject || templateSubjects[template] || "ForSWAGs Notification",
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse.data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
