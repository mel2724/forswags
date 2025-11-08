-- Enable realtime for user_badges table to support badge notifications
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;