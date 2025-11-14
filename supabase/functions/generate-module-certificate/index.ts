import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificateRequest {
  userId: string;
  moduleId: string;
  courseId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, moduleId, courseId }: CertificateRequest = await req.json();

    console.log(`Generating certificate for user ${userId}, module ${moduleId}`);

    // Get user details
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Get module and course details
    const { data: module } = await supabase
      .from("modules")
      .select("title")
      .eq("id", moduleId)
      .single();

    const { data: course } = await supabase
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single();

    if (!module || !course) {
      throw new Error("Module or course not found");
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from("module_certificates")
      .select("id")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (existingCert) {
      console.log("Certificate already exists, skipping generation");
      return new Response(
        JSON.stringify({ message: "Certificate already issued" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate certificate HTML
    const certificateDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const certificateHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 40px;
              font-family: 'Georgia', serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .certificate {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 60px;
              border: 20px solid #f4f4f4;
              box-shadow: 0 0 40px rgba(0,0,0,0.2);
              text-align: center;
            }
            .header {
              margin-bottom: 40px;
            }
            .title {
              font-size: 48px;
              color: #667eea;
              margin: 20px 0;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 4px;
            }
            .subtitle {
              font-size: 20px;
              color: #666;
              margin-bottom: 40px;
            }
            .recipient {
              font-size: 36px;
              color: #333;
              margin: 30px 0;
              font-weight: bold;
            }
            .completion-text {
              font-size: 18px;
              color: #666;
              margin: 30px 0;
              line-height: 1.8;
            }
            .course-name {
              font-size: 24px;
              color: #764ba2;
              font-weight: bold;
              margin: 20px 0;
            }
            .module-name {
              font-size: 20px;
              color: #667eea;
              font-style: italic;
              margin: 10px 0;
            }
            .date {
              font-size: 16px;
              color: #999;
              margin-top: 40px;
            }
            .seal {
              width: 100px;
              height: 100px;
              background: #667eea;
              border-radius: 50%;
              margin: 40px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="title">Certificate of Completion</div>
              <div class="subtitle">Playbook for Life</div>
            </div>
            
            <div class="recipient">${profile.full_name}</div>
            
            <div class="completion-text">
              Has successfully completed all videos in the
            </div>
            
            <div class="module-name">"${module.title}"</div>
            <div class="completion-text">module from</div>
            <div class="course-name">${course.title}</div>
            
            <div class="seal">
              ✓<br/>VERIFIED
            </div>
            
            <div class="date">
              Issued on ${certificateDate}
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email with certificate
    const emailResponse = await resend.emails.send({
      from: "Playbook for Life <onboarding@resend.dev>",
      to: [profile.email],
      subject: `🎓 Congratulations! You've earned a certificate - ${module.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #667eea;">Congratulations, ${profile.full_name}! 🎉</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            You've successfully completed all videos in the <strong>"${module.title}"</strong> module from ${course.title}!
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            Your certificate of completion is attached below. Keep up the great work on your learning journey!
          </p>
          <div style="margin: 30px 0;">
            ${certificateHtml}
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 40px;">
            Keep learning and growing with Playbook for Life!
          </p>
        </div>
      `,
    });

    console.log("Email sent:", emailResponse);

    // Save certificate record
    const { error: insertError } = await supabase
      .from("module_certificates")
      .insert({
        user_id: userId,
        module_id: moduleId,
        course_id: courseId,
        emailed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error saving certificate record:", insertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Certificate generated and emailed successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating certificate:", error);
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
