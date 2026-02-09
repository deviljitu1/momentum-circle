-- Fix infinite recursion in circle_members policy by using a security definer function

-- 1. Create a security definer function to check membership without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.is_circle_member(_circle_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM circle_members
    WHERE circle_id = _circle_id
    AND user_id = auth.uid()
  );
$$;

-- 2. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Circle members viewable by circle members" ON public.circle_members;

-- 3. Re-create the policy using the security definer function and explicit self-view
CREATE POLICY "Circle members viewable by circle members"
ON public.circle_members
FOR SELECT
USING (
  auth.uid() = user_id -- Users can always see their own membership
  OR
  is_circle_member(circle_id) -- Users can see other members if they are in the circle
);
