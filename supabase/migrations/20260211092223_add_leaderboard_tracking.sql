
create table if not exists public.user_follows (
    follower_id uuid references auth.users(id) on delete cascade not null,
    following_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now(),
    primary key (follower_id, following_id)
);

-- RLS
alter table public.user_follows enable row level security;

create policy "Users can view who follows who"
    on public.user_follows for select
    using (true);

create policy "Users can follow others"
    on public.user_follows for insert
    with check (auth.uid() = follower_id);

create policy "Users can unfollow"
    on public.user_follows for delete
    using (auth.uid() = follower_id);
