
-- Add leave details to daily_summaries
ALTER TABLE public.daily_summaries
ADD COLUMN IF NOT EXISTS leave_type TEXT,
ADD COLUMN IF NOT EXISTS leave_reason TEXT;
