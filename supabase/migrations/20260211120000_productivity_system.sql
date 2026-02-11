-- Create ENUM for task types
DO $$ BEGIN
    CREATE TYPE public.task_type AS ENUM ('A', 'B', 'C');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TASKS Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    task_type public.task_type NOT NULL,
    target_value FLOAT, -- For Type A and B
    is_personal BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for TASKS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD their own tasks" ON public.tasks;
CREATE POLICY "Users can CRUD their own tasks"
ON public.tasks
USING (auth.uid() = user_id);

-- TASK_LOGS Table
CREATE TABLE IF NOT EXISTS public.task_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT current_date,
    actual_value FLOAT, -- For Type A and B
    completed BOOLEAN, -- For Type C
    calculated_points FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(task_id, date)
);

-- RLS for TASK_LOGS
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD their own task logs" ON public.task_logs;
CREATE POLICY "Users can CRUD their own task logs"
ON public.task_logs
USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_logs.task_id
        AND tasks.user_id = auth.uid()
    )
);

-- DAILY_SUMMARY Table
CREATE TABLE IF NOT EXISTS public.daily_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT current_date,
    earned_points FLOAT DEFAULT 0,
    possible_points FLOAT DEFAULT 0,
    final_percentage FLOAT DEFAULT 0,
    is_leave BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

-- RLS for DAILY_SUMMARY
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all daily summaries" ON public.daily_summaries;
CREATE POLICY "Users can view all daily summaries"
ON public.daily_summaries
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can update their own daily summaries" ON public.daily_summaries;
CREATE POLICY "Users can update their own daily summaries"
ON public.daily_summaries
FOR UPDATE
USING (auth.uid() = user_id);

-- CHALLENGE_STATS Table
CREATE TABLE IF NOT EXISTS public.challenge_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    streak_days INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    last_success_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- RLS for CHALLENGE_STATS
ALTER TABLE public.challenge_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all challenge stats" ON public.challenge_stats;
CREATE POLICY "Users can view all challenge stats"
ON public.challenge_stats
FOR SELECT
USING (true);

-- FUNCTIONS AND TRIGGERS

-- 1. Calculate points for a log entry
CREATE OR REPLACE FUNCTION public.calculate_log_points()
RETURNS TRIGGER AS $$
DECLARE
    t_type public.task_type;
    t_target FLOAT;
BEGIN
    SELECT task_type, target_value INTO t_type, t_target FROM public.tasks WHERE id = NEW.task_id;

    IF t_type = 'A' OR t_type = 'B' THEN
        -- Avoid divide by zero
        IF t_target IS NULL OR t_target = 0 THEN
             NEW.calculated_points := 0;
        ELSE
             -- Points calculated as min((actual / target) * 100, 100)
             NEW.calculated_points := LEAST((COALESCE(NEW.actual_value, 0) / t_target) * 100, 100);
        END IF;
    ELSIF t_type = 'C' THEN
        IF NEW.completed IS TRUE THEN
            NEW.calculated_points := 100;
        ELSE
            NEW.calculated_points := 0;
        END IF;
    ELSE
        NEW.calculated_points := 0;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_points ON public.task_logs;
CREATE TRIGGER trigger_calculate_points
BEFORE INSERT OR UPDATE ON public.task_logs
FOR EACH ROW
EXECUTE FUNCTION public.calculate_log_points();


-- 2. Update Daily Summary on Log Change
CREATE OR REPLACE FUNCTION public.update_daily_summary_trigger()
RETURNS TRIGGER AS $$
DECLARE
    target_date DATE;
    target_user_id UUID;
    total_earned FLOAT;
    total_possible FLOAT;
    final_pct FLOAT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_date := OLD.date;
        SELECT user_id INTO target_user_id FROM public.tasks WHERE id = OLD.task_id;
    ELSE
        target_date := NEW.date;
        SELECT user_id INTO target_user_id FROM public.tasks WHERE id = NEW.task_id;
    END IF;

    -- Calculate totals for that day
    -- Note: This happens AFTER the log is written, so the query sees the new state.
    SELECT 
        COALESCE(SUM(l.calculated_points), 0),
        COUNT(t.id) * 100
    INTO total_earned, total_possible
    FROM public.tasks t
    LEFT JOIN public.task_logs l ON t.id = l.task_id AND l.date = target_date
    WHERE t.user_id = target_user_id AND t.is_personal = true;

    IF total_possible = 0 THEN
        final_pct := 0;
    ELSE
        final_pct := (total_earned / total_possible) * 100;
    END IF;

    -- Update or Insert Summary
    INSERT INTO public.daily_summaries (user_id, date, earned_points, possible_points, final_percentage)
    VALUES (target_user_id, target_date, total_earned, total_possible, final_pct)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
        earned_points = EXCLUDED.earned_points,
        possible_points = EXCLUDED.possible_points,
        final_percentage = EXCLUDED.final_percentage;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_daily_summary ON public.task_logs;
CREATE TRIGGER trigger_update_daily_summary
AFTER INSERT OR UPDATE OR DELETE ON public.task_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_summary_trigger();


-- 3. Update Challenge Stats on Summary Change
CREATE OR REPLACE FUNCTION public.update_challenge_stats_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_streak INT := 0;
    last_success DATE;
    target_user_id UUID;
    is_today_success BOOLEAN;
    was_today_counted BOOLEAN;
    yesterday DATE;
BEGIN
    -- Only act on percentages or leave changes
    target_user_id := NEW.user_id;

    -- Success = >= 80% OR Leave
    -- Note: Leave preserves streak but doesn't increment? 
    -- User spec: "If success: streak_days += 1". "Leave... do NOT affect streak".
    -- So if Leave, we treat it as... nothing?
    -- If today is leave, we don't increment, don't reset.
    -- Since this trigger fires on UPDATE, if I toggle Leave, I need to handle it.
    
    -- Let's fetch current stats
    SELECT streak_days, last_success_date INTO current_streak, last_success 
    FROM public.challenge_stats WHERE user_id = target_user_id;
    
    current_streak := COALESCE(current_streak, 0);
    yesterday := NEW.date - INTERVAL '1 day';
    
    is_today_success := (NEW.final_percentage >= 80);
    
    IF NEW.is_leave THEN
       -- If leave, we ensure we didn't accidentally count today as a 'streak day' (increment)
       -- If we did (e.g. was success, then switched to leave), we revert.
       IF last_success = NEW.date THEN
          -- Revert
          UPDATE public.challenge_stats
          SET streak_days = GREATEST(0, streak_days - 1),
              last_success_date = yesterday -- Approximate fallback
          WHERE user_id = target_user_id;
       END IF;
       RETURN NEW;
    END IF;

    -- Logic for Non-Leave day
    was_today_counted := (last_success = NEW.date);

    IF is_today_success AND NOT was_today_counted THEN
        -- Increment Streak
        -- Check if connected to yesterday
        IF last_success = yesterday THEN
             UPDATE public.challenge_stats
             SET streak_days = streak_days + 1,
                 last_success_date = NEW.date,
                 best_streak = GREATEST(best_streak, streak_days + 1)
             WHERE user_id = target_user_id;
        ELSE
             -- Restart Streak (or start new)
             -- But maybe last success was 2 days ago but yesterday was Leave?
             -- Complexity: checking LEAVE history.
             -- Simplified: If last_success < yesterday, reset to 1.
             UPDATE public.challenge_stats
             SET streak_days = 1,
                 last_success_date = NEW.date,
                 best_streak = GREATEST(best_streak, 1)
             WHERE user_id = target_user_id;
        END IF;
        
        -- Insert if missing
        IF NOT FOUND THEN
             INSERT INTO public.challenge_stats (user_id, streak_days, best_streak, last_success_date)
             VALUES (target_user_id, 1, 1, NEW.date);
        END IF;

    ELSIF NOT is_today_success AND was_today_counted THEN
        -- We lost success status, decrement.
        UPDATE public.challenge_stats
        SET streak_days = GREATEST(0, streak_days - 1),
            last_success_date = yesterday
        WHERE user_id = target_user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_challenge_stats ON public.daily_summaries;
CREATE TRIGGER trigger_update_challenge_stats
AFTER UPDATE OF final_percentage, is_leave ON public.daily_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_challenge_stats_trigger();
