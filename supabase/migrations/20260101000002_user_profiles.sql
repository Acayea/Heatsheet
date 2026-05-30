-- User profiles (extends Supabase auth.users)
create type public.user_role as enum ('user', 'admin');

create table public.user_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  username      text not null,
  display_name  text not null,
  avatar_url    text,
  role          public.user_role not null default 'user',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint user_profiles_user_id_key unique (user_id),
  constraint user_profiles_username_key unique (username),
  constraint username_length check (char_length(username) between 3 and 20),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]+$')
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.user_profiles enable row level security;

create policy "Users can read any profile"
  on public.user_profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (user_id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'FieldDay Fan')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
