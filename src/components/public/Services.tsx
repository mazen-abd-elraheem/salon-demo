import { useState } from 'react';
import { ArrowUpRight, ArrowUpLeft, Clock, Sparkles, Layers, Check } from 'lucide-react';
import type { Service, Package } from '../../lib/types';
import { imageForService, genericServiceImage } from '../../lib/images';
import { formatDuration, formatPrice } from '../../lib/format';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalPackages } from '../../lib/mockData';

interface ServicesProps {
  services: Service[];
  loading: boolean;
  onSelect: (service: Service) => void;
}

export default function Services({ services, loading, onSelect }: ServicesProps) {
  const { t, lang, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('services');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const packages = getLocalPackages().filter((p) => p.is_active);

  // Unique categories
  const categories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean))
  ) as string[];

  const filteredServices = services.filter((s) => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  return (
    <section id="services" className="relative py-20 lg:py-28 bg-white/40">
      <div className="container-page">
        {/* Section Header */}
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {t('servicesEyebrow')}
            </span>
            <h2 className="heading-display mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.12] text-espresso">
              {t('servicesTitle1')}{' '}
              <span className="italic font-normal text-rosegold-500">{t('servicesTitle2')}</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-mocha-600">
            {t('servicesSubtitle')}
          </p>
        </div>

        {/* View Switcher: Services vs Packages */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-pearl/80 pb-4">
          <div className="inline-flex rounded-2xl bg-pearl/50 p-1">
            <button
              onClick={() => setActiveTab('services')}
              className={[
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition',
                activeTab === 'services'
                  ? 'bg-espresso text-ivory shadow-clean'
                  : 'text-mocha-600 hover:text-espresso',
              ].join(' ')}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('servicesTab')}</span>
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={[
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition',
                activeTab === 'packages'
                  ? 'bg-espresso text-ivory shadow-clean'
                  : 'text-mocha-600 hover:text-espresso',
              ].join(' ')}
            >
              <Layers className="h-3.5 w-3.5 text-rosegold-300" />
              <span>{t('packagesTab')} ({packages.length})</span>
            </button>
          </div>

          {/* Categories Filter (Only visible when viewing individual services) */}
          {activeTab === 'services' && categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium transition',
                  selectedCategory === 'all'
                    ? 'bg-espresso text-ivory shadow-clean'
                    : 'bg-white border border-pearl/80 text-mocha-600 hover:border-mocha-400',
                ].join(' ')}
              >
                {t('allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={[
                    'rounded-full px-3 py-1 text-xs font-medium transition',
                    selectedCategory === cat
                      ? 'bg-espresso text-ivory shadow-clean'
                      : 'bg-white border border-pearl/80 text-mocha-600 hover:border-mocha-400',
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
              <div className="col-span-full rounded-2xl border border-pearl/80 bg-white p-12 text-center shadow-clean">
                <p className="font-display text-xl text-espresso font-semibold">
                  {t('noServicesTitle')}
                </p>
                <p className="mt-2 text-sm text-mocha-500">
                  {t('noServicesSubtitle')}
                </p>
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
  const [imgSrc, setImgSrc] = useState<string>(() => imageForService(service.name).url);
  const displayName = (lang === 'ar' && service.name_ar) ? service.name_ar : service.name;
  const displayDescription = (lang === 'ar' && service.description_ar) ? service.description_ar : service.description;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-pearl/80 bg-white shadow-clean transition duration-300 hover:-translate-y-1 hover:shadow-soft"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-cream">
        <img
          src={imgSrc}
          alt={displayName}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={() => setImgSrc(genericServiceImage)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 via-transparent to-transparent" />
        <div className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-espresso shadow-clean backdrop-blur-sm">
          <Clock className="h-3.5 w-3.5 text-rosegold-500" />
          <span>{formatDuration(service.duration_minutes, lang)}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base sm:text-lg font-semibold leading-snug text-espresso">
            {displayName}
          </h3>
          <span className="font-display text-base sm:text-lg font-bold text-rosegold-500 whitespace-nowrap shrink-0 tabular-nums">
            {formatPrice(service.price, lang)}
          </span>
        </div>

        {displayDescription && (
          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-mocha-600">
            {displayDescription}
          </p>
        )}

        <div className="mt-auto pt-5">
          <button
            onClick={() => onSelect(service)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-espresso transition hover:text-rosegold-500"
          >
            <span>{reserveLabel}</span>
            <span className="grid h-6 w-6 place-items-center rounded-full border border-pearl/90 transition-transform group-hover:translate-x-0.5">
              {isRTL ? <ArrowUpLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
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
  const [imgSrc, setImgSrc] = useState<string>(genericServiceImage);
  const displayName = lang === 'ar' ? pkg.name_ar : (pkg.name_en || pkg.name_ar);
  const displayDescription = lang === 'ar' ? pkg.description_ar : (pkg.description_en || pkg.description_ar);

  // Convert package to service shape for booking selection
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
      is_active: true,
      category: 'bridal',
      room_type_required: 'general',
    };
    onSelect(pkgService);
  };

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-rosegold-200 bg-white shadow-clean transition duration-300 hover:-translate-y-1 hover:shadow-soft"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-cream">
        <img
          src={imgSrc}
          alt={displayName}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={() => setImgSrc(genericServiceImage)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/50 via-transparent to-transparent" />
        <div className="absolute top-3 end-3 rounded-full bg-rosegold-500 px-3 py-1 text-[11px] font-semibold text-white shadow-clean">
          {lang === 'ar' ? 'باقة ملكية مجمعة' : 'Curated Bundle'}
        </div>
        <div className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-espresso shadow-clean backdrop-blur-sm">
          <Clock className="h-3.5 w-3.5 text-rosegold-500" />
          <span>{formatDuration(pkg.duration_minutes, lang)}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-snug text-espresso">
            {displayName}
          </h3>
          <div className="text-end shrink-0">
            <div className="font-display text-lg font-bold text-rosegold-500 whitespace-nowrap">
              {formatPrice(pkg.price, lang)}
            </div>
          </div>
        </div>

        {displayDescription && (
          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-mocha-600">
            {displayDescription}
          </p>
        )}

        <div className="mt-4 space-y-1.5 border-t border-pearl/70 pt-3">
          {pkg.services?.slice(0, 3).map((svc: Service) => {
            return (
              <div key={svc.id} className="flex items-center gap-1.5 text-xs text-mocha-600">
                <Check className="h-3.5 w-3.5 text-rosegold-400 shrink-0" />
                <span className="truncate">{lang === 'ar' ? svc.name_ar || svc.name : (svc.name_en || svc.name)}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-5">
          <button
            onClick={handleSelectPackage}
            className="btn-primary w-full text-xs py-2.5"
          >
            <span>{reserveLabel}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-pearl/80 bg-white p-4 shadow-clean animate-pulse">
      <div className="aspect-[16/10] rounded-xl bg-pearl/60" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-2/3 rounded bg-pearl/70" />
        <div className="h-3 w-full rounded bg-pearl/50" />
        <div className="h-3 w-4/5 rounded bg-pearl/50" />
      </div>
    </div>
  );
}