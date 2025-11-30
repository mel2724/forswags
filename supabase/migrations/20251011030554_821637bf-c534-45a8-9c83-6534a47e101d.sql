-- Add foreign key constraint between athletes and profiles
-- This allows Supabase to join the tables properly
ALTER TABLE athletes 
ADD CONSTRAINT athletes_user_id_profiles_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;