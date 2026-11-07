import type {
  Booking,
  BusinessHour,
  BusinessSettings,
  Package,
  PromoCode,
  Room,
  Service,
  Specialist,
  TimeSlot,
} from './types';
import { combineDateAndTime, toClockLabel, toDateString } from './time';
import { supabase } from './supabase';
import { getLocalBookings } from './mockData';

/**
 * Normalizes Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) to standard Western digits (0123456789)
 */
export function normalizeArabicDigits(input: string): string {
  if (!input) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return input.replace(/[٠-٩]/g, (w) => `${arabicNumerals.indexOf(w)}`);
}

/**
 * Validates 11-digit Egyptian mobile numbers (010, 011, 012, 015)
 */
export function validateEgyptianPhone(phone: string): { isValid: boolean; normalized: string; error?: string } {
  const digits = normalizeArabicDigits(phone).replace(/\D/g, '');
  if (digits.length !== 11) {
    return {
      isValid: false,
      normalized: digits,
      error: 'رقم الموبايل يجب أن يتكون من ١١ رقم',
    };
  }
  if (!/^(010|011|012|015)/.test(digits)) {
    return {
      isValid: false,
      normalized: digits,
      error: 'رقم الموبايل يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015',
    };
  }
  return { isValid: true, normalized: digits };
}

/**
 * Calculates cart totals, discounts, and the mandatory 50% deposit
 */
export function calculateCartSummary(params: {
  services: Service[];
  packages: Package[];
  promoCode?: PromoCode | null;
  depositPercentage?: number;
}): {
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  depositRequired: number;
  totalDurationMinutes: number;
} {
  const { services, packages, promoCode, depositPercentage = 50 } = params;

  const servicesTotal = services.reduce((sum, s) => sum + Number(s.price), 0);
  const packagesTotal = packages.reduce((sum, p) => sum + Number(p.price), 0);
  const subtotal = servicesTotal + packagesTotal;

  const servicesDuration = services.reduce((sum, s) => sum + Number(s.duration_minutes), 0);
  const packagesDuration = packages.reduce((sum, p) => sum + Number(p.duration_minutes), 0);
  const totalDurationMinutes = servicesDuration + packagesDuration;

  let discountAmount = 0;
  if (promoCode && promoCode.is_active) {
    const minSpend = promoCode.min_spend || 0;
    if (subtotal >= minSpend) {
      if (promoCode.discount_type === 'percent') {
        discountAmount = Math.round((subtotal * promoCode.discount_value) / 100);
      } else {
        discountAmount = Math.min(subtotal, promoCode.discount_value);
      }
    }
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const depositRequired = Math.round((totalAmount * depositPercentage) / 100);

  return {
    subtotal,
    discountAmount,
    totalAmount,
    depositRequired,
    totalDurationMinutes,
  };
}

/**
 * Computes available time slots checking both Specialist and Room constraints
 */
export async function getDualConstraintAvailableSlots(params: {
  date: Date;
  totalDurationMinutes: number;
  services: Service[];
  packages: Package[];
  businessHours: BusinessHour[];
  rooms: Room[];
  specialists: Specialist[];
  settings: BusinessSettings | null;
  preferredSpecialistId?: string | null;
  lang?: 'en' | 'ar';
}): Promise<TimeSlot[]> {
  const {
    date,
    totalDurationMinutes,
    businessHours,
    rooms,
    specialists,
    settings,
    lang = 'ar',
  } = params;

  if (totalDurationMinutes <= 0) return [];

  // 1. Day of week & Working hours check
  const weekday = date.getDay();
  const hour = businessHours.find((bh) => bh.weekday === weekday);
  if (!hour || !hour.is_open) return [];

  const dayStart = combineDateAndTime(date, hour.start_time);
  const dayEnd = combineDateAndTime(date, hour.end_time);
  if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) return [];

  // 2. Fetch existing bookings for the selected date
  const ymd = toDateString(date);
  let existingBookings: Booking[] = [];

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, start_time, end_time, status, hold_expires_at, booking_items(*)')
      .eq('appointment_date', ymd)
      .neq('status', 'cancelled');

    if (!error && data) {
      existingBookings = data as any[];
    } else {
      existingBookings = getLocalBookings().filter(
        (b) => b.appointment_date === ymd && b.status !== 'cancelled',
      );
    }
  } catch {
    existingBookings = getLocalBookings().filter(
      (b) => b.appointment_date === ymd && b.status !== 'cancelled',
    );
  }

  // Filter out expired 30-minute holds
  const now = new Date();
  existingBookings = existingBookings.filter((b) => {
    if (b.status === 'pending_deposit' && b.hold_expires_at) {
      return new Date(b.hold_expires_at).getTime() > now.getTime();
    }
    return true;
  });

  // 3. Build candidate slots
  const stepMinutes = settings?.slot_interval_minutes || 30;
  const noticeMs = (settings?.booking_notice_hours || 2) * 60 * 60 * 1000;
  const earliestAllowed = new Date(Date.now() + noticeMs);

  const candidates: TimeSlot[] = [];
  let cursor = new Date(dayStart);

  while (cursor.getTime() + totalDurationMinutes * 60 * 1000 <= dayEnd.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + totalDurationMinutes * 60 * 1000);

    // Skip if earlier than minimum notice
    if (slotStart.getTime() >= earliestAllowed.getTime()) {
      // Check dual constraints: room and specialist availability
      // Simple verification: ensure that active specialists and active rooms are not all booked during [slotStart, slotEnd]
      const overlappingBookings = existingBookings.filter((b) => {
        const bStart = combineDateAndTime(date, b.start_time);
        const bEnd = combineDateAndTime(date, b.end_time);
        return slotStart < bEnd && slotEnd > bStart;
      });

      const maxCapacity = Math.min(rooms.length || 4, specialists.length || 4);
      if (overlappingBookings.length < maxCapacity) {
        candidates.push({
          start: slotStart,
          end: slotEnd,
          label: toClockLabel(slotStart, lang),
        });
      }
    }

    cursor = new Date(cursor.getTime() + stepMinutes * 60 * 1000);
  }

  return candidates;
}
