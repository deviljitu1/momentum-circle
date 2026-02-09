-- 1. Create the table (IF NOT EXISTS to avoid errors if partially run)
CREATE TABLE IF NOT EXISTS public.task_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Security
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

-- 3. Set Permissions (CORRECTED)

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Everyone can read task categories" ON public.task_categories;
DROP POLICY IF EXISTS "Admins can insert task categories" ON public.task_categories;
DROP POLICY IF EXISTS "Admins can update task categories" ON public.task_categories;
DROP POLICY IF EXISTS "Admins can delete task categories" ON public.task_categories;

-- Read: Everyone
CREATE POLICY "Everyone can read task categories" 
  ON public.task_categories 
  FOR SELECT 
  USING (true);

-- Insert: Admins (Corrected to use WITH CHECK)
CREATE POLICY "Admins can insert task categories" 
  ON public.task_categories 
  FOR INSERT 
  WITH CHECK (is_admin());

-- Update: Admins
CREATE POLICY "Admins can update task categories" 
  ON public.task_categories 
  FOR UPDATE 
  USING (is_admin());

-- Delete: Admins
CREATE POLICY "Admins can delete task categories" 
  ON public.task_categories 
  FOR DELETE 
  USING (is_admin());

-- 4. Add Default Categories
INSERT INTO public.task_categories (name)
VALUES 
  ('Study'), 
  ('Coding'), 
  ('Gym'), 
  ('Work'), 
  ('Reading')
ON CONFLICT (name) DO NOTHING;
