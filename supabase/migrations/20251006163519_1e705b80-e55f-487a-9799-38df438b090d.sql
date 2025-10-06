-- Add missing enum values to subscription_plan
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'pro_monthly';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'championship_yearly';