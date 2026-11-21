-- =============================================================================
-- Orbix (ORX) - Supabase PostgreSQL Schema with Row Level Security (RLS)
-- =============================================================================
-- Points are in-app rewards only (signup bonus, daily check-in, verified tasks,
-- free daily Lucky Draw, reward nodes, and 1-level referrals). No mining, no ROI.
-- All mutations run exclusively on the server in Supabase Edge Functions using
-- SUPABASE_SERVICE_ROLE_KEY after Telegram initData HMAC-SHA256 verification.
-- =============================================================================

create extension if not exists "pgcrypto";

-- 1. USERS TABLE
create table if not exists public.users (
  tg_id text primary key,
  username text,
  first_name text not null default 'Pioneer',
  last_name text,
  photo_url text,
  balance numeric(18, 4) not null default 100.0000,
  daily_earned numeric(18, 4) not null default 0,
  checkin_streak integer not null default 0,
  last_checkin_date date,
  cumulative_checkin_rewards numeric(18, 4) not null default 0,
  last_spin_date date,
  referred_by text references public.users(tg_id) on delete set null,
  valid_invites integer not null default 0,
  referral_earnings numeric(18, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TASKS TABLE
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  url text not null,
  reward numeric(18, 4) not null default 10.0000,
  category text not null default 'custom' check (category in ('telegram_group', 'telegram_channel', 'x', 'facebook', 'custom')),
  is_active boolean not null default true,
  sort_order integer not null default 10,
  created_at timestamptz not null default now()
);

-- 3. USER TASKS (VERIFICATION + COMPLETION LOG)
create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  tg_id text not null references public.users(tg_id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  started_at timestamptz,
  completed_at timestamptz,
  reward_claimed numeric(18, 4) not null default 0,
  unique (tg_id, task_id)
);

-- 4. CHECK-INS LOG
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  tg_id text not null references public.users(tg_id) on delete cascade,
  checkin_date date not null,
  streak_day integer not null check (streak_day between 1 and 7),
  reward numeric(18, 4) not null,
  created_at timestamptz not null default now(),
  unique (tg_id, checkin_date)
);

-- 5. LUCKY DRAWS LOG
create table if not exists public.lucky_draws (
  id uuid primary key default gen_random_uuid(),
  tg_id text not null references public.users(tg_id) on delete cascade,
  spin_date date not null,
  segment_index integer not null,
  reward numeric(18, 4) not null,
  created_at timestamptz not null default now(),
  unique (tg_id, spin_date)
);

-- 6. REFERRALS (1-LEVEL ONLY, ONE REFERRER PER USER)
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_tg_id text not null references public.users(tg_id) on delete cascade,
  referred_tg_id text not null unique references public.users(tg_id) on delete cascade,
  referred_name text not null default 'Pioneer',
  referred_username text,
  bonus_awarded numeric(18, 4) not null default 25.0000,
  created_at timestamptz not null default now(),
  constraint no_self_referral check (referrer_tg_id <> referred_tg_id)
);

-- 7. WITHDRAW REQUESTS
create table if not exists public.withdraw_requests (
  id uuid primary key default gen_random_uuid(),
  tg_id text not null references public.users(tg_id) on delete cascade,
  wallet_address text not null,
  amount numeric(18, 4) not null check (amount >= 50),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- 8. TRANSACTIONS LEDGER
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  tg_id text not null references public.users(tg_id) on delete cascade,
  type text not null,
  amount numeric(18, 4) not null,
  description text not null,
  created_at timestamptz not null default now()
);

-- 9. BROADCASTS
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

-- 10. USER NODES (IN-APP ORX POINT NODES)
create table if not exists public.user_nodes (
  id uuid primary key default gen_random_uuid(),
  tg_id text not null references public.users(tg_id) on delete cascade,
  tier_id text not null,
  tier_name text not null,
  daily_orx numeric(18, 4) not null,
  duration_days integer not null,
  days_claimed integer not null default 0,
  total_claimed_orx numeric(18, 4) not null default 0,
  last_claim_date date,
  activated_at timestamptz not null default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.user_tasks enable row level security;
alter table public.check_ins enable row level security;
alter table public.lucky_draws enable row level security;
alter table public.referrals enable row level security;
alter table public.withdraw_requests enable row level security;
alter table public.transactions enable row level security;
alter table public.broadcasts enable row level security;
alter table public.user_nodes enable row level security;

drop policy if exists "Public read active tasks" on public.tasks;
create policy "Public read active tasks"
  on public.tasks for select
  using (is_active = true);

drop policy if exists "Public read broadcasts" on public.broadcasts;
create policy "Public read broadcasts"
  on public.broadcasts for select
  using (true);

drop policy if exists "Users read own profile" on public.users;
create policy "Users read own profile"
  on public.users for select
  using (tg_id = coalesce(auth.jwt() ->> 'tg_id', ''));

drop policy if exists "Users read own tasks" on public.user_tasks;
create policy "Users read own tasks"
  on public.user_tasks for select
  using (tg_id = coalesce(auth.jwt() ->> 'tg_id', ''));

drop policy if exists "Users read own checkins" on public.check_ins;
create policy "Users read own checkins"
  on public.check_ins for select
  using (tg_id = coalesce(auth.jwt() ->> 'tg_id', ''));

drop policy if exists "Users read own lucky draws" on public.lucky_draws;
create policy "Users read own lucky draws"
  on public.lucky_draws for select
  using (tg_id = coalesce(auth.jwt() ->> 'tg_id', ''));

drop policy if exists "Users read own referrals" on public.referrals;
create policy "Users read own referrals"
  on public.referrals for select
  using (referrer_tg_id = coalesce(auth.jwt() ->> 'tg_id', ''));

drop policy if exists "Users read own withdraws" on public.withdraw_requests;
create policy "Users read own withdraws"
  on public.withdraw_requests for select
  using (tg_id = coalesce(auth.jwt() ->> 'tg_id', ''));

drop policy if exists "Users read own transactions" on public.transactions;
create policy "Users read own transactions"
  on public.transactions for select
  using (tg_id = coalesce(auth.jwt() ->> 'tg_id', ''));

drop policy if exists "Users read own nodes" on public.user_nodes;
create policy "Users read own nodes"
  on public.user_nodes for select
  using (tg_id = coalesce(auth.jwt() ->> 'tg_id', ''));

-- =============================================================================
-- SEED DEFAULT TASKS
-- =============================================================================
insert into public.tasks (id, title, subtitle, url, reward, category, is_active, sort_order)
values
  ('11111111-1111-1111-1111-111111111101', 'Discussion Group', 'Connect & Share', 'https://t.me/+I7sfRF2mQgZiZjVl', 15.0, 'telegram_group', true, 1),
  ('11111111-1111-1111-1111-111111111102', 'Official Channel', 'Follow the latest updates', 'https://t.me/tanjirul0123', 15.0, 'telegram_channel', true, 2),
  ('11111111-1111-1111-1111-111111111103', 'Follow Orbix on X', 'Stay updated on X (Twitter)', 'https://x.com/tanjirul_king', 12.0, 'x', true, 3),
  ('11111111-1111-1111-1111-111111111104', 'Like Orbix on Facebook', 'Join our Facebook community', 'https://www.facebook.com/share/18seM3aWbW/', 12.0, 'facebook', true, 4)
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  url = excluded.url,
  reward = excluded.reward;
