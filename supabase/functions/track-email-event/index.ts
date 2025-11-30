import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const emailId = url.searchParams.get('id');
    const eventType = url.searchParams.get('type');
    const recipient = url.searchParams.get('r');
    const clickUrl = url.searchParams.get('url');
    
    if (!emailId || !eventType || !recipient) {
      return new Response('Invalid parameters', { status: 400 });
    }

    // Get user agent and IP
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

    // Record the engagement event
    const { error: insertError } = await supabaseAdmin
      .from('email_engagement')
      .insert({
        scheduled_email_id: emailId,
        recipient_email: recipient,
        event_type: eventType,
        clicked_url: clickUrl || null,
        user_agent: userAgent,
        ip_address: ip,
      });

    if (insertError) {
      console.error('Failed to insert engagement event:', insertError);
    }

    // Update aggregated counts
    if (eventType === 'open') {
      // Check if this is a unique open
      const { count } = await supabaseAdmin
        .from('email_engagement')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_email_id', emailId)
        .eq('recipient_email', recipient)
        .eq('event_type', 'open');

      // Get current counts
      const { data: emailData } = await supabaseAdmin
        .from('scheduled_emails')
        .select('open_count, unique_opens')
        .eq('id', emailId)
        .single();

      if (emailData) {
        await supabaseAdmin
          .from('scheduled_emails')
          .update({ 
            open_count: (emailData.open_count || 0) + 1,
            unique_opens: count === 1 ? (emailData.unique_opens || 0) + 1 : emailData.unique_opens
          })
          .eq('id', emailId);
      }
    } else if (eventType === 'click') {
      // Check if this is a unique click
      const { count } = await supabaseAdmin
        .from('email_engagement')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_email_id', emailId)
        .eq('recipient_email', recipient)
        .eq('event_type', 'click');

      // Get current counts
      const { data: emailData } = await supabaseAdmin
        .from('scheduled_emails')
        .select('click_count, unique_clicks')
        .eq('id', emailId)
        .single();

      if (emailData) {
        await supabaseAdmin
          .from('scheduled_emails')
          .update({ 
            click_count: (emailData.click_count || 0) + 1,
            unique_clicks: count === 1 ? (emailData.unique_clicks || 0) + 1 : emailData.unique_clicks
          })
          .eq('id', emailId);
      }

      // Redirect to the actual URL if it's a click event
      if (clickUrl) {
        return Response.redirect(clickUrl, 302);
      }
    }

    // Return tracking pixel for open events
    if (eventType === 'open') {
      return new Response(TRACKING_PIXEL, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in track-email-event:', error);
    
    // For open events, still return pixel even if tracking fails
    const url = new URL(req.url);
    if (url.searchParams.get('type') === 'open') {
      return new Response(TRACKING_PIXEL, {
        status: 200,
        headers: { 'Content-Type': 'image/gif' },
      });
    }
    
    return new Response('Error', { status: 500 });
  }
};

serve(handler);
