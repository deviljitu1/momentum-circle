
-- Create daily_steps table for step tracking
CREATE TABLE public.daily_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER NOT NULL DEFAULT 0,
  goal INTEGER NOT NULL DEFAULT 10000,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own steps" ON public.daily_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own steps" ON public.daily_steps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own steps" ON public.daily_steps FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_daily_steps_updated_at BEFORE UPDATE ON public.daily_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_steps;
