import { format } from 'date-fns';

/**
 * Combine a calendar date and an "HH:mm" or "HH:mm:ss" string into a real Date
 * in the user's local time zone. Avoids passing ad-hoc strings into format().
 */
export function combineDateAndTime(date: Date, time: string): Date {
  const [hh, mm, ss] = time.split(':').map((p) => parseInt(p, 10));
  const next = new Date(date);
  next.setHours(hh || 0, mm || 0, ss || 0, 0);
  return next;
}

/** Format a Date to "YYYY-MM-DD" for Supabase date columns. */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Format a Date to "HH:mm:ss" for Supabase time columns. */
export function toTimeString(date: Date): string {
  return format(date, 'HH:mm:ss');
}

/** Pretty label like "10:30 AM" or "10:30 صباحاً" used in slot pills. */
export function toClockLabel(date: Date, lang: 'en' | 'ar' = 'en'): string {
  if (lang === 'ar') {
    const timeStr = format(date, 'h:mm');
    const period = date.getHours() >= 12 ? 'مساءً' : 'صباحاً';
    return `${timeStr} ${period}`;
  }
  return format(date, 'h:mm a');
}

export function toLongDateLabel(date: Date, lang: 'en' | 'ar' = 'en'): string {
  if (lang === 'ar') {
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
  return format(date, "EEEE, MMMM d, yyyy");
}

export function toMonthLabel(date: Date, lang: 'en' | 'ar' = 'en'): string {
  if (lang === 'ar') {
    return new Intl.DateTimeFormat('ar-EG', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
  return format(date, 'MMMM yyyy');
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
