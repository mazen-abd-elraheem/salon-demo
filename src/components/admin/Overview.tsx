import { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Scissors,
  TrendingUp,
} from 'lucide-react';
import PageHeader from './PageHeader';
import { supabase } from '../../lib/supabase';
import { defaultServices } from '../../lib/mockData';
import type { Appointment, Service } from '../../lib/types';
import { toDateString } from '../../lib/time';
import { formatDuration, formatPrice } from '../../lib/format';
import { format } from 'date-fns';
import { useLanguage } from '../../context/LanguageContext';

interface OverviewProps {
  brand?: string | null;
}

export default function Overview({ brand }: OverviewProps) {
  const { lang } = useLanguage();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [apptRes, svcRes] = await Promise.all([
          supabase
            .from('appointments')
            .select('*')
            .order('appointment_date', { ascending: false })
            .order('start_time', { ascending: false })
            .limit(200),
          supabase.from('services').select('*'),
        ]);
        if (cancelled) return;

        const loadedAppts = (apptRes?.data as Appointment[]) ?? [];
        const loadedServices = (svcRes?.data as Service[]) ?? [];

        let finalAppts = loadedAppts;
        if (finalAppts.length === 0) {
          try {
            const raw = localStorage.getItem('maison_local_appointments') || '[]';
            finalAppts = JSON.parse(raw);
          } catch {
            // ignore
          }
        }

        setAppts(finalAppts);
        setServices(loadedServices.length > 0 ? loadedServices : defaultServices);
      } catch {
        if (!cancelled) {
          try {
            const raw = localStorage.getItem('maison_local_appointments') || '[]';
            setAppts(JSON.parse(raw));
          } catch {
            setAppts([]);
          }
          setServices(defaultServices);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = toDateString(new Date());
  const upcoming = appts.filter(
    (a) =>
      (a.appointment_date >= today && a.status !== 'cancelled' && a.status !== 'completed'),
  );
  const pending = appts.filter((a) => a.status === 'pending');
  const completed = appts.filter((a) => a.status === 'completed');
  const activeServices = services.filter((s) => s.is_active).length;

  const nextFew = [...upcoming]
    .sort((a, b) =>
      a.appointment_date === b.appointment_date
        ? a.start_time.localeCompare(b.start_time)
        : a.appointment_date.localeCompare(b.appointment_date),
    )
    .slice(0, 6);

  const recent = [...appts].slice(0, 6);

  const serviceById = new Map(services.map((s) => [s.id, s]));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={lang === 'ar' ? 'نظرة عامة' : 'Overview'}
        title={
          lang === 'ar'
            ? `أهلاً بكِ مجدداً${brand ? ` في ${brand}` : ''}.`
            : `Welcome back${brand ? ` — ${brand}` : ''}.`
        }
        subtitle={
          lang === 'ar'
            ? 'ملخص سريع وشامل لمواعيد اليوم، الجلسات، وحالة الحجوزات القادمة.'
            : "A quiet read on bookings, services and what's coming up next."
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={lang === 'ar' ? 'الحجوزات القادمة' : 'Upcoming'}
          value={upcoming.length}
          icon={<CalendarClock className="h-4 w-4" />}
          hint={
            lang === 'ar'
              ? 'الحجوزات المؤكدة للمواعيد القادمة'
              : 'Confirmed & pending future appointments'
          }
        />
        <MetricCard
          label={lang === 'ar' ? 'بانتظار المراجعة' : 'Pending review'}
          value={pending.length}
          icon={<CalendarCheck className="h-4 w-4" />}
          hint={
            lang === 'ar'
              ? 'طلبات وعربين بانتظار الاعتماد'
              : 'Requests awaiting your confirmation'
          }
          tone="warm"
        />
        <MetricCard
          label={lang === 'ar' ? 'مكتملة ومقفلة' : 'Completed'}
          value={completed.length}
          icon={<CheckCircle2 className="h-4 w-4" />}
          hint={lang === 'ar' ? 'إجمالي الجلسات المكتملة' : 'Sessions completed to date'}
        />
        <MetricCard
          label={lang === 'ar' ? 'الخدمات المفعلة' : 'Active services'}
          value={activeServices}
          icon={<Scissors className="h-4 w-4" />}
          hint={
            lang === 'ar'
              ? `${services.length} خدمة إجمالية · ${activeServices} مفعلة`
              : `${services.length} total · ${activeServices} live`
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="card-soft p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider-2 text-mocha-500">
                {lang === 'ar' ? 'جدول المواعيد القادمة' : 'Next on the books'}
              </div>
              <h2 className="font-display text-2xl text-espresso">
                {lang === 'ar' ? 'الحجوزات القادمة' : 'Upcoming appointments'}
              </h2>
            </div>
            <TrendingUp className="h-4 w-4 text-rosegold-400" />
          </div>

          <div className="mt-6">
            {loading && <SkeletonRows />}
            {!loading && nextFew.length === 0 && (
              <EmptyState
                text={lang === 'ar' ? 'لا توجد حجوزات قادمة حالياً.' : 'No upcoming appointments yet.'}
              />
            )}
            {!loading && nextFew.length > 0 && (
              <ul className="divide-y divide-pearl/70">
                {nextFew.map((a) => {
                  const svcId = a.service_id || a.items?.[0]?.service_id;
                  const svc = svcId ? serviceById.get(svcId) : null;
                  const clientName = a.customer_name || a.full_name || 'عميلة الصالون';
                  return (
                    <li
                      key={a.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-espresso">
                          {clientName}
                        </div>
                        <div className="text-xs text-mocha-500">
                          {svc?.name_ar || svc?.name || 'جلسة صالون'} ·{' '}
                          {svc ? formatDuration(svc.duration_minutes, lang) : '—'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right leading-tight">
                          <div className="font-medium text-espresso">
                            {prettyDate(a.appointment_date)}
                          </div>
                          <div className="text-xs text-mocha-500">
                            {prettyTime(a.start_time)} – {prettyTime(a.end_time)}
                          </div>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="card-soft p-6 lg:col-span-2">
          <div className="text-[11px] uppercase tracking-wider-2 text-mocha-500">
            {lang === 'ar' ? 'آخر العمليات' : 'Recent activity'}
          </div>
          <h2 className="font-display text-2xl text-espresso">
            {lang === 'ar' ? 'أحدث الطلبات' : 'Latest requests'}
          </h2>

          <div className="mt-6">
            {loading && <SkeletonRows />}
            {!loading && recent.length === 0 && (
              <EmptyState text={lang === 'ar' ? 'لا توجد حجوزات حتى الآن.' : 'No bookings yet.'} />
            )}
            {!loading && recent.length > 0 && (
              <ul className="space-y-3">
                {recent.map((a) => {
                  const svcId = a.service_id || a.items?.[0]?.service_id;
                  const svc = svcId ? serviceById.get(svcId) : null;
                  const clientName = a.customer_name || a.full_name || 'عميلة الصالون';
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-2xl border border-pearl/70 bg-white/70 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-espresso">
                          {clientName}
                        </div>
                        <div className="truncate text-xs text-mocha-500">
                          {svc?.name_ar || svc?.name || 'خدمة صالون'} · {prettyDate(a.appointment_date)}
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-xs text-mocha-500">
                          {svc ? formatPrice(svc.price) : ''}
                        </div>
                        <StatusBadge status={a.status} small />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  hint,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  hint?: string;
  tone?: 'warm';
}) {
  return (
    <div className="card-soft relative overflow-hidden p-6">
      <div
        aria-hidden
        className={[
          'absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl',
          tone === 'warm'
            ? 'bg-rosegold-200/50'
            : 'bg-champagne-100/60',
        ].join(' ')}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider-2 text-mocha-500">
          {label}
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ivory text-rosegold-500 shadow-softer">
          {icon}
        </span>
      </div>
      <div className="relative mt-4 font-display text-4xl text-espresso">
        {value}
      </div>
      {hint && (
        <div className="relative mt-1 text-xs text-mocha-500">{hint}</div>
      )}
    </div>
  );
}

export function StatusBadge({
  status,
  small,
}: {
  status: Appointment['status'];
  small?: boolean;
}) {
  const { lang } = useLanguage();
  const styles: Record<string, string> = {
    pending: 'bg-champagne-100 text-mocha-700',
    pending_deposit: 'bg-rose-100 text-rose-700',
    pending_verification: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-rosegold-100 text-rosegold-600',
    checked_in: 'bg-emerald-100 text-emerald-700',
    checkout_pending: 'bg-amber-100 text-amber-800',
    cancelled: 'bg-blush-100 text-blush-600',
    completed: 'bg-mocha-700/10 text-mocha-700',
    no_show: 'bg-gray-100 text-gray-600',
  };

  const labelsAr: Record<string, string> = {
    pending: 'بانتظار التأكيد',
    pending_deposit: 'بانتظار العربون',
    pending_verification: 'مراجعة العربون',
    confirmed: 'مؤكد',
    checked_in: 'متواجدة بالفرع',
    checkout_pending: 'بانتظار السداد',
    cancelled: 'ملغي',
    completed: 'مكتمل',
    no_show: 'لم تحضر',
  };

  const label = lang === 'ar' ? labelsAr[status] || status : status;

  return (
    <span
      className={['badge', styles[status] || 'bg-gray-100 text-gray-700', small && 'px-2 py-0.5']
        .filter(Boolean)
        .join(' ')}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-2xl border border-pearl/70 bg-white/60 px-4 py-3"
        >
          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-pearl" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-pearl/70" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-pearl/60" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-mocha-400/30 px-4 py-10 text-center text-sm text-mocha-500">
      {text}
    </p>
  );
}

export function prettyDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map((p) => parseInt(p, 10));
  const date = new Date(y, m - 1, d);
  return format(date, 'EEE, MMM d');
}

export function prettyTime(hms: string): string {
  const [h, m] = hms.split(':').map((p) => parseInt(p, 10));
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return format(date, 'h:mm a');
}
