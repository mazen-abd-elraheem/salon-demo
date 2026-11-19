import { useMemo, useState } from 'react';
import { Check, Clock, Sparkles } from 'lucide-react';
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
  // Cells 0, 3, 6 (1, 4, 7 in 1-based indexing) selected by default per Section 6.6
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
        subtitleAr: s.description_ar || 'جلسة عناية متكاملة',
        subtitleEn: s.description_en || 'Signature spa ritual',
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

    // Pad up to 10 cells if needed
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

  const cycleFilter = () => {
    setFilterMode((prev) =>
      prev === 'all' ? 'services' : prev === 'services' ? 'products' : 'all',
    );
    setActiveIndex(0);
  };

  return (
    <section id="services" className="relative flex flex-col w-full px-0">
      <div id="pdp" className="-mt-24 pt-24" />

      {/* Full-Bleed Rounded Panel (ai__top, Section 6.6) */}
      <div
        className="relative w-full min-h-[38rem] sm:min-h-[64rem] lg:h-[70rem] p-6 sm:p-12 lg:p-20 rounded-[1.5rem] sm:rounded-[3rem] flex flex-col justify-between items-start overflow-hidden"
        style={{
          backgroundColor: 'var(--secondbg, #f3e6f0)',
          color: 'var(--fonts-100, #3a1d43)',
        }}
      >
        {/* Top-Left Tag */}
        <div className="relative z-[2] flex items-center gap-2.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: 'var(--fonts-30, #3a1d434d)' }}
          />
          <span className="u-title-2 font-medium">
            {lang === 'ar'
              ? 'استوديو خدمات ومنتجات جوزال ميديكال سبا (Guzel Showcase)'
              : 'Guzel Medical Spa Services & Skincare Studio'}
          </span>
        </div>

        {/* Desktop Showcase Strip: Input Card -> Arrow -> 5x2 Dark Dashboard (Section 6.6) */}
        <div
          className="hidden lg:flex absolute top-20 bottom-44 inset-x-0 ps-20 items-center gap-10 z-[2]"
          dir="ltr"
        >
          {/* 1. Left Featured Packshot / Active Service Input Card (17.5rem × 26.5rem) */}
          <div
            className="relative w-[17.5rem] h-[26.5rem] rounded-[2rem] overflow-hidden shrink-0 shadow-soft flex flex-col justify-end group"
            style={{ border: '1px solid var(--mainbg, #f9f0f5)' }}
          >
            <PhImage
              imgKey={activeItem?.imgKey || 'base:0'}
              customImageUrl={activeItem?.customImageUrl}
              className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#25142d]/90 via-[#25142d]/25 to-transparent" />

            <div className="relative z-10 p-5 text-[#f6e9f4]" dir={isRTL ? 'rtl' : 'ltr'}>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#cbb6ea] px-2.5 py-0.5 text-[10px] font-semibold text-[#2c1433]">
                <Sparkles className="h-3 w-3" />
                {activeItem?.type === 'product'
                  ? lang === 'ar'
                    ? 'منتج جوزال أصلي'
                    : 'Guzel Skincare'
                  : lang === 'ar'
                  ? 'جلسة سبا ملكية'
                  : 'Signature Ritual'}
              </span>

              <h4 className="mt-2 text-base font-semibold leading-snug line-clamp-2">
                {lang === 'ar' ? activeItem?.titleAr : activeItem?.titleEn}
              </h4>

              <div className="mt-2 flex items-center justify-between text-xs text-[#f6e9f4]/80">
                <span className="font-bold text-[#cbb6ea] text-sm">
                  {formatPrice(activeItem?.price || 1500, lang)}
                </span>
                {activeItem?.duration && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(activeItem.duration, lang)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleBookActive}
                className="mt-3 w-full py-2 px-4 rounded-full text-xs font-semibold bg-[#cbb6ea] text-[#2c1433] hover:bg-[#e58fb6] transition cursor-pointer border-0"
              >
                {lang === 'ar' ? 'احجزي هذه الجلسة الآن' : 'Book This Ritual'}
              </button>
            </div>
          </div>

          {/* 2. Stroked Right Arrow (1.5rem) */}
          <div className="shrink-0" style={{ color: 'var(--fonts-30, #3a1d434d)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h15m0 0-6-6m6 6-6 6" />
            </svg>
          </div>

          {/* 3. Dark Dashboard (d2, bleeds off right edge, 5x2 grid) */}
          <div
            className="flex-1 min-w-0 h-[32rem] rounded-l-[2rem] overflow-hidden flex flex-col justify-between p-6 pr-0 shadow-soft"
            style={{
              backgroundColor: 'var(--dash, #25142d)',
              color: '#f6e9f4',
              border: '1px solid var(--mainbg, #f9f0f5)',
              borderRight: 'none',
            }}
          >
            {/* Dashboard Header Row */}
            <div className="flex items-center justify-between pr-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <div>
                <div className="text-[1.1rem] font-medium leading-tight text-[#f6e9f4]">
                  {lang === 'ar'
                    ? 'كتالوج جلسات ومنتجات جوزال التفاعلي'
                    : 'Guzel Interactive Rituals & Products'}
                </div>
                <div className="text-[0.75rem] text-[#f6e9f4]/50 mt-0.5">
                  {lang === 'ar'
                    ? `مجموعة جوزال ميديكال سبا · ${selectedIndices.length} مختارة من ${showcaseItems.length} (اضغطي على أي صورة للمعاينة والحجز)`
                    : `Guzel Collection · ${selectedIndices.length} selected of ${showcaseItems.length} (Click any card to preview & book)`}
                </div>
              </div>

              <button
                type="button"
                onClick={cycleFilter}
                className="h-9 px-4 rounded-full bg-[#cbb6ea] text-[#2c1433] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#e58fb6] transition cursor-pointer border-0"
              >
                <span>✦</span>
                <span>
                  {filterMode === 'all'
                    ? lang === 'ar'
                      ? 'عرض: الكل (جلسات + منتجات)'
                      : 'Showing: All Rituals & Serums'
                    : filterMode === 'services'
                    ? lang === 'ar'
                      ? 'عرض: جلسات السبا فقط'
                      : 'Showing: Spa Rituals Only'
                    : lang === 'ar'
                    ? 'عرض: منتجات جوزال فقط'
                    : 'Showing: Guzel Skincare Only'}
                </span>
              </button>
            </div>

            {/* 5x2 Grid of Results */}
            <div className="grid grid-cols-5 gap-3 pr-6 my-auto">
              {showcaseItems.map((cell, idx) => {
                const isSelected = selectedIndices.includes(idx);
                const isActive = activeIndex === idx;
                return (
                  <div
                    key={cell.id}
                    onClick={() => handleCellClick(idx)}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#ffffff0d] cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                    style={{
                      outline: isSelected
                        ? '2px solid #cbb6ea'
                        : isActive
                        ? '2px solid #e58fb6'
                        : 'none',
                      outlineOffset: '-2px',
                    }}
                  >
                    <PhImage
                      imgKey={cell.imgKey}
                      customImageUrl={cell.customImageUrl}
                      className="absolute inset-0 w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#25142d]/85 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                    {/* Top-right Check Badge */}
                    <span
                      className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full grid place-items-center transition-colors"
                      style={{
                        backgroundColor: isSelected ? '#cbb6ea' : '#ffffffd9',
                        color: '#2c1433',
                      }}
                    >
                      <Check className="h-3 w-3 stroke-[2.5]" />
                    </span>

                    {/* Bottom Mini Caption */}
                    <div
                      className="absolute inset-x-2.5 bottom-2.5 text-[#f6e9f4]"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <div className="text-[11px] font-semibold leading-tight truncate">
                        {lang === 'ar' ? cell.titleAr : cell.titleEn}
                      </div>
                      <div className="text-[10px] text-[#cbb6ea] font-bold mt-0.5">
                        {formatPrice(cell.price, lang)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tablet & Mobile Alternate 3-Column Collage (ai__grid-alt, ≤991px, Section 6.6 & 7) */}
        <div className="lg:hidden relative w-full my-8 grid grid-cols-3 gap-2.5 sm:gap-4 items-start">
          {/* Column 1 */}
          <div className="flex flex-col gap-2.5 sm:gap-4 pt-6">
            <div
              onClick={() => showcaseItems[0]?.rawService && onSelectService(showcaseItems[0].rawService)}
              className="relative h-36 sm:h-64 rounded-xl overflow-hidden cursor-pointer shadow-clean"
            >
              <PhImage
                imgKey="studio:1"
                customImageUrl={showcaseItems[0]?.customImageUrl}
                className="w-full h-full"
              />
            </div>
            <div
              onClick={() => showcaseItems[1]?.rawService && onSelectService(showcaseItems[1].rawService)}
              className="relative h-28 sm:h-48 rounded-xl overflow-hidden cursor-pointer shadow-clean"
            >
              <PhImage
                imgKey="styled:0"
                customImageUrl={showcaseItems[1]?.customImageUrl}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Middle Column */}
          <div className="flex flex-col gap-2.5 sm:gap-4">
            <div
              onClick={() => showcaseItems[2]?.rawService && onSelectService(showcaseItems[2].rawService)}
              className="relative h-48 sm:h-80 rounded-xl overflow-hidden cursor-pointer shadow-clean"
            >
              <PhImage
                imgKey="ringa:1"
                customImageUrl={showcaseItems[2]?.customImageUrl}
                className="w-full h-full"
              />
            </div>
            <div
              onClick={() => showcaseItems[3]?.rawService && onSelectService(showcaseItems[3].rawService)}
              className="hidden sm:block relative h-48 rounded-xl overflow-hidden cursor-pointer shadow-clean"
            >
              <PhImage
                imgKey="life:1"
                customImageUrl={showcaseItems[3]?.customImageUrl}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-2.5 sm:gap-4 pt-6">
            <div
              onClick={() => showcaseItems[4]?.rawService && onSelectService(showcaseItems[4].rawService)}
              className="relative h-36 sm:h-64 rounded-xl overflow-hidden cursor-pointer shadow-clean"
            >
              <PhImage
                imgKey="studio:2"
                customImageUrl={showcaseItems[4]?.customImageUrl}
                className="w-full h-full"
              />
            </div>
            <div
              onClick={() => showcaseItems[5]?.rawService && onSelectService(showcaseItems[5].rawService)}
              className="relative h-28 sm:h-48 rounded-xl overflow-hidden cursor-pointer shadow-clean"
            >
              <PhImage
                imgKey="styled2:3"
                customImageUrl={showcaseItems[5]?.customImageUrl}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Bottom-Left Title Block */}
        <div className="relative z-[2] flex flex-col gap-3 max-w-[38rem]">
          <h3 className="u-h3">
            {lang === 'ar' ? (
              <>
                جلسات سبا ومنتجات فاخرة،
                <br />
                مصممة <span className="it font-normal">لإشراقتكِ.</span>
              </>
            ) : (
              <>
                Campaign-grade rituals,
                <br />
                crafted for your <span className="it font-normal">glow.</span>
              </>
            )}
          </h3>
          <p className="u-body-2 u-fonts-64 max-w-[32rem]">
            {lang === 'ar'
              ? 'اختاري سيروم جوزال باللافندر أو جلسة الهيدرا فيشل والحمام المغربي الملكي، واستمتعي بتجربة استرخاء متكاملة في كبائن خاصة ومعقمة بالكامل.'
              : 'Explore Guzel Lavender Dropper Serums, rejuvenating HydraFacials, and authentic Moroccan Hammam rituals — all synced in real time from our studio.'}
          </p>
        </div>

        {/* Bottom-Right White Spark Button (Section 6.6) */}
        <a
          href="#list"
          aria-label="Explore the 4 Guzel steps"
          className="
            z-[5] grid place-items-center rounded-full bg-white text-[#2c1433] shadow-soft transition-all duration-200
            hover:bg-[var(--accent)] hover:scale-90
            lg:absolute lg:bottom-6 lg:right-6 lg:w-16 lg:h-16
            max-lg:absolute max-lg:top-5 max-lg:end-6 max-lg:w-11 max-lg:h-11
          "
        >
          <GuzelSparkIcon className="w-6 h-6 lg:w-8 lg:h-8" />
        </a>
      </div>
    </section>
  );
}

