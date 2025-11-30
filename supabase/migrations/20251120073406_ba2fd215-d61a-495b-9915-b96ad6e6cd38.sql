-- Fix IP address data types (INET to TEXT)
ALTER TABLE athletes 
ALTER COLUMN consent_ip_address TYPE TEXT USING consent_ip_address::TEXT;

ALTER TABLE parent_verifications 
ALTER COLUMN ip_address TYPE TEXT USING ip_address::TEXT;

ALTER TABLE contact_form_submissions 
ALTER COLUMN ip_address TYPE TEXT USING ip_address::TEXT;

-- Add new membership tier columns (keeping old 'plan' for now)
ALTER TABLE memberships 
ADD COLUMN tier TEXT CHECK (tier IN ('standard', 'pro', 'championship')),
ADD COLUMN billing_interval TEXT CHECK (billing_interval IN ('month', 'year'));

-- Add optional foreign key to link manual contacts to system coaches
ALTER TABLE coach_contacts
ADD COLUMN system_coach_id UUID REFERENCES coach_profiles(user_id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_coach_contacts_system_coach_id ON coach_contacts(system_coach_id);