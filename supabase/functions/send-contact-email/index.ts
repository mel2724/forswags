import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot?: string;
  timestamp?: number;
}

// HTML escape function to prevent XSS
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message, honeypot, timestamp }: ContactEmailRequest = await req.json();

    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.log("Honeypot triggered - blocking spam");
      return new Response(
        JSON.stringify({ error: "Invalid submission" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Timing check - submission must take at least 3 seconds
    if (timestamp && (Date.now() - timestamp) < 3000) {
      console.log("Form submitted too quickly - blocking spam");
      return new Response(
        JSON.stringify({ error: "Please take your time filling out the form" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate inputs
    if (!name || name.length > 100) {
      throw new Error("Invalid name");
    }
    if (!email || email.length > 255 || !email.includes("@")) {
      throw new Error("Invalid email");
    }
    if (!subject || subject.length > 200) {
      throw new Error("Invalid subject");
    }
    if (!message || message.length < 10 || message.length > 2000) {
      throw new Error("Invalid message");
    }

    // Get client IP address
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                      req.headers.get("x-real-ip") || 
                      "unknown";

    // Rate limiting check - max 5 submissions per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentSubmissions, error: rateLimitError } = await supabase
      .from("contact_form_submissions")
      .select("id")
      .eq("ip_address", ipAddress)
      .gte("submitted_at", oneHourAgo);

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (recentSubmissions && recentSubmissions.length >= 5) {
      console.log(`Rate limit exceeded for IP: ${ipAddress}`);
      return new Response(
        JSON.stringify({ error: "Too many submissions. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send confirmation email to user
    const userEmail = await resend.emails.send({
      from: "ForSWAGs Contact <noreply@updates.forswags.com>",
      to: [email],
      subject: "We received your message!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #9B51E0 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .message-box { background: white; padding: 20px; border-left: 4px solid #9B51E0; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Thank You for Contacting ForSWAGs!</h1>
              </div>
              <div class="content">
                <p>Hi ${escapeHtml(name)},</p>
                <p>We've received your message and our team will get back to you as soon as possible, usually within 24-48 hours.</p>
                
                <div class="message-box">
                  <p><strong>Your Message:</strong></p>
                  <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
                  <p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
                </div>
                
                <p>In the meantime, feel free to explore our platform and check out athlete profiles, training courses, and more.</p>
                
                <p>Best regards,<br><strong>The ForSWAGs Team</strong></p>
                
                <div class="footer">
                  <p>Building Athletes, Shaping Futures</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("User email response:", userEmail);

    // Check if user email failed
    if (userEmail.error) {
      console.error("Failed to send user email:", userEmail.error);
      throw new Error(`Failed to send confirmation email: ${userEmail.error.message || 'Unknown error'}`);
    }

    // Send notification email to admin
    const adminEmail = await resend.emails.send({
      from: "ForSWAGs Contact <noreply@updates.forswags.com>",
      to: ["coach@updates.forswags.com"],
      subject: `Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #9B51E0; color: white; padding: 20px; }
              .content { background: #f9f9f9; padding: 20px; }
              .info-row { margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #9B51E0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">New Contact Form Submission</h2>
              </div>
              <div class="content">
                <div class="info-row">
                  <strong>Name:</strong> ${escapeHtml(name)}
                </div>
                <div class="info-row">
                  <strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
                </div>
                <div class="info-row">
                  <strong>Subject:</strong> ${escapeHtml(subject)}
                </div>
                <div class="info-row">
                  <strong>Message:</strong><br>
                  ${escapeHtml(message).replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Admin email response:", adminEmail);

    // Check if admin email failed
    if (adminEmail.error) {
      console.error("Failed to send admin email:", adminEmail.error);
      // Don't throw error for admin email, but log it
    }

    // Log successful submission for rate limiting
    await supabase.from("contact_form_submissions").insert({
      ip_address: ipAddress,
      email: email,
      user_agent: req.headers.get("user-agent") || null,
      success: true,
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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
