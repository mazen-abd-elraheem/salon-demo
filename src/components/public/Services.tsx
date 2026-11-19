import { useState } from 'react';
import { ArrowUpRight, ArrowUpLeft, Clock, Sparkles, Layers, Check } from 'lucide-react';
import type { Service, Package } from '../../lib/types';
import { formatDuration, formatPrice } from '../../lib/format';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalPackages } from '../../lib/mockData';
import PhImage from './PhImage';

interface ServicesProps {
  services: Service[];
  loading: boolean;
  onSelect: (service: Service) => void;
  defaultTab?: 'services' | 'packages';
}

const FALLBACK_SHEET_KEYS = [
  'ringa:1',
  'life:0',
  'ringb:3',
  'ringb:1',
  'studio:1',
  'ringa:3',
  'pre:1',
  'styled:0',
];

export default function Services({
  services,
  loading,
  onSelect,
  defaultTab = 'services',
}: ServicesProps) {
  const { t, lang, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>(defaultTab);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const packages = getLocalPackages().filter((p) => p.is_active);

  const categories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean)),
  ) as string[];

  const filteredServices = services.filter((s) => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  return (
    <section
      id="catalog"
      className="relative py-20 lg:py-28"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <div className="container-page">
        {/* Section Header */}
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {t('servicesEyebrow')}
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.12]">
              {t('servicesTitle1')}{' '}
              <span className="it text-[#b14bd9]">{t('servicesTitle2')}</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
            {t('servicesSubtitle')}
          </p>
        </div>

        {/* View Switcher: Services vs Packages */}
        <div
          className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b pb-4"
          style={{ borderColor: 'var(--lines, #e8d7e4)' }}
        >
          <div
            className="inline-flex rounded-full p-1"
            style={{ backgroundColor: 'var(--secondbg, #f3e6f0)' }}
          >
            <button
              onClick={() => setActiveTab('services')}
              className={[
                'inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition cursor-pointer border-0',
                activeTab === 'services'
                  ? 'bg-[#cbb6ea] text-[#2c1433] shadow-clean'
                  : 'bg-transparent opacity-70 hover:opacity-100',
              ].join(' ')}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('servicesTab')}</span>
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={[
                'inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition cursor-pointer border-0',
                activeTab === 'packages'
                  ? 'bg-[#cbb6ea] text-[#2c1433] shadow-clean'
                  : 'bg-transparent opacity-70 hover:opacity-100',
              ].join(' ')}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>
                {t('packagesTab')} ({packages.length})
              </span>
            </button>
          </div>

          {/* Categories Filter */}
          {activeTab === 'services' && categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={[
                  'rounded-full px-3.5 py-1.5 text-xs font-medium transition cursor-pointer border',
                  selectedCategory === 'all'
                    ? 'bg-[#3a1d43] text-[#f9f0f5] border-[#3a1d43]'
                    : 'bg-white/70 border-[var(--lines)] hover:border-[#b14bd9]',
                ].join(' ')}
              >
                {t('allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={[
                    'rounded-full px-3.5 py-1.5 text-xs font-medium transition cursor-pointer border',
                    selectedCategory === cat
                      ? 'bg-[#3a1d43] text-[#f9f0f5] border-[#3a1d43]'
                      : 'bg-white/70 border-[var(--lines)] hover:border-[#b14bd9]',
                  ].join(' ')}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Individual Services Grid */}
        {activeTab === 'services' && (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

            {!loading && filteredServices.length === 0 && (
              <div
                className="col-span-full rounded-3xl border p-12 text-center shadow-clean"
                style={{
                  backgroundColor: 'var(--secondbg, #f3e6f0)',
                  borderColor: 'var(--lines, #e8d7e4)',
                }}
              >
                <p className="text-xl font-semibold">{t('noServicesTitle')}</p>
                <p className="mt-2 text-sm opacity-70">{t('noServicesSubtitle')}</p>
              </div>
            )}

            {!loading &&
              filteredServices.map((service, idx) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelect={onSelect}
                  index={idx}
                  lang={lang}
                  isRTL={isRTL}
                  reserveLabel={t('reserveRitual')}
                />
              ))}
          </div>
        )}

        {/* Packages & Bundles Grid */}
        {activeTab === 'packages' && (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, idx) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                services={services}
                onSelect={onSelect}
                index={idx}
                lang={lang}
                isRTL={isRTL}
                reserveLabel={t('reserveRitual')}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  onSelect,
  index,
  lang,
  isRTL,
  reserveLabel,
}: {
  service: Service;
  onSelect: (s: Service) => void;
  index: number;
  lang: 'en' | 'ar';
  isRTL: boolean;
  reserveLabel: string;
}) {
  const displayName =
    lang === 'ar' && service.name_ar ? service.name_ar : service.name_en || service.name || '';
  const displayDescription =
    lang === 'ar' && service.description_ar
      ? service.description_ar
      : service.description_en || service.description;

  const sheetKey = service.sheet_key || FALLBACK_SHEET_KEYS[index % FALLBACK_SHEET_KEYS.length];

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border transition duration-300 hover:-translate-y-1 shadow-clean hover:shadow-soft"
      style={{
        backgroundColor: 'var(--secondbg, #f3e6f0)',
        borderColor: 'var(--lines, #e8d7e4)',
      }}
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        <PhImage
          imgKey={sheetKey}
          customImageUrl={service.image_url}
          className="h-full w-full transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#25142d]/45 via-transparent to-transparent" />
        <div className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#3a1d43] shadow-clean backdrop-blur-sm">
          <Clock className="h-3.5 w-3.5 text-[#b14bd9]" />
          <span>{formatDuration(service.duration_minutes, lang)}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base sm:text-lg font-semibold leading-snug">
            {displayName}
          </h3>
          <span className="text-base sm:text-lg font-bold text-[#b14bd9] whitespace-nowrap shrink-0 tabular-nums">
            {formatPrice(service.price, lang)}
          </span>
        </div>

        {displayDescription && (
          <p
            className="mt-2.5 line-clamp-2 text-xs leading-relaxed"
            style={{ color: 'var(--fonts-64, #3a1d43a3)' }}
          >
            {displayDescription}
          </p>
        )}

        <div className="mt-auto pt-5">
          <button
            onClick={() => onSelect(service)}
            className="inline-flex items-center gap-2 text-xs font-semibold transition hover:text-[#b14bd9] cursor-pointer bg-transparent border-0 p-0"
            style={{ color: 'var(--fonts-100, #3a1d43)' }}
          >
            <span>{reserveLabel}</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#cbb6ea] text-[#2c1433] transition-transform group-hover:scale-110">
              {isRTL ? <ArrowUpLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

function PackageCard({
  pkg,
  services,
  onSelect,
  index,
  lang,
  isRTL,
  reserveLabel,
}: {
  pkg: Package;
  services: Service[];
  onSelect: (s: Service) => void;
  index: number;
  lang: 'en' | 'ar';
  isRTL: boolean;
  reserveLabel: string;
}) {
  const displayName = lang === 'ar' ? pkg.name_ar : pkg.name_en || pkg.name_ar;
  const displayDescription =
    lang === 'ar' ? pkg.description_ar : pkg.description_en || pkg.description_ar;
  const sheetKey = pkg.sheet_key || (index % 2 === 0 ? 'life:2' : 'life:1');

  const handleSelectPackage = () => {
    const pkgService: Service = {
      id: pkg.id,
      name: pkg.name_en || pkg.name_ar,
      name_ar: pkg.name_ar,
      name_en: pkg.name_en || pkg.name_ar,
      description: pkg.description_en || pkg.description_ar,
      description_ar: pkg.description_ar,
      description_en: pkg.description_en,
      duration_minutes: pkg.duration_minutes,
      price: pkg.price,
      image_url: pkg.image_url,
      sheet_key: sheetKey,
      is_active: true,
      category: 'bridal',
      room_type_required: 'general',
    };
    onSelect(pkgService);
  };

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border-2 border-[#cbb6ea] transition duration-300 hover:-translate-y-1 shadow-clean hover:shadow-soft"
      style={{ backgroundColor: 'var(--secondbg, #f3e6f0)' }}
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        <PhImage
          imgKey={sheetKey}
          customImageUrl={pkg.image_url}
          className="h-full w-full transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#25142d]/50 via-transparent to-transparent" />
        <div className="absolute top-3 end-3 rounded-full bg-[#cbb6ea] px-3 py-1 text-[11px] font-semibold text-[#2c1433] shadow-clean">
          {lang === 'ar' ? 'باقة غزل الملكية' : 'Guzel Signature Bundle'}
        </div>
        <div className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#3a1d43] shadow-clean backdrop-blur-sm">
          <Clock className="h-3.5 w-3.5 text-[#b14bd9]" />
          <span>{formatDuration(pkg.duration_minutes, lang)}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base sm:text-lg font-semibold leading-snug">{displayName}</h3>
          <div className="text-end shrink-0">
            <div className="text-base sm:text-lg font-bold text-[#b14bd9] whitespace-nowrap tabular-nums">
              {formatPrice(pkg.price, lang)}
            </div>
          </div>
        </div>

        {displayDescription && (
          <p
            className="mt-2.5 line-clamp-2 text-xs leading-relaxed"
            style={{ color: 'var(--fonts-64, #3a1d43a3)' }}
          >
            {displayDescription}
          </p>
        )}

        <div
          className="mt-4 space-y-1.5 border-t pt-3"
          style={{ borderColor: 'var(--lines, #e8d7e4)' }}
        >
          {(pkg.services?.slice(0, 3) || services.slice(0, 3)).map((svc: Service) => (
            <div
              key={svc.id}
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--fonts-64, #3a1d43a3)' }}
            >
              <Check className="h-3.5 w-3.5 text-[#b14bd9] shrink-0" />
              <span className="truncate">{lang === 'ar' ? svc.name_ar : svc.name_en}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-5">
          <button
            onClick={handleSelectPackage}
            className="w-full py-2.5 px-4 rounded-full bg-[#cbb6ea] text-[#2c1433] hover:bg-[#e58fb6] text-xs font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer border-0"
          >
            <span>{reserveLabel}</span>
            {isRTL ? <ArrowUpLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-[1.75rem] border p-5 animate-pulse"
      style={{
        backgroundColor: 'var(--secondbg, #f3e6f0)',
        borderColor: 'var(--lines, #e8d7e4)',
      }}
    >
      <div className="aspect-[16/11] w-full rounded-2xl bg-[#cbb6ea]/30" />
      <div className="mt-4 h-5 w-2/3 rounded bg-[#cbb6ea]/30" />
      <div className="mt-2 h-3 w-full rounded bg-[#cbb6ea]/20" />
      <div className="mt-2 h-3 w-4/5 rounded bg-[#cbb6ea]/20" />
    </div>
  );
}
