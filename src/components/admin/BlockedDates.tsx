import { useEffect, useState } from 'react';
import { CalendarOff, Loader2, Plus, Trash2 } from 'lucide-react';
import PageHeader from './PageHeader';
import { supabase } from '../../lib/supabase';
import type { BlockedDate } from '../../lib/types';
import { prettyDate } from './Overview';
import { useLanguage } from '../../context/LanguageContext';

export default function BlockedDates() {
  const { lang } = useLanguage();
  const [rows, setRows] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('blocked_dates')
        .select('*')
        .order('blocked_date', { ascending: true });
      setRows((data as BlockedDate[]) ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    setError(null);
    if (!date) {
      setError('Please pick a date to block.');
      return;
    }
    setSaving(true);
    const { error: err } = await supabase
      .from('blocked_dates')
      .insert({ blocked_date: date, reason: reason.trim() || null });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDate('');
    setReason('');
    await load();
  }

  async function remove(id: string) {
    setRemovingId(id);
    await supabase.from('blocked_dates').delete().eq('id', id);
    setRemovingId(null);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={lang === 'ar' ? 'الأيام المغلقة' : 'Blocked Dates'}
        title={lang === 'ar' ? 'الإجازات وأيام إغلاق الصالون' : 'Days off & studio closures'}
        subtitle={
          lang === 'ar'
            ? 'إغلاق أيام الأعياد أو الإجازات الرسمية أو فترات الصيانة لمنع حجزها على التقويم.'
            : "Block holidays, training days, or private bookings. Blocked dates won't appear in the booking calendar."
        }
      />

      <div className="card-soft p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <label className="field-label">{lang === 'ar' ? 'التاريخ' : 'Date'}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field-input font-mono"
            />
          </div>
          <div className="sm:col-span-6">
            <label className="field-label">
              {lang === 'ar' ? 'سبب الإغلاق (اختياري)' : 'Reason (optional)'}
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'مثال: إجازة عيد الفطر المبارك أو صيانة دورية'
                  : 'Studio closed for training'
              }
              className="field-input"
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <button
              onClick={add}
              disabled={saving}
              className={['btn-primary w-full justify-center', saving && 'opacity-70'].join(' ')}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />{' '}
                  {lang === 'ar' ? 'جاري الإغلاق' : 'Adding'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />{' '}
                  {lang === 'ar' ? 'إغلاق هذا اليوم' : 'Block date'}
                </>
              )}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-2xl border border-blush-300/60 bg-blush-50 px-4 py-3 text-sm text-blush-600">
            {error}
          </div>
        )}
      </div>

      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-mocha-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {lang === 'ar' ? 'جاري تحميل الأيام المغلقة...' : 'Loading blocked dates…'}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CalendarOff className="mx-auto h-7 w-7 text-rosegold-400" />
            <p className="mt-3 font-display text-2xl text-espresso">
              {lang === 'ar' ? 'لا توجد أيام مغلقة حالياً' : 'No blocked dates.'}
            </p>
            <p className="mt-2 text-sm text-mocha-500">
              {lang === 'ar'
                ? 'أضيفي الأيام المراد إغلاقها من النموذج أعلاه لاستبعادها من تقويم الحجز.'
                : 'Add days above to remove them from the booking calendar.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-pearl/70">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-rosegold-100 to-rosegold-200 text-espresso">
                    <CalendarOff className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-espresso">
                      {prettyDate(r.blocked_date)}
                    </div>
                    <div className="text-xs text-mocha-500">
                      {r.reason || (lang === 'ar' ? 'بدون سبب محدد' : 'No reason provided')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => remove(r.id)}
                  disabled={removingId === r.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-mocha-400/25 px-3 py-1.5 text-xs font-medium text-mocha-700 transition hover:border-blush-300 hover:bg-blush-50 hover:text-blush-600"
                >
                  {removingId === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'إلغاء الإغلاق' : 'Remove'}</span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
