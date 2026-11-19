import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Scissors,
  Store,
  TrendingUp,
} from 'lucide-react';
import PageHeader from './PageHeader';
import { supabase } from '../../lib/supabase';
import { defaultServices, getLocalBookings, getLocalServices } from '../../lib/mockData';
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
  const [services, setServices] = useState<Service[]>(() => getLocalServices());
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

        let finalAppts = [...loadedAppts];
        try {
          const raw = localStorage.getItem('maison_local_appointments');
          if (raw) {
            const parsed: Appointment[] = JSON.parse(raw);
            for (const item of parsed) {
              if (!finalAppts.some((x) => x.id === item.id)) {
                finalAppts.push(item);
              }
            }
          }
        } catch {
          // ignore
        }

        // Also include v2 bookings from POS / online booking flow
        const v2Bookings = getLocalBookings();
        for (const b of v2Bookings) {
          if (!finalAppts.some((x) => x.id === b.id || x.booking_number === b.booking_number)) {
            finalAppts.push({
              ...b,
              service_id: b.items?.[0]?.service_id || 'svc-1',
            });
          }
        }

        setAppts(finalAppts);
        const localSvcs = getLocalServices();
        setServices(loadedServices.length > 0 ? loadedServices : localSvcs.length > 0 ? localSvcs : defaultServices);
      } catch {
        if (!cancelled) {
          const v2Bookings = getLocalBookings().map((b) => ({
            ...b,
            service_id: b.items?.[0]?.service_id || 'svc-1',
          }));
          setAppts(v2Bookings);
          setServices(getLocalServices());
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
      a.appointment_date >= today &&
      a.status !== 'cancelled' &&
      a.status !== 'completed',
  );
  const pending = appts.filter(
    (a) =>
      a.status === 'pending' ||
      a.status === 'pending_verification' ||
      a.status === 'checkout_pending',
  );
  const completed = appts.filter((a) => a.status === 'completed');
  const activeServices = services.filter((s) => s.is_active).length;

  const verifiedRevenue = getLocalBookings().reduce((acc, b) => {
    const paid = (b.payments || [])
      .filter((p) => p.status === 'verified')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return acc + paid;
  }, 0);

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
    <div className="space-y-8">
      <PageHeader
        eyebrow={lang === 'ar' ? 'نظرة عامة وتقارير فورية' : 'Executive Overview'}
        title={
          lang === 'ar'
            ? `أهلاً بكِ في لوحة إدارة جوزال ميديكال سبا`
            : `Welcome back — ${brand || 'Guzel Medical Spa'}`
        }
        subtitle={
          lang === 'ar'
            ? 'متابعة حية للحجوزات، الفواتير المفتوحة بالفرع، الإيرادات المعتمدة، وحالة الخدمات.'
            : 'Real-time command center for bookings, open POS tabs, verified revenue, and live services.'
        }
        actions={
          <>
            <Link
              to="/reception"
              className="btn-secondary !px-4 !py-2.5 !text-xs font-bold no-underline"
            >
              <Store className="h-3.5 w-3.5 text-[#73358c]" />
              <span>{lang === 'ar' ? 'شاشة الاستقبال والدفع الذكي' : 'Reception & Smart POS'}</span>
            </Link>
            <Link
              to="/admin/payment-gateways"
              className="btn-primary !px-4 !py-2.5 !text-xs font-bold no-underline"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'بوابات الدفع' : 'Payment Gateways'}</span>
            </Link>
          </>
        }
      />

      {/* Bento KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label={lang === 'ar' ? 'الحجوزات النشطة والقادمة' : 'Active & Upcoming'}
          value={String(upcoming.length)}
          icon={<CalendarClock className="h-4 w-4" />}
          hint={
            lang === 'ar'
              ? 'حجوزات اليوم والمواعيد القادمة'
              : 'Today & upcoming active slots'
          }
        />
        <MetricCard
          label={lang === 'ar' ? 'بانتظار الاعتماد' : 'Pending Review'}
          value={String(pending.length)}
          icon={<CalendarCheck className="h-4 w-4" />}
          hint={
            lang === 'ar'
              ? 'عربين أو فواتير بانتظار المراجعة'
              : 'Deposits & tabs awaiting verification'
          }
          tone="lilac"
        />
        <MetricCard
          label={lang === 'ar' ? 'جلسات مكتملة' : 'Completed'}
          value={String(completed.length)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          hint={lang === 'ar' ? 'إجمالي الفواتير المغلقة' : 'Closed & settled invoices'}
        />
        <MetricCard
          label={lang === 'ar' ? 'الخدمات المفعلة' : 'Live Services'}
          value={String(activeServices)}
          icon={<Scissors className="h-4 w-4" />}
          hint={
            lang === 'ar'
              ? `${services.length} خدمة إجمالية بالكتالوج`
              : `${services.length} total catalog rituals`
          }
        />
        <MetricCard
          label={lang === 'ar' ? 'الإيرادات المعتمدة' : 'Verified Revenue'}
          value={formatPrice(verifiedRevenue, lang)}
          icon={<DollarSign className="h-4 w-4" />}
          hint={lang === 'ar' ? 'عربين ومدفوعات مؤكدة' : 'Verified deposits & settlements'}
          tone="plum"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="card-soft p-6 lg:col-span-3">
          <div className="flex items-center justify-between pb-4 border-b border-[#e8d7e4]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#73358c]">
                {lang === 'ar' ? 'جدول المواعيد الحية' : 'Live Schedule'}
              </div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#3a1d43] mt-0.5">
                {lang === 'ar' ? 'الحجوزات النشطة والقادمة' : 'Active & Upcoming Appointments'}
              </h2>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#f3e6f0] text-[#73358c]">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4">
            {loading && <SkeletonRows />}
            {!loading && nextFew.length === 0 && (
              <EmptyState
                text={lang === 'ar' ? 'لا توجد حجوزات قادمة حالياً.' : 'No upcoming appointments yet.'}
              />
            )}
            {!loading && nextFew.length > 0 && (
              <ul className="divide-y divide-[#e8d7e4]/70">
                {nextFew.map((a) => {
                  const svcId = a.service_id || a.items?.[0]?.service_id;
                  const svc = svcId ? serviceById.get(svcId) : a.items?.[0]?.service || null;
                  const clientName = a.customer_name || a.full_name || 'عميلة جوزال ميديكال سبا';
                  return (
                    <li
                      key={a.id}
                      className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#3a1d43] flex items-center gap-2">
                          <span>{clientName}</span>
                          {a.booking_number && (
                            <span className="text-[11px] font-mono font-semibold text-[#73358c] bg-[#f3e6f0] px-2 py-0.5 rounded-full">
                              #{a.booking_number}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#3a1d43]/65 mt-0.5">
                          {lang === 'ar'
                            ? svc?.name_ar || svc?.name || 'جلسة عناية متكاملة'
                            : svc?.name_en || svc?.name || 'Signature Spa Ritual'}{' '}
                          · {svc ? formatDuration(svc.duration_minutes, lang) : '60m'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 text-sm">
                        <div className="text-end leading-tight font-mono">
                          <div className="font-bold text-xs text-[#3a1d43]">
                            {prettyDate(a.appointment_date)}
                          </div>
                          <div className="text-[11px] text-[#3a1d43]/60">
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
          <div className="pb-4 border-b border-[#e8d7e4]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#73358c]">
              {lang === 'ar' ? 'آخر العمليات' : 'Recent Activity'}
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#3a1d43] mt-0.5">
              {lang === 'ar' ? 'أحدث الطلبات والفواتير' : 'Latest Bookings & Tabs'}
            </h2>
          </div>

          <div className="mt-4">
            {loading && <SkeletonRows />}
            {!loading && recent.length === 0 && (
              <EmptyState text={lang === 'ar' ? 'لا توجد حجوزات حتى الآن.' : 'No bookings yet.'} />
            )}
            {!loading && recent.length > 0 && (
              <ul className="space-y-2.5">
                {recent.map((a) => {
                  const svcId = a.service_id || a.items?.[0]?.service_id;
                  const svc = svcId ? serviceById.get(svcId) : a.items?.[0]?.service || null;
                  const clientName = a.customer_name || a.full_name || 'عميلة جوزال ميديكال سبا';
                  const priceVal = a.total_amount || svc?.price || 0;
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/60 px-4 py-3 transition hover:bg-white"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs sm:text-sm font-bold text-[#3a1d43]">
                          {clientName}
                        </div>
                        <div className="truncate text-[11px] text-[#3a1d43]/60 mt-0.5">
                          {lang === 'ar'
                            ? svc?.name_ar || svc?.name || 'جلسة جوزال'
                            : svc?.name_en || svc?.name || 'Guzel Ritual'}{' '}
                          · <span className="font-mono">{prettyDate(a.appointment_date)}</span>
                        </div>
                      </div>
                      <div className="ms-3 text-end shrink-0">
                        {priceVal > 0 && (
                          <div className="text-xs font-mono font-bold text-[#3a1d43] mb-1">
                            {formatPrice(priceVal, lang)}
                          </div>
                        )}
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
  value: string;
  icon: React.ReactNode;
  hint?: string;
  tone?: 'lilac' | 'plum';
}) {
  const isPlum = tone === 'plum';
  return (
    <div
      className="relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl transition-all"
      style={{
        backgroundColor: isPlum ? '#3a1d43' : 'rgba(255, 255, 255, 0.88)',
        borderColor: isPlum ? '#3a1d43' : 'rgba(58, 29, 67, 0.09)',
        color: isPlum ? '#ffffff' : '#3a1d43',
        boxShadow: isPlum
          ? '0 18px 40px -14px rgba(58, 29, 67, 0.35)'
          : '0 12px 32px -14px rgba(58, 29, 67, 0.09)',
      }}
    >
      <div className="relative flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${isPlum ? 'text-[#cbb6ea]' : 'text-[#3a1d43]/65'
            }`}
        >
          {label}
        </span>
        <span
          className="grid h-8 w-8 place-items-center rounded-xl shrink-0"
          style={{
            backgroundColor: isPlum ? 'rgba(203, 182, 234, 0.2)' : '#f3e6f0',
            color: isPlum ? '#cbb6ea' : '#73358c',
          }}
        >
          {icon}
        </span>
      </div>
      <div className="relative mt-3 font-mono font-extrabold text-2xl sm:text-3xl tracking-tight">
        {value}
      </div>
      {hint && (
        <div
          className={`relative mt-1 text-[11px] ${isPlum ? 'text-white/70' : 'text-[#3a1d43]/55'
            }`}
        >
          {hint}
        </div>
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
    pending: 'bg-[#f3e6f0] text-[#73358c] border border-[#cbb6ea]',
    pending_deposit: 'bg-rose-50 text-rose-700 border border-rose-200',
    pending_verification: 'bg-[#f3e6f0] text-[#73358c] border border-[#cbb6ea]',
    confirmed: 'bg-[#cbb6ea]/45 text-[#3a1d43] border border-[#cbb6ea]',
    checked_in: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    checkout_pending: 'bg-[#f3e6f0] text-[#73358c] border border-[#b14bd9]/30',
    cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
    completed: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    no_show: 'bg-gray-100 text-gray-600 border border-gray-200',
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
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
        styles[status] || 'bg-gray-100 text-gray-700',
        small && '!px-2 !py-0.5 !text-[10px]',
      ]
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
          className="flex items-center justify-between rounded-2xl border border-[#e8d7e4] bg-white/60 px-4 py-3"
        >
          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-[#e8d7e4]" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-[#e8d7e4]/70" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-[#e8d7e4]/60" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-[#cbb6ea] px-4 py-10 text-center text-sm text-[#3a1d43]/60">
      {text}
    </p>
  );
}

export function prettyDate(ymd: string): string {
  try {
    const [y, m, d] = ymd.split('-').map((p) => parseInt(p, 10));
    const date = new Date(y, m - 1, d);
    return format(date, 'EEE, MMM d');
  } catch {
    return ymd;
  }
}

export function prettyTime(hms: string): string {
  try {
    const [h, m] = hms.split(':').map((p) => parseInt(p, 10));
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return format(date, 'h:mm a');
  } catch {
    return hms;
  }
}
