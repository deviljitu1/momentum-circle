-- Fix visibility by establishing a relationship between circle_members and profiles
-- This allows PostgREST to join them via circle_members.user_id -> profiles.user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'circle_members_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.circle_members
        ADD CONSTRAINT circle_members_user_id_fkey_profiles
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(user_id);
    END IF;
END $$;

-- Create circle_messages table
CREATE TABLE IF NOT EXISTS public.circle_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK for circle_messages to profiles to allow easy joins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'circle_messages_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.circle_messages
        ADD CONSTRAINT circle_messages_user_id_fkey_profiles
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(user_id);
    END IF;
END $$;

-- RLS for messages
ALTER TABLE public.circle_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Messages viewable by circle members" ON public.circle_messages;
DROP POLICY IF EXISTS "Members can insert messages" ON public.circle_messages;

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

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_messages;
