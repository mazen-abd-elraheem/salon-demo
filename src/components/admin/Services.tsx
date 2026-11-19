import React, { useEffect, useState } from 'react';
import { Edit3, Loader2, Plus, Power, PowerOff, Upload, X } from 'lucide-react';
import PageHeader from './PageHeader';
import { supabase } from '../../lib/supabase';
import { getLocalServices, saveLocalService } from '../../lib/mockData';
import type { Service, ServiceCategory } from '../../lib/types';
import { formatDuration, formatPrice } from '../../lib/format';
import { useLanguage } from '../../context/LanguageContext';
import { compressReceiptImage } from '../../lib/imageCompressor';
import PhImage from '../public/PhImage';

interface DraftService {
  id?: string;
  name_ar: string;
  name_en: string;
  category: ServiceCategory;
  description_ar: string;
  description_en: string;
  duration_minutes: number;
  price: number;
  image_url: string;
  sheet_key: string;
  is_active: boolean;
}

const SHEET_CELL_PRESETS = [
  { key: 'ringa:1', labelAr: 'بورتريه نضارة السيروم', labelEn: 'Dewy Serum Portrait' },
  { key: 'life:0', labelAr: 'حمام مغربي وسبا', labelEn: 'Marble Spa Suite' },
  { key: 'ringb:3', labelAr: 'مساج واسترخاء', labelEn: 'Lavender Relaxation' },
  { key: 'ringb:1', labelAr: 'ميك آب وإشراقة', labelEn: 'Soft Glam Profile' },
  { key: 'studio:1', labelAr: 'عناية وترميم', labelEn: 'Studio Beauty Shot' },
  { key: 'styled:0', labelAr: 'قطارة سيروم جوزال', labelEn: 'Guzel Dropper Serum' },
  { key: 'prod:0', labelAr: 'مجموعة جوزال الكاملة', labelEn: 'Guzel Trio Set' },
  { key: 'pre:1', labelAr: 'بشرة زجاجية ناعمة', labelEn: 'Glass Skin Closeup' },
];

const EMPTY_DRAFT: DraftService = {
  name_ar: '',
  name_en: '',
  category: 'skincare',
  description_ar: '',
  description_en: '',
  duration_minutes: 60,
  price: 1200,
  image_url: '',
  sheet_key: 'ringa:1',
  is_active: true,
};

export default function Services() {
  const { lang } = useLanguage();
  const [services, setServices] = useState<Service[]>(() => getLocalServices());
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftService>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const localList = getLocalServices();
    try {
      const { data } = await supabase
        .from('services')
        .select('*')
        .order('is_active', { ascending: false })
        .order('price', { ascending: true });
      const loaded = (data as Service[]) ?? [];
      if (loaded.length > 0) {
        const merged = loaded.map((dbItem, idx) => {
          const localMatch = localList.find(
            (l) => l.id === dbItem.id || l.name_ar === dbItem.name_ar,
          );
          return {
            ...localMatch,
            ...dbItem,
            image_url: dbItem.image_url || localMatch?.image_url || null,
            sheet_key: dbItem.sheet_key || localMatch?.sheet_key || SHEET_CELL_PRESETS[idx % SHEET_CELL_PRESETS.length].key,
          };
        });
        setServices(merged);
      } else {
        setServices(localList);
      }
    } catch {
      setServices(localList);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setDraft(EMPTY_DRAFT);
    setError(null);
    setOpen(true);
  }

  function startEdit(s: Service) {
    setDraft({
      id: s.id,
      name_ar: s.name_ar || s.name || '',
      name_en: s.name_en || s.name || '',
      category: s.category || 'skincare',
      description_ar: s.description_ar ?? s.description ?? '',
      description_en: s.description_en ?? s.description ?? '',
      duration_minutes: s.duration_minutes,
      price: s.price,
      image_url: s.image_url || '',
      sheet_key: s.sheet_key || 'ringa:1',
      is_active: s.is_active,
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    setError(null);
    const cleanNameAr = draft.name_ar.trim() || draft.name_en.trim();
    const cleanNameEn = draft.name_en.trim() || draft.name_ar.trim();
    if (!cleanNameAr || draft.duration_minutes < 5 || draft.price < 0) {
      setError(
        lang === 'ar'
          ? 'يرجى إدخال اسم الخدمة والمدة والسعر بشكل صحيح.'
          : 'Please enter a valid service name, duration, and price.',
      );
      return;
    }
    setSaving(true);

    const newService: Service = {
      id: draft.id || `svc-${Date.now()}`,
      name: cleanNameEn,
      name_ar: cleanNameAr,
      name_en: cleanNameEn,
      category: draft.category,
      description: draft.description_en.trim() || draft.description_ar.trim() || null,
      description_ar: draft.description_ar.trim() || null,
      description_en: draft.description_en.trim() || null,
      duration_minutes: Math.round(draft.duration_minutes),
      price: Number(draft.price),
      room_type_required: 'general',
      image_url: draft.image_url.trim() || null,
      sheet_key: draft.sheet_key || 'ringa:1',
      is_active: draft.is_active,
    };

    // Save locally & trigger real-time update across the website immediately
    saveLocalService(newService);

    // Also sync to Supabase if table is available
    try {
      const dbPayload = {
        name: cleanNameEn,
        name_ar: cleanNameAr,
        name_en: cleanNameEn,
        category: draft.category,
        description: newService.description,
        description_ar: newService.description_ar,
        description_en: newService.description_en,
        duration_minutes: newService.duration_minutes,
        price: newService.price,
        is_active: newService.is_active,
      };
      const isUuid =
        draft.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draft.id);
      if (isUuid) {
        await supabase.from('services').update(dbPayload).eq('id', draft.id);
      } else if (!draft.id) {
        await supabase.from('services').insert(dbPayload);
      }
    } catch {
      // ignore DB error, local save already succeeded
    }

    setSaving(false);
    setOpen(false);
    await load();
  }

  async function toggleActive(s: Service) {
    setBusyId(s.id);
    const updated = { ...s, is_active: !s.is_active };
    saveLocalService(updated);
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        s.id,
      );
      if (isUuid) {
        await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
      }
    } catch {
      // ignore
    }
    setBusyId(null);
    setServices((prev) => prev.map((row) => (row.id === s.id ? updated : row)));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={lang === 'ar' ? 'الخدمات وصور العرض' : 'Services & Visual Assets'}
        title={lang === 'ar' ? 'منيو جلسات جوزال ميديكال سبا وصور العرض' : 'Guzel Medical Spa Services & Photos'}
        subtitle={
          lang === 'ar'
            ? 'أضيفي أو عدلي الجلسات واربطي كل جلسة بصورتها المخصصة لتظهر لحظياً في الحلقة الدوارة واستوديو العرض بالصفحة الرئيسية.'
            : 'Add or edit rituals and upload custom photos that feed directly into the landing page Hero Ring and Showcase Dashboard in real time.'
        }
        actions={
          <button onClick={startCreate} className="btn-primary">
            <Plus className="h-4 w-4" />
            {lang === 'ar' ? 'خدمة جديدة' : 'New service'}
          </button>
        }
      />

      {loading ? (
        <div className="card-soft flex items-center justify-center gap-2 py-20 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          {lang === 'ar' ? 'جاري تحميل قائمة الخدمات...' : 'Loading services…'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((s, idx) => {
            const serviceName =
              lang === 'ar' ? s.name_ar || s.name || s.name_en : s.name_en || s.name || s.name_ar;
            const serviceDesc =
              lang === 'ar'
                ? s.description_ar || s.description || s.description_en
                : s.description_en || s.description || s.description_ar;
            const sheetKey =
              s.sheet_key || SHEET_CELL_PRESETS[idx % SHEET_CELL_PRESETS.length].key;

            return (
              <article
                key={s.id}
                className={[
                  'group flex flex-col overflow-hidden rounded-3xl border bg-white/85 shadow-softer transition-all hover:-translate-y-0.5 hover:shadow-soft',
                  s.is_active ? 'border-[var(--lines)]' : 'border-[var(--lines)] opacity-75',
                ].join(' ')}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <PhImage
                    imgKey={sheetKey}
                    customImageUrl={s.image_url}
                    className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#25142d]/45 to-transparent" />
                  <div className="absolute right-3 top-3">
                    <span
                      className={[
                        'badge',
                        s.is_active
                          ? 'bg-[#cbb6ea] text-[#2c1433]'
                          : 'bg-rose-100 text-rose-700',
                      ].join(' ')}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {s.is_active
                        ? lang === 'ar'
                          ? 'مفعلة'
                          : 'Live'
                        : lang === 'ar'
                        ? 'معطلة'
                        : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold leading-tight">{serviceName}</h3>
                    <span className="text-base font-bold text-[#b14bd9] font-mono whitespace-nowrap">
                      {formatPrice(s.price, lang)}
                    </span>
                  </div>
                  {serviceDesc && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed opacity-75">
                      {serviceDesc}
                    </p>
                  )}
                  <div className="mt-3 text-[11px] font-mono opacity-65">
                    {formatDuration(s.duration_minutes, lang)}
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--lines)] px-3 py-2 text-xs font-semibold transition hover:bg-[#cbb6ea] hover:text-[#2c1433]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {lang === 'ar' ? 'تعديل الخدمة والصورة' : 'Edit & Photo'}
                    </button>
                    <button
                      onClick={() => toggleActive(s)}
                      disabled={busyId === s.id}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--lines)] px-3 py-2 text-xs font-medium transition hover:bg-rose-50"
                    >
                      {s.is_active ? (
                        <PowerOff className="h-3.5 w-3.5" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {open && (
        <ServiceModal
          draft={draft}
          setDraft={setDraft}
          onClose={() => setOpen(false)}
          onSave={save}
          saving={saving}
          error={error}
        />
      )}
    </div>
  );
}

function ServiceModal({
  draft,
  setDraft,
  onClose,
  onSave,
  saving,
  error,
}: {
  draft: DraftService;
  setDraft: (d: DraftService) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const { lang } = useLanguage();
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await compressReceiptImage(file, 90, 900);
      setDraft({ ...draft, image_url: res.dataUrl });
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25142d]/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-soft border border-[var(--lines)] my-8">
        <div className="flex items-center justify-between border-b border-[var(--lines)] px-6 py-4">
          <h2 className="text-xl font-bold">
            {draft.id
              ? lang === 'ar'
                ? 'تعديل الخدمة وصورة العرض'
                : 'Edit Service & Visual Asset'
              : lang === 'ar'
              ? 'إضافة خدمة تجميل جديدة'
              : 'Add New Beauty Service'}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-[var(--lines)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">{lang === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</label>
              <input
                value={draft.name_ar}
                onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })}
                placeholder="جلسة هيدرا فيشل جوزال"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">{lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}</label>
              <input
                value={draft.name_en}
                onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                placeholder="Guzel Signature HydraFacial"
                className="field-input"
              />
            </div>
          </div>

          <div>
            <label className="field-label">{lang === 'ar' ? 'وصف الجلسة' : 'Description'}</label>
            <textarea
              value={draft.description_ar}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  description_ar: e.target.value,
                  description_en: draft.description_en || e.target.value,
                })
              }
              rows={2}
              className="field-textarea"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="field-label">{lang === 'ar' ? 'القسم' : 'Category'}</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value as ServiceCategory })}
                className="field-input"
              >
                <option value="skincare">{lang === 'ar' ? 'بشرة وفيشل' : 'Skincare'}</option>
                <option value="moroccan_bath">{lang === 'ar' ? 'حمام مغربي' : 'Moroccan Bath'}</option>
                <option value="massage">{lang === 'ar' ? 'مساج واسترخاء' : 'Massage'}</option>
                <option value="hair">{lang === 'ar' ? 'شعر وترميم' : 'Hair'}</option>
                <option value="bridal">{lang === 'ar' ? 'عرائس وميك آب' : 'Bridal & Makeup'}</option>
                <option value="nails">{lang === 'ar' ? 'أظافر ورموش' : 'Nails & Lashes'}</option>
              </select>
            </div>
            <div>
              <label className="field-label">{lang === 'ar' ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
              <input
                type="number"
                min={5}
                step={5}
                value={draft.duration_minutes}
                onChange={(e) => setDraft({ ...draft, duration_minutes: Number(e.target.value) })}
                className="field-input font-mono"
              />
            </div>
            <div>
              <label className="field-label">{lang === 'ar' ? 'السعر (ج.م)' : 'Price'}</label>
              <input
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                className="field-input font-mono"
              />
            </div>
          </div>

          {/* Photo Upload & Sheet Cell Picker */}
          <div className="rounded-2xl border border-[var(--lines)] bg-[#f9f0f5] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="field-label">
                {lang === 'ar'
                  ? 'صورة الخدمة (تظهر في الحلقة الدوارة واستوديو العرض)'
                  : 'Service Visual Asset (Hero Ring & Showcase)'}
              </label>
              {draft.image_url && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, image_url: '' })}
                  className="text-[11px] text-rose-600 underline"
                >
                  {lang === 'ar' ? 'استعادة صورة جوزال الافتراضية' : 'Reset to Guzel Sheet'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[var(--lines)] shrink-0">
                <PhImage
                  imgKey={draft.sheet_key}
                  customImageUrl={draft.image_url}
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 rounded-full bg-[#cbb6ea] text-[#2c1433] px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-[#e58fb6] transition">
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {uploading
                      ? lang === 'ar'
                        ? 'جاري معالجة الصورة...'
                        : 'Uploading…'
                      : lang === 'ar'
                      ? 'رفع صورة مخصصة من جهازك'
                      : 'Upload Custom Photo'}
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>

                <div>
                  <label className="block text-[10px] opacity-70 mb-1">
                    {lang === 'ar'
                      ? 'أو اختاري خلية من شيت صور جوزال (Cell-by-Cell Crop):'
                      : 'Or select a Guzel sheet cell (Cell-by-Cell Crop):'}
                  </label>
                  <select
                    value={draft.sheet_key}
                    onChange={(e) => setDraft({ ...draft, sheet_key: e.target.value, image_url: '' })}
                    className="w-full rounded-xl border border-[var(--lines)] bg-white px-3 py-1.5 text-xs"
                  >
                    {SHEET_CELL_PRESETS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {lang === 'ar' ? p.labelAr : p.labelEn} ({p.key})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--lines)] px-6 py-4">
          <button onClick={onClose} className="btn-ghost text-xs" disabled={saving}>
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={onSave} disabled={saving} className="btn-primary text-xs">
            {saving
              ? lang === 'ar'
                ? 'جاري الحفظ...'
                : 'Saving…'
              : lang === 'ar'
              ? 'حفظ ومزامنة لحظية'
              : 'Save & Sync Live'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      dir="ltr"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b14bd9]/50',
        checked ? 'bg-[#b14bd9]' : 'bg-[#3a1d43]/20',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
        style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
      />
    </button>
  );
}
