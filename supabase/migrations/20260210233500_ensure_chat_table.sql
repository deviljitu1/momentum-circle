-- Ensure circle_messages table exists
CREATE TABLE IF NOT EXISTS public.circle_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.circle_messages ENABLE ROW LEVEL SECURITY;

-- Drop generic messages policies to avoid conflicts
DROP POLICY IF EXISTS "Messages viewable by circle members" ON public.circle_messages;
DROP POLICY IF EXISTS "Members can insert messages" ON public.circle_messages;

-- Create policies again
CREATE POLICY "Messages viewable by circle members"
ON public.circle_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.circle_members
        WHERE circle_id = circle_messages.circle_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Members can insert messages"
ON public.circle_messages
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND
    EXISTS (
        SELECT 1 FROM public.circle_members
        WHERE circle_id = circle_messages.circle_id
        AND user_id = auth.uid()
    )
);

-- Ensure profiles is accessible
-- Sometimes explicit grant helps if public schema usage is restricted
GRANT SELECT, INSERT ON public.circle_messages TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
