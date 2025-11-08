# Scheduled Email Setup Guide

This guide explains how to set up automated processing of scheduled emails for coach announcements.

## Overview

The scheduled email system consists of:
1. A `scheduled_emails` database table that stores pending emails
2. A `process-scheduled-emails` edge function that sends scheduled emails
3. A cron job that runs the edge function every 5 minutes

## Setup Steps

### 1. Verify Edge Function Deployment

The `process-scheduled-emails` edge function should be automatically deployed with your project. You can verify it's available in your backend functions.

### 2. Set Up the Cron Job

You need to create a cron job that calls the `process-scheduled-emails` function every 5 minutes.

**Important:** Run this SQL in your Supabase SQL editor (not as a migration):

```sql
-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job
SELECT cron.schedule(
  'process-scheduled-emails',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://fejnevxardxejdvjbipc.supabase.co/functions/v1/process-scheduled-emails',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret')
        ),
        body:=jsonb_build_object('time', now())
    ) as request_id;
  $$
);
```

### 3. Verify the Cron Job

You can check if the cron job was created successfully:

```sql
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-emails';
```

### 4. Monitor Scheduled Emails

You can view all scheduled emails in the database:

```sql
SELECT 
  id,
  subject,
  scheduled_for,
  status,
  recipient_count,
  success_count,
  failed_count,
  created_at
FROM scheduled_emails
ORDER BY scheduled_for DESC;
```

### 5. Testing

To test the system:

1. Go to Admin > Coaches
2. Click "Send Bulk Email"
3. Choose "Schedule for later"
4. Set a time 5-10 minutes in the future
5. Fill in subject and message
6. Click "Schedule Email"
7. Wait for the scheduled time
8. Check that the email status changes to 'sent' in the database

## How It Works

1. **Scheduling**: When an admin schedules an email, it's stored in the `scheduled_emails` table with status 'pending'
2. **Processing**: Every 5 minutes, the cron job triggers the `process-scheduled-emails` function
3. **Sending**: The function finds all pending emails where `scheduled_for <= now()`, sends them, and updates the status
4. **Tracking**: Success/failure counts and timestamps are recorded for monitoring

## Troubleshooting

### Emails Not Sending

1. Check if the cron job is active:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-scheduled-emails';
   ```

2. Check scheduled emails status:
   ```sql
   SELECT * FROM scheduled_emails WHERE status = 'pending' AND scheduled_for <= now();
   ```

3. Check edge function logs for errors

### Removing the Cron Job

If you need to remove the cron job:

```sql
SELECT cron.unschedule('process-scheduled-emails');
```

## Security

- The cron job uses the `CRON_SECRET` for authentication
- Only admins can schedule emails (enforced by RLS policies)
- The `process-scheduled-emails` function requires the CRON_SECRET in the Authorization header

## Monitoring

You can monitor scheduled email performance:

```sql
-- Count by status
SELECT status, COUNT(*) 
FROM scheduled_emails 
GROUP BY status;

-- Recent scheduled emails
SELECT 
  subject,
  scheduled_for,
  status,
  recipient_count,
  success_count,
  failed_count
FROM scheduled_emails
WHERE created_at > now() - interval '7 days'
ORDER BY created_at DESC;

-- Failed emails
SELECT *
FROM scheduled_emails
WHERE status = 'failed'
ORDER BY scheduled_for DESC;
```
