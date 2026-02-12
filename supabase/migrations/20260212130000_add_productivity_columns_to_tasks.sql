-- Add productivity system columns to existing tasks table
-- This migration adds the columns needed for the productivity tracking system

-- First, create the task_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.task_type AS ENUM ('A', 'B', 'C');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to tasks table if they don't exist
DO $$ 
BEGIN
    -- Add task_type column (default to 'C' for existing tasks - completion based)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'task_type'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN task_type public.task_type DEFAULT 'C';
    END IF;

    -- Add target_value column (for Type A and B tasks)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'target_value'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN target_value FLOAT;
    END IF;

    -- Add is_personal column (to distinguish personal vs shared tasks)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'is_personal'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN is_personal BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update existing tasks to have task_type = 'C' if null
UPDATE public.tasks SET task_type = 'C' WHERE task_type IS NULL;

-- Make task_type NOT NULL after setting defaults
ALTER TABLE public.tasks ALTER COLUMN task_type SET NOT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN public.tasks.task_type IS 'Type A: Target-based (e.g., steps), Type B: Time-based (e.g., hours), Type C: Completion-based (done/not done)';
COMMENT ON COLUMN public.tasks.target_value IS 'Target value for Type A and B tasks';
COMMENT ON COLUMN public.tasks.is_personal IS 'Whether this is a personal task (true) or shared/circle task (false)';
