-- Create daily_steps table
CREATE TABLE IF NOT EXISTS public.daily_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT current_date,
    steps INT DEFAULT 0,
    goal INT DEFAULT 10000,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_steps ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view everyone's steps (for leaderboard)
CREATE POLICY "Users can view all steps"
ON public.daily_steps FOR SELECT
USING (true);

-- Users can insert/update their own steps (from Android app / API)
CREATE POLICY "Users can manage their own steps"
ON public.daily_steps FOR ALL
USING (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.daily_steps;
