-- 1. Auto-confirm existing admin user if they are stuck
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'admin@momentum.com';

-- 2. Create a trigger to auto-confirm admin@momentum.com on sign up (for future resets)
CREATE OR REPLACE FUNCTION public.auto_confirm_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'admin@momentum.com' THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop check to avoid error if exists
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;

CREATE TRIGGER on_auth_user_created_admin
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_admin();
