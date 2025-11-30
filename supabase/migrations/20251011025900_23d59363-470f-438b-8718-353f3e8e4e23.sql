-- Add email template for alumni transition
INSERT INTO email_templates (template_key, subject, content, description, available_variables)
VALUES (
  'alumni_transition',
  'Welcome to Alumni Status! 🎓',
  '<h1>Congratulations on Your Graduation!</h1>
  <p>Hi {{athlete_name}},</p>
  <p>We''re excited to welcome you to our Alumni Network! Your athlete account has been automatically transitioned to alumni status following your graduation in {{graduation_year}}.</p>
  
  <h2>What This Means:</h2>
  <ul>
    <li>✅ Your profile and media remain accessible</li>
    <li>✅ Free access to the alumni network and mentoring features</li>
    <li>✅ Your subscription has been cancelled (no further charges)</li>
    <li>✅ You can now connect with current athletes as a mentor</li>
  </ul>
  
  <p>Visit your new alumni dashboard to:</p>
  <ul>
    <li>Update your professional information</li>
    <li>Connect with other alumni</li>
    <li>Mentor current athletes</li>
    <li>Share your success story</li>
  </ul>
  
  <p><a href="{{dashboard_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Go to Alumni Dashboard</a></p>
  
  <p>Thank you for being part of our community!</p>
  <p>Best regards,<br>The Team</p>',
  'Email sent when an athlete transitions to alumni status',
  '["athlete_name", "graduation_year", "dashboard_url"]'::jsonb
)
ON CONFLICT (template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  available_variables = EXCLUDED.available_variables,
  updated_at = now();