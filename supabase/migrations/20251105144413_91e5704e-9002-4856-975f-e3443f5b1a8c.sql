-- Add DELETE policy for notifications
CREATE POLICY "Users can delete their own notifications" 
ON notifications
FOR DELETE 
USING (auth.uid() = user_id);