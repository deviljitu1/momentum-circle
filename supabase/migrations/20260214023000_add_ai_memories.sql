
-- Create ai_memories table
create table if not exists ai_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  memory_type text not null default 'insight',
  importance integer default 5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint valid_importance check (importance >= 1 and importance <= 10)
);

-- Enable RLS
alter table ai_memories enable row level security;

-- Policies
-- Policies (Drop first to avoid conflicts during re-runs)
drop policy if exists "Users can view their own AI memories" on ai_memories;
create policy "Users can view their own AI memories"
  on ai_memories for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own AI memories" on ai_memories;
create policy "Users can insert their own AI memories"
  on ai_memories for insert
  with check (auth.uid() = user_id);

-- Create index for performance
create index if not exists ai_memories_user_id_idx on ai_memories(user_id);
create index if not exists ai_memories_importance_idx on ai_memories(importance);
