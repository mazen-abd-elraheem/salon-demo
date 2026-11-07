-- ===========================================================================
-- Maison Lumière Beauty Atelier - Complete Supabase Database Schema
-- ===========================================================================
-- Paste this script into your Supabase project's SQL Editor (supabase.com -> SQL Editor)
-- and click "RUN" to create all tables, permissions, and sample data.

-- 1. Enable UUID extension
create extension if not exists "pgcrypto";

-- 2. Create tables
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null default 60,
  price numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null check (weekday between 0 and 6) unique,
  is_open boolean not null default true,
  start_time time not null default '10:00:00',
  end_time time not null default '20:00:00'
);

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Maison Lumière',
  business_email text default 'contact@maisonlumiere.beauty',
  business_phone text default '+20 100 123 4567',
  business_address text default '15 Brazil St, Zamalek, Cairo',
  slot_interval_minutes integer not null default 30,
  booking_notice_hours integer not null default 2,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  service_id uuid references public.services(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  created_at timestamptz not null default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.business_settings enable row level security;
alter table public.appointments enable row level security;
alter table public.admin_users enable row level security;

-- Helper function to check if current user is in admin_users
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

-- 4. RLS Policies
-- Services: anyone can view active services; admins can do all
drop policy if exists "Public can view active services" on public.services;
create policy "Public can view active services" on public.services
  for select using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage services" on public.services;
create policy "Admins can manage services" on public.services
  for all using (public.is_admin());

-- Business hours: anyone can read; admins can manage
drop policy if exists "Public can view business hours" on public.business_hours;
create policy "Public can view business hours" on public.business_hours
  for select using (true);

drop policy if exists "Admins can manage business hours" on public.business_hours;
create policy "Admins can manage business hours" on public.business_hours
  for all using (public.is_admin());

-- Blocked dates: anyone can read; admins can manage
drop policy if exists "Public can view blocked dates" on public.blocked_dates;
create policy "Public can view blocked dates" on public.blocked_dates
  for select using (true);

drop policy if exists "Admins can manage blocked dates" on public.blocked_dates;
create policy "Admins can manage blocked dates" on public.blocked_dates
  for all using (public.is_admin());

-- Business settings: anyone can read; admins can manage
drop policy if exists "Public can view business settings" on public.business_settings;
create policy "Public can view business settings" on public.business_settings
  for select using (true);

drop policy if exists "Admins can manage business settings" on public.business_settings;
create policy "Admins can manage business settings" on public.business_settings
  for all using (public.is_admin());

-- Appointments: public can insert bookings; admins can read & update
drop policy if exists "Public can book appointments" on public.appointments;
create policy "Public can book appointments" on public.appointments
  for insert with check (true);

drop policy if exists "Admins can manage appointments" on public.appointments;
create policy "Admins can manage appointments" on public.appointments
  for all using (public.is_admin());

-- Admin users: authenticated users can check their own status
drop policy if exists "Users can check admin status" on public.admin_users;
create policy "Users can check admin status" on public.admin_users
  for select using (auth.uid() = user_id or public.is_admin());

-- 5. Seed Data
-- Business settings
insert into public.business_settings (business_name, business_email, business_phone, business_address, slot_interval_minutes, booking_notice_hours)
values (
  'Maison Lumière',
  'contact@maisonlumiere.beauty',
  '+20 100 123 4567',
  '15 Brazil St, Zamalek, Cairo',
  30,
  2
) on conflict do nothing;

-- Business hours (0 = Sunday ... 6 = Saturday)
insert into public.business_hours (weekday, is_open, start_time, end_time) values
  (0, true, '11:00:00', '21:00:00'),
  (1, true, '10:00:00', '21:00:00'),
  (2, true, '10:00:00', '21:00:00'),
  (3, true, '10:00:00', '21:00:00'),
  (4, true, '10:00:00', '22:00:00'),
  (5, true, '13:00:00', '22:00:00'),
  (6, true, '10:00:00', '21:00:00')
on conflict (weekday) do nothing;

-- Default services
insert into public.services (name, description, duration_minutes, price, is_active) values
  ('Signature Hydrafacial Ritual', 'Deep pore cleansing, fruit acid exfoliation, lymphatic massage, and intense hyaluronic infusion.', 60, 1500.00, true),
  ('Soft Glam Makeup & Glow', 'Skin-first, radiant makeup tailored to your features and evening event. Includes premium prep and lashes.', 75, 1800.00, true),
  ('Atelier Brow Shaping & Tint', 'Architectural brow mapping, custom tinting, precision tweezing, and a nourishing keratin finishing balm.', 45, 600.00, true),
  ('Lash Lift & Deep Nourishment', 'Natural lash lift curl and deep obsidian tinting with organic peptide glaze for up to 8 weeks.', 60, 900.00, true),
  ('Hair Revival & Blowout Treatment', 'Deep scalp detoxification, caviar hair mask therapy, and a voluminous, bouncy signature blowout.', 60, 1100.00, true),
  ('Bridal Beauty Consultation & Trial', 'Comprehensive private session with senior artist to curate your complete bridal skin, hair, and makeup vision.', 90, 2500.00, true)
on conflict do nothing;

-- Instructions for Admin user:
-- 1. Create a user via Supabase Auth (Authentication -> Users -> Add User)
-- 2. Copy the user's UUID
-- 3. Run: INSERT INTO public.admin_users (user_id) VALUES ('YOUR-USER-UUID-HERE');

