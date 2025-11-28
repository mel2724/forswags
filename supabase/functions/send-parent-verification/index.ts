import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { parent_email, child_name, child_dob, app_url } = await req.json();

    if (!parent_email || !child_name || !app_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Extract IP address early for security logging
    const cfIp = req.headers.get("cf-connecting-ip");
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = cfIp 
      ? cfIp 
      : (forwardedFor ? forwardedFor.split(',')[0].trim() : "unknown");
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      // Log failed authentication attempt for audit trail
      await supabaseClient.from("security_events").insert({
        user_id: null,
        event_type: "parent_verification_failed_auth",
        severity: "warning",
        description: "Failed authentication attempt on parent verification endpoint",
        ip_address: ipAddress,
        metadata: {
          error: userError?.message || "No user found"
        }
      });
      
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate parent email is different from user email
    if (user.email && parent_email.toLowerCase() === user.email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Parent email must be different from account email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // RATE LIMITING: Check for recent verification sends to prevent spam
    const { data: recentVerifications } = await supabaseClient
      .from("parent_verifications")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("parent_email", parent_email)
      .gte("created_at", new Date(Date.now() - 60000).toISOString()) // Last minute
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentVerifications && recentVerifications.length > 0) {
      return new Response(
        JSON.stringify({ error: "Please wait at least 1 minute before requesting another verification code" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store verification code
    // athlete_id is set to null and will be linked by database trigger when athlete profile is created
    const { data: insertedVerification, error: insertError } = await supabaseClient
      .from("parent_verifications")
      .insert({
        athlete_id: null,
        user_id: user.id,
        parent_email,
        verification_code: verificationCode,
        ip_address: ipAddress,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing verification:", insertError);
      throw insertError;
    }

    console.log("Verification created successfully:", insertedVerification.id);

    // Send email with verification link using the frontend app URL
    const verificationUrl = `${app_url}/parent-verify?email=${encodeURIComponent(parent_email)}&code=${verificationCode}&name=${encodeURIComponent(child_name)}`;
    
    const emailResponse = await resend.emails.send({
      from: "ForSWAGs <noreply@updates.forswags.com>",
      to: [parent_email],
      subject: "Verify Your Child's ForSWAGs Profile - COPPA Compliance",
      html: `
        <h2>Parental Consent Required</h2>
        <p>Hello,</p>
        <p>Your child <strong>${child_name}</strong> is creating a profile on ForSWAGs, an athletic recruiting platform.</p>
        <p>Federal law (COPPA) requires us to obtain verifiable parental consent before allowing children under 13 to create public profiles.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">Your Verification Code:</h3>
          <div style="font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px;">
            ${verificationCode}
          </div>
          <p style="margin: 15px 0 0 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email Now
            </a>
          </p>
        </div>

        <p><strong>What this means:</strong></p>
        <ul>
          <li>You are consenting to your child creating a profile on ForSWAGs</li>
          <li>You understand their athletic information will be visible to college recruiters</li>
          <li>You can revoke consent at any time by contacting support@forswags.com</li>
        </ul>

        <p><strong>This code expires in 24 hours.</strong></p>
        
        <p>If you did not authorize this request, please ignore this email and contact us immediately at support@forswags.com.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Child's Date of Birth:</strong> ${child_dob}<br />
          <strong>Platform:</strong> ForSWAGs Athletic Recruiting<br />
          <strong>Support:</strong> support@forswags.com
        </p>
      `,
    });

    console.log("Email sent:", emailResponse);

    if (emailResponse.error) {
      console.error("Failed to send email:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send verification email. Please contact support.",
          details: emailResponse.error.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log security event for audit trail (only if email sent successfully)
    await supabaseClient.from("security_events").insert({
      user_id: user.id,
      event_type: "parent_verification_sent",
      severity: "info",
      description: `Parent verification email sent to ${parent_email} for child ${child_name}`,
      ip_address: ipAddress,
      metadata: {
        parent_email,
        child_name,
        child_dob,
        verification_id: insertedVerification.id,
      }
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-parent-verification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});