
-- Drop the overly permissive service role policy and replace with proper auth-based ones
DROP POLICY "Service role full access to AI memories" ON public.ai_memories;
