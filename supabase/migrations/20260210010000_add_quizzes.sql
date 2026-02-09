-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('General', 'Tech', 'Science', 'History', 'Pop Culture', 'Sports')),
    questions JSONB NOT NULL, -- Array of { question: string, options: string[], correctOption: number }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quizzes policies
CREATE POLICY "Quizzes viewable by circle members"
ON public.quizzes
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.circle_members
        WHERE circle_id = quizzes.circle_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Members can create quizzes"
ON public.quizzes
FOR INSERT
WITH CHECK (
    auth.uid() = created_by
    AND
    EXISTS (
        SELECT 1 FROM public.circle_members
        WHERE circle_id = quizzes.circle_id
        AND user_id = auth.uid()
    )
);

-- Quiz attempts policies
CREATE POLICY "Attempts viewable by circle members"
ON public.quiz_attempts
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        JOIN public.circle_members cm ON q.circle_id = cm.circle_id
        WHERE q.id = quiz_attempts.quiz_id
        AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create attempts"
ON public.quiz_attempts
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
);

-- Add XP reward for completing quiz (Trigger)
CREATE OR REPLACE FUNCTION public.reward_quiz_xp()
RETURNS TRIGGER AS $$
BEGIN
    -- Award 10 XP per correct answer
    UPDATE public.profiles
    SET xp = xp + (NEW.score * 10),
        tasks_completed = tasks_completed + 1 -- Counting quiz as a task for now
    WHERE user_id = NEW.user_id;

    -- Log activity
    INSERT INTO public.activity_feed (user_id, circle_id, activity_type, title, description, points_earned)
    SELECT 
        NEW.user_id,
        q.circle_id,
        'task_completed', -- Reuse existing type or add new 'quiz_completed' enum if possible (hard to alter enum in migration without recreation sometimes)
        'Completed Quiz: ' || q.title,
        'Scored ' || NEW.score || '/' || NEW.total_questions,
        NEW.score * 10
    FROM public.quizzes q
    WHERE q.id = NEW.quiz_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_quiz_attempt_created
    AFTER INSERT ON public.quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION public.reward_quiz_xp();

-- Add 'quiz_completed' to activity_type enum if it doesn't exist?
-- It's tricky to alter types safely in all postgres versions in migration scripts without standard "ALTER TYPE ... ADD VALUE".
-- We will use 'task_completed' for now or 'badge_earned'. Let's stick to 'task_completed'.
