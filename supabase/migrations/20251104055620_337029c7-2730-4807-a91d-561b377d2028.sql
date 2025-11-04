-- Add INSERT policy for evaluations table to allow service role and system to create evaluations
CREATE POLICY "Service role can insert evaluations"
ON public.evaluations
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also add policy for admins to manage evaluations
CREATE POLICY "Admins can manage evaluations"
ON public.evaluations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));