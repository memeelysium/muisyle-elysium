-- MUISYLE Community Profiles
-- Run this script once in Supabase Dashboard > SQL Editor.
create table if not exists public.community_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  x_username text check (x_username is null or x_username ~ '^[A-Za-z0-9_]{1,15}$'),
  bio text not null default '' check (char_length(bio) <= 160),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_profiles enable row level security;

grant select on public.community_profiles to anon, authenticated;
grant insert (id, display_name, x_username, bio, avatar_url)
  on public.community_profiles to authenticated;
grant update (display_name, x_username, bio, avatar_url)
  on public.community_profiles to authenticated;

drop policy if exists "Public can view community profiles" on public.community_profiles;
create policy "Public can view community profiles"
  on public.community_profiles for select
  using (true);

drop policy if exists "Members can create their own profile" on public.community_profiles;
create policy "Members can create their own profile"
  on public.community_profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Members can update their own profile" on public.community_profiles;
create policy "Members can update their own profile"
  on public.community_profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
