import { useState, useMemo } from 'react';
import {
  Sparkles,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  ShieldCheck,
  Heart,
  Crown,
  ChevronRight,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import type { Service, Package } from '../../lib/types';
import { imageForService, genericServiceImage } from '../../lib/images';
import { formatDuration, formatPrice } from '../../lib/format';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalPackages } from '../../lib/mockData';

interface ServiceShowcaseProps {
  services: Service[];
  onSelect: (service: Service) => void;
}

export default function ServiceShowcase({ services, onSelect }: ServiceShowcaseProps) {
  const { t, lang, isRTL } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>(() => services[0]?.id || 'svc-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('services');

  const packages = useMemo(() => getLocalPackages().filter((p) => p.is_active), []);

  const categories = useMemo(() => {
    return Array.from(new Set(services.map((s) => s.category).filter(Boolean))) as string[];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const activeService = useMemo(() => {
    return services.find((s) => s.id === selectedId) || filteredServices[0] || services[0];
  }, [services, selectedId, filteredServices]);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section
      id="showcase"
      className="relative overflow-hidden bg-gradient-to-b from-[#faf6f1] via-[#f7edf5]/60 to-[#faf6f1] py-24 lg:py-32"
    >
      {/* Soft Ambient Radial Accents */}
      <div className="pointer-events-none absolute -start-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#cbb6ea]/25 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -end-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-[#e58fb6]/20 to-transparent blur-3xl" />

      <div className="container-page relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow">
              <span className="eyebrow-dot bg-[#e58fb6]" />
              {t('showcaseEyebrow')}
            </span>
            <h2 className="heading-display mt-4 text-3xl font-semibold leading-[1.12] text-espresso sm:text-4xl lg:text-5xl">
              {t('showcaseTitle1')}{' '}
              <span className="it text-3xl text-rosegold-500 sm:text-4xl lg:text-5xl">
                {t('showcaseTitle2')}
              </span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-mocha-600">
            {t('showcaseSubtitle')}
          </p>
        </div>

        {/* View & Category Filters Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-pearl/80 pb-5">
          {/* Switcher: All Services vs Royal Packages */}
          <div className="inline-flex rounded-2xl bg-pearl/60 p-1 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('services')}
              className={[
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200',
                activeTab === 'services'
                  ? 'bg-espresso text-ivory shadow-clean'
                  : 'text-mocha-600 hover:text-espresso',
              ].join(' ')}
            >
              <Sparkles className="h-3.5 w-3.5 text-rosegold-300" />
              <span>{t('servicesTab')}</span>
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={[
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200',
                activeTab === 'packages'
                  ? 'bg-espresso text-ivory shadow-clean'
                  : 'text-mocha-600 hover:text-espresso',
              ].join(' ')}
            >
              <Crown className="h-3.5 w-3.5 text-rosegold-300" />
              <span>
                {t('packagesTab')} ({packages.length})
              </span>
            </button>
          </div>

          {/* Category Chips */}
          {activeTab === 'services' && categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={[
                  'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
                  selectedCategory === 'all'
                    ? 'bg-espresso text-ivory shadow-clean'
                    : 'border border-pearl/90 bg-white/80 text-mocha-600 hover:border-mocha-400',
                ].join(' ')}
              >
                {t('allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={[
                    'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
                    selectedCategory === cat
                      ? 'bg-espresso text-ivory shadow-clean'
                      : 'border border-pearl/90 bg-white/80 text-mocha-600 hover:border-mocha-400',
                  ].join(' ')}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RESHOOT-INSPIRED EDITORIAL SHOWCASE PANEL (Dark Luxury Studio) */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#25142d] p-6 shadow-2xl sm:p-8 lg:p-10">
          {/* Top Bar inside the Panel */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 text-[#f6e9f4]">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#cbb6ea] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider-2 text-[#f6e9f4]/80">
                {t('showcaseTag')}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#f6e9f4]/70">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#cbb6ea]" />
                <span>{t('showcasePrivateCabin')}</span>
              </span>
              <span className="hidden sm:inline-block">·</span>
              <span className="hidden tabular-nums sm:inline-block">
                {filteredServices.length} {lang === 'ar' ? 'جلسة متاحة للمعاينة' : 'Active rituals'}
              </span>
            </div>
          </div>

          {/* Main Showcase Layout: Left Feature Card + Center Flow + Right Dashboard Grid */}
          <div className="mt-8 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
            {/* 1. Feature Stage (The Currently Selected Service in High Polish) */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/15 bg-[#1b0f22] p-5 shadow-lg lg:col-span-5">
              {/* Feature Media */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/40 sm:aspect-[16/11]">
                <img
                  src={
                    activeService
                      ? imageForService(activeService.name_ar || activeService.name).url
                      : genericServiceImage
                  }
                  alt={activeService?.name_ar || activeService?.name || 'Ritual'}
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b0f22] via-transparent to-transparent opacity-80" />

                {/* Top Overlay Badges */}
                <div className="absolute top-3.5 start-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#cbb6ea] px-3 py-1 text-[11px] font-bold text-[#2c1433] shadow-md">
                  <Sparkles className="h-3 w-3" />
                  <span>{t('showcaseSelectedBadge')}</span>
                </div>

                <div className="absolute top-3.5 end-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#2c1433]/80 px-3 py-1 text-xs font-semibold text-white shadow-clean backdrop-blur-md">
                  <Clock className="h-3.5 w-3.5 text-[#cbb6ea]" />
                  <span className="tabular-nums">
                    {activeService ? formatDuration(activeService.duration_minutes, lang) : '—'}
                  </span>
                </div>
              </div>

              {/* Feature Content Glass Card */}
              <div className="mt-5 flex flex-1 flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur-md">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-[#cbb6ea]">
                      {activeService?.category || 'Ritual'}
                    </span>
                    <span className="it text-2xl font-bold tabular-nums text-[#e58fb6]">
                      {activeService ? formatPrice(activeService.price, lang) : '—'}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-xl font-bold leading-snug text-white sm:text-2xl">
                    {lang === 'ar' && activeService?.name_ar
                      ? activeService.name_ar
                      : activeService?.name || 'جلسة استرخاء ملكية'}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-[#f6e9f4]/75 sm:text-sm">
                    {lang === 'ar' && activeService?.description_ar
                      ? activeService.description_ar
                      : activeService?.description ||
                        'طقوس متكاملة معطرة بأجود الزيوت الطبيعية داخل كابينة خاصة ومعقمة بالكامل لضمان الراحة التامة.'}
                  </p>
                </div>

                {/* Quick Action Button */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    onClick={() => activeService && onSelect(activeService)}
                    className="group relative flex w-full items-center justify-center gap-3 rounded-full bg-[#cbb6ea] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#2c1433] transition-all duration-300 hover:bg-[#e58fb6] hover:text-white active:scale-[0.98]"
                  >
                    <span>{t('showcaseBookNow')}</span>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#2c1433]/15 transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-white/20">
                      <ArrowIcon className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Interactive Dashboard Grid (Live 5x2 or Multi-card Showcase) */}
            <div className="flex flex-col rounded-3xl border border-white/10 bg-[#1e1126] p-5 lg:col-span-7">
              {/* Dashboard Subheader */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h4 className="font-display text-base font-semibold text-white">
                    {t('showcaseGeneratedTitle')}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-[#f6e9f4]/60">
                    {t('showcaseFilterHint')}
                  </p>
                </div>
                <span className="hidden rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-[#cbb6ea] sm:inline-block">
                  {filteredServices.length} {lang === 'ar' ? 'جلسات' : 'items'}
                </span>
              </div>

              {/* Grid of Dynamic Services */}
              <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4">
                {filteredServices.slice(0, 6).map((svc) => {
                  const isSelected = svc.id === selectedId;
                  const img = imageForService(svc.name_ar || svc.name).url;
                  const name = (lang === 'ar' && svc.name_ar) ? svc.name_ar : svc.name;

                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setSelectedId(svc.id)}
                      className={[
                        'group relative flex flex-col overflow-hidden rounded-2xl border text-start transition-all duration-300',
                        isSelected
                          ? 'border-[#cbb6ea] bg-[#2d1938] shadow-lg shadow-[#cbb6ea]/10 ring-2 ring-[#cbb6ea]'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 hover:-translate-y-0.5',
                      ].join(' ')}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
                        <img
                          src={img}
                          alt={name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1126] via-transparent to-transparent opacity-80" />

                        {/* Top-end Check Badge */}
                        <div
                          className={[
                            'absolute top-2 end-2 flex h-6 w-6 items-center justify-center rounded-full transition-colors',
                            isSelected
                              ? 'bg-[#cbb6ea] text-[#2c1433]'
                              : 'bg-black/50 text-white/50 backdrop-blur-sm group-hover:text-white',
                          ].join(' ')}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        </div>

                        {/* Bottom-start Duration Chip */}
                        <div className="absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                          <Clock className="h-2.5 w-2.5 text-[#cbb6ea]" />
                          <span className="tabular-nums">
                            {formatDuration(svc.duration_minutes, lang)}
                          </span>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="flex flex-1 flex-col justify-between p-3">
                        <h5 className="line-clamp-2 text-xs font-semibold leading-snug text-white group-hover:text-[#cbb6ea]">
                          {name}
                        </h5>
                        <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
                          <span className="tabular-nums font-bold text-[#e58fb6]">
                            {formatPrice(svc.price, lang)}
                          </span>
                          <span className="text-[10px] text-white/50 group-hover:text-white">
                            {isSelected ? (lang === 'ar' ? 'محددة' : 'Active') : (lang === 'ar' ? 'معاينة' : 'View')}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Quick Row: Book Selected or View Full Menu */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
                <span className="text-[#f6e9f4]/70">
                  {lang === 'ar' ? 'يمكنكِ تحديد أكثر من خدمة عند تأكيد الحجز' : 'Multi-service cart available in booking step'}
                </span>
                <a
                  href="#booking"
                  onClick={() => activeService && onSelect(activeService)}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#cbb6ea] hover:text-white transition"
                >
                  <span>{t('showcaseBookNow')}</span>
                  <ArrowIcon className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FOUR STEP EXPERIENCE ROW (Inspired by Section 4 Four Steps)  */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-14">
          <div className="text-center">
            <span className="eyebrow">
              <span className="eyebrow-dot bg-[#cbb6ea]" />
              {lang === 'ar' ? 'تجربة ميزون لوميير المتقنة' : 'The Lumière Experience'}
            </span>
            <h3 className="heading-display mt-3 text-2xl font-semibold text-espresso sm:text-3xl">
              {lang === 'ar' ? 'أربع خطوات تضمن لكِ' : 'Four Steps to a'}{' '}
              <span className="it text-rosegold-500">
                {lang === 'ar' ? 'أعلى درجات الراحة والتألق' : 'Radiant Experience'}
              </span>
            </h3>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-pearl/80 bg-gradient-to-br from-[#f9d6c8]/35 via-[#efcfdc]/25 to-[#d8c5f1]/35 p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-clean">
              <div>
                <span className="it block text-4xl font-bold text-[#b86949]/40 group-hover:text-[#b86949]">
                  01
                </span>
                <h4 className="mt-3 font-display text-base font-bold text-espresso">
                  {t('showcaseStep1Tag')}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-mocha-600">
                  {t('showcaseStep1Text')}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold text-rosegold-500">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'جلسات وباقات ملكية' : 'Curated Rituals'}</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-pearl/80 bg-gradient-to-br from-[#f6d0d9]/35 via-[#e7c9e8]/25 to-[#cdb9ef]/35 p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-clean">
              <div>
                <span className="it block text-4xl font-bold text-[#b86949]/40 group-hover:text-[#b86949]">
                  02
                </span>
                <h4 className="mt-3 font-display text-base font-bold text-espresso">
                  {t('showcaseStep2Tag')}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-mocha-600">
                  {t('showcaseStep2Text')}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold text-rosegold-500">
                <Heart className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'أخصائيات خريجات مراكش' : 'Master Therapists'}</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-pearl/80 bg-gradient-to-br from-[#f8dccd]/35 via-[#f1cfe0]/25 to-[#dcc3ee]/35 p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-clean">
              <div>
                <span className="it block text-4xl font-bold text-[#b86949]/40 group-hover:text-[#b86949]">
                  03
                </span>
                <h4 className="mt-3 font-display text-base font-bold text-espresso">
                  {t('showcaseStep3Tag')}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-mocha-600">
                  {t('showcaseStep3Text')}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold text-rosegold-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'تعقيم طبي وأجنحة مستقلة' : '100% Sanitized Suites'}</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-pearl/80 bg-gradient-to-br from-[#efd2ea]/35 via-[#e2c6ef]/25 to-[#c9b6f0]/35 p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-clean">
              <div>
                <span className="it block text-4xl font-bold text-[#b86949]/40 group-hover:text-[#b86949]">
                  04
                </span>
                <h4 className="mt-3 font-display text-base font-bold text-espresso">
                  {t('showcaseStep4Tag')}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-mocha-600">
                  {t('showcaseStep4Text')}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold text-rosegold-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'سداد ذكي وفاتورة QR' : 'Smart 50% & QR Pass'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
