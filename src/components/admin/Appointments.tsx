import { useEffect, useMemo, useState } from 'react';
import { Filter, Loader2, Mail, Phone, Search, X } from 'lucide-react';
import PageHeader from './PageHeader';
import { StatusBadge, prettyDate, prettyTime } from './Overview';
import { supabase } from '../../lib/supabase';
import { defaultServices } from '../../lib/mockData';
import type { Appointment, AppointmentStatus, Service } from '../../lib/types';
import { formatDuration, formatPrice, initialsFromName } from '../../lib/format';
import { useLanguage } from '../../context/LanguageContext';

export default function Appointments() {
  const { lang, isRTL } = useLanguage();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const statuses: { value: AppointmentStatus | 'all'; label: string }[] = [
    { value: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
    { value: 'pending', label: lang === 'ar' ? 'بانتظار التأكيد' : 'Pending' },
    { value: 'confirmed', label: lang === 'ar' ? 'مؤكد' : 'Confirmed' },
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
      try {
        const raw = localStorage.getItem('maison_local_appointments') || '[]';
        setAppts(JSON.parse(raw));
      } catch {
        setAppts([]);
      }
      setServices(defaultServices);
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

  const filtered = useMemo(() => {
    return appts.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const svcId = a.service_id || a.items?.[0]?.service_id || '';
        const svc = (svcId ? serviceById.get(svcId)?.name : '') ?? '';
        const name = (a.customer_name || a.full_name || '').toLowerCase();
        const email = (a.email || '').toLowerCase();
        const phone = (a.customer_phone || a.phone || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          svc.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [appts, filter, query, serviceById]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    setUpdatingId(id);
    try {
      await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
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
    <div className="space-y-8">
      <PageHeader
        eyebrow={lang === 'ar' ? 'الحجوزات' : 'Appointments'}
        title={lang === 'ar' ? 'إدارة حجوزات الصالون' : 'Manage your bookings'}
        subtitle={
          lang === 'ar'
            ? 'تصفية وبحث وتحديث حالة كافة طلبات العميلات والمواعيد المسجلة.'
            : 'Filter, search and update the status of every client request.'
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {statuses.map((s) => {
            const active = filter === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={[
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider-2 transition-all',
                  active
                    ? 'border-espresso bg-espresso text-ivory'
                    : 'border-pearl bg-white/70 text-mocha-600 hover:border-mocha-400',
                ].join(' ')}
              >
                <Filter className="h-3 w-3" />
                {s.label}
                {counts[s.value] !== undefined && (
                  <span
                    className={[
                      'rounded-full px-1.5 py-px text-[10px]',
                      active ? 'bg-ivory/15 text-ivory' : 'bg-pearl text-mocha-600',
                    ].join(' ')}
                  >
                    {counts[s.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mocha-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'بحث باسم العميلة، رقم الهاتف، أو الخدمة...'
                : 'Search by client, email, phone or service…'
            }
            className="field-input mt-0 ps-10"
          />
        </div>
      </div>

      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-mocha-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {lang === 'ar' ? 'جاري تحميل الحجوزات...' : 'Loading appointments…'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="font-display text-2xl text-espresso">
              {lang === 'ar' ? 'لا توجد حجوزات مطابقة' : 'Nothing here yet.'}
            </p>
            <p className="mt-2 text-sm text-mocha-500">
              {lang === 'ar'
                ? 'عند قيام عميلة بحجز موعد جديد، سيظهر طلبها هنا مباشرة.'
                : 'When a client books, their request will appear in this list.'}
            </p>
          </div>
        ) : (
          <div className="admin-scroll overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-pearl/70 bg-cream/40 text-[11px] uppercase tracking-wider-2 text-mocha-500">
                  <th className="px-6 py-4 text-start">{lang === 'ar' ? 'العميلة' : 'Client'}</th>
                  <th className="px-6 py-4 text-start">{lang === 'ar' ? 'الخدمة' : 'Service'}</th>
                  <th className="px-6 py-4 text-start">{lang === 'ar' ? 'الموعد' : 'When'}</th>
                  <th className="px-6 py-4 text-start">{lang === 'ar' ? 'التواصل' : 'Contact'}</th>
                  <th className="px-6 py-4 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="px-6 py-4 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pearl/70">
                {filtered.map((a) => {
                  const svcId = a.service_id || a.items?.[0]?.service_id;
                  const svc = svcId ? serviceById.get(svcId) : null;
                  const clientName = a.customer_name || a.full_name || 'عميلة الصالون';
                  return (
                    <tr
                      key={a.id}
                      className="cursor-pointer transition hover:bg-cream/40"
                      onClick={() => setOpenId(a.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rosegold-100 to-rosegold-300 text-[11px] font-semibold text-espresso">
                            {initialsFromName(clientName)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-espresso">
                              {clientName}
                            </div>
                            {a.notes && (
                              <div className="mt-0.5 line-clamp-1 text-xs text-mocha-500">
                                “{a.notes}”
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-espresso">
                          {svc?.name ?? '—'}
                        </div>
                        <div className="text-xs text-mocha-500">
                          {svc ? formatDuration(svc.duration_minutes) : '—'} ·{' '}
                          {svc ? formatPrice(svc.price) : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-espresso">
                          {prettyDate(a.appointment_date)}
                        </div>
                        <div className="text-xs text-mocha-500">
                          {prettyTime(a.start_time)} – {prettyTime(a.end_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-mocha-600">
                          <Mail className="h-3 w-3" />
                          {a.email}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-mocha-600">
                          <Phone className="h-3 w-3" />
                          {a.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
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

      {openAppt && (
        <DetailsDrawer
          appt={openAppt}
          service={
            serviceById.get(openAppt.service_id || openAppt.items?.[0]?.service_id || '') ?? null
          }
          onClose={() => setOpenId(null)}
          onUpdate={(s) => updateStatus(openAppt.id, s)}
          updating={updatingId === openAppt.id}
        />
      )}
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
  return (
    <select
      value={value}
      disabled={loading}
      onChange={(e) => onChange(e.target.value as AppointmentStatus)}
      className="rounded-full border border-mocha-400/25 bg-white/80 px-3 py-1.5 text-xs font-medium text-espresso outline-none transition focus:border-rosegold-300 focus:ring-2 focus:ring-rosegold-200/50"
    >
      <option value="pending">{lang === 'ar' ? 'بانتظار التأكيد' : 'Pending'}</option>
      <option value="confirmed">{lang === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
      <option value="completed">{lang === 'ar' ? 'مكتمل' : 'Completed'}</option>
      <option value="cancelled">{lang === 'ar' ? 'ملغي' : 'Cancelled'}</option>
    </select>
  );
}

function DetailsDrawer({
  appt,
  service,
  onClose,
  onUpdate,
  updating,
}: {
  appt: Appointment;
  service: Service | null;
  onClose: () => void;
  onUpdate: (s: AppointmentStatus) => void;
  updating: boolean;
}) {
  const { lang } = useLanguage();
  const clientName = appt.customer_name || appt.full_name || (lang === 'ar' ? 'عميلة الصالون' : 'Studio Client');

  const statusLabels: Record<string, string> = {
    pending: lang === 'ar' ? 'بانتظار التأكيد' : 'Pending',
    confirmed: lang === 'ar' ? 'مؤكد' : 'Confirmed',
    completed: lang === 'ar' ? 'مكتمل' : 'Completed',
    cancelled: lang === 'ar' ? 'ملغي' : 'Cancelled',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        onClick={onClose}
        className="flex-1 bg-espresso/30 backdrop-blur-sm"
        aria-label="Close drawer"
      />
      <aside className="relative flex w-full max-w-md flex-col bg-ivory shadow-elevated border-s border-pearl">
        <div className="flex items-center justify-between border-b border-pearl/70 px-6 py-5">
          <div>
            <div className="text-[11px] uppercase tracking-wider-2 text-mocha-500">
              {lang === 'ar' ? 'تفاصيل الحجز' : 'Appointment'}
            </div>
            <div className="font-display text-2xl text-espresso">
              {clientName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-mocha-400/30 hover:border-mocha-500"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="admin-scroll flex-1 overflow-y-auto px-6 py-6">
          <DetailRow
            label={lang === 'ar' ? 'الخدمة' : 'Service'}
            value={lang === 'ar' ? service?.name_ar || service?.name || '—' : service?.name_en || service?.name || '—'}
          />
          <DetailRow
            label={lang === 'ar' ? 'المدة' : 'Duration'}
            value={service ? formatDuration(service.duration_minutes, lang) : '—'}
          />
          <DetailRow
            label={lang === 'ar' ? 'السعر' : 'Investment'}
            value={service ? formatPrice(service.price, lang) : '—'}
          />
          <div className="my-5 divider-thin" />
          <DetailRow
            label={lang === 'ar' ? 'التاريخ' : 'Date'}
            value={prettyDate(appt.appointment_date)}
          />
          <DetailRow
            label={lang === 'ar' ? 'الوقت' : 'Time'}
            value={`${prettyTime(appt.start_time)} – ${prettyTime(appt.end_time)}`}
          />
          <div className="my-5 divider-thin" />
          <DetailRow
            label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            value={appt.email || '—'}
          />
          <DetailRow
            label={lang === 'ar' ? 'رقم الهاتف' : 'Phone'}
            value={appt.customer_phone || appt.phone || '—'}
          />
          {appt.notes && (
            <div className="mt-4 rounded-2xl border border-pearl/70 bg-cream/40 p-4">
              <div className="text-[10px] uppercase tracking-wider-2 text-mocha-500">
                {lang === 'ar' ? 'ملاحظات العميل' : 'Notes'}
              </div>
              <p className="mt-1 text-sm text-espresso">{appt.notes}</p>
            </div>
          )}
        </div>

        <div className="border-t border-pearl/70 px-6 py-5">
          <div className="text-[11px] uppercase tracking-wider-2 text-mocha-500">
            {lang === 'ar' ? 'تحديث حالة الحجز' : 'Update status'}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['pending', 'confirmed', 'completed', 'cancelled'] as AppointmentStatus[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => onUpdate(s)}
                  disabled={updating || appt.status === s}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider-2 transition',
                    appt.status === s
                      ? 'border-espresso bg-espresso text-ivory'
                      : 'border-pearl bg-white/70 text-mocha-700 hover:border-mocha-400',
                  ].join(' ')}
                >
                  {statusLabels[s] || s}
                </button>
              ),
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[11px] uppercase tracking-wider-2 text-mocha-500">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-espresso">
        {value}
      </span>
    </div>
  );
}
