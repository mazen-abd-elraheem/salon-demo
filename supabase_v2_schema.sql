-- ===========================================================================
-- Beauty Center & Spa - Centralized Single-Branch Production Schema (v2)
-- ===========================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/zerqvtduallempbtjjak/sql)

create extension if not exists "pgcrypto";

-- 1. ROOMS & STATIONS
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  type text not null check (type in ('hair_station', 'massage_room', 'moroccan_bath', 'facial_cabin', 'nails_station', 'general')),
  capacity integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. SPECIALISTS / STAFF
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

-- 3. SERVICES
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  category text not null check (category in ('hair', 'skincare', 'massage', 'moroccan_bath', 'nails', 'bridal')),
  description_ar text,
  description_en text,
  duration_minutes integer not null default 60,
  price numeric(10, 2) not null default 0,
  room_type_required text not null default 'general',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. PACKAGES & SEASONAL BUNDLES (e.g. Bridal Packages)
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

-- 5. RETAIL INVENTORY (Add-on products sold at reception)
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

-- 6. PROMO CODES
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

-- 7. RECEPTION SHIFTS
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true
);

-- 8. BUSINESS SETTINGS
create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'ميزون لوميير بيوتي سنتر وسبا',
  business_name_en text not null default 'Maison Lumière Beauty Center & Spa',
  business_email text default 'contact@maisonlumiere.beauty',
  business_phone text default '01012345678',
  business_address text default '١٥ شارع البرازيل، الزمالك، القاهرة',
  instapay_ipa text default 'maisonlumiere@instapay',
  instapay_name text default 'Maison Lumiere Spa',
  vodafone_cash_number text default '01012345678',
  deposit_percentage numeric(5, 2) not null default 50.00,
  deposit_hold_minutes integer not null default 30,
  slot_interval_minutes integer not null default 30,
  cancellation_notice_hours integer not null default 24,
  created_at timestamptz not null default now()
);

-- 9. BOOKINGS & INVOICES
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
      'pending_deposit',      -- Booked online, 30min hold awaiting transfer proof
      'pending_verification', -- Proof uploaded by customer, waiting for cashier approval
      'confirmed',            -- Deposit approved by reception
      'checked_in',           -- Customer arrived in branch (Open Tab active)
      'checkout_pending',     -- Customer scanning QR / settling remaining balance
      'completed',            -- Final payment approved & invoice closed
      'cancelled',            -- Cancelled (refund recorded if >= 24h)
      'no_show'               -- Customer did not show up (deposit kept)
    )
  ),
  notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  refund_amount numeric(10, 2) default 0,
  hold_expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 10. BOOKING ITEMS (Services/Packages selected in the booking)
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

-- 11. IN-BRANCH OPEN TAB ADD-ONS
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

-- 12. PAYMENTS & TRANSACTIONS (Both 50% deposit and QR checkout settlement)
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

-- 13. STAFF USERS
create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  email text not null,
  role text not null default 'receptionist' check (role in ('receptionist', 'manager', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 14. ENABLE ROW LEVEL SECURITY
alter table public.rooms enable row level security;
alter table public.specialists enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.package_services enable row level security;
alter table public.products enable row level security;
alter table public.promo_codes enable row level security;
alter table public.shifts enable row level security;
alter table public.business_settings enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.tab_addons enable row level security;
alter table public.payments enable row level security;
alter table public.staff_users enable row level security;

-- 15. RLS POLICIES (Public read for booking catalog, public insert for bookings & payments, staff manages all)
drop policy if exists "Public can read rooms" on public.rooms;
create policy "Public can read rooms" on public.rooms for select using (true);

drop policy if exists "Public can read specialists" on public.specialists;
create policy "Public can read specialists" on public.specialists for select using (true);

drop policy if exists "Public can read services" on public.services;
create policy "Public can read services" on public.services for select using (true);

drop policy if exists "Public can read packages" on public.packages;
create policy "Public can read packages" on public.packages for select using (true);

drop policy if exists "Public can read package_services" on public.package_services;
create policy "Public can read package_services" on public.package_services for select using (true);

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products for select using (true);

drop policy if exists "Public can read promo_codes" on public.promo_codes;
create policy "Public can read promo_codes" on public.promo_codes for select using (true);

drop policy if exists "Public can read shifts" on public.shifts;
create policy "Public can read shifts" on public.shifts for select using (true);

drop policy if exists "Public can read business_settings" on public.business_settings;
create policy "Public can read business_settings" on public.business_settings for select using (true);

-- Bookings: Customers can insert bookings and read their own via token or phone
drop policy if exists "Public can create bookings" on public.bookings;
create policy "Public can create bookings" on public.bookings for insert with check (true);

drop policy if exists "Public can read bookings by token or phone" on public.bookings;
create policy "Public can read bookings by token or phone" on public.bookings for select using (true);

drop policy if exists "Public can update bookings" on public.bookings;
create policy "Public can update bookings" on public.bookings for update using (true);

-- Booking items
drop policy if exists "Public can create booking_items" on public.booking_items;
create policy "Public can create booking_items" on public.booking_items for insert with check (true);

drop policy if exists "Public can read booking_items" on public.booking_items;
create policy "Public can read booking_items" on public.booking_items for select using (true);

-- Tab addons
drop policy if exists "Public can read tab_addons" on public.tab_addons;
create policy "Public can read tab_addons" on public.tab_addons for select using (true);

drop policy if exists "Public can insert tab_addons" on public.tab_addons;
create policy "Public can insert tab_addons" on public.tab_addons for insert with check (true);

-- Payments
drop policy if exists "Public can insert payments" on public.payments;
create policy "Public can insert payments" on public.payments for insert with check (true);

drop policy if exists "Public can read payments" on public.payments;
create policy "Public can read payments" on public.payments for select using (true);

drop policy if exists "Public can update payments" on public.payments;
create policy "Public can update payments" on public.payments for update using (true);

-- Staff users
drop policy if exists "Staff can read staff_users" on public.staff_users;
create policy "Staff can read staff_users" on public.staff_users for select using (true);

-- 16. SEED DATA
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
  deposit_hold_minutes
) values (
  'ميزون لوميير بيوتي سنتر وسبا',
  'Maison Lumière Beauty Center & Spa',
  'contact@maisonlumiere.beauty',
  '01012345678',
  '١٥ شارع البرازيل، الزمالك، القاهرة',
  'maisonlumiere@instapay',
  'Maison Lumière Spa',
  '01012345678',
  50.00,
  30
) on conflict do nothing;

-- Shifts
insert into public.shifts (name_ar, name_en, start_time, end_time) values
  ('وردية صباحية', 'Morning Shift', '10:00:00', '16:00:00'),
  ('وردية مسائية', 'Evening Shift', '16:00:00', '23:00:00')
on conflict do nothing;

-- Rooms & Stations
insert into public.rooms (name_ar, name_en, type, capacity) values
  ('جناح الحمام المغربي الملكي', 'Royal Moroccan Bath Suite', 'moroccan_bath', 1),
  ('كابينة المساج والاسترخاء (أ)', 'Massage Cabin A', 'massage_room', 1),
  ('كابينة المساج والاسترخاء (ب)', 'Massage Cabin B', 'massage_room', 1),
  ('كابينة تنظيف ونضارة البشرة (١)', 'Facial Cabin 1', 'facial_cabin', 1),
  ('كابينة تنظيف ونضارة البشرة (٢)', 'Facial Cabin 2', 'facial_cabin', 1),
  ('محطة تصفيف وترميم الشعر (١)', 'Hair Station 1', 'hair_station', 1),
  ('محطة تصفيف وترميم الشعر (٢)', 'Hair Station 2', 'hair_station', 1),
  ('استوديو الميك آب والعرائس', 'Bridal & Makeup Suite', 'general', 2),
  ('محطة العناية بالأظافر والباديكير', 'Nail Bar Station', 'nails_station', 2)
on conflict do nothing;

-- Specialists
insert into public.specialists (name_ar, name_en, title_ar, title_en, specialties) values
  ('نورهان فهمي', 'Nourhan Fahmy', 'خبيرة العناية بالبشرة والهيدرا فيشل', 'Senior Skincare Specialist', array['skincare', 'bridal']),
  ('سارة المنشاوي', 'Sara El-Menshawy', 'أخصائية مساج علاجي واسترخاء', 'Therapeutic Massage Specialist', array['massage', 'moroccan_bath']),
  ('أمينة رشيد', 'Amina Rachid', 'خبيرة الحمام المغربي والملكي', 'Moroccan Bath Master', array['moroccan_bath', 'skincare']),
  ('ياسمين شريف', 'Yasmine Sherif', 'ميك آب أرتيست ومصممة لوكات', 'Senior Makeup Artist', array['bridal', 'skincare']),
  ('هبة كمال', 'Heba Kamal', 'أخصائية معالجات وترميم الشعر', 'Hair Revival & Styling Master', array['hair', 'bridal']),
  ('مريم طارق', 'Mariam Tarek', 'أخصائية حواجب ورموش وأظافر', 'Lash & Brow Specialist', array['nails', 'skincare'])
on conflict do nothing;

-- Services
insert into public.services (name_ar, name_en, category, description_ar, description_en, duration_minutes, price, room_type_required) values
  ('جلسة هيدرا فيشل ونضارة عميقة', 'Signature Hydrafacial Ritual', 'skincare', 'تنضيف عميق للمسام، تقشير لطيف بأحماض الفواكه، مساج ليمفاوي وسيروم هيالورونيك مركز لنضارة وإشراقة فورية.', 'Deep pore cleanse, gentle fruit acid peel, lymphatic drainage, and hyaluronic acid infusion for glowing skin.', 60, 1500.00, 'facial_cabin'),
  ('جلسة مساج استرخائي بالزيوت العطرية', 'Aromatherapy Relaxation Massage', 'massage', 'مساج كامل للجسم لمدة ساعة لفك التشنجات العضلية وتهدئة الأعصاب باستخدام أرقى الزيوت العطرية الطبيعية.', 'Full body massage to relieve muscle tension and soothe senses using organic aromatic oils.', 60, 1200.00, 'massage_room'),
  ('الحمام المغربي الملكي بالصابون الأسود والأعشاب', 'Royal Moroccan Bath Ritual', 'moroccan_bath', 'طقس مغربي أصيل: بخار، تلييف بالصابون البلدي المغربي، ماسك الطمي الطبيعي مع الورد، وتفتيح وتنعيم للجسم.', 'Traditional steam, authentic black soap exfoliation, rose clay mask, and total body softening.', 90, 2200.00, 'moroccan_bath'),
  ('ميك آب سواريه ولوك ناعم', 'Soft Glam Evening Makeup', 'bridal', 'ميك آب هادي ومميز يبرز جمال ملامحك مع تحضير كامل للبشرة وتركيب رموش حبة حبة للمناسبات.', 'Skin-first, radiant makeup tailored to your features with luxury skin prep and individual lashes.', 75, 1800.00, 'general'),
  ('جلسة ترميم واستشوار ومعالجة شعر', 'Caviar Hair Revival & Signature Blowout', 'hair', 'ديتوكس لفروة الرأس وماسك الكافيار لترميم الروابط التالفة، مع استشوار وفوليوم جذاب يدوم أيام.', 'Deep scalp detoxification, caviar mask therapy, and a voluminous bouncy blowout.', 60, 1100.00, 'hair_station'),
  ('رسم وتنظيف وتحديد حواجب وصبغة طبيعية', 'Atelier Brow Mapping & Tint', 'nails', 'رسم هندسي متقن وتحديد دقيق لشكل الحواجب مع صبغة مخصصة وماسك كيراتين مغذي.', 'Architectural brow mapping, custom tinting, precision shaping, and a nourishing keratin balm.', 45, 600.00, 'nails_station'),
  ('رفع وتغذية رموش لاش ليفت (Lash Lift)', 'Lash Lift & Keratin Glaze', 'nails', 'ثني ورفع الرموش الطبيعية بلون أسود عميق مع سيروم ببتيدات طبيعي يدوم حتى ٨ أسابيع.', 'Natural lash lift curl and deep obsidian tinting with organic peptide glaze lasting up to 8 weeks.', 60, 900.00, 'facial_cabin')
on conflict do nothing;

-- Packages
insert into public.packages (name_ar, name_en, description_ar, description_en, price, duration_minutes) values
  ('باقة العروسة الملكية الشاملة (Royal Bridal Package)', 'Royal Bridal Signature Package', 'الباقة المتكاملة لليلة العمر: حمام مغربي ملكي + هيدرا فيشل نضارة + ترميم واستشوار الشعر + ميك آب عروسة متكامل.', 'Complete bridal journey: Royal Moroccan bath, Hydrafacial, hair therapy, and luxury bridal makeup.', 6500.00, 240),
  ('باقة الروقان والاسترخاء التام (Total Spa Day)', 'Total Glow & Relaxation Spa Day', 'يوم دلع كامل: حمام مغربي بالأعشاب + مساج استرخائي ٦٠ دقيقة + تنظيف ونضارة بشرة.', 'Full Moroccan bath, 60-min aromatic massage, and restorative facial treatment.', 4200.00, 180)
on conflict do nothing;

-- Retail Products (In-branch shop)
insert into public.products (name_ar, name_en, category, price, stock_quantity, sku) values
  ('سيروم الهيالورونيك اسيد المكثف (30ml)', 'Intensive Hyaluronic Serum', 'skincare', 650.00, 25, 'SKIN-HYA-01'),
  ('ماسك الكافيار لترميم الشعر (250g)', 'Caviar Hair Repair Mask', 'hair', 850.00, 18, 'HAIR-CAV-02'),
  ('صابون بلدي مغربي أصلي بزيت الزيتون (300g)', 'Authentic Moroccan Black Soap', 'moroccan_bath', 350.00, 40, 'SPA-SOAP-03'),
  ('زيت الأرجان النقي المعصور على البارد (100ml)', 'Cold-Pressed Pure Argan Oil', 'skincare', 750.00, 20, 'OIL-ARG-04'),
  ('سيروم تكثيف وتطويل الرموش والحواجب (10ml)', 'Peptide Lash & Brow Growth Elixir', 'nails', 450.00, 30, 'LASH-ELX-05')
on conflict do nothing;

-- Promo Codes
insert into public.promo_codes (code, discount_type, discount_value, min_spend, max_uses, expires_at) values
  ('WELCOME10', 'percent', 10.00, 1000.00, 200, now() + interval '90 days'),
  ('MAISON200', 'fixed', 200.00, 2000.00, 100, now() + interval '60 days')
on conflict (code) do nothing;
