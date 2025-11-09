import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { corsHeaders } from "../_shared/cors.ts";

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
    const { parent_email, app_url } = await req.json();

    if (!parent_email || !app_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Resending verification for:", parent_email);

    // Find the most recent verification request for this email
    const { data: existingVerification, error: fetchError } = await supabaseClient
      .from("parent_verifications")
      .select("*, athletes(full_name, date_of_birth)")
      .eq("parent_email", parent_email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !existingVerification) {
      console.error("No verification found for email:", parent_email);
      return new Response(
        JSON.stringify({ error: "No verification request found for this email" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already verified
    if (existingVerification.verified_at) {
      return new Response(
        JSON.stringify({ error: "This verification has already been completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update the verification record with the new code
    const { error: updateError } = await supabaseClient
      .from("parent_verifications")
      .update({ 
        verification_code: verificationCode,
        created_at: new Date().toISOString() // Reset the timestamp
      })
      .eq("id", existingVerification.id);

    if (updateError) {
      console.error("Error updating verification:", updateError);
      throw updateError;
    }

    // Get child name from athlete record or use placeholder
    const childName = existingVerification.athletes?.full_name || "your child";
    const childDob = existingVerification.athletes?.date_of_birth || "N/A";

    // Send email with new verification code
    const verificationUrl = `${app_url}/parent-verify?email=${encodeURIComponent(parent_email)}&name=${encodeURIComponent(childName)}`;
    
    const emailResponse = await resend.emails.send({
      from: "ForSWAGs <noreply@updates.forswags.com>",
      to: [parent_email],
      subject: "Resent: Verify Your Child's ForSWAGs Profile - COPPA Compliance",
      html: `
        <h2>Parental Consent Required</h2>
        <p>Hello,</p>
        <p>You requested a new verification code for <strong>${childName}</strong>'s ForSWAGs profile.</p>
        <p>Federal law (COPPA) requires us to obtain verifiable parental consent before allowing children under 13 to create public profiles.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">Your New Verification Code:</h3>
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
        
        <p>If you did not request this code, please ignore this email and contact us immediately at support@forswags.com.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Child's Date of Birth:</strong> ${childDob}<br />
          <strong>Platform:</strong> ForSWAGs Athletic Recruiting<br />
          <strong>Support:</strong> support@forswags.com
        </p>
      `,
    });

    console.log("Resend email sent:", emailResponse);

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

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in resend-parent-verification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});