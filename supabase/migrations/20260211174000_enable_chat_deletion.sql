-- Add DELETE policies for circle_messages

-- 1. Check if policy exists and drop it to be safe (or just create if not exists)
DROP POLICY IF EXISTS "Users can delete own messages" ON public.circle_messages;
DROP POLICY IF EXISTS "Creators can delete circle messages" ON public.circle_messages;
DROP POLICY IF EXISTS "Admins can delete all messages" ON public.circle_messages;

-- 2. Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.circle_messages
FOR DELETE
USING (
    auth.uid() = user_id
);

-- 3. Allow circle creators to delete messages in their circle
CREATE POLICY "Creators can delete circle messages"
ON public.circle_messages
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.circles
        WHERE id = circle_messages.circle_id
        AND created_by = auth.uid()
    )
);

-- 4. Allow Admins to delete any message
CREATE POLICY "Admins can delete all messages"
ON public.circle_messages
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);
