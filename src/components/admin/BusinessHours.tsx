import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, CopyCheck, Loader2, Save } from 'lucide-react';
import PageHeader from './PageHeader';
import { Switch } from './Services';
import { supabase } from '../../lib/supabase';
import { defaultBusinessHours } from '../../lib/mockData';
import type { BusinessHour } from '../../lib/types';
import { WEEKDAYS } from '../../lib/availability';
import { useLanguage } from '../../context/LanguageContext';

const WEEKDAYS_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

const LOCAL_HOURS_KEY = 'guzel_v2_business_hours';

type DraftRow = Omit<BusinessHour, 'start_time' | 'end_time'> & {
  start_time: string; // HH:mm
  end_time: string; // HH:mm
};

function toInput(t: string): string {
  return t ? t.slice(0, 5) : '10:00';
}

function toDb(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

function calcDurationHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(eh)) return 0;
  const diff = (eh * 60 + (em || 0) - (sh * 60 + (sm || 0))) / 60;
  return Math.max(0, Math.round(diff * 10) / 10);
}

export default function BusinessHours() {
  const { lang } = useLanguage();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('business_hours')
        .select('*')
        .order('weekday');

      let source: BusinessHour[] =
        (data as BusinessHour[] | null)?.length
          ? (data as BusinessHour[])
          : defaultBusinessHours;

      if (!(data as BusinessHour[] | null)?.length) {
        try {
          const cached = localStorage.getItem(LOCAL_HOURS_KEY);
          if (cached) source = JSON.parse(cached);
        } catch {
          // ignore
        }
      }

      const list: DraftRow[] = source.map((r) => ({
        ...r,
        start_time: toInput(r.start_time),
        end_time: toInput(r.end_time),
      }));
      setRows(list);
    } catch {
      let fallback = defaultBusinessHours;
      try {
        const cached = localStorage.getItem(LOCAL_HOURS_KEY);
        if (cached) fallback = JSON.parse(cached);
      } catch {
        // ignore
      }
      setRows(
        fallback.map((r) => ({
          ...r,
          start_time: toInput(r.start_time),
          end_time: toInput(r.end_time),
        })),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateLocal(id: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function saveToLocalCache(nextRows: DraftRow[]) {
    try {
      const normalized = nextRows.map((r) => ({
        ...r,
        start_time: toDb(r.start_time),
        end_time: toDb(r.end_time),
      }));
      localStorage.setItem(LOCAL_HOURS_KEY, JSON.stringify(normalized));
    } catch {
      // ignore
    }
  }

  async function persist(row: DraftRow) {
    setSavingId(row.id);
    saveToLocalCache(rows);
    try {
      await supabase
        .from('business_hours')
        .update({
          is_open: row.is_open,
          start_time: toDb(row.start_time),
          end_time: toDb(row.end_time),
        })
        .eq('id', row.id);
    } catch {
      // local cache already saved
    }
    setSavingId(null);
    setSavedAt(row.id);
    setTimeout(() => setSavedAt(null), 1600);
  }

  async function persistAll() {
    setSavingAll(true);
    saveToLocalCache(rows);
    try {
      await Promise.all(
        rows.map((row) =>
          supabase
            .from('business_hours')
            .update({
              is_open: row.is_open,
              start_time: toDb(row.start_time),
              end_time: toDb(row.end_time),
            })
            .eq('id', row.id),
        ),
      );
    } catch {
      // local cache already persisted
    }
    setSavingAll(false);
    showToast(
      lang === 'ar'
        ? 'تم حفظ ومزامنة مواعيد العمل لجميع أيام الأسبوع بنجاح ✨'
        : 'All weekday opening hours saved & synced ✨',
    );
  }

  function applyFirstDayToAll() {
    if (rows.length === 0) return;
    const template = rows[0];
    const next = rows.map((r) => ({
      ...r,
      is_open: template.is_open,
      start_time: template.start_time,
      end_time: template.end_time,
    }));
    setRows(next);
    showToast(
      lang === 'ar'
        ? `تم نسخ مواعيد يوم ${WEEKDAYS_AR[template.weekday]} إلى باقي الأيام — اضغطي "حفظ كل الأيام" للتأكيد`
        : `Copied ${WEEKDAYS[template.weekday]} hours to all days — click Save All to confirm`,
    );
  }

  const openDaysCount = rows.filter((r) => r.is_open).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={lang === 'ar' ? 'مواعيد العمل والاستقبال' : 'Business Hours'}
        title={lang === 'ar' ? 'ساعات عمل جوزال ميديكال سبا' : 'Guzel Medical Spa Opening Hours'}
        subtitle={
          lang === 'ar'
            ? 'تحكّمي في أيام وأوقات استقبال العميلات لكل يوم في الأسبوع. تنعكس التغييرات فوراً على جدول الحجز أونلاين.'
            : 'Configure studio opening hours for each weekday. Changes apply immediately to live online booking.'
        }
        actions={
          <>
            <button
              type="button"
              onClick={applyFirstDayToAll}
              disabled={rows.length === 0}
              className="btn-secondary !px-4 !py-2.5 !text-xs font-bold cursor-pointer"
            >
              <CopyCheck className="h-3.5 w-3.5 text-[#73358c]" />
              <span>
                {lang === 'ar' ? 'تعميم مواعيد الأحد' : 'Copy Sunday to All'}
              </span>
            </button>
            <button
              type="button"
              onClick={persistAll}
              disabled={savingAll || rows.length === 0}
              className="btn-primary !px-5 !py-2.5 !text-xs font-bold cursor-pointer border-0"
            >
              {savingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{lang === 'ar' ? 'حفظ كل الأيام' : 'Save All Days'}</span>
            </button>
          </>
        }
      />

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-bold text-emerald-800 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Summary Strip */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#e8d7e4] bg-white/85 p-4 backdrop-blur-md">
            <div className="text-[11px] font-bold text-[#3a1d43]/55">
              {lang === 'ar' ? 'أيام العمل المفتوحة' : 'Open Days / Week'}
            </div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-[#3a1d43]">
              {openDaysCount} <span className="text-xs font-sans font-semibold text-[#73358c]">/ 7</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e8d7e4] bg-white/85 p-4 backdrop-blur-md">
            <div className="text-[11px] font-bold text-[#3a1d43]/55">
              {lang === 'ar' ? 'أيام الإجازة الأسبوعية' : 'Closed Days'}
            </div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-[#b14bd9]">
              {7 - openDaysCount}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-[#e8d7e4] bg-white/85 p-4 backdrop-blur-md">
            <div className="text-[11px] font-bold text-[#3a1d43]/55">
              {lang === 'ar' ? 'ساعات العمل الافتراضية' : 'Standard Shift Window'}
            </div>
            <div dir="ltr" className="mt-1 font-mono text-lg font-extrabold text-[#3a1d43] text-start">
              {rows[0]?.start_time || '10:00'} – {rows[0]?.end_time || '22:00'}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-soft flex items-center justify-center gap-2 py-20 text-sm text-[#3a1d43]/65">
          <Loader2 className="h-4 w-4 animate-spin text-[#b14bd9]" />
          {lang === 'ar' ? 'جاري تحميل مواعيد العمل...' : 'Loading business hours…'}
        </div>
      ) : rows.length === 0 ? (
        <div className="card-soft px-6 py-16 text-center text-sm text-[#3a1d43]/60">
          {lang === 'ar'
            ? 'لم يتم تهيئة مواعيد العمل حتى الآن.'
            : 'No business hours configured yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((r) => {
            const hrs = r.is_open ? calcDurationHours(r.start_time, r.end_time) : 0;
            const isSaved = savedAt === r.id;

            return (
              <div
                key={r.id}
                className="rounded-3xl border p-5 sm:p-6 transition-all duration-200 backdrop-blur-xl"
                style={{
                  backgroundColor: r.is_open
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(243, 230, 240, 0.55)',
                  borderColor: r.is_open
                    ? 'rgba(58, 29, 67, 0.1)'
                    : 'rgba(58, 29, 67, 0.06)',
                  boxShadow: r.is_open
                    ? '0 12px 32px -14px rgba(58, 29, 67, 0.09)'
                    : 'none',
                }}
              >
                {/* Top Row: Day Name + Status Chip + Fixed RTL Toggle */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#e8d7e4]/80">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-2xl shrink-0"
                      style={{
                        backgroundColor: r.is_open ? '#f3e6f0' : 'rgba(58,29,67,0.06)',
                        color: r.is_open ? '#73358c' : 'rgba(58,29,67,0.4)',
                      }}
                    >
                      <Clock className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-display font-bold text-lg text-[#3a1d43]">
                        {lang === 'ar' ? WEEKDAYS_AR[r.weekday] : WEEKDAYS[r.weekday]}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                            r.is_open
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {r.is_open
                            ? lang === 'ar'
                              ? 'يستقبل حجوزات'
                              : 'Open'
                            : lang === 'ar'
                            ? 'مغلق (إجازة)'
                            : 'Closed'}
                        </span>
                        {r.is_open && hrs > 0 && (
                          <span className="font-mono text-[#3a1d43]/55">
                            {hrs} {lang === 'ar' ? 'ساعة' : 'hrs'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Switch
                      checked={r.is_open}
                      onChange={(v) => updateLocal(r.id, { is_open: v })}
                    />
                  </div>
                </div>

                {/* Middle Row: Opens & Closes Time Inputs */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#3a1d43]/65 mb-1.5">
                      {lang === 'ar' ? 'يفتح الساعة' : 'Opens At'}
                    </label>
                    <input
                      type="time"
                      dir="ltr"
                      disabled={!r.is_open}
                      value={r.start_time}
                      onChange={(e) =>
                        updateLocal(r.id, { start_time: e.target.value })
                      }
                      className="w-full rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/70 px-3.5 py-2.5 font-mono text-sm font-bold text-[#3a1d43] outline-none transition focus:border-[#b14bd9] focus:bg-white disabled:opacity-45"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#3a1d43]/65 mb-1.5">
                      {lang === 'ar' ? 'يغلق الساعة' : 'Closes At'}
                    </label>
                    <input
                      type="time"
                      dir="ltr"
                      disabled={!r.is_open}
                      value={r.end_time}
                      onChange={(e) =>
                        updateLocal(r.id, { end_time: e.target.value })
                      }
                      className="w-full rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/70 px-3.5 py-2.5 font-mono text-sm font-bold text-[#3a1d43] outline-none transition focus:border-[#b14bd9] focus:bg-white disabled:opacity-45"
                    />
                  </div>
                </div>

                {/* Footer Row: Save Single Day */}
                <div className="mt-4 pt-3 border-t border-[#e8d7e4]/60 flex items-center justify-between">
                  <span className="text-[11px] text-[#3a1d43]/55">
                    {isSaved ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {lang === 'ar' ? 'تم حفظ مواعيد اليوم بنجاح' : 'Day hours saved'}
                      </span>
                    ) : lang === 'ar' ? (
                      'تحديث فوري لجدول الحجز'
                    ) : (
                      'Syncs live with booking slots'
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() => persist(r)}
                    disabled={savingId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer border-0"
                    style={{
                      backgroundColor: isSaved ? '#10b981' : '#3a1d43',
                      color: '#ffffff',
                    }}
                  >
                    {savingId === r.id ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>{lang === 'ar' ? 'جاري الحفظ...' : 'Saving…'}</span>
                      </>
                    ) : isSaved ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'تم الحفظ' : 'Saved'}</span>
                      </>
                    ) : (
                      <span>{lang === 'ar' ? 'حفظ اليوم' : 'Save Day'}</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
