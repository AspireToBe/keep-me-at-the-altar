-- ============================================================
-- KEEP ME AT THE ALTAR — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- Created automatically when a user signs in via magic link.
-- ============================================================
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  email         text,
  selected_months text[] default array['January','July','December'],
  created_at    timestamptz default now()
);

-- Auto-create profile on first sign-in
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- 2. ALTAR ENTRIES (Weekly Saturday journal)
-- One entry per user per month per week.
-- ============================================================
create table altar_entries (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  month         text not null,
  week_number   int not null check (week_number between 1 and 4),
  morning       text,
  midday        text,
  evening       text,
  one_word      text,
  feeling       text,
  saved_at      timestamptz default now(),
  unique (user_id, month, week_number)
);

-- ============================================================
-- 3. MONTHLY REFLECTIONS
-- One reflection per user per month.
-- ============================================================
create table monthly_reflections (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null references profiles(id) on delete cascade,
  month                     text not null,
  what_changed              text,
  clearest_thing_god_said   text,
  prayer_answered           text,
  still_in_progress         text,
  carry_forward             text,
  spiritual_temperature     text,
  saved_at                  timestamptz default now(),
  unique (user_id, month)
);

-- ============================================================
-- 4. TESTIMONIES
-- status: 'pending' | 'published' | 'rejected'
-- Only Nina (admin) can set status = 'published'.
-- ============================================================
create table testimonies (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references profiles(id) on delete set null,
  display_name  text not null,
  body          text not null,
  category      text not null check (category in ('breakthrough','healing','provision','direction','restoration','other')),
  month         text,
  status        text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at    timestamptz default now()
);

-- ============================================================
-- 5. REACTIONS
-- One reaction per user per testimony per type.
-- ============================================================
create table reactions (
  id            uuid primary key default uuid_generate_v4(),
  testimony_id  uuid not null references testimonies(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  type          text not null check (type in ('amen','praying','encouraged')),
  unique (testimony_id, user_id, type)
);

-- ============================================================
-- 6. COMMENTS
-- ============================================================
create table comments (
  id            uuid primary key default uuid_generate_v4(),
  testimony_id  uuid not null references testimonies(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  display_name  text not null,
  body          text not null,
  created_at    timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles           enable row level security;
alter table altar_entries      enable row level security;
alter table monthly_reflections enable row level security;
alter table testimonies        enable row level security;
alter table reactions          enable row level security;
alter table comments           enable row level security;

-- PROFILES: users can only read/update their own profile
create policy "users read own profile"
  on profiles for select using (auth.uid() = id);

create policy "users update own profile"
  on profiles for update using (auth.uid() = id);

-- ALTAR ENTRIES: private — only the owner can see/edit
create policy "users manage own altar entries"
  on altar_entries for all using (auth.uid() = user_id);

-- MONTHLY REFLECTIONS: private — only the owner can see/edit
create policy "users manage own reflections"
  on monthly_reflections for all using (auth.uid() = user_id);

-- TESTIMONIES: anyone can submit; only published ones are public
create policy "anyone can submit testimony"
  on testimonies for insert with check (true);

create policy "published testimonies are public"
  on testimonies for select using (status = 'published');

create policy "users can see own pending testimonies"
  on testimonies for select using (auth.uid() = user_id);

-- Admin update policy — replace YOUR_ADMIN_USER_ID with your actual Supabase user UUID
-- Find it in: Supabase Dashboard > Authentication > Users
create policy "admin can update testimony status"
  on testimonies for update
  using (auth.uid() = 'YOUR_ADMIN_USER_ID'::uuid);

-- REACTIONS: authenticated users only; one per type per testimony
create policy "authenticated users can react"
  on reactions for insert with check (auth.uid() = user_id);

create policy "anyone can read reactions"
  on reactions for select using (true);

create policy "users can remove own reaction"
  on reactions for delete using (auth.uid() = user_id);

-- COMMENTS: authenticated users only
create policy "authenticated users can comment"
  on comments for insert with check (auth.uid() = user_id);

create policy "anyone can read comments"
  on comments for select using (true);

create policy "users can delete own comments"
  on comments for delete using (auth.uid() = user_id);

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- Testimony feed with reaction counts
create or replace view testimony_feed as
select
  t.id,
  t.display_name,
  t.body,
  t.category,
  t.month,
  t.created_at,
  count(case when r.type = 'amen' then 1 end)        as amen_count,
  count(case when r.type = 'praying' then 1 end)     as praying_count,
  count(case when r.type = 'encouraged' then 1 end)  as encouraged_count,
  count(c.id)                                         as comment_count
from testimonies t
left join reactions r on r.testimony_id = t.id
left join comments c  on c.testimony_id = t.id
where t.status = 'published'
group by t.id;

-- ============================================================
-- NOTES FOR NINA:
-- 1. Replace 'YOUR_ADMIN_USER_ID' above with your user UUID
--    (Dashboard > Authentication > Users > copy your UUID)
-- 2. To publish a testimony, go to Dashboard > Table Editor >
--    testimonies > click the row > change status to 'published'
--    OR use the admin panel in the app once you set your UUID.
-- ============================================================

-- ============================================================
-- 7. COUNTERS
-- Anonymous — no user ID attached.
-- increment_counter() is callable by anyone via rpc().
-- ============================================================
create table counters (
  key        text primary key,
  value      bigint default 0,
  updated_at timestamptz default now()
);

-- Seed initial counters
insert into counters (key, value) values
  ('downloads', 0),
  ('altar_days', 0);

-- Public read access
alter table counters enable row level security;
create policy "counters are publicly readable"
  on counters for select using (true);

-- Anonymous increment — called via supabase.rpc('increment_counter', { counter_key: 'downloads' })
create or replace function increment_counter(counter_key text)
returns void language plpgsql security definer as $$
begin
  update counters
  set value      = value + 1,
      updated_at = now()
  where key = counter_key;
end;
$$;

-- ============================================================
-- PLATFORM STATS VIEW
-- Returns all public counts in one query.
-- Usage: supabase.from('platform_stats').select('*')
-- ============================================================
create or replace view platform_stats as
select
  (select value from counters where key = 'downloads')   as downloads,
  (select value from counters where key = 'altar_days')  as altar_days,
  (select count(*) from profiles where on_fast = true)   as fasting_now,
  (select count(*) from testimonies where status = 'published') as testimonies;

-- NOTE: The profiles table needs an on_fast column.
-- Add it with:
--   alter table profiles add column if not exists on_fast boolean default false;
--   alter table profiles add column if not exists altar_day text;
--   alter table profiles add column if not exists fast_type text;
--   alter table profiles add column if not exists fast_day  int default 1;
--   alter table profiles add column if not exists stage     int;

-- ============================================================
-- 8. EVENTS
-- Church events, gospel shows, live prayer sessions, etc.
-- Admin creates events via Supabase table editor or admin UI.
-- All published events are publicly visible — no sign-in needed.
-- ============================================================
create table events (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  category    text not null check (category in (
                'live-prayer',
                'church-service',
                'gospel-show',
                'conference',
                'community-fast',
                'other'
              )),
  event_date  date not null,
  event_time  text,                    -- e.g. "6:00 PM GMT"
  location    text,                    -- physical address or online
  link        text,                    -- Zoom / YouTube / ticket link
  image_url   text,                    -- optional banner image
  organiser   text,                    -- church or organisation name
  status      text not null default 'published'
                check (status in ('draft','published','cancelled')),
  created_at  timestamptz default now()
);

-- Public read — no sign-in needed
alter table events enable row level security;
create policy "published events are public"
  on events for select using (status = 'published');

-- Admin only can insert, update, delete
create policy "admin can manage events"
  on events for all
  using (auth.uid() = 'YOUR_ADMIN_USER_ID'::uuid);

-- ============================================================
-- NOTES FOR NINA:
-- To add an event: Supabase Dashboard > Table Editor > events
-- > Insert row. Set status to 'published' to make it live.
-- Replace 'YOUR_ADMIN_USER_ID' with your UUID (same as above).
-- ============================================================
