-- ===========================================================================
-- Maison Lumière Beauty Atelier & Spa - Master Supabase Database Schema
-- ===========================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard:
--    https://supabase.com/dashboard/project/zerqvtduallempbtjjak/sql/new
-- 2. Paste this entire script into the SQL Editor.
-- 3. Click "Run" (or Ctrl + Enter).
-- All tables, relationships, RLS policies, and seed data will be created!
-- ===========================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. BUSINESS SETTINGS
create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'ميزون لوميير بيوتي سنتر وسبا',
  business_name_en text not null default 'Maison Lumière Beauty Center & Spa',
  business_email text default 'contact@maisonlumiere.beauty',
  business_phone text default '01012345678',
  business_address text default '١٥ شارع البرازيل، الزمالك، القاهرة',
  logo_url text,
  instapay_ipa text default 'maisonlumiere@instapay',
  instapay_name text default 'Maison Lumiere Spa',
  vodafone_cash_number text default '01012345678',
  deposit_percentage numeric(5, 2) not null default 50.00,
  deposit_hold_minutes integer not null default 30,
  slot_interval_minutes integer not null default 30,
  booking_notice_hours integer not null default 2,
  cancellation_notice_hours integer not null default 24,
  created_at timestamptz not null default now()
);

-- Ensure logo_url and booking_notice_hours exist if table was already partially created
alter table public.business_settings add column if not exists logo_url text;
alter table public.business_settings add column if not exists booking_notice_hours integer not null default 2;
alter table public.business_settings add column if not exists business_name_en text default 'Maison Lumière Beauty Center & Spa';

-- 3. BUSINESS HOURS & BLOCKED DATES
create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null check (weekday between 0 and 6) unique,
  is_open boolean not null default true,
  start_time time not null default '10:00:00',
  end_time time not null default '22:00:00'
);

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

-- 4. ROOMS & CABINS
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  type text not null check (type in ('hair_station', 'massage_room', 'moroccan_bath', 'facial_cabin', 'nails_station', 'general')),
  capacity integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. SPECIALISTS / STAFF
create table if not exists public.specialists (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  title_ar text default 'أخصائية تجميل',
  title_en text default 'Beauty Specialist',
  specialties text[] not null default '{}',
  is_active boolean not null default true,
  working_hours jsonb default '{"start": "10:00", "end": "22:00"}'::jsonb,
  created_at timestamptz not null default now()
);

-- 6. SERVICES (Dual Arabic / English support)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text,
  name_ar text not null,
  name_en text not null,
  category text not null check (category in ('hair', 'skincare', 'massage', 'moroccan_bath', 'nails', 'bridal')),
  description text,
  description_ar text,
  description_en text,
  duration_minutes integer not null default 60,
  price numeric(10, 2) not null default 0,
  room_type_required text not null default 'general',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 7. PACKAGES & BUNDLES (e.g. Bridal Packages)
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  price numeric(10, 2) not null,
  duration_minutes integer not null default 120,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.package_services (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  sort_order integer default 0
);

-- 8. RETAIL INVENTORY (Add-on products sold at reception)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  category text default 'general',
  price numeric(10, 2) not null,
  stock_quantity integer not null default 0,
  sku text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 9. PROMO CODES
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('fixed', 'percent')),
  discount_value numeric(10, 2) not null,
  min_spend numeric(10, 2) default 0,
  max_uses integer default 100,
  times_used integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 10. RECEPTION SHIFTS
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true
);

-- 11. BOOKINGS & INVOICES
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique,
  secret_token uuid not null default gen_random_uuid() unique,
  customer_name text not null,
  customer_phone text not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  subtotal_amount numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
  promo_code_id uuid references public.promo_codes(id) on delete set null,
  total_amount numeric(10, 2) not null default 0,
  deposit_required numeric(10, 2) not null default 0,
  deposit_paid numeric(10, 2) not null default 0,
  status text not null default 'pending_deposit' check (
    status in (
      'pending_deposit',
      'pending_verification',
      'confirmed',
      'checked_in',
      'checkout_pending',
      'completed',
      'cancelled',
      'no_show',
      'pending'
    )
  ),
  notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  refund_amount numeric(10, 2) default 0,
  hold_expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 12. BOOKING ITEMS
create table if not exists public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  package_id uuid references public.packages(id) on delete set null,
  specialist_id uuid references public.specialists(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  scheduled_start time not null,
  scheduled_end time not null,
  price numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- 13. IN-BRANCH OPEN TAB ADD-ONS
create table if not exists public.tab_addons (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  type text not null check (type in ('service', 'product')),
  item_id uuid not null,
  name_ar text not null,
  name_en text,
  quantity integer not null default 1,
  price numeric(10, 2) not null,
  added_by_staff_id uuid,
  created_at timestamptz not null default now()
);

-- 14. PAYMENTS & TRANSACTIONS
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  payment_type text not null check (payment_type in ('deposit', 'settlement', 'refund')),
  method text not null check (method in ('instapay', 'vodafone_cash', 'cash')),
  amount numeric(10, 2) not null,
  reference_number text,
  proof_image_url text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  verified_by_staff_name text,
  verified_by_staff_id uuid,
  verified_at timestamptz,
  shift_name text,
  shift_id uuid references public.shifts(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 15. STAFF USERS & PERMISSIONS
create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role text not null default 'receptionist' check (role in ('receptionist', 'manager', 'admin', 'specialist')),
  is_active boolean not null default true,
  pin text default '1234',
  created_at timestamptz not null default now()
);

-- 16. ADMIN USERS (for RLS is_admin checks)
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  created_at timestamptz not null default now()
);

-- 17. ATTENDANCE SYSTEM
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid,
  staff_name text not null,
  role text not null,
  date date not null default current_date,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  shift text not null default 'morning',
  status text not null default 'present' check (status in ('present', 'late', 'absent', 'excused')),
  notes text,
  created_at timestamptz not null default now()
);

-- 18. LEGACY APPOINTMENTS TABLE (alias)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  service_id uuid references public.services(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

-- 19. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
alter table public.business_settings enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.rooms enable row level security;
alter table public.specialists enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.package_services enable row level security;
alter table public.products enable row level security;
alter table public.promo_codes enable row level security;
alter table public.shifts enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.tab_addons enable row level security;
alter table public.payments enable row level security;
alter table public.staff_users enable row level security;
alter table public.admin_users enable row level security;
alter table public.attendance_records enable row level security;
alter table public.appointments enable row level security;

-- 20. RLS POLICIES (Allow public read for site features & public insert for booking/payment)
-- Business Settings: Public read, all authenticated manage
drop policy if exists "Public can view business settings" on public.business_settings;
create policy "Public can view business settings" on public.business_settings for select using (true);
drop policy if exists "Admins can manage business settings" on public.business_settings;
create policy "Admins can manage business settings" on public.business_settings for all using (true) with check (true);

-- Business Hours & Blocked Dates
drop policy if exists "Public can view business hours" on public.business_hours;
create policy "Public can view business hours" on public.business_hours for select using (true);
drop policy if exists "Admins can manage business hours" on public.business_hours;
create policy "Admins can manage business hours" on public.business_hours for all using (true) with check (true);

drop policy if exists "Public can view blocked dates" on public.blocked_dates;
create policy "Public can view blocked dates" on public.blocked_dates for select using (true);
drop policy if exists "Admins can manage blocked dates" on public.blocked_dates;
create policy "Admins can manage blocked dates" on public.blocked_dates for all using (true) with check (true);

-- Catalog: Services, Packages, Rooms, Specialists, Products, Promo Codes
drop policy if exists "Public can read rooms" on public.rooms;
create policy "Public can read rooms" on public.rooms for select using (true);
drop policy if exists "Admins can manage rooms" on public.rooms;
create policy "Admins can manage rooms" on public.rooms for all using (true) with check (true);

drop policy if exists "Public can read specialists" on public.specialists;
create policy "Public can read specialists" on public.specialists for select using (true);
drop policy if exists "Admins can manage specialists" on public.specialists;
create policy "Admins can manage specialists" on public.specialists for all using (true) with check (true);

drop policy if exists "Public can read services" on public.services;
create policy "Public can read services" on public.services for select using (true);
drop policy if exists "Admins can manage services" on public.services;
create policy "Admins can manage services" on public.services for all using (true) with check (true);

drop policy if exists "Public can read packages" on public.packages;
create policy "Public can read packages" on public.packages for select using (true);
drop policy if exists "Admins can manage packages" on public.packages;
create policy "Admins can manage packages" on public.packages for all using (true) with check (true);

drop policy if exists "Public can read package_services" on public.package_services;
create policy "Public can read package_services" on public.package_services for select using (true);
drop policy if exists "Admins can manage package_services" on public.package_services;
create policy "Admins can manage package_services" on public.package_services for all using (true) with check (true);

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products for select using (true);
drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products" on public.products for all using (true) with check (true);

drop policy if exists "Public can read promo_codes" on public.promo_codes;
create policy "Public can read promo_codes" on public.promo_codes for select using (true);
drop policy if exists "Admins can manage promo_codes" on public.promo_codes;
create policy "Admins can manage promo_codes" on public.promo_codes for all using (true) with check (true);

drop policy if exists "Public can read shifts" on public.shifts;
create policy "Public can read shifts" on public.shifts for select using (true);
drop policy if exists "Admins can manage shifts" on public.shifts;
create policy "Admins can manage shifts" on public.shifts for all using (true) with check (true);

-- Bookings, Items, Tab Addons & Payments (Public insert, reception/admin manage all)
drop policy if exists "Public can create bookings" on public.bookings;
create policy "Public can create bookings" on public.bookings for insert with check (true);
drop policy if exists "Anyone can read bookings" on public.bookings;
create policy "Anyone can read bookings" on public.bookings for select using (true);
drop policy if exists "Admins can manage bookings" on public.bookings;
create policy "Admins can manage bookings" on public.bookings for all using (true) with check (true);

drop policy if exists "Public can create booking items" on public.booking_items;
create policy "Public can create booking items" on public.booking_items for insert with check (true);
drop policy if exists "Anyone can read booking items" on public.booking_items;
create policy "Anyone can read booking items" on public.booking_items for select using (true);
drop policy if exists "Admins can manage booking items" on public.booking_items;
create policy "Admins can manage booking items" on public.booking_items for all using (true) with check (true);

drop policy if exists "Anyone can manage tab addons" on public.tab_addons;
create policy "Anyone can manage tab addons" on public.tab_addons for all using (true) with check (true);

drop policy if exists "Public can insert payments" on public.payments;
create policy "Public can insert payments" on public.payments for insert with check (true);
drop policy if exists "Anyone can read payments" on public.payments;
create policy "Anyone can read payments" on public.payments for select using (true);
drop policy if exists "Admins can manage payments" on public.payments;
create policy "Admins can manage payments" on public.payments for all using (true) with check (true);

-- Staff Users & Admin Users
drop policy if exists "Anyone can read staff users" on public.staff_users;
create policy "Anyone can read staff users" on public.staff_users for select using (true);
drop policy if exists "Admins can manage staff users" on public.staff_users;
create policy "Admins can manage staff users" on public.staff_users for all using (true) with check (true);

drop policy if exists "Anyone can read admin users" on public.admin_users;
create policy "Anyone can read admin users" on public.admin_users for select using (true);
drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage admin users" on public.admin_users for all using (true) with check (true);

-- Attendance Records
drop policy if exists "Anyone can manage attendance" on public.attendance_records;
create policy "Anyone can manage attendance" on public.attendance_records for all using (true) with check (true);

-- Appointments (Legacy)
drop policy if exists "Anyone can manage appointments" on public.appointments;
create policy "Anyone can manage appointments" on public.appointments for all using (true) with check (true);

-- 21. SEED DEFAULT DATA
-- Business Settings
insert into public.business_settings (
  business_name,
  business_name_en,
  business_email,
  business_phone,
  business_address,
  instapay_ipa,
  instapay_name,
  vodafone_cash_number,
  deposit_percentage,
  deposit_hold_minutes,
  slot_interval_minutes,
  booking_notice_hours,
  cancellation_notice_hours
)
select
  'ميزون لوميير بيوتي سنتر وسبا',
  'Maison Lumière Beauty Center & Spa',
  'contact@maisonlumiere.beauty',
  '01012345678',
  '١٥ شارع البرازيل، الزمالك، القاهرة',
  'maisonlumiere@instapay',
  'Maison Lumiere Spa',
  '01012345678',
  50.00,
  30,
  30,
  2,
  24
where not exists (select 1 from public.business_settings limit 1);

-- Business Hours (All 7 days open 10:00 to 22:00)
insert into public.business_hours (weekday, is_open, start_time, end_time) values
  (0, true, '10:00:00', '22:00:00'),
  (1, true, '10:00:00', '22:00:00'),
  (2, true, '10:00:00', '22:00:00'),
  (3, true, '10:00:00', '22:00:00'),
  (4, true, '10:00:00', '22:00:00'),
  (5, true, '10:00:00', '22:00:00'),
  (6, true, '10:00:00', '22:00:00')
on conflict (weekday) do nothing;

-- Rooms
insert into public.rooms (name_ar, name_en, type, capacity) values
  ('جناح الحمام المغربي الملكي', 'Royal Moroccan Bath Suite', 'moroccan_bath', 1),
  ('كابينة الهيدرا فيشل والسكين كير', 'HydraFacial & Skincare Cabin', 'facial_cabin', 1),
  ('جناح المساج والاسترخاء العطري', 'Aromatherapy Massage Suite', 'massage_room', 1),
  ('محطة تصفيف وترميم الشعر (١)', 'Hair Styling Station 1', 'hair_station', 1),
  ('محطة تصفيف وترميم الشعر (٢)', 'Hair Styling Station 2', 'hair_station', 1),
  ('ركن الباديكير والمانيكير الملكي', 'Royal Nails Lounge', 'nails_station', 2)
on conflict do nothing;

-- Specialists
insert into public.specialists (name_ar, name_en, title_ar, title_en, specialties) values
  ('نادية بناني', 'Nadia Bennani', 'خريجة مراكش وخبيرة الحمام المغربي الملكي', 'Moroccan Bath Master', array['moroccan_bath']::text[]),
  ('د. نورهان الشريف', 'Dr. Nourhan El-Sherif', 'أخصائية العناية المتقدمة بالبشرة والفيشل', 'Skin Care Specialist', array['skincare']::text[]),
  ('سارة المنشاوي', 'Sara El-Menshawy', 'أخصائية تدليك علاجي وريفليكسولوجي', 'Aromatherapy & Massage Specialist', array['massage']::text[]),
  ('كارولين صبري', 'Caroline Sabry', 'أخصائية علاج وترميم ألياف الشعر وتصفيفه', 'Hair Therapy Expert', array['hair']::text[]),
  ('ميرا وجدي', 'Mira Wagdy', 'خبيرة الميك آب وتحديد ورسم الملامح', 'Celebrity Makeup Artist', array['bridal']::text[])
on conflict do nothing;

-- Services
insert into public.services (name, name_ar, name_en, category, description, description_ar, description_en, duration_minutes, price, room_type_required) values
  ('جلسة هيدرا فيشل ونضارة عميقة', 'جلسة هيدرا فيشل ونضارة عميقة', 'Deep HydraFacial & Glow Ritual', 'skincare', 'تنظيف مسام ثلاثي المرحلة وتقشير مائي وتغذية بسيروم الهيالورونيك وفيتامين C', 'تنظيف مسام ثلاثي المرحلة وتقشير مائي وتغذية بسيروم الهيالورونيك وفيتامين C', 'Triple-stage vortex extraction, hydro-peeling, and intense hyaluronic hydration.', 60, 1500.00, 'facial_cabin'),
  ('الحمام المغربي الملكي بالأعشاب والصابون الأسود', 'الحمام المغربي الملكي بالأعشاب والصابون الأسود', 'Royal Moroccan Bath with Black Soap & Herbs', 'moroccan_bath', 'طقس مراكشي كامل بالصابون البلدي المعتق، كيس مغربي أصلي، دلكة أعشاب طبيعية، وماسك طمي الأطلس الأبيض', 'طقس مراكشي كامل بالصابون البلدي المعتق، كيس مغربي أصلي، دلكة أعشاب طبيعية، وماسك طمي الأطلس الأبيض', 'Authentic Moroccan hammam ritual with aged black olive soap, Kessa peeling, and Atlas white clay mask.', 90, 2200.00, 'moroccan_bath'),
  ('جلسة مساج استرخائي بالزيوت العطرية', 'جلسة مساج استرخائي بالزيوت العطرية', 'Aromatherapy Full Body Relaxation Massage', 'massage', 'مساج سويدي استرخائي يفك إجهاد عضلات الجسم بالكامل مع زيوت اللافندر والورد النقية', 'مساج سويدي استرخائي يفك إجهاد عضلات الجسم بالكامل مع زيوت اللافندر والورد النقية', 'Full-body Swedish relaxation massage infused with warm lavender and sweet almond botanical oils.', 60, 1200.00, 'massage_room'),
  ('ميك آب سواريه ولوك ناعم', 'ميك آب سواريه ولوك ناعم', 'Soirée & Soft Glam Makeup', 'bridal', 'ميك آب هادي وراقي يبرز جمالك وملامحك الطبيعية مع تجهيز كامل للبشرة وتركيب رموش حبة حبة للمناسبات', 'ميك آب هادي وراقي يبرز جمالك وملامحك الطبيعية مع تجهيز كامل للبشرة وتركيب رموش حبة حبة للمناسبات', 'Elegant soft-glam makeover tailored to your skin tone, featuring individual lash clusters and full skin prep.', 75, 1800.00, 'general'),
  ('ترميم واستشوار ومعالجة شعر بالكافيار', 'ترميم واستشوار ومعالجة شعر بالكافيار', 'Caviar Hair Restoration & Blowout', 'hair', 'ديتوكس لفروة الرأس مع جلسة ماسك كافيار لترميم الشعر وتصفيف بالسيشوار فوليوم يجنن يدوم أيام', 'ديتوكس لفروة الرأس مع جلسة ماسك كافيار لترميم الشعر وتصفيف بالسيشوار فوليوم يجنن يدوم أيام', 'Scalp detox ritual, intense caviar keratin infusion, and signature bouncy salon blowout.', 60, 1100.00, 'hair_station'),
  ('رسم وتنظيف وتحديد حواجب وصبغة طبيعية', 'رسم وتنظيف وتحديد حواجب وصبغة طبيعية', 'Eyebrow Shaping, Threading & Botanical Tint', 'bridal', 'رسم هندسي وتحديد دقيق لشكل الحواجب مع صبغة مخصصة وماسك كيراتين مغذي يعيد كثافتها', 'رسم هندسي وتحديد دقيق لشكل الحواجب مع صبغة مخصصة وماسك كيراتين مغذي يعيد كثافتها', 'Architectural brow mapping, precise threading, and organic henna conditioning tint.', 45, 600.00, 'general')
on conflict do nothing;

-- Packages
insert into public.packages (name_ar, name_en, description_ar, description_en, price, duration_minutes) values
  ('باقة العروسة الملكية الشاملة (Full Bridal VIP)', 'Full Royal Bridal VIP Ritual', 'يوم العروسة الكامل: حمام مغربي ملكي بالأعشاب + هيدرا فيشل ونضارة + مساج استرخائي بالزيوت + ميك آب سواريه راقي', 'Complete head-to-toe bridal ritual: Moroccan hammam, HydraFacial, body massage, and full soirée makeover.', 5500.00, 240),
  ('باقة ديتوكس واسترخاء نهاية الأسبوع (Weekend Retreat)', 'Weekend Detox & Radiance Retreat', 'حمام مغربي أصيل + جلسة مساج كامل للجسم لمدة ساعة + ترطيب ونضارة ماسك ذهب سريع', 'Authentic Moroccan hammam followed by full-body Swedish massage and express golden sheet mask.', 3100.00, 150),
  ('باقة النضارة والشعر الذهبي (Glow & Hair Silk)', 'Glow & Silk Hair Revival', 'جلسة هيدرا فيشل لتنظيف وتقشير البشرة + ماسك كافيار مكثف للشعر مع استشوار وفوليوم', 'Deep pore cleansing HydraFacial combined with intense caviar hair therapy and blowout.', 2300.00, 120)
on conflict do nothing;

-- Retail Products
insert into public.products (name_ar, name_en, category, price, stock_quantity, sku) values
  ('صابون بلدي مغربي بزيت الأرجان النقي (٥٠٠ جم)', 'Moroccan Black Soap with Pure Argan (500g)', 'moroccan_bath', 350.00, 24, 'MB-ARG-500'),
  ('سيروم حمض الهيالورونيك المركز للنضارة (٣٠ مل)', 'Concentrated Hyaluronic Acid Serum (30ml)', 'skincare', 650.00, 18, 'SK-HA-030'),
  ('ماسك الكافيار المعالج لترميم خصلات الشعر (٢٥٠ جم)', 'Caviar Restorative Hair Mask (250g)', 'hair', 550.00, 15, 'HR-CAV-250'),
  ('زيت مساج استرخائي طبيعي باللافندر وزهرة البرتقال (١٠٠ مل)', 'Lavender & Neroli Relaxing Body Oil (100ml)', 'massage', 400.00, 30, 'MS-LAV-100')
on conflict do nothing;

-- Staff Users
insert into public.staff_users (name, email, phone, role, is_active, pin) values
  ('مريم الصاوي', 'admin@maisonlumiere.beauty', '01011112222', 'admin', true, '1234'),
  ('فريدة عثمان', 'manager@maisonlumiere.beauty', '01022223333', 'manager', true, '1234'),
  ('رنا نبيل', 'reception@maisonlumiere.beauty', '01033334444', 'receptionist', true, '1234'),
  ('حبيبة رشوان', 'specialist1@maisonlumiere.beauty', '01044445555', 'specialist', true, '1234')
on conflict do nothing;

-- Shifts
insert into public.shifts (name_ar, name_en, start_time, end_time) values
  ('الوردية الصباحية', 'Morning Shift', '10:00:00', '16:00:00'),
  ('الوردية المسائية', 'Evening Shift', '16:00:00', '22:00:00')
on conflict do nothing;
