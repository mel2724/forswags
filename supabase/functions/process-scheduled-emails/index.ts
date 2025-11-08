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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify CRON_SECRET for scheduled execution
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (!authHeader || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    console.log('Processing scheduled emails...');

    // Find emails scheduled for now or earlier that are still pending
    const { data: scheduledEmails, error: fetchError } = await supabaseAdmin
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .eq('recipient_type', 'coaches')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled emails: ${fetchError.message}`);
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      console.log('No scheduled emails to process');
      return new Response(
        JSON.stringify({ success: true, processedCount: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Found ${scheduledEmails.length} scheduled email(s) to process`);

    // Process each scheduled email
    const results = [];
    
    for (const scheduledEmail of scheduledEmails) {
      try {
        console.log(`Processing scheduled email ID: ${scheduledEmail.id}`);

        // Fetch coaches
        let query = supabaseAdmin
          .from('coach_profiles')
          .select('user_id, full_name, is_active');

        if (!scheduledEmail.include_inactive) {
          query = query.eq('is_active', true);
        }

        const { data: coaches, error: coachError } = await query;

        if (coachError) {
          throw new Error(`Failed to fetch coaches: ${coachError.message}`);
        }

        if (!coaches || coaches.length === 0) {
          throw new Error('No coaches found');
        }

        // Fetch emails
        const userIds = coaches.map(c => c.user_id);
        const { data: profiles, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        if (profileError) {
          throw new Error(`Failed to fetch profiles: ${profileError.message}`);
        }

        const recipients = coaches.map(coach => {
          const profile = profiles?.find(p => p.id === coach.user_id);
          return {
            email: profile?.email,
            name: coach.full_name || profile?.full_name || 'Coach',
          };
        }).filter(r => r.email);

        if (recipients.length === 0) {
          throw new Error('No valid email addresses found');
        }

        console.log(`Sending to ${recipients.length} coaches`);

        // Send emails
        const emailPromises = recipients.map(async (recipient) => {
          try {
            // Create tracking URLs
            const baseUrl = Deno.env.get('SUPABASE_URL') ?? '';
            const trackingPixelUrl = `${baseUrl}/functions/v1/track-email-event?id=${scheduledEmail.id}&type=open&r=${encodeURIComponent(recipient.email)}`;
            
            // Process message to add click tracking to links
            let processedMessage = scheduledEmail.message;
            const urlRegex = /(https?:\/\/[^\s<]+)/g;
            processedMessage = processedMessage.replace(urlRegex, (url: string) => {
              const trackedUrl = `${baseUrl}/functions/v1/track-email-event?id=${scheduledEmail.id}&type=click&r=${encodeURIComponent(recipient.email)}&url=${encodeURIComponent(url)}`;
              return `<a href="${trackedUrl}" style="color: #667eea; text-decoration: underline;">${url}</a>`;
            });

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
                    <div class="message">${processedMessage}</div>
                    <p>Thank you for being part of the ForSWAGs coaching team!</p>
                    <p>Best regards,<br>The ForSWAGs Team</p>
                  </div>
                  <div class="footer">
                    <p>This is an automated message from ForSWAGs.<br>
                    Please do not reply to this email.</p>
                  </div>
                  <!-- Tracking pixel -->
                  <img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />
                </body>
              </html>
            `;

            const { data, error } = await resend.emails.send({
              from: 'ForSWAGs <noreply@forswags.com>',
              to: [recipient.email],
              subject: scheduledEmail.subject,
              html: emailHtml,
            });

            if (error) {
              console.error(`Failed to send to ${recipient.email}:`, error);
              return { success: false, email: recipient.email };
            }

            return { success: true, email: recipient.email };
          } catch (error) {
            console.error(`Error sending to ${recipient.email}:`, error);
            return { success: false, email: recipient.email };
          }
        });

        const emailResults = await Promise.all(emailPromises);
        const successCount = emailResults.filter(r => r.success).length;
        const failedCount = emailResults.filter(r => !r.success).length;

        // Update scheduled email status
        const { error: updateError } = await supabaseAdmin
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            recipient_count: recipients.length,
            success_count: successCount,
            failed_count: failedCount,
          })
          .eq('id', scheduledEmail.id);

        if (updateError) {
          console.error('Failed to update scheduled email status:', updateError);
        }

        results.push({
          id: scheduledEmail.id,
          success: true,
          recipientCount: recipients.length,
          successCount,
          failedCount,
        });

        console.log(`Completed scheduled email ID: ${scheduledEmail.id}`);
      } catch (error) {
        console.error(`Error processing scheduled email ${scheduledEmail.id}:`, error);
        
        // Mark as failed
        await supabaseAdmin
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', scheduledEmail.id);

        results.push({
          id: scheduledEmail.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: scheduledEmails.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in process-scheduled-emails:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(handler);
