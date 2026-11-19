import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Filter,
  Loader2,
  Mail,
  Phone,
  Search,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import PageHeader from './PageHeader';
import { StatusBadge, prettyDate, prettyTime } from './Overview';
import { supabase } from '../../lib/supabase';
import {
  defaultServices,
  getLocalBookings,
  getLocalServices,
  updateLocalBookingStatus,
} from '../../lib/mockData';
import type { Appointment, AppointmentStatus, Service } from '../../lib/types';
import { formatDuration, formatPrice, initialsFromName } from '../../lib/format';
import { useLanguage } from '../../context/LanguageContext';

export default function Appointments() {
  const { lang } = useLanguage();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const statuses: { value: AppointmentStatus | 'all'; label: string }[] = [
    { value: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
    { value: 'pending_verification', label: lang === 'ar' ? 'مراجعة العربون' : 'Deposit Review' },
    { value: 'confirmed', label: lang === 'ar' ? 'مؤكد' : 'Confirmed' },
    { value: 'checked_in', label: lang === 'ar' ? 'متواجدة بالفرع' : 'Checked-In' },
    { value: 'checkout_pending', label: lang === 'ar' ? 'بانتظار السداد' : 'Checkout Pending' },
    { value: 'completed', label: lang === 'ar' ? 'مكتمل' : 'Completed' },
    { value: 'cancelled', label: lang === 'ar' ? 'ملغي' : 'Cancelled' },
  ];

  async function load() {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: false })
          .order('start_time', { ascending: false }),
        supabase.from('services').select('*'),
      ]);

      const loadedAppts = (a?.data as Appointment[]) ?? [];
      const loadedServices = (s?.data as Service[]) ?? [];

      const finalAppts = [...loadedAppts];
      try {
        const raw = localStorage.getItem('maison_local_appointments') || '[]';
        const localAppts: Appointment[] = JSON.parse(raw);
        for (const item of localAppts) {
          if (!finalAppts.some((x) => x.id === item.id)) {
            finalAppts.push(item);
          }
        }
      } catch {
        // ignore
      }

      for (const b of getLocalBookings()) {
        if (!finalAppts.some((x) => x.id === b.id || x.booking_number === b.booking_number)) {
          finalAppts.push({
            ...b,
            service_id: b.items?.[0]?.service_id || 'svc-1',
          });
        }
      }

      setAppts(finalAppts);
      const localSvcs = getLocalServices();
      // Merge Supabase services + local default services so every service_id resolves reliably
      const mergedServices: Service[] = [...loadedServices];
      for (const ls of [...localSvcs, ...defaultServices]) {
        if (!mergedServices.some((ms) => ms.id === ls.id)) {
          mergedServices.push(ls);
        }
      }
      setServices(mergedServices);
    } catch {
      const v2 = getLocalBookings().map((b) => ({
        ...b,
        service_id: b.items?.[0]?.service_id || 'svc-1',
      }));
      setAppts(v2);
      setServices([...getLocalServices(), ...defaultServices]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const serviceById = useMemo(
    () => new Map(services.map((s) => [s.id, s])),
    [services],
  );

  const resolveService = (a: Appointment): Service | null => {
    const svcId = a.service_id || a.items?.[0]?.service_id;
    return (
      (svcId ? serviceById.get(svcId) : null) ||
      a.items?.[0]?.service ||
      null
    );
  };

  const filtered = useMemo(() => {
    return appts.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const svc = resolveService(a);
        const svcName = `${svc?.name_ar || ''} ${svc?.name_en || ''} ${svc?.name || ''}`.toLowerCase();
        const name = (a.customer_name || a.full_name || '').toLowerCase();
        const email = (a.email || '').toLowerCase();
        const phone = (a.customer_phone || a.phone || '').toLowerCase();
        const bNum = (a.booking_number || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          bNum.includes(q) ||
          svcName.includes(q)
        );
      }
      return true;
    });
  }, [appts, filter, query, serviceById]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    setUpdatingId(id);
    try {
      await supabase.from('appointments').update({ status }).eq('id', id);
    } catch {
      // ignore
    }

    try {
      const raw = localStorage.getItem('maison_local_appointments') || '[]';
      const list = JSON.parse(raw);
      const updated = list.map((item: any) => (item.id === id ? { ...item, status } : item));
      localStorage.setItem('maison_local_appointments', JSON.stringify(updated));
    } catch {
      // ignore
    }

    updateLocalBookingStatus(id, status as any);
    setUpdatingId(null);
    setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: appts.length };
    for (const a of appts) map[a.status] = (map[a.status] || 0) + 1;
    return map;
  }, [appts]);

  const openAppt = openId ? appts.find((a) => a.id === openId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={lang === 'ar' ? 'الحجوزات والمواعيد' : 'Appointments'}
        title={lang === 'ar' ? 'إدارة حجوزات جوزال ميديكال سبا' : 'Manage Studio Appointments'}
        subtitle={
          lang === 'ar'
            ? 'تصفية وبحث وتحديث حالة كافة حجوزات العميلات ومتابعة تفاصيل الخدمات والمدفوعات لحظياً.'
            : 'Filter, search and update every client reservation with real-time POS synchronization.'
        }
        actions={
          <Link
            to="/reception"
            className="btn-primary !px-4 !py-2.5 !text-xs font-bold no-underline"
          >
            <Store className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'فتح شاشة الاستقبال والدفع' : 'Open Reception POS'}</span>
          </Link>
        }
      />

      {/* Filter Pills + Search Input */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {statuses.map((s) => {
            const active = filter === s.value;
            const count = counts[s.value] ?? 0;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setFilter(s.value)}
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: active ? '#3a1d43' : 'rgba(255, 255, 255, 0.85)',
                  borderColor: active ? '#3a1d43' : 'rgba(58, 29, 67, 0.12)',
                  color: active ? '#ffffff' : '#3a1d43',
                  boxShadow: active ? '0 8px 20px -6px rgba(58,29,67,0.3)' : 'none',
                }}
              >
                <Filter className="h-3 w-3 opacity-75" />
                <span>{s.label}</span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: active ? 'rgba(203,182,234,0.28)' : '#f3e6f0',
                    color: active ? '#ffffff' : '#73358c',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full xl:w-80">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3a1d43]/45" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'بحث بالاسم، الموبايل، رقم الحجز، أو الخدمة...'
                : 'Search client, phone, booking #, or service…'
            }
            className="w-full rounded-full border border-[#e8d7e4] bg-white/90 py-2.5 ps-10 pe-4 text-xs sm:text-sm text-[#3a1d43] outline-none transition focus:border-[#b14bd9] focus:ring-2 focus:ring-[#cbb6ea]/40"
          />
        </div>
      </div>

      {/* Main Glass Table Container */}
      <div
        className="rounded-3xl border overflow-hidden backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(58, 29, 67, 0.09)',
          boxShadow: '0 16px 44px -18px rgba(58, 29, 67, 0.1)',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-[#3a1d43]/65">
            <Loader2 className="h-4 w-4 animate-spin text-[#b14bd9]" />
            {lang === 'ar' ? 'جاري تحميل الحجوزات...' : 'Loading appointments…'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#f3e6f0] text-[#73358c]">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="font-display font-bold text-xl text-[#3a1d43]">
              {lang === 'ar' ? 'لا توجد حجوزات مطابقة' : 'No matching appointments'}
            </p>
            <p className="mt-1.5 text-xs text-[#3a1d43]/60">
              {lang === 'ar'
                ? 'جرّبي تغيير الفلتر أو البحث بكلمة أخرى.'
                : 'Try adjusting your status filter or search term.'}
            </p>
          </div>
        ) : (
          <div className="admin-scroll overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr
                  className="border-b text-[11px] font-bold uppercase tracking-wider text-[#3a1d43]/55"
                  style={{
                    backgroundColor: 'rgba(243, 230, 240, 0.65)',
                    borderColor: 'rgba(58, 29, 67, 0.08)',
                  }}
                >
                  <th className="px-5 py-4 text-start">{lang === 'ar' ? 'العميلة' : 'Client'}</th>
                  <th className="px-5 py-4 text-start">{lang === 'ar' ? 'الخدمة والتكلفة' : 'Service & Total'}</th>
                  <th className="px-5 py-4 text-start">{lang === 'ar' ? 'الموعد' : 'Schedule'}</th>
                  <th className="px-5 py-4 text-start">{lang === 'ar' ? 'التواصل والكود' : 'Contact & Code'}</th>
                  <th className="px-5 py-4 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="px-5 py-4 text-end">{lang === 'ar' ? 'تغيير الحالة' : 'Update Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8d7e4]/80">
                {filtered.map((a) => {
                  const svc = resolveService(a);
                  const clientName = a.customer_name || a.full_name || 'عميلة جوزال ميديكال سبا';
                  const phoneVal = a.customer_phone || a.phone || '';
                  const svcLabel =
                    lang === 'ar'
                      ? svc?.name_ar || svc?.name || 'جلسة جوزال ميديكال سبا'
                      : svc?.name_en || svc?.name || 'Guzel Signature Ritual';
                  const extraCount = Math.max(0, (a.items?.length || 1) - 1) + (a.addons?.length || 0);
                  const totalPrice = a.total_amount || svc?.price || 0;
                  const durationMins = svc?.duration_minutes || 60;

                  return (
                    <tr
                      key={a.id}
                      className="cursor-pointer transition-colors hover:bg-[#f9f0f5]/80"
                      onClick={() => setOpenId(a.id)}
                    >
                      {/* Client Cell */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#cbb6ea]/55 border border-[#b14bd9]/20 text-xs font-bold text-[#3a1d43]">
                            {initialsFromName(clientName)}
                          </div>
                          <div className="min-w-0 max-w-[14rem]">
                            <div className="truncate text-sm font-bold text-[#3a1d43]">
                              {clientName}
                            </div>
                            {a.notes && (
                              <div className="mt-0.5 line-clamp-1 text-[11px] text-[#3a1d43]/60">
                                “{a.notes}”
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Service & Total Cell */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-[#3a1d43] max-w-[15rem]">
                          <span className="truncate">{svcLabel}</span>
                          {extraCount > 0 && (
                            <span className="shrink-0 rounded-full bg-[#f3e6f0] border border-[#cbb6ea] px-1.5 py-0.5 text-[10px] font-bold text-[#73358c]">
                              +{extraCount}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[#3a1d43]/65 font-mono">
                          <span>{formatDuration(durationMins, lang)}</span>
                          <span className="opacity-40">•</span>
                          <span className="font-bold text-[#73358c]">
                            {formatPrice(totalPrice, lang)}
                          </span>
                        </div>
                      </td>

                      {/* Schedule Cell */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold font-mono text-[#3a1d43]">
                          {prettyDate(a.appointment_date)}
                        </div>
                        <div
                          dir="ltr"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono text-[#3a1d43]/65"
                        >
                          <Clock className="h-3 w-3 text-[#b14bd9]" />
                          <span>
                            {prettyTime(a.start_time)} – {prettyTime(a.end_time)}
                          </span>
                        </div>
                      </td>

                      {/* Contact & Booking Code Cell */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {phoneVal ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#3a1d43]">
                            <Phone className="h-3.5 w-3.5 text-[#b14bd9] shrink-0" />
                            <span dir="ltr">{phoneVal}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-[#3a1d43]/40">—</div>
                        )}
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-[#3a1d43]/60">
                          {a.booking_number ? (
                            <>
                              <Sparkles className="h-3 w-3 text-[#73358c] shrink-0" />
                              <span dir="ltr">#{a.booking_number}</span>
                            </>
                          ) : a.email ? (
                            <>
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[11rem]">{a.email}</span>
                            </>
                          ) : null}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={a.status} />
                      </td>

                      {/* Status Selector */}
                      <td className="px-5 py-4 text-end whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <StatusDropdown
                            value={a.status}
                            onChange={(s) => updateStatus(a.id, s)}
                            loading={updatingId === a.id}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Detail Drawer */}
      {openAppt && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[#25142d]/40 backdrop-blur-xs"
          onClick={() => setOpenId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-s border-[#e8d7e4] bg-[#f9f0f5] p-6 sm:p-8 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-start justify-between pb-4 border-b border-[#e8d7e4]">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e6f0] border border-[#cbb6ea] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#73358c]">
                  {lang === 'ar' ? 'تفاصيل الحجز' : 'Appointment Details'}
                </div>
                <h2 className="mt-2 font-display font-bold text-2xl text-[#3a1d43]">
                  {openAppt.customer_name || openAppt.full_name || 'عميلة جوزال ميديكال سبا'}
                </h2>
                {openAppt.booking_number && (
                  <p className="mt-0.5 text-xs font-mono font-bold text-[#73358c]" dir="ltr">
                    #{openAppt.booking_number}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpenId(null)}
                className="grid h-9 w-9 place-items-center rounded-full border border-[#3a1d43]/15 bg-white text-[#3a1d43] hover:bg-[#f3e6f0] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <StatusBadge status={openAppt.status} />
              <Link
                to="/reception"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#cbb6ea]/50 hover:bg-[#cbb6ea] px-3.5 py-1.5 text-xs font-bold text-[#3a1d43] transition no-underline"
              >
                <Store className="h-3.5 w-3.5 text-[#73358c]" />
                <span>{lang === 'ar' ? 'إدارة في الكاشير' : 'Manage in POS'}</span>
              </Link>
            </div>

            <dl className="mt-6 space-y-3 rounded-2xl border border-[#e8d7e4] bg-white/85 p-4 text-sm">
              <Detail
                label={lang === 'ar' ? 'الخدمة الرئيسية' : 'Primary Service'}
                value={(() => {
                  const s = resolveService(openAppt);
                  return lang === 'ar'
                    ? s?.name_ar || s?.name || 'جلسة جوزال ميديكال سبا'
                    : s?.name_en || s?.name || 'Guzel Signature Ritual';
                })()}
              />
              <Detail
                label={lang === 'ar' ? 'الإجمالي' : 'Total Amount'}
                value={formatPrice(
                  openAppt.total_amount || resolveService(openAppt)?.price || 0,
                  lang,
                )}
                mono
              />
              <Detail
                label={lang === 'ar' ? 'التاريخ' : 'Date'}
                value={prettyDate(openAppt.appointment_date)}
                mono
              />
              <Detail
                label={lang === 'ar' ? 'الموعد' : 'Time'}
                value={`${prettyTime(openAppt.start_time)} – ${prettyTime(openAppt.end_time)}`}
                mono
                ltr
              />
              <Detail
                label={lang === 'ar' ? 'رقم الهاتف' : 'Phone'}
                value={openAppt.customer_phone || openAppt.phone || '—'}
                mono
                ltr
              />
              {openAppt.email && (
                <Detail label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} value={openAppt.email} />
              )}
              {openAppt.notes && (
                <Detail label={lang === 'ar' ? 'ملاحظات' : 'Notes'} value={openAppt.notes} />
              )}
            </dl>

            <div className="mt-auto pt-6 border-t border-[#e8d7e4]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#3a1d43]/55 mb-3">
                {lang === 'ar' ? 'تحديث حالة الحجز فوراً' : 'Quick Status Update'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    'pending_verification',
                    'confirmed',
                    'checked_in',
                    'checkout_pending',
                    'completed',
                    'cancelled',
                  ] as AppointmentStatus[]
                ).map((st) => {
                  const isCurrent = openAppt.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingId === openAppt.id}
                      onClick={() => updateStatus(openAppt.id, st)}
                      className="rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer"
                      style={{
                        backgroundColor: isCurrent ? '#3a1d43' : '#ffffff',
                        borderColor: isCurrent ? '#3a1d43' : '#e8d7e4',
                        color: isCurrent ? '#ffffff' : '#3a1d43',
                      }}
                    >
                      {statusLabel(st, lang)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function statusLabel(st: AppointmentStatus, lang: 'ar' | 'en'): string {
  const ar: Record<string, string> = {
    pending: 'بانتظار التأكيد',
    pending_deposit: 'بانتظار العربون',
    pending_verification: 'مراجعة العربون',
    confirmed: 'مؤكد',
    checked_in: 'متواجدة بالفرع',
    checkout_pending: 'بانتظار السداد',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    no_show: 'لم تحضر',
  };
  const en: Record<string, string> = {
    pending: 'Pending',
    pending_deposit: 'Pending Deposit',
    pending_verification: 'Deposit Review',
    confirmed: 'Confirmed',
    checked_in: 'Checked-In',
    checkout_pending: 'Checkout Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return lang === 'ar' ? ar[st] || st : en[st] || st;
}

function Detail({
  label,
  value,
  mono,
  ltr,
}: {
  label: string;
  value: string;
  mono?: boolean;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e8d7e4]/60 pb-2.5 last:border-b-0 last:pb-0">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-[#3a1d43]/55 shrink-0">
        {label}
      </dt>
      <dd
        dir={ltr ? 'ltr' : undefined}
        className={`text-end text-xs sm:text-sm font-semibold text-[#3a1d43] ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function StatusDropdown({
  value,
  onChange,
  loading,
}: {
  value: AppointmentStatus;
  onChange: (s: AppointmentStatus) => void;
  loading: boolean;
}) {
  const { lang } = useLanguage();
  const options: AppointmentStatus[] = [
    'pending',
    'pending_verification',
    'confirmed',
    'checked_in',
    'checkout_pending',
    'completed',
    'cancelled',
  ];

  return (
    <div className="relative">
      <select
        value={value}
        disabled={loading}
        onChange={(e) => onChange(e.target.value as AppointmentStatus)}
        className="rounded-full border border-[#e8d7e4] bg-[#f9f0f5] px-3.5 py-1.5 text-xs font-bold text-[#3a1d43] outline-none transition hover:border-[#b14bd9] focus:border-[#b14bd9] disabled:opacity-50 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {statusLabel(opt, lang)}
          </option>
        ))}
      </select>
    </div>
  );
}
