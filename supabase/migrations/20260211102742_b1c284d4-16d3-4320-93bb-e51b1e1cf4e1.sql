
-- Create daily_summaries table
CREATE TABLE public.daily_summaries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    earned_points NUMERIC NOT NULL DEFAULT 0,
    possible_points NUMERIC NOT NULL DEFAULT 0,
    final_percentage NUMERIC NOT NULL DEFAULT 0,
    is_leave BOOLEAN NOT NULL DEFAULT false,
    leave_type TEXT,
    leave_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, date)
);

ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own summaries"
    ON public.daily_summaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summaries"
    ON public.daily_summaries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries"
    ON public.daily_summaries FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow others to read summaries for leaderboard
CREATE POLICY "Summaries are readable by authenticated users"
    ON public.daily_summaries FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create task_logs table
CREATE TABLE public.task_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    actual_value NUMERIC,
    completed BOOLEAN,
    calculated_points NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(task_id, date)
);

ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own task logs"
    ON public.task_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t WHERE t.id = task_logs.task_id AND t.user_id = auth.uid()
        )
    );

-- Create challenge_stats table
CREATE TABLE public.challenge_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    streak_days INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    last_success_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats"
    ON public.challenge_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
    ON public.challenge_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
    ON public.challenge_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- Create user_follows table
CREATE TABLE public.user_follows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follows"
    ON public.user_follows FOR SELECT
    USING (auth.uid() = follower_id);

CREATE POLICY "Users can insert their own follows"
    ON public.user_follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
    ON public.user_follows FOR DELETE
    USING (auth.uid() = follower_id);

-- Enable realtime for daily_summaries
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_summaries;
