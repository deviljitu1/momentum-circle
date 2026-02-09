-- Create enum for activity types
CREATE TYPE public.activity_type AS ENUM ('task_completed', 'focus_session', 'streak_milestone', 'badge_earned', 'joined_circle', 'level_up');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  total_hours NUMERIC(10,2) DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create circles (groups) table
CREATE TABLE public.circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create circle members junction table
CREATE TABLE public.circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Work',
  estimated_mins INTEGER DEFAULT 30,
  completed BOOLEAN DEFAULT false,
  logged_mins INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create focus sessions table
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  duration_seconds INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Create activity feed table
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE,
  activity_type public.activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reactions table
CREATE TABLE public.activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.activity_feed(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id, emoji)
);

-- Create user badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_name TEXT NOT NULL,
  badge_emoji TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_name)
);

-- Create daily stats table for leaderboard
CREATE TABLE public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_focused NUMERIC(5,2) DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Circles RLS policies
CREATE POLICY "Circles are viewable by members" ON public.circles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.circle_members WHERE circle_id = circles.id AND user_id = auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Anyone can view circles by invite code" ON public.circles
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create circles" ON public.circles
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle creators can update" ON public.circles
  FOR UPDATE USING (auth.uid() = created_by);

-- Circle members RLS policies
CREATE POLICY "Circle members viewable by circle members" ON public.circle_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.circle_members cm WHERE cm.circle_id = circle_members.circle_id AND cm.user_id = auth.uid())
  );

CREATE POLICY "Users can join circles" ON public.circle_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave circles" ON public.circle_members
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks RLS policies
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view circle members tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm1
      JOIN public.circle_members cm2 ON cm1.circle_id = cm2.circle_id
      WHERE cm1.user_id = auth.uid() AND cm2.user_id = tasks.user_id
    )
  );

CREATE POLICY "Users can create own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Focus sessions RLS policies
CREATE POLICY "Users can view own focus sessions" ON public.focus_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own focus sessions" ON public.focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions" ON public.focus_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Activity feed RLS policies
CREATE POLICY "Activity viewable by circle members" ON public.activity_feed
  FOR SELECT USING (
    circle_id IS NULL OR
    EXISTS (SELECT 1 FROM public.circle_members WHERE circle_id = activity_feed.circle_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create own activity" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity reactions RLS policies
CREATE POLICY "Reactions viewable by all" ON public.activity_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can add reactions" ON public.activity_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON public.activity_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- User badges RLS policies
CREATE POLICY "Badges viewable by all" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "System can award badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily stats RLS policies
CREATE POLICY "Daily stats viewable by all" ON public.daily_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own stats" ON public.daily_stats
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_circles_updated_at BEFORE UPDATE ON public.circles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON public.daily_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;