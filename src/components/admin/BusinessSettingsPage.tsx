import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Clock4, Loader2, Mail, MapPin, Phone, Upload, Image, Sparkles } from 'lucide-react';
import PageHeader from './PageHeader';
import { supabase } from '../../lib/supabase';
import { defaultSettings, getLocalSettings, saveLocalSettings } from '../../lib/mockData';
import type { BusinessSettings } from '../../lib/types';
import { useLanguage } from '../../context/LanguageContext';
import { compressReceiptImage } from '../../lib/imageCompressor';

interface Draft {
  id?: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  logo_url: string;
  slot_interval_minutes: number;
  booking_notice_hours: number;
}

const EMPTY: Draft = {
  business_name: '',
  business_email: '',
  business_phone: '',
  business_address: '',
  logo_url: '',
  slot_interval_minutes: 30,
  booking_notice_hours: 2,
};

export default function BusinessSettingsPage({
  onSaved,
}: {
  onSaved?: (s: BusinessSettings) => void;
}) {
  const { lang } = useLanguage();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      const s = (data as BusinessSettings) || getLocalSettings();
      setDraft({
        id: s.id,
        business_name: s.business_name ?? '',
        business_email: s.business_email ?? '',
        business_phone: s.business_phone ?? '',
        business_address: s.business_address ?? '',
        logo_url: s.logo_url ?? '',
        slot_interval_minutes: s.slot_interval_minutes ?? 30,
        booking_notice_hours: s.booking_notice_hours ?? 2,
      });
    } catch {
      const s = getLocalSettings();
      setDraft({
        id: s.id,
        business_name: s.business_name ?? '',
        business_email: s.business_email ?? '',
        business_phone: s.business_phone ?? '',
        business_address: s.business_address ?? '',
        logo_url: s.logo_url ?? '',
        slot_interval_minutes: s.slot_interval_minutes ?? 30,
        booking_notice_hours: s.booking_notice_hours ?? 2,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await compressReceiptImage(file, 90, 800);
      setDraft((prev) => ({ ...prev, logo_url: res.dataUrl }));
      setUploadingLogo(false);
    } catch {
      setUploadingLogo(false);
    }
  }

  async function save() {
    setError(null);
    setSaving(true);
    const payload = {
      business_name: draft.business_name.trim() || null,
      business_email: draft.business_email.trim() || null,
      business_phone: draft.business_phone.trim() || null,
      business_address: draft.business_address.trim() || null,
      logo_url: draft.logo_url?.trim() || null,
      slot_interval_minutes: Math.max(5, Math.round(draft.slot_interval_minutes)),
      booking_notice_hours: Math.max(0, Math.round(draft.booking_notice_hours)),
    };

    saveLocalSettings({ ...defaultSettings, ...payload, id: draft.id || 'bs-default' });

    let result;
    try {
      if (draft.id) {
        result = await supabase
          .from('business_settings')
          .update(payload)
          .eq('id', draft.id)
          .select()
          .maybeSingle();
      } else {
        result = await supabase
          .from('business_settings')
          .insert(payload)
          .select()
          .maybeSingle();
      }
    } catch {
      result = { data: { id: draft.id || 'bs-default', ...payload }, error: null };
    }

    setSaving(false);

    if (result.error) {
      // If table doesn't exist yet in Supabase (PGRST205), we still succeed locally!
      if (result.error.code === 'PGRST205' || result.error.message?.includes('schema cache') || result.error.message?.includes('not find')) {
        const localSaved = getLocalSettings();
        setDraft((d) => ({ ...d, id: localSaved.id }));
        onSaved?.(localSaved);
        setSavedAt(Date.now());
        setTimeout(() => setSavedAt(null), 2500);
        return;
      }
      setError(result.error.message);
      return;
    }

    if (result.data) {
      const s = result.data as BusinessSettings;
      setDraft((d) => ({ ...d, id: s.id }));
      onSaved?.(s);
    }
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 1800);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={lang === 'ar' ? 'إعدادات الصالون' : 'Business Settings'}
        title={lang === 'ar' ? 'بيانات وهوية الصالون وقواعد الحجز' : 'Studio identity & booking rules'}
        subtitle={
          lang === 'ar'
            ? 'تحديث بيانات الصالون العامة، وسائل التواصل، والقواعد المنظمة لمواعيد الحجز.'
            : "Update your salon's public details and the rules that govern the booking system."
        }
      />

      {loading ? (
        <div className="card-soft flex items-center justify-center gap-2 py-20 text-sm text-mocha-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {lang === 'ar' ? 'جاري تحميل إعدادات الصالون...' : 'Loading business settings…'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="card-soft p-6 lg:col-span-2">
            <h2 className="font-display text-2xl text-espresso">
              {lang === 'ar' ? 'بيانات وهوية الصالون' : 'Studio identity'}
            </h2>
            <p className="mt-1 text-sm text-mocha-500">
              {lang === 'ar'
                ? 'تظهر هذه البيانات على موقعك العام، التذييل، وإشعارات الحجز.'
                : 'These details appear on your public website, footer and confirmation emails.'}
            </p>

            {/* Logo Customization */}
            <div className="mt-6 mb-6 p-4 rounded-2xl bg-ivory/60 border border-pearl flex flex-col sm:flex-row items-center gap-5">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-pearl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-soft">
                {draft.logo_url ? (
                  <img
                    src={draft.logo_url}
                    alt="Salon Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="text-center p-2">
                    <Sparkles className="w-6 h-6 text-rosegold-400 mx-auto" />
                    <span className="text-[10px] text-mocha-400 block mt-1">
                      {lang === 'ar' ? 'بدون لوجو' : 'No Logo'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-start w-full">
                <label className="block text-xs font-bold text-espresso mb-1">
                  {lang === 'ar' ? 'شعار الصالون (Logo):' : 'Salon Brand Logo:'}
                </label>
                <p className="text-[11px] text-mocha-500 mb-3">
                  {lang === 'ar'
                    ? 'يظهر الشعار في أعلى الموقع، التذييل، شاشة الاستقبال، وفواتير العميلات.'
                    : 'Appears on the navbar, footer, reception screen, and customer invoices.'}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory text-xs font-medium cursor-pointer transition shadow-soft">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingLogo
                        ? lang === 'ar'
                          ? 'جاري الرفع...'
                          : 'Uploading...'
                        : lang === 'ar'
                        ? 'رفع شعار من جهازك'
                        : 'Upload Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {draft.logo_url && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, logo_url: '' })}
                      className="px-3 py-2 rounded-xl border border-pearl bg-white hover:bg-rose-50 text-mocha-600 hover:text-rose-600 text-xs font-medium transition"
                    >
                      {lang === 'ar' ? 'إزالة الشعار' : 'Remove Logo'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                icon={<Building2 className="h-4 w-4" />}
                label={lang === 'ar' ? 'اسم الصالون' : 'Salon Name'}
                value={draft.business_name}
                onChange={(v) => setDraft({ ...draft, business_name: v })}
                placeholder={lang === 'ar' ? 'ميزون لوميير بيوتي سنتر وسبا' : 'Maison Lumière'}
              />
              <Field
                icon={<Mail className="h-4 w-4" />}
                label={lang === 'ar' ? 'البريد الإلكتروني' : 'Salon Email'}
                value={draft.business_email}
                onChange={(v) => setDraft({ ...draft, business_email: v })}
                placeholder="contact@maisonlumiere.beauty"
                type="email"
              />
              <Field
                icon={<Phone className="h-4 w-4" />}
                label={lang === 'ar' ? 'رقم الهاتف' : 'Salon Phone'}
                value={draft.business_phone}
                onChange={(v) => setDraft({ ...draft, business_phone: v })}
                placeholder="01012345678"
              />
              <Field
                icon={<MapPin className="h-4 w-4" />}
                label={lang === 'ar' ? 'عنوان الصالون' : 'Salon Address'}
                value={draft.business_address}
                onChange={(v) => setDraft({ ...draft, business_address: v })}
                placeholder={lang === 'ar' ? '١٥ شارع البرازيل، الزمالك، القاهرة' : '15 Brazil St, Zamalek, Cairo'}
              />
            </div>
          </section>

          <section className="card-soft p-6">
            <h2 className="font-display text-2xl text-espresso">
              {lang === 'ar' ? 'قواعد جدولة المواعيد' : 'Booking rules'}
            </h2>
            <p className="mt-1 text-sm text-mocha-500">
              {lang === 'ar'
                ? 'تُستخدم لتوليد وحساب المواعيد الشاغرة في صفحة الحجز أونلاين.'
                : 'Used to generate the available time slots on the booking page.'}
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="field-label inline-flex items-center gap-1.5">
                  <Clock4 className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'الفارق بين المواعيد (بالدقائق)' : 'Slot Interval (minutes)'}
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={draft.slot_interval_minutes}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      slot_interval_minutes: Number(e.target.value),
                    })
                  }
                  className="field-input font-mono"
                />
                <p className="mt-1 text-xs text-mocha-500">
                  {lang === 'ar'
                    ? 'الفاصل الزمني بين بداية كل موعد وآخر (مثلاً: ٣٠ دقيقة).'
                    : 'Gap between time slot starts (e.g. 30 minutes).'}
                </p>
              </div>

              <div>
                <label className="field-label inline-flex items-center gap-1.5">
                  <Clock4 className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'أقل مهلة حجز مسبق (بالساعات)' : 'Booking Notice (hours)'}
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={draft.booking_notice_hours}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      booking_notice_hours: Number(e.target.value),
                    })
                  }
                  className="field-input font-mono"
                />
                <p className="mt-1 text-xs text-mocha-500">
                  {lang === 'ar'
                    ? 'أقل عدد ساعات قبل موعد الجلسة لتجنب الحجوزات المفاجئة (مثلاً: ساعتين).'
                    : 'Minimum hours before a client can book. Use 2 to avoid last-minute bookings.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {!loading && (
        <div className="flex items-center justify-end gap-3">
          {savedAt && (
            <span className="inline-flex items-center gap-1.5 text-sm text-rosegold-500">
              <CheckCircle2 className="h-4 w-4" />
              <span>{lang === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved'}</span>
            </span>
          )}
          {error && (
            <span className="rounded-full border border-blush-300/60 bg-blush-50 px-3 py-1.5 text-xs text-blush-600">
              {error}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className={['btn-primary', saving && 'cursor-wait opacity-70'].join(' ')}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {lang === 'ar' ? 'جاري الحفظ...' : 'Saving…'}
              </>
            ) : (
              lang === 'ar' ? 'حفظ التعديلات' : 'Save changes'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative mt-2">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mocha-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={['field-input mt-0', icon && 'pl-10'].filter(Boolean).join(' ')}
        />
      </div>
    </div>
  );
}
