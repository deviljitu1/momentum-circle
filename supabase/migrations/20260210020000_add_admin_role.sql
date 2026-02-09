-- Create app_role type
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Add role to profiles
ALTER TABLE public.profiles 
ADD COLUMN role public.app_role NOT NULL DEFAULT 'user';

-- Create a secure function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- RLS Updates for Admin Override

-- 1. Profiles: Admins can update/delete any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
USING (is_admin());

-- 2. Circles: Admins can update/delete any circle
CREATE POLICY "Admins can update any circle"
ON public.circles
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete any circle"
ON public.circles
FOR DELETE
USING (is_admin());

-- 3. Circle Members: Admins can remove anyone
CREATE POLICY "Admins can delete circle members"
ON public.circle_members
FOR DELETE
USING (is_admin());

-- 4. Tasks/Activity/etc: Generally cascade from user/circle deletion, but we can gives admins view access
CREATE POLICY "Admins can view all tasks"
ON public.tasks
FOR SELECT
USING (is_admin());

-- AUTOMATICALLY MAKE 'admin@momentum.com' AN ADMIN
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'admin@momentum.com' THEN 'admin'::public.app_role
      ELSE 'user'::public.app_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Note: We are replacing the existing trigger function to include the role logic.

-- Also update existing user if they exist and are 'admin@momentum.com'
UPDATE public.profiles
SET role = 'admin'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@momentum.com');
