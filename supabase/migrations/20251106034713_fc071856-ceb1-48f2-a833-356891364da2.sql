-- Enable RLS on rankings table if not already enabled
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view rankings" ON rankings;
DROP POLICY IF EXISTS "Admins can manage rankings" ON rankings;
DROP POLICY IF EXISTS "Public can view rankings" ON rankings;

-- Create new policies for rankings table
CREATE POLICY "Anyone can view rankings" 
ON rankings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage rankings" 
ON rankings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert rankings" 
ON rankings 
FOR INSERT 
WITH CHECK (true);