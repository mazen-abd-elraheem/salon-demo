import { useMemo, useState } from 'react';
import { ArrowUpLeft, ArrowUpRight, Check, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { Package, Product, Service } from '../../lib/types';
import { formatDuration, formatPrice } from '../../lib/format';
import PhImage from './PhImage';
import { GuzelSparkIcon } from './GuzelSvgIcons';

interface GuzelShowcasePanelProps {
  services: Service[];
  products: Product[];
  packages: Package[];
  onSelectService: (svc: Service) => void;
}

const DEFAULT_CELL_KEYS = [
  'styled:0', // 1 (selected)
  'studio:0', // 2
  'styled:1', // 3
  'life:1',   // 4 (selected)
  'styled2:3',// 5
  'ringa:1',  // 6
  'styled2:0',// 7 (selected)
  'life:3',   // 8
  'styled:4', // 9
  'studio:1', // 10
];

export default function GuzelShowcasePanel({
  services,
  products,
  packages,
  onSelectService,
}: GuzelShowcasePanelProps) {
  const { lang, isRTL } = useLanguage();
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0, 3, 6]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'all' | 'services' | 'products'>('all');

  // Build 10 interactive catalog items combining Admin Services, Products & Packages
  const showcaseItems = useMemo(() => {
    const items: {
      id: string;
      type: 'service' | 'product' | 'package';
      titleAr: string;
      titleEn: string;
      subtitleAr: string;
      subtitleEn: string;
      price: number;
      duration?: number;
      imgKey: string;
      customImageUrl?: string | null;
      rawService?: Service;
    }[] = [];

    const poolServices = filterMode === 'products' ? [] : services;
    const poolProducts = filterMode === 'services' ? [] : products;

    let idx = 0;
    for (const s of poolServices) {
      if (items.length >= 10) break;
      items.push({
        id: s.id,
        type: 'service',
        titleAr: s.name_ar || s.name || 'جلسة جوزال ميديكال سبا',
        titleEn: s.name_en || s.name || 'Guzel Medical Spa Ritual',
        subtitleAr: s.description_ar || 'جلسة عناية متكاملة بأحدث التقنيات الطبية',
        subtitleEn: s.description_en || 'Signature clinical spa ritual',
        price: s.price,
        duration: s.duration_minutes,
        imgKey: s.sheet_key || DEFAULT_CELL_KEYS[idx % DEFAULT_CELL_KEYS.length],
        customImageUrl: s.image_url,
        rawService: s,
      });
      idx++;
    }

    for (const p of poolProducts) {
      if (items.length >= 10) break;
      items.push({
        id: p.id,
        type: 'product',
        titleAr: p.name_ar,
        titleEn: p.name_en,
        subtitleAr: p.description_ar || 'منتج عناية أصلي من مجموعة جوزال',
        subtitleEn: p.description_en || 'Guzel botanical skincare line',
        price: p.price,
        imgKey: p.sheet_key || DEFAULT_CELL_KEYS[idx % DEFAULT_CELL_KEYS.length],
        customImageUrl: p.image_url,
      });
      idx++;
    }

    for (const pkg of packages) {
      if (items.length >= 10) break;
      items.push({
        id: pkg.id,
        type: 'package',
        titleAr: pkg.name_ar,
        titleEn: pkg.name_en,
        subtitleAr: pkg.description_ar || 'باقة ملكية متكاملة',
        subtitleEn: pkg.description_en || 'Curated luxury spa bundle',
        price: pkg.price,
        duration: pkg.duration_minutes,
        imgKey: pkg.sheet_key || DEFAULT_CELL_KEYS[idx % DEFAULT_CELL_KEYS.length],
        customImageUrl: pkg.image_url,
      });
      idx++;
    }

    while (items.length < 10) {
      const k = DEFAULT_CELL_KEYS[items.length % DEFAULT_CELL_KEYS.length];
      const fallbackSvc = services[items.length % Math.max(1, services.length)];
      items.push({
        id: `cell-${items.length}`,
        type: 'service',
        titleAr: fallbackSvc?.name_ar || 'طقس جوزال الملكي للنضارة',
        titleEn: fallbackSvc?.name_en || 'Guzel Radiance Ritual',
        subtitleAr: 'جلسة عناية فاخرة',
        subtitleEn: 'Luxury beauty session',
        price: fallbackSvc?.price || 1500,
        duration: fallbackSvc?.duration_minutes || 60,
        imgKey: k,
        customImageUrl: fallbackSvc?.image_url || null,
        rawService: fallbackSvc,
      });
    }

    return items.slice(0, 10);
  }, [filterMode, packages, products, services]);

  const activeItem = showcaseItems[activeIndex] || showcaseItems[0];

  const handleCellClick = (index: number) => {
    setActiveIndex(index);
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleBookActive = () => {
    if (activeItem?.rawService) {
      onSelectService(activeItem.rawService);
    } else if (services.length > 0) {
      onSelectService(services[0]);
    }
  };

  const ArrowIcon = isRTL ? ArrowUpLeft : ArrowUpRight;

  return (
    <section id="services" className="relative w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div id="pdp" className="-mt-24 pt-24" />

      {/* Centered Editorial Showcase Container — ZERO Edge Clipping */}
      <div
        className="relative mx-auto w-full max-w-7xl rounded-[2rem] sm:rounded-[3rem] border p-5 sm:p-8 lg:p-12 overflow-hidden"
        style={{
          backgroundColor: 'var(--secondbg, #f3e6f0)',
          borderColor: 'rgba(58, 29, 67, 0.08)',
          color: 'var(--fonts-100, #3a1d43)',
          boxShadow: '0 24px 64px -24px rgba(58, 29, 67, 0.12)',
        }}
      >
        {/* Subtle Editorial Radial Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -end-24 h-80 w-80 rounded-full blur-3xl opacity-45"
          style={{
            background:
              'radial-gradient(circle, rgba(203,182,234,0.65) 0%, rgba(229,143,182,0.2) 55%, transparent 75%)',
          }}
        />

        {/* Top Eyebrow & Section Header */}
        <div className="relative z-[2] flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-[#3a1d43]/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-[#73358c] shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#b14bd9]" />
              <span>
                {lang === 'ar'
                  ? 'استوديو خدمات ومنتجات جوزال ميديكال سبا'
                  : 'Guzel Medical Spa Services & Skincare Studio'}
              </span>
            </span>

            <h2
              className="mt-4 font-display font-bold tracking-tight text-[#3a1d43]"
              style={{
                fontSize: 'clamp(1.75rem, 3.2vw, 3rem)',
                lineHeight: lang === 'ar' ? 1.25 : 1.08,
              }}
            >
              {lang === 'ar' ? (
                <>
                  استعرضي جلساتنا ومنتجاتنا{' '}
                  <span
                    className="text-[#b14bd9]"
                    style={{
                      fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
                      fontStyle: 'normal',
                    }}
                  >
                    بتجربة تفاعلية
                  </span>
                </>
              ) : (
                <>
                  Explore our rituals &amp; serums,{' '}
                  <span className="it text-[#b14bd9]">beautifully</span> curated.
                </>
              )}
            </h2>
          </div>

          {/* Filter Segmented Control */}
          <div
            className="inline-flex items-center gap-1 rounded-full p-1 border self-start md:self-auto"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.78)',
              borderColor: 'rgba(58, 29, 67, 0.09)',
            }}
          >
            {[
              { id: 'all', ar: 'الكل', en: 'All' },
              { id: 'services', ar: 'جلسات السبا', en: 'Rituals' },
              { id: 'products', ar: 'منتجات جوزال', en: 'Skincare' },
            ].map((tab) => {
              const active = filterMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilterMode(tab.id as 'all' | 'services' | 'products');
                    setActiveIndex(0);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border-0"
                  style={{
                    backgroundColor: active ? '#3a1d43' : 'transparent',
                    color: active ? '#ffffff' : '#3a1d43',
                    boxShadow: active ? '0 6px 16px -4px rgba(58,29,67,0.3)' : 'none',
                  }}
                >
                  {lang === 'ar' ? tab.ar : tab.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main 12-Column Responsive Showcase Grid — Zero Clipping on Any Screen */}
        <div className="relative z-[2] grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 1. Featured Active Preview Card (4 cols on desktop) */}
          <div
            className="lg:col-span-4 relative min-h-[26rem] sm:min-h-[30rem] lg:min-h-[34rem] rounded-[2rem] overflow-hidden flex flex-col justify-end group border"
            style={{
              borderColor: 'rgba(58, 29, 67, 0.12)',
              boxShadow: '0 20px 50px -16px rgba(37, 20, 45, 0.25)',
            }}
          >
            <PhImage
              imgKey={activeItem?.imgKey || 'base:0'}
              customImageUrl={activeItem?.customImageUrl}
              className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#25142d] via-[#25142d]/45 to-transparent" />

            {/* Top Floating Index Pill */}
            <div className="absolute top-4 inset-x-4 z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#25142d]/70 backdrop-blur-md border border-white/15 px-3 py-1 text-[11px] font-bold text-[#f6e9f4]">
                <Sparkles className="h-3 w-3 text-[#cbb6ea]" />
                {activeItem?.type === 'product'
                  ? lang === 'ar'
                    ? 'منتج جوزال أصلي'
                    : 'Guzel Skincare'
                  : activeItem?.type === 'package'
                  ? lang === 'ar'
                    ? 'باقة ملكية'
                    : 'Luxury Package'
                  : lang === 'ar'
                  ? 'جلسة سبا ملكية'
                  : 'Signature Ritual'}
              </span>
              <span className="rounded-full bg-white/20 backdrop-blur-md border border-white/20 px-2.5 py-1 font-mono text-[11px] font-bold text-white">
                {String(activeIndex + 1).padStart(2, '0')} / {String(showcaseItems.length).padStart(2, '0')}
              </span>
            </div>

            {/* Bottom Glass Info Deck */}
            <div className="relative z-10 p-5 sm:p-6 text-[#f6e9f4]">
              <h3 className="text-xl sm:text-2xl font-display font-bold leading-snug text-white">
                {lang === 'ar' ? activeItem?.titleAr : activeItem?.titleEn}
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-[#f6e9f4]/80 leading-relaxed line-clamp-2">
                {lang === 'ar' ? activeItem?.subtitleAr : activeItem?.subtitleEn}
              </p>

              <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between gap-2">
                <div className="font-mono font-extrabold text-lg sm:text-xl text-[#cbb6ea]">
                  {formatPrice(activeItem?.price || 1500, lang)}
                </div>
                {activeItem?.duration && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-mono text-white/90">
                    <Clock className="h-3.5 w-3.5 text-[#e58fb6]" />
                    {formatDuration(activeItem.duration, lang)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleBookActive}
                className="mt-4 w-full py-3 px-5 rounded-full text-xs sm:text-sm font-bold bg-[#cbb6ea] text-[#25142d] hover:bg-[#e58fb6] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-0 active:scale-[0.98]"
                style={{ boxShadow: '0 10px 24px -6px rgba(0, 0, 0, 0.35)' }}
              >
                <span>{lang === 'ar' ? 'احجزي هذه الجلسة الآن' : 'Book This Ritual Now'}</span>
                <ArrowIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 2. Dark Plum Interactive Catalog Studio (8 cols on desktop — Fully Contained) */}
          <div
            className="lg:col-span-8 rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between border overflow-hidden"
            style={{
              backgroundColor: 'var(--dash, #25142d)',
              color: '#f6e9f4',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              boxShadow: '0 24px 60px -20px rgba(37, 20, 45, 0.35)',
            }}
          >
            {/* Studio Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
              <div>
                <div className="text-base sm:text-lg font-display font-bold text-white">
                  {lang === 'ar'
                    ? 'كتالوج جلسات ومنتجات جوزال التفاعلي'
                    : 'Guzel Interactive Rituals & Products'}
                </div>
                <div className="text-xs text-[#f6e9f4]/60 mt-0.5">
                  {lang === 'ar'
                    ? `مجموعة جوزال ميديكال سبا · اضغطي على أي بطاقة للمعاينة الفورية والحجز`
                    : `Guzel Collection · Click any card for live preview and instant booking`}
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-[11px] font-mono text-[#cbb6ea]">
                <span>{selectedIndices.length}</span>
                <span className="opacity-60">/</span>
                <span>{showcaseItems.length}</span>
                <span className="font-sans text-white/80">
                  {lang === 'ar' ? 'مختارة' : 'selected'}
                </span>
              </div>
            </div>

            {/* Responsive 2 -> 3 -> 5 Column Grid — Crisp, Contained, Zero Overflow */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 my-auto">
              {showcaseItems.map((cell, idx) => {
                const isSelected = selectedIndices.includes(idx);
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={cell.id}
                    type="button"
                    onClick={() => handleCellClick(idx)}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 cursor-pointer text-start p-0 border-0 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cbb6ea]"
                    style={{
                      outline: isActive
                        ? '2px solid #e58fb6'
                        : isSelected
                        ? '2px solid #cbb6ea'
                        : '1px solid rgba(255,255,255,0.08)',
                      outlineOffset: '-2px',
                    }}
                  >
                    <PhImage
                      imgKey={cell.imgKey}
                      customImageUrl={cell.customImageUrl}
                      className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Selection Check Circle */}
                    <span
                      className="absolute top-2 end-2 z-10 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: isActive
                          ? '#e58fb6'
                          : isSelected
                          ? '#cbb6ea'
                          : 'rgba(255,255,255,0.88)',
                        color: '#25142d',
                      }}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
                    </span>

                    {/* Bottom Legible Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8 bg-gradient-to-t from-[#190c20]/95 via-[#190c20]/70 to-transparent">
                      <div className="text-[11px] font-bold text-white leading-snug line-clamp-2">
                        {lang === 'ar' ? cell.titleAr : cell.titleEn}
                      </div>
                      <div className="mt-1 text-[11px] font-mono font-semibold text-[#cbb6ea]">
                        {formatPrice(cell.price, lang)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Editorial Footer Row */}
        <div className="relative z-[2] mt-8 pt-6 border-t border-[#3a1d43]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-[#3a1d43]/70 max-w-2xl leading-relaxed">
            {lang === 'ar'
              ? 'جميع الصور والأسعار والمنتجات متزامنة لحظياً مع لوحة إدارة جوزال ميديكال سبا. اختاري الجلسة المناسبة واحجزي موعدك في أقل من دقيقة.'
              : 'Every ritual, photo, and Guzel skincare formula syncs in real time with our studio catalog. Select any item and reserve your slot in under a minute.'}
          </p>

          <button
            type="button"
            onClick={handleBookActive}
            aria-label={lang === 'ar' ? 'احجزي جلستك الآن' : 'Book your ritual now'}
            className="inline-flex items-center gap-3 rounded-full bg-white hover:bg-[#cbb6ea] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#3a1d43] border border-[#3a1d43]/10 shadow-softer transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
          >
            <span>{lang === 'ar' ? 'بدء الحجز الفوري' : 'Start Instant Booking'}</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#3a1d43] text-[#cbb6ea]">
              <GuzelSparkIcon className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
