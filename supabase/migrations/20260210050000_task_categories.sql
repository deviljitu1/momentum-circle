-- Create task_categories table
CREATE TABLE IF NOT EXISTS public.task_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Everyone can read task categories"
  ON public.task_categories
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert task categories"
  ON public.task_categories
  FOR INSERT
  USING (is_admin());

CREATE POLICY "Admins can update task categories"
  ON public.task_categories
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete task categories"
  ON public.task_categories
  FOR DELETE
  USING (is_admin());

-- Seed default categories
INSERT INTO public.task_categories (name)
VALUES 
  ('Study'),
  ('Coding'),
  ('Gym'),
  ('Work'),
  ('Reading')
ON CONFLICT (name) DO NOTHING;
