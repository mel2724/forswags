-- Create table for tracking completed next steps tasks
CREATE TABLE IF NOT EXISTS next_steps_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_key text NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_key)
);

-- Enable RLS
ALTER TABLE next_steps_tasks ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tasks
CREATE POLICY "Users can manage their own tasks"
  ON next_steps_tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_next_steps_tasks_user_id ON next_steps_tasks(user_id);
CREATE INDEX idx_next_steps_tasks_task_key ON next_steps_tasks(task_key);