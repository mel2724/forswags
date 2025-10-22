import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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

async function getTemplate(templateKey: string): Promise<{ subject: string; content: string }> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("subject, content")
    .eq("template_key", templateKey)
    .single();

  if (error || !data) {
    console.error(`Failed to load template ${templateKey}:`, error);
    throw new Error(`Template ${templateKey} not found`);
  }

  return data;
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
    // SECURITY FIX: Verify authentication (JWT enabled in config.toml)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { to, template, variables, subject }: EmailRequest = await req.json();

    if (!to || !template) {
      throw new Error("Missing required fields: to, template");
    }

    console.log(`Sending ${template} email to ${to}`);

    // Load template from database
    const templateData = await getTemplate(template);
    const processedContent = substituteVariables(templateData.content, variables);
    const htmlContent = wrapInLayout(processedContent);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "ForSWAGs <noreply@updates.forswags.com>",
      to: [to],
      subject: subject || templateData.subject,
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
    
    // Send error notification to tech support
    try {
      await resend.emails.send({
        from: "ForSWAGs Errors <noreply@updates.forswags.com>",
        to: ["techsupport@forswags.com"],
        subject: "Email Send Error - ForSWAGs",
        html: `
          <h2>Email Send Error</h2>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Stack:</strong> <pre>${error.stack || 'N/A'}</pre></p>
        `,
      });
    } catch (notifyError) {
      console.error("Failed to send error notification:", notifyError);
    }
    
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
