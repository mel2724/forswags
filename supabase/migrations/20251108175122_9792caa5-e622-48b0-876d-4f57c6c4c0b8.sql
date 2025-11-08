-- Create storage bucket for playbook videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('playbook-videos', 'playbook-videos', true)
ON CONFLICT (id) DO NOTHING;