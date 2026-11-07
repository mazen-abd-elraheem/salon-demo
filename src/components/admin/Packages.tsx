import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Edit3,
  Power,
  PowerOff,
  Trash2,
  Clock,
  CheckCircle2,
  X,
  Layers,
  Search,
} from 'lucide-react';
import PageHeader from './PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { formatDuration, formatPrice } from '../../lib/format';
import {
  defaultServices,
  defaultPackages,
  getLocalPackages,
  saveLocalPackage,
  deleteLocalPackage,
} from '../../lib/mockData';
import type { Package } from '../../lib/types';

export default function Packages() {
  const { lang } = useLanguage();
  const [packages, setPackages] = useState<Package[]>(() => getLocalPackages());
  const [openModal, setOpenModal] = useState(false);
  const [query, setQuery] = useState('');
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);

  // Form state
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [duration, setDuration] = useState<number>(120);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const reload = () => {
    setPackages([...getLocalPackages()]);
  };

  const handleOpenAdd = () => {
    setEditingPkg(null);
    setNameAr('');
    setNameEn('');
    setDescAr('');
    setPrice(2500);
    setDuration(120);
    setSelectedServiceIds([defaultServices[0].id, defaultServices[1].id]);
    setIsActive(true);
    setOpenModal(true);
  };

  const handleOpenEdit = (pkg: Package) => {
    setEditingPkg(pkg);
    setNameAr(pkg.name_ar);
    setNameEn(pkg.name_en);
    setDescAr(pkg.description_ar || '');
    setPrice(pkg.price);
    setDuration(pkg.duration_minutes);
    setSelectedServiceIds(pkg.services?.map((s) => s.id) || []);
    setIsActive(pkg.is_active);
    setOpenModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;

    const chosenServices = defaultServices.filter((s) =>
      selectedServiceIds.includes(s.id),
    );

    const newPkg: Package = {
      id: editingPkg ? editingPkg.id : 'pkg-' + Date.now(),
      name_ar: nameAr.trim(),
      name_en: nameEn.trim() || nameAr.trim(),
      description_ar: descAr.trim() || null,
      price: Number(price) || 0,
      duration_minutes: Number(duration) || 90,
      is_active: isActive,
      services: chosenServices,
      created_at: editingPkg?.created_at || new Date().toISOString(),
    };

    saveLocalPackage(newPkg);
    reload();
    setOpenModal(false);
  };

  const handleToggle = (pkg: Package) => {
    const updated = { ...pkg, is_active: !pkg.is_active };
    saveLocalPackage(updated);
    reload();
  };

  const handleDelete = (pkgId: string) => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكدة من حذف هذه الباقة؟' : 'Are you sure you want to delete this package?')) {
      deleteLocalPackage(pkgId);
      reload();
    }
  };

  const filtered = packages.filter((p) => {
    const q = query.toLowerCase();
    return (
      !q ||
      p.name_ar.toLowerCase().includes(q) ||
      p.name_en.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={lang === 'ar' ? 'الباقات والعروض' : 'Bundles & Packages'}
        title={lang === 'ar' ? 'إدارة باقات العروسة والسبا' : 'Manage Seasonal Bundles'}
        subtitle={
          lang === 'ar'
            ? 'إنشاء باقات مجمعة تضم عدة جلسات معاً بأسعار ترويجية، وتفعيلها في صفحة الحجز أونلاين.'
            : 'Create multi-service curated packages and seasonal bridal bundles with custom pricing.'
        }
        actions={
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus className="h-4 w-4" />
            <span>{lang === 'ar' ? 'إضافة باقة جديدة' : 'New Bundle'}</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mocha-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث عن باقة أو عرض...' : 'Search bundles…'}
            className="field-input mt-0 ps-10"
          />
        </div>
        <span className="text-xs text-mocha-500 font-mono">
          {packages.length} {lang === 'ar' ? 'باقة مسجلة' : 'bundles'}
        </span>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((pkg) => {
          const originalSum = (pkg.services || []).reduce(
            (sum, s) => sum + Number(s.price || 0),
            0,
          );
          const savings = Math.max(0, originalSum - pkg.price);

          return (
            <div
              key={pkg.id}
              className={`rounded-2xl border bg-white p-5 shadow-soft transition flex flex-col justify-between ${
                pkg.is_active ? 'border-pearl/80' : 'border-pearl/60 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="p-2 rounded-xl bg-rosegold-50 text-rosegold-600">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      pkg.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {pkg.is_active
                      ? lang === 'ar'
                        ? 'مفعلة'
                        : 'Active'
                      : lang === 'ar'
                      ? 'معطلة'
                      : 'Inactive'}
                  </span>
                </div>

                <h3 className="font-bold text-base text-espresso">
                  {lang === 'ar' ? pkg.name_ar : pkg.name_en}
                </h3>
                <p className="text-xs text-mocha-500 line-clamp-2 mt-1 leading-relaxed">
                  {pkg.description_ar || (lang === 'ar' ? 'باقة متكاملة من الجلسات الخاصة' : 'Curated bundle')}
                </p>

                {/* Included Services */}
                <div className="mt-3 pt-3 border-t border-pearl/60 space-y-1">
                  <p className="text-[11px] font-semibold text-mocha-400">
                    {lang === 'ar' ? 'الجلسات المتضمنة:' : 'Included treatments:'}
                  </p>
                  {(pkg.services || []).map((s) => (
                    <div
                      key={s.id}
                      className="text-xs text-mocha-600 flex items-center justify-between"
                    >
                      <span className="truncate">• {lang === 'ar' ? s.name_ar : s.name_en}</span>
                      <span className="font-mono text-[11px] text-mocha-400">
                        {formatPrice(s.price, lang)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-pearl/60">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-[11px] text-mocha-400 block">
                      {lang === 'ar' ? 'سعر العرض الباقة:' : 'Bundle Price:'}
                    </span>
                    <span className="text-lg font-bold font-mono text-rosegold-700">
                      {formatPrice(pkg.price, lang)}
                    </span>
                    {savings > 0 && (
                      <span className="text-[10px] text-emerald-700 ms-1.5 font-semibold">
                        (وفرت {formatPrice(savings, lang)})
                      </span>
                    )}
                  </div>
                  <div className="text-end font-mono text-xs text-mocha-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(pkg.duration_minutes, lang)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(pkg)}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-pearl bg-ivory hover:bg-pearl/50 text-xs font-semibold text-espresso transition flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggle(pkg)}
                    className={`p-2 rounded-xl border transition ${
                      pkg.is_active
                        ? 'border-pearl bg-ivory text-mocha-500 hover:text-rose-600'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                    title={pkg.is_active ? 'تعطيل' : 'تفعيل'}
                  >
                    {pkg.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(pkg.id)}
                    className="p-2 rounded-xl border border-pearl bg-ivory hover:bg-rose-50 text-mocha-400 hover:text-rose-600 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Package Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-pearl max-w-lg w-full p-6 shadow-elevated text-start space-y-4 max-h-[90vh] overflow-y-auto admin-scroll"
          >
            <div className="flex items-center justify-between pb-3 border-b border-pearl">
              <h3 className="font-bold text-base text-espresso">
                {editingPkg
                  ? lang === 'ar'
                    ? 'تعديل الباقة'
                    : 'Edit Bundle'
                  : lang === 'ar'
                  ? 'إضافة باقة عروض جديدة'
                  : 'New Curated Bundle'}
              </h3>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="p-1 rounded-lg hover:bg-pearl text-mocha-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">
                {lang === 'ar' ? 'اسم الباقة بالعربية:' : 'Package Name (Arabic):'}
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: باقة العروسة الملكية الشاملة"
                className="w-full px-3 py-2 rounded-xl border border-pearl text-xs focus:border-rosegold-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">
                {lang === 'ar' ? 'الاسم بالإنجليزية:' : 'Package Name (English):'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Royal Bridal Ritual"
                className="w-full px-3 py-2 rounded-xl border border-pearl text-xs focus:border-rosegold-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">
                {lang === 'ar' ? 'وصف الباقة ومميزاتها:' : 'Description:'}
              </label>
              <textarea
                rows={2}
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                placeholder="تفاصيل الخدمات والطقوس المتضمنة..."
                className="w-full px-3 py-2 rounded-xl border border-pearl text-xs focus:border-rosegold-400 focus:outline-none"
              />
            </div>

            {/* Multi-Service Selector */}
            <div>
              <label className="block text-xs font-semibold text-espresso mb-1.5">
                {lang === 'ar' ? 'اختاري الجلسات المتضمنة في الباقة:' : 'Select Bundled Services:'}
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto border border-pearl rounded-xl p-2 bg-ivory/40 admin-scroll">
                {defaultServices.map((s) => {
                  const isChecked = selectedServiceIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white cursor-pointer text-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServiceIds([...selectedServiceIds, s.id]);
                            } else {
                              setSelectedServiceIds(
                                selectedServiceIds.filter((id) => id !== s.id),
                              );
                            }
                          }}
                          className="rounded text-rosegold-600 focus:ring-rosegold-400"
                        />
                        <span className="font-medium text-espresso">
                          {lang === 'ar' ? s.name_ar : s.name_en}
                        </span>
                      </div>
                      <span className="font-mono text-mocha-500">
                        {formatPrice(s.price, lang)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'سعر الباقة (ج.م):' : 'Package Price (EGP):'}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-pearl font-mono text-xs focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'المدة التقديرية (دقيقة):' : 'Duration (minutes):'}
                </label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-pearl font-mono text-xs focus:border-rosegold-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-pearl">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 rounded-xl border border-pearl text-xs font-medium text-mocha-600 hover:bg-pearl/50"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory text-xs font-semibold shadow-soft"
              >
                {editingPkg
                  ? lang === 'ar'
                    ? 'حفظ التعديلات'
                    : 'Save Changes'
                  : lang === 'ar'
                  ? 'إنشاء الباقة'
                  : 'Create Bundle'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

