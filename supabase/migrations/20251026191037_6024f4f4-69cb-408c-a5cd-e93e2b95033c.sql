-- Update the Prime Dime template to remove match score percentage
UPDATE post_templates
SET content_template = '🎯 My Top 3 Prime Dime College Matches!

1. {College Name}
2. {College Name}
3. {College Name}

Found my perfect fit colleges with Prime Dime analysis! 🏆'
WHERE template_type = 'prime_dime' AND name = 'Prime Dime College Matches';