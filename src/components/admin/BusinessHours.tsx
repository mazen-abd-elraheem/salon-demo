import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
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

type DraftRow = Omit<BusinessHour, 'start_time' | 'end_time'> & {
  start_time: string; // HH:mm
  end_time: string; // HH:mm
};

function toInput(t: string): string {
  return t ? t.slice(0, 5) : '09:00';
}

function toDb(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

export default function BusinessHours() {
  const { lang } = useLanguage();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('business_hours')
        .select('*')
        .order('weekday');
      const source = (data as BusinessHour[] | null)?.length ? (data as BusinessHour[]) : defaultBusinessHours;
      const list: DraftRow[] = source.map((r) => ({
        ...r,
        start_time: toInput(r.start_time),
        end_time: toInput(r.end_time),
      }));
      setRows(list);
    } catch {
      setRows(
        defaultBusinessHours.map((r) => ({
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

  async function persist(row: DraftRow) {
    setSavingId(row.id);
    const { error } = await supabase
      .from('business_hours')
      .update({
        is_open: row.is_open,
        start_time: toDb(row.start_time),
        end_time: toDb(row.end_time),
      })
      .eq('id', row.id);
    setSavingId(null);
    if (!error) {
      setSavedAt(row.id);
      setTimeout(() => setSavedAt(null), 1400);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={lang === 'ar' ? 'مواعيد العمل' : 'Business Hours'}
        title={lang === 'ar' ? 'ساعات استقبال العميلات بالصالون' : 'Studio opening times'}
        subtitle={
          lang === 'ar'
            ? 'تعديل أوقات العمل لكل يوم في الأسبوع. أي تعديل ينعكس فوراً على المواعيد المتاحة للحجز أونلاين.'
            : 'Edit each weekday. Changes apply instantly to your booking availability.'
        }
      />

      {loading ? (
        <div className="card-soft flex items-center justify-center gap-2 py-20 text-sm text-mocha-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {lang === 'ar' ? 'جاري تحميل مواعيد العمل...' : 'Loading business hours…'}
        </div>
      ) : rows.length === 0 ? (
        <div className="card-soft px-6 py-16 text-center text-sm text-mocha-500">
          {lang === 'ar'
            ? 'لم يتم تهيئة مواعيد العمل حتى الآن.'
            : 'No business hours configured yet.'}
        </div>
      ) : (
        <div className="card-soft divide-y divide-pearl/70 overflow-hidden">
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-1 items-center gap-3 px-6 py-5 sm:grid-cols-12 sm:gap-6"
            >
              <div className="sm:col-span-3">
                <div className="font-display text-xl text-espresso">
                  {lang === 'ar' ? WEEKDAYS_AR[r.weekday] : WEEKDAYS[r.weekday]}
                </div>
                <div className="text-[11px] uppercase tracking-wider-2 text-mocha-500">
                  {r.is_open
                    ? lang === 'ar'
                      ? 'مفتوح'
                      : 'Open'
                    : lang === 'ar'
                    ? 'مغلق'
                    : 'Closed'}
                </div>
              </div>

              <div className="flex items-center gap-3 sm:col-span-3">
                <Switch
                  checked={r.is_open}
                  onChange={(v) => updateLocal(r.id, { is_open: v })}
                />
                <span className="text-sm text-mocha-600">
                  {r.is_open
                    ? lang === 'ar'
                      ? 'يستقبل حجوزات'
                      : 'Accepting bookings'
                    : lang === 'ar'
                    ? 'مغلق'
                    : 'Closed'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:col-span-4">
                <div>
                  <label className="field-label">
                    {lang === 'ar' ? 'يفتح الساعة' : 'Opens'}
                  </label>
                  <input
                    type="time"
                    disabled={!r.is_open}
                    value={r.start_time}
                    onChange={(e) =>
                      updateLocal(r.id, { start_time: e.target.value })
                    }
                    className="field-input font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="field-label">
                    {lang === 'ar' ? 'يغلق الساعة' : 'Closes'}
                  </label>
                  <input
                    type="time"
                    disabled={!r.is_open}
                    value={r.end_time}
                    onChange={(e) =>
                      updateLocal(r.id, { end_time: e.target.value })
                    }
                    className="field-input font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end sm:col-span-2">
                {savedAt === r.id && (
                  <span className="me-2 inline-flex items-center gap-1 text-xs text-rosegold-500">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'تم الحفظ' : 'Saved'}</span>
                  </span>
                )}
                <button
                  onClick={() => persist(r)}
                  disabled={savingId === r.id}
                  className={[
                    'btn-secondary py-2 text-xs',
                    savingId === r.id && 'cursor-wait opacity-70',
                  ].join(' ')}
                >
                  {savingId === r.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {lang === 'ar' ? 'جاري الحفظ...' : 'Saving…'}
                    </>
                  ) : (
                    lang === 'ar' ? 'حفظ' : 'Save'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
