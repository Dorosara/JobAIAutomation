-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('JOB_SEEKER', 'COLLEGE_ADMIN', 'RECRUITER', 'SUPER_ADMIN')) default 'JOB_SEEKER',
  subscription_plan text default 'FREE',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. JOBS (For Job Board)
create table if not exists public.jobs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  company text not null,
  location text,
  type text check (type in ('Full-time', 'Part-time', 'Internship')),
  salary_range text,
  description text,
  skills_required text[],
  posted_date date default current_date,
  is_active boolean default true,
  created_by uuid references public.profiles(id)
);

-- 3. APPLICATIONS (Tracking)
create table if not exists public.applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status text check (status in ('APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED')) default 'APPLIED',
  cover_letter text,
  applied_date timestamp with time zone default timezone('utc'::text, now()),
  unique(job_id, user_id) -- Prevent duplicate applications
);

-- 4. RESUMES (User Data)
create table if not exists public.resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  content_json jsonb,
  resume_text text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. PLANS (Defines Limits)
create table if not exists public.plans (
  code text primary key, -- Matches 'FREE', 'PRO', etc.
  name text,
  daily_apply_limit int,
  price int
);

-- Insert Default Plans
insert into public.plans (code, name, daily_apply_limit, price) values 
('FREE', 'Starter Plan', 2, 0),
('BASIC', 'Pro Plan', 10, 299),
('PRO', 'Elite Plan', 50, 599)
on conflict (code) do nothing;

-- 6. SUBSCRIPTIONS VIEW (Virtual table to match your query)
create or replace view public.subscriptions as
select 
  p.id as user_id,
  p.subscription_plan as plan_code,
  coalesce(pl.daily_apply_limit, 0) as daily_apply_limit,
  'active' as status
from public.profiles p
left join public.plans pl on p.subscription_plan = pl.code;

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.resumes enable row level security;
alter table public.plans enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Jobs Policies
create policy "Jobs are viewable by everyone" on public.jobs for select using (true);
create policy "Recruiters can insert jobs" on public.jobs for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'RECRUITER')
);

-- Applications Policies
create policy "Users can view own applications" on public.applications for select using (auth.uid() = user_id);
create policy "Recruiters can view applications for their jobs" on public.applications for select using (
  exists (select 1 from public.jobs where id = applications.job_id and created_by = auth.uid())
);
create policy "Users can insert applications" on public.applications for insert with check (auth.uid() = user_id);

-- Plans Policies
create policy "Plans are public" on public.plans for select using (true);

-- Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
