-- Add cancelled and refunded statuses to evaluation_status enum
ALTER TYPE evaluation_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE evaluation_status ADD VALUE IF NOT EXISTS 'refunded';