import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    // Get all waitlist entries that haven't been emailed yet
    const { data: waitlistEntries, error: fetchError } = await supabaseClient
      .from("waitlist")
      .select("*")
      .eq("email_sent", false)
      .not("claim_token", "is", null);

    if (fetchError) throw fetchError;

    if (!waitlistEntries || waitlistEntries.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending invites to send" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = [];
    const appUrl = Deno.env.get("APP_URL") || "https://app.forswags.com";

    for (const entry of waitlistEntries) {
      try {
        const claimUrl = `${appUrl}/claim/${entry.claim_token}`;

        const emailResponse = await resend.emails.send({
          from: "ForSWAGs <onboarding@forswags.com>",
          to: [entry.email],
          subject: "Your ForSWAGs Profile is Ready! 🏆",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #9B51E0, #FFD623); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                .content { background: #f9f9f9; padding: 40px 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: linear-gradient(135deg, #9B51E0, #A85EE5); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Welcome to ForSWAGs!</h1>
                </div>
                <div class="content">
                  <h2>Hey ${entry.full_name.split(" ")[0]}! 👋</h2>
                  <p>Thanks for joining the movement! Your free ForSWAGs profile is ready and waiting for you.</p>
                  
                  <p><strong>What's next?</strong></p>
                  <ul>
                    <li>Claim your profile and complete your athlete information</li>
                    <li>Upload your highlights and showcase your talent</li>
                    <li>Get discovered by college recruiters nationwide</li>
                    <li>Access exclusive training through our Playbook for Life</li>
                  </ul>

                  <div style="text-align: center;">
                    <a href="${claimUrl}" class="button">Claim Your Free Profile</a>
                  </div>

                  <p style="margin-top: 30px; font-size: 14px; color: #666;">
                    This link expires in 6 months. Don't wait—claim your profile today and start building your recruiting presence!
                  </p>
                </div>
                <div class="footer">
                  <p>ForSWAGs - Building Athletes. Shaping Futures.</p>
                  <p>Questions? Reply to this email or visit app.forswags.com</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        // Mark as email sent
        await supabaseClient
          .from("waitlist")
          .update({ email_sent: true })
          .eq("id", entry.id);

        results.push({
          email: entry.email,
          success: true,
          messageId: emailResponse.data?.id,
        });

        console.log(`Email sent to ${entry.email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${entry.email}:`, emailError);
        const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
        results.push({
          email: entry.email,
          success: false,
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} invites`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-waitlist-invites function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
