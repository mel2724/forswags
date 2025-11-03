import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistConfirmationRequest {
  name: string;
  email: string;
  role: 'parent' | 'recruiter';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, role }: WaitlistConfirmationRequest = await req.json();

    console.log(`Sending waitlist confirmation to ${email} (${role})`);

    const roleTitle = role === 'parent' ? 'Parent Portal' : 'College Scout Network';
    const roleDescription = role === 'parent' 
      ? 'connect with your athlete\'s journey and access parent-specific resources'
      : 'search athlete profiles, manage watchlists, and streamline your scouting process';

    const emailResponse = await resend.emails.send({
      from: "ForSWAGs <noreply@updates.forswags.com>",
      to: [email],
      subject: `You're on the Waitlist! - ${roleTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ForSWAGs Waitlist</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header with gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                        🎉 You're In!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                        Hi ${name}!
                      </h2>
                      
                      <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Thank you for your interest in the <strong>${roleTitle}</strong>! We're excited to have you on our waitlist.
                      </p>
                      
                      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">
                          ✅ Your spot is secured!
                        </p>
                        <p style="margin: 10px 0 0 0; color: #166534; font-size: 14px;">
                          We'll notify you by email as soon as the ${roleTitle} is ready to launch.
                        </p>
                      </div>
                      
                      <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                        What's Coming Your Way:
                      </h3>
                      
                      <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                        ${role === 'parent' ? `
                          <li>Direct insights into your athlete's journey</li>
                          <li>Real-time updates on profile views and scout interest</li>
                          <li>Parent-specific resources and guidance</li>
                          <li>Communication tools to stay connected</li>
                        ` : `
                          <li>Advanced athlete search and filtering tools</li>
                          <li>Watchlist management for prospective athletes</li>
                          <li>Direct communication with verified athletes</li>
                          <li>Analytics and scouting insights</li>
                        `}
                      </ul>
                      
                      <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        In the meantime, our athlete profiles are live! Athletes can sign up and start building their profiles today.
                      </p>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="https://forswags.com" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
                          Visit ForSWAGs
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                        Questions? Reply to this email or visit our website.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © 2025 ForSWAGs. Empowering student-athletes to achieve their dreams.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send confirmation email",
          details: emailResponse.error.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Waitlist confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-waitlist-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
