
-- Fix tasks table schema by adding missing columns
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_type public.task_type DEFAULT 'A',
ADD COLUMN IF NOT EXISTS target_value FLOAT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT true;

-- Ensure task_type column is NOT NULL after providing default
ALTER TABLE public.tasks ALTER COLUMN task_type SET NOT NULL;

-- If existing rows have 'completed' = true, we might want to backfill logs?
-- For now, let's just leave them. The system works moving forward.
