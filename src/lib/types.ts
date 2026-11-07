export type AppointmentStatus =
  | 'pending_deposit'
  | 'pending_verification'
  | 'confirmed'
  | 'checked_in'
  | 'checkout_pending'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  // Backward compatibility alias:
  | 'pending';

export type ServiceCategory =
  | 'hair'
  | 'skincare'
  | 'massage'
  | 'moroccan_bath'
  | 'nails'
  | 'bridal';

export type RoomType =
  | 'hair_station'
  | 'massage_room'
  | 'moroccan_bath'
  | 'facial_cabin'
  | 'nails_station'
  | 'general';

export interface Room {
  id: string;
  name_ar: string;
  name_en: string;
  type: RoomType;
  capacity: number;
  is_active: boolean;
  created_at?: string;
}

export interface Specialist {
  id: string;
  name_ar: string;
  name_en: string;
  title_ar: string;
  title_en: string;
  specialties: ServiceCategory[];
  is_active: boolean;
  working_hours?: { start: string; end: string };
  created_at?: string;
}

export interface Service {
  id: string;
  name?: string; // fallback alias
  name_ar: string;
  name_en: string;
  category: ServiceCategory;
  description?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  duration_minutes: number;
  price: number;
  room_type_required: RoomType | string;
  is_active: boolean;
  created_at?: string;
}

export interface Package {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  services?: Service[];
  created_at?: string;
}

export interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  category: string;
  price: number;
  stock_quantity: number;
  sku?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'fixed' | 'percent';
  discount_value: number;
  min_spend?: number;
  max_uses?: number;
  times_used: number;
  expires_at?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Shift {
  id: string;
  name_ar: string;
  name_en: string;
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  is_active: boolean;
}

export interface Booking {
  id: string;
  booking_number: string;
  secret_token: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  subtotal_amount: number;
  discount_amount: number;
  promo_code_id?: string | null;
  promo_code?: string | null;
  total_amount: number;
  deposit_required: number;
  deposit_paid: number;
  status: AppointmentStatus;
  notes?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  refund_amount?: number;
  hold_expires_at?: string | null;
  created_at?: string;
  items?: BookingItem[];
  addons?: TabAddon[];
  payments?: Payment[];
}

// Backward compatibility alias for existing components
export type Appointment = Booking & {
  full_name?: string;
  email?: string;
  phone?: string;
  service_id?: string;
};

export interface BookingItem {
  id: string;
  booking_id: string;
  service_id?: string | null;
  package_id?: string | null;
  specialist_id?: string | null;
  specialist?: Specialist | null;
  room_id?: string | null;
  room?: Room | null;
  scheduled_start: string; // HH:mm:ss
  scheduled_end: string; // HH:mm:ss
  price: number;
  service?: Service | null;
  package?: Package | null;
  created_at?: string;
}

export interface TabAddon {
  id: string;
  booking_id: string;
  type: 'service' | 'product';
  item_id: string;
  name_ar: string;
  name_en?: string | null;
  quantity: number;
  price: number;
  added_by_staff_id?: string | null;
  created_at?: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  payment_type: 'deposit' | 'settlement' | 'refund';
  method: 'instapay' | 'vodafone_cash' | 'cash';
  amount: number;
  cash_tendered?: number | null;
  reference_number?: string | null;
  proof_image_url?: string | null;
  status: 'pending' | 'verified' | 'rejected';
  verified_by_staff_name?: string | null;
  verified_by_staff_id?: string | null;
  verified_at?: string | null;
  shift_name?: string | null;
  shift_id?: string | null;
  created_at: string;
}

export type StaffRole = 'admin' | 'manager' | 'receptionist' | 'specialist';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  phone?: string | null;
  pin?: string;
  is_active: boolean;
  specialist_id?: string | null;
  created_at?: string;
  last_login_at?: string | null;
}

export type ShiftType = 'morning' | 'evening' | 'full_day';
export type AttendanceStatus = 'present' | 'late' | 'completed' | 'absent';

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  role: StaffRole;
  date: string; // YYYY-MM-DD
  clock_in: string; // ISO string
  clock_out?: string | null; // ISO string
  shift: ShiftType;
  status: AttendanceStatus;
  total_hours?: number;
  notes?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  created_at?: string;
}

export interface BusinessHour {
  id: string;
  weekday: number; // 0 = Sunday, 6 = Saturday
  is_open: boolean;
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
}

export interface BlockedDate {
  id: string;
  blocked_date: string; // YYYY-MM-DD
  reason: string | null;
  created_at?: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string | null;
  business_name_en?: string | null;
  logo_url?: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  instapay_ipa?: string | null;
  instapay_name?: string | null;
  vodafone_cash_number?: string | null;
  deposit_percentage: number;
  deposit_hold_minutes: number;
  slot_interval_minutes: number;
  booking_notice_hours: number;
  cancellation_notice_hours?: number;
  created_at?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
  specialist_id?: string;
  room_id?: string;
}
