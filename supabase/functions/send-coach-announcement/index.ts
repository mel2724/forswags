import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Resend } from 'https://esm.sh/resend@4.0.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface CoachAnnouncementRequest {
  subject: string;
  message: string;
  includeInactive?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify admin role
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { subject, message, includeInactive = false }: CoachAnnouncementRequest = await req.json();

    if (!subject || !message) {
      throw new Error('Subject and message are required');
    }

    console.log('Fetching coaches for bulk email...', { includeInactive });

    // Fetch coach profiles
    let query = supabaseAdmin
      .from('coach_profiles')
      .select('user_id, full_name, is_active');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: coaches, error: coachError } = await query;

    if (coachError) {
      throw new Error(`Failed to fetch coaches: ${coachError.message}`);
    }

    if (!coaches || coaches.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No coaches found',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Found ${coaches.length} coaches`);

    // Fetch emails from profiles
    const userIds = coaches.map(c => c.user_id);
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    if (profileError) {
      throw new Error(`Failed to fetch coach emails: ${profileError.message}`);
    }

    // Prepare email recipients
    const recipients = coaches.map(coach => {
      const profile = profiles?.find(p => p.id === coach.user_id);
      return {
        email: profile?.email,
        name: coach.full_name || profile?.full_name || 'Coach',
      };
    }).filter(r => r.email); // Filter out coaches without email

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No valid email addresses found',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Sending emails to ${recipients.length} coaches`);

    // Send emails (batch sending)
    const emailPromises = recipients.map(async (recipient) => {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  border-radius: 8px 8px 0 0;
                  text-align: center;
                }
                .content {
                  background: #ffffff;
                  padding: 30px;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                }
                .greeting {
                  font-size: 18px;
                  margin-bottom: 20px;
                }
                .message {
                  white-space: pre-wrap;
                  margin: 20px 0;
                }
                .footer {
                  background: #f9fafb;
                  padding: 20px;
                  border-radius: 0 0 8px 8px;
                  text-align: center;
                  font-size: 12px;
                  color: #6b7280;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>ForSWAGs Coach Announcement</h1>
              </div>
              <div class="content">
                <p class="greeting">Hi ${recipient.name},</p>
                <div class="message">${message}</div>
                <p>Thank you for being part of the ForSWAGs coaching team!</p>
                <p>Best regards,<br>The ForSWAGs Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message from ForSWAGs.<br>
                Please do not reply to this email.</p>
              </div>
            </body>
          </html>
        `;

        const { data, error } = await resend.emails.send({
          from: 'ForSWAGs <noreply@forswags.com>',
          to: [recipient.email],
          subject: subject,
          html: emailHtml,
        });

        if (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          return { success: false, email: recipient.email, error: error.message };
        }

        console.log(`Email sent successfully to ${recipient.email}`);
        return { success: true, email: recipient.email, messageId: data?.id };
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
        return { success: false, email: recipient.email, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`Email sending complete: ${successCount} succeeded, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        totalRecipients: recipients.length,
        successCount,
        failedCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending coach announcement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
};

serve(handler);
