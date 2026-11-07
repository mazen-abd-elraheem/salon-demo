import { supabase } from './supabase';
import type {
  Appointment,
  BlockedDate,
  BusinessHour,
  BusinessSettings,
  Service,
  TimeSlot,
} from './types';
import {
  combineDateAndTime,
  isSameDay,
  toClockLabel,
  toDateString,
} from './time';

/**
 * Generate the bookable time slots for a given date + service, using:
 * - business_hours (the weekday's open/closed and start/end times)
 * - business_settings.slot_interval_minutes (gap between slot starts)
 * - business_settings.booking_notice_hours (cannot book sooner than this)
 * - blocked_dates (entire day is off)
 * - existing appointments (overlap rule)
 * - services.duration_minutes (so end_time is computed correctly)
 */
export async function getAvailableSlots(params: {
  date: Date;
  service: Service;
  businessHours: BusinessHour[];
  blockedDates: BlockedDate[];
  settings: BusinessSettings | null;
  lang?: 'en' | 'ar';
}): Promise<TimeSlot[]> {
  const { date, service, businessHours, blockedDates, settings, lang = 'en' } = params;

  // 1. Day blocked? Return early.
  const ymd = toDateString(date);
  if (blockedDates.some((bd) => bd.blocked_date === ymd)) {
    return [];
  }

  // 2. Find the business hour entry for the weekday.
  const weekday = date.getDay();
  const hour = businessHours.find((bh) => bh.weekday === weekday);
  if (!hour || !hour.is_open) {
    return [];
  }

  // 3. Build the working window for this date.
  const dayStart = combineDateAndTime(date, hour.start_time);
  const dayEnd = combineDateAndTime(date, hour.end_time);
  if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) {
    return [];
  }

  // 4. Build candidate slots stepping by the slot interval.
  const stepMinutes = settings?.slot_interval_minutes ?? 30;
  const noticeMs = (settings?.booking_notice_hours ?? 2) * 60 * 60 * 1000;
  const earliest = new Date(Date.now() + noticeMs);

  const candidates: TimeSlot[] = [];
  let cursor = new Date(dayStart);
  while (cursor.getTime() + service.duration_minutes * 60 * 1000 <= dayEnd.getTime()) {
    const start = new Date(cursor);
    const end = new Date(cursor.getTime() + service.duration_minutes * 60 * 1000);

    // Filter out slots earlier than the booking notice cut-off.
    if (start.getTime() >= earliest.getTime()) {
      candidates.push({ start, end, label: toClockLabel(start, lang) });
    }

    cursor = new Date(cursor.getTime() + stepMinutes * 60 * 1000);
  }

  if (candidates.length === 0) return [];

  // 5. Fetch existing appointments for that day to subtract overlapping ones.
  const { data: existing, error } = await supabase
    .from('appointments')
    .select('start_time, end_time, status, appointment_date')
    .eq('appointment_date', ymd)
    .neq('status', 'cancelled');

  if (error) {
    // If we cannot read appointments due to RLS, fall back to showing candidates.
    // Booking will still respect server-side constraints.
    return candidates;
  }

  const taken: { start: Date; end: Date }[] = (existing ?? []).map((row: any) => ({
    start: combineDateAndTime(date, row.start_time),
    end: combineDateAndTime(date, row.end_time),
  }));

  return candidates.filter((slot) => {
    return !taken.some(
      (t) => isSameDay(t.start, slot.start) && slot.start < t.end && slot.end > t.start,
    );
  });
}

/**
 * Pure overlap check helper exported for tests / admin previews.
 * Returns true if the new range overlaps the existing one.
 */
export function rangesOverlap(
  newStart: Date,
  newEnd: Date,
  existingStart: Date,
  existingEnd: Date,
): boolean {
  return newStart < existingEnd && newEnd > existingStart;
}

/**
 * Helper to compute upcoming working days for the booking calendar.
 * Skips days where the salon is closed or fully blocked.
 */
export function getCalendarDays(params: {
  from: Date;
  count: number;
  businessHours: BusinessHour[];
  blockedDates: BlockedDate[];
}): { date: Date; available: boolean; reason?: string }[] {
  const { from, count, businessHours, blockedDates } = params;
  const out: { date: Date; available: boolean; reason?: string }[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);

    const ymd = toDateString(d);
    const blocked = blockedDates.find((b) => b.blocked_date === ymd);
    if (blocked) {
      out.push({ date: d, available: false, reason: blocked.reason ?? 'Closed' });
      continue;
    }
    const hour = businessHours.find((bh) => bh.weekday === d.getDay());
    if (!hour || !hour.is_open) {
      out.push({ date: d, available: false, reason: 'Closed' });
      continue;
    }
    out.push({ date: d, available: true });
  }
  return out;
}

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WEEKDAYS_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const WEEKDAY_SHORT_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
