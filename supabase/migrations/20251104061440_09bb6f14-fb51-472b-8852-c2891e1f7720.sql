-- Add payment tracking fields to evaluations table for refund support
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS refund_id uuid REFERENCES refunds(id),
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_by uuid,
ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Add index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_evaluations_payment_intent ON evaluations(stripe_payment_intent_id);