-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  subject text NOT NULL,
  content text NOT NULL,
  description text,
  available_variables jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage all templates
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read templates (needed for sending emails)
CREATE POLICY "Anyone can view email templates"
  ON public.email_templates FOR SELECT
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing templates
INSERT INTO public.email_templates (template_key, subject, description, content, available_variables) VALUES
('badge_earned', 'New Badge Unlocked! 🎖️', 'Sent when a user earns a new badge', 
'<h2 style="color:#FFD623;">New badge unlocked 🎖️</h2>
<p>Great job, {{first_name}}—you earned <strong>{{badge_name}}</strong>.</p>
<p><a href="{{dashboard_url}}">See your badges</a> • <a href="{{profile_url}}">Show on profile</a></p>',
'["first_name", "badge_name", "dashboard_url", "profile_url"]'::jsonb),

('college_match_ready', 'Your Top College Matches Are Ready 🎯', 'Sent when college matches are calculated',
'<h2 style="color:#FFD623;">Top-10 Matches Updated 🎯</h2>
<p>We found {{match_count}} schools that fit your goals.</p>
<p><a href="{{college_match_url}}">See your list</a> • <a href="{{dashboard_url}}">Adjust preferences</a></p>',
'["match_count", "college_match_url", "dashboard_url"]'::jsonb),

('eval_complete', 'Your Evaluation is Complete 🔍', 'Sent when a coach evaluation is completed',
'<h2 style="color:#9B51E0;">Evaluation complete 🔍</h2>
<p>Your evaluation is ready with strengths and improvements.</p>
<p><a href="{{evaluation_url}}">View evaluation</a></p>
<small>Note: ForSWAGs does not guarantee recruiting outcomes.</small>',
'["evaluation_url"]'::jsonb),

('eval_started', 'Your Evaluation Has Started', 'Sent when a coach begins an evaluation',
'<h2 style="color:#FFD623;">Evaluation started</h2>
<p>{{evaluator_name}} is reviewing your film and info now (ID: {{evaluation_id}}).</p>
<p>We''ll notify you when it''s complete.</p>
<p><a href="{{evaluation_url}}">Track status</a></p>',
'["evaluator_name", "evaluation_id", "evaluation_url"]'::jsonb),

('membership_renewal', 'Membership Renewal Reminder', 'Sent before membership renewal',
'<h2 style="color:#FFD623;">Renewal Reminder</h2>
<p>Your ForSWAGs membership renews on <strong>{{renewal_date}}</strong>.</p>
<p><a href="{{dashboard_url}}">Manage billing</a></p>',
'["renewal_date", "dashboard_url"]'::jsonb),

('payment_receipt', 'Payment Receipt - ForSWAGs', 'Sent after successful payment',
'<h2 style="color:#9B51E0;">Thank you!</h2>
<p>We received your payment of <strong>${{amount}}</strong>.</p>
<p><a href="{{invoice_url}}">View receipt</a> • <a href="{{dashboard_url}}">Go to dashboard</a></p>',
'["amount", "invoice_url", "dashboard_url"]'::jsonb),

('profile_nudge', 'Complete Your Profile', 'Sent to encourage profile completion',
'<h2 style="color:#FFD623;">Boost your profile in minutes</h2>
<ol>
  <li>Add a clear profile photo</li>
  <li>Paste a highlight link</li>
  <li>Enter GPA & grad year</li>
</ol>
<p><a href="{{dashboard_url}}">Complete now</a></p>',
'["dashboard_url"]'::jsonb),

('profile_viewed', 'Your Profile Was Viewed 👀', 'Sent when a recruiter views athlete profile',
'<h2 style="color:#9B51E0;">Heads up, {{first_name}}!</h2>
<p>A coach/recruiter checked out your profile.</p>
<p><a href="{{profile_url}}">Review your profile</a> • <a href="{{dashboard_url}}">Update highlights</a></p>
<hr/><small>ForSWAGs educates & exposes athletes to opportunities. We are not recruiters.</small>',
'["first_name", "profile_url", "dashboard_url"]'::jsonb),

('quiz_passed', 'Quiz Passed! ✅', 'Sent when user passes a course quiz',
'<h2 style="color:#9B51E0;">Quiz passed ✅</h2>
<p>You scored <strong>{{score_pct}}%</strong> on <em>{{quiz_title}}</em>.</p>
<p>Keep going—every pass boosts your life-skills score.</p>
<p><a href="{{dashboard_url}}">Continue the course</a></p>',
'["score_pct", "quiz_title", "dashboard_url"]'::jsonb),

('ranking_updated', 'Your Ranking Has Been Updated 📊', 'Sent when athlete ranking changes',
'<h2 style="color:#9B51E0;">Ranking Update 📊</h2>
<p>Bucket: <strong>{{rank_bucket}}</strong></p>
<p>New score: <strong>{{score_total}}</strong> ({{change_direction}} {{delta_points}} pts)</p>
<p><a href="{{dashboard_url}}">See what changed</a></p>
<small>Rankings blend athletic metrics (70%) and life-skills progress (30%).</small>',
'["rank_bucket", "score_total", "change_direction", "delta_points", "dashboard_url"]'::jsonb),

('recruiter_daily_digest', 'ForSWAGs Daily Recruiter Digest', 'Daily digest for recruiters with new athlete matches',
'<h2 style="color:#9B51E0; margin-bottom:10px;">ForSWAGs Daily Recruiter Digest</h2>
<p>Here are the newest athletes that match your saved search <strong>"{{search_name}}"</strong> in the last 24 hours:</p>
<ul>
  {{athletes}}
</ul>
<p style="margin-top:20px;">
  See the full list here: <a href="{{search_results_url}}">{{search_results_url}}</a>
</p>
<hr style="margin:20px 0;"/>
<small style="color:#777;">ForSWAGs empowers athletes and helps coaches discover talent. We are not recruiters, we are an education & exposure platform.</small>',
'["search_name", "athletes", "search_results_url"]'::jsonb),

('recruiter_weekly_digest', 'ForSWAGs Weekly Recruiter Digest', 'Weekly digest for recruiters with athlete matches',
'<h2 style="color:#FFD623; margin-bottom:10px;">ForSWAGs Weekly Recruiter Digest</h2>
<p>Your saved search <strong>"{{search_name}}"</strong> had {{athlete_count}} updates this week.</p>
<h3 style="color:#9B51E0; margin-top:15px;">Top Matches:</h3>
<ol>
  {{athletes}}
</ol>
<p style="margin-top:20px;">
  View all {{athlete_count}} athletes here: <a href="{{search_results_url}}">{{search_results_url}}</a>
</p>
<hr style="margin:20px 0;"/>
<small style="color:#777;">ForSWAGs.com | Building well-rounded student-athletes. Not a recruiting service—an education & exposure system.</small>',
'["search_name", "athlete_count", "athletes", "search_results_url"]'::jsonb),

('social_post_ready', 'Your Social Post is Ready 🚀', 'Sent when a social post draft is ready',
'<h2 style="color:#9B51E0;">Welcome Post Draft 🚀</h2>
<p>We drafted a social post to introduce you to the community.</p>
<p><a href="{{post_preview_url}}">Preview & approve</a> • <a href="{{dashboard_url}}">Edit profile</a></p>
<small>Watermark: ForSWAGs.com (diagonal) is applied by default.</small>',
'["post_preview_url", "dashboard_url"]'::jsonb);
