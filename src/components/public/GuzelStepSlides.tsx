import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { Product, Service } from '../../lib/types';
import PhImage from './PhImage';
import { GuzelSpinIcon } from './GuzelSvgIcons';

interface GuzelStepSlidesProps {
  services?: Service[];
  products?: Product[];
  onBook?: () => void;
}

interface StepCardItem {
  wide?: boolean;
  imgKey: string;
  fy?: number;
  customImg?: string | null;
  pick?: boolean;
  chip?: string;
  spinChip?: string;
  caption?: string;
  arrow?: string;
}

interface StepSlideItem {
  num: string;
  gradClass: string;
  headline: React.ReactNode;
  b1Tag: string;
  b1Text: string;
  b2Tag: string;
  b2Text: string;
  cards: StepCardItem[];
}

export default function GuzelStepSlides({
  services = [],
  products = [],
  onBook,
}: GuzelStepSlidesProps) {
  const { lang } = useLanguage();
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [progresses, setProgresses] = useState<number[]>([0, 0, 0, 0]);

  // Stable random tilt between -4.5deg and +4.5deg per slide chosen once per mount (Section 8.14)
  const tilts = useMemo(
    () => [
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 9,
      0,
    ],
    [],
  );

  // Smooth 3D tip-back (rotationX 40deg, scale 0.7, rotationZ tilt, fade out) driven by scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const vh = window.innerHeight || 1;
        const next: number[] = [0, 0, 0, 0];

        for (let i = 0; i < 3; i++) {
          const el = wrapperRefs.current[i];
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          // When slide top reaches 0 and scrolls up by 1 viewport height
          if (rect.top <= 0) {
            const p = Math.min(1, Math.max(0, -rect.top / vh));
            next[i] = p;
          }
        }
        setProgresses(next);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Optional custom images from Admin settings
  const svcImgs = services.map((s) => s.image_url).filter(Boolean);
  const prodImgs = products.map((p) => p.image_url).filter(Boolean);

  const slides: StepSlideItem[] = [
    {
      num: '01',
      gradClass: 'guzel-slide-s1',
      headline:
        lang === 'ar' ? (
          <>
            اختاري جلساتكِ
            <br />
            ومنتجات <span className="it text-[1.08em]">جوزال.</span>
          </>
        ) : (
          <>
            Add products
            <br />
            and <span className="it text-[1.08em] tracking-[-0.04rem]">looks.</span>
          </>
        ),
      b1Tag: lang === 'ar' ? '+٢٠ جلسة ومنتج عناية' : '20+ ritual & serum presets',
      b1Text:
        lang === 'ar'
          ? 'نسّقي جلسات الهيدرا فيشل والحمام المغربي مع سيروم وكريم جوزال الوردي.'
          : 'Stack your Guzel serums, facials and spa rituals side by side.',
      b2Tag: lang === 'ar' ? 'تخصيص كامل لبشرتكِ' : 'Multiple ritual choices',
      b2Text:
        lang === 'ar'
          ? 'كل جلسة مصممة بدقة لتلائم احتياج بشرتكِ وشعركِ مع أفضل الأخصائيات.'
          : 'Facials, Moroccan hammam and aromatherapy from a single menu.',
      cards: [
        {
          wide: true,
          imgKey: 'prod:0',
          customImg: prodImgs[0] || null,
          caption: lang === 'ar' ? 'مجموعة جوزال للعناية بالبشرة' : 'Guzel skincare set',
          arrow: '→',
        },
        {
          imgKey: 'faces:1',
          pick: true,
          chip: lang === 'ar' ? 'مختارة' : 'Selected',
        },
        {
          imgKey: 'faces:0',
        },
        {
          imgKey: 'faces:2',
        },
      ],
    },
    {
      num: '02',
      gradClass: 'guzel-slide-s2',
      headline:
        lang === 'ar' ? (
          <>
            نسّقي باقتكِ
            <br />
            <span className="it text-[1.08em]">الخاصة.</span>
          </>
        ) : (
          <>
            Guzel curates
            <br />
            <span className="it text-[1.08em] tracking-[-0.04rem]">options.</span>
          </>
        ),
      b1Tag: lang === 'ar' ? 'أجواء استرخاء وإضاءة هادئة' : 'Mood & ambiance variations',
      b1Text:
        lang === 'ar'
          ? 'كبائن خاصة معطرة باللافندر وإضاءة دافئة تمنحكِ هدوءاً نفسياً تاماً.'
          : 'Dream up tranquil scenes, aromatic steam and private suites.',
      b2Tag: lang === 'ar' ? 'باقات متكاملة للعروسة' : 'Multiple beauty directions',
      b2Text:
        lang === 'ar'
          ? 'ادمجي أكثر من خدمة أو باقة وسيحسب النظام الوقت والعربون تلقائياً.'
          : 'Explore different rituals, textures and bridal bundles.',
      cards: [
        {
          wide: true,
          imgKey: 'styled:0',
          customImg: svcImgs[0] || null,
          spinChip: lang === 'ar' ? 'جاري التجهيز…' : 'Preparing…',
          caption: lang === 'ar' ? 'مجموعة سيروم جوزال باللافندر' : 'Guzel Serum Collection',
          arrow: '→',
        },
        {
          imgKey: 'styled:1',
          customImg: prodImgs[1] || null,
        },
        {
          imgKey: 'ringa:1',
          customImg: svcImgs[1] || null,
        },
        {
          imgKey: 'styled2:1',
          customImg: prodImgs[2] || null,
        },
      ],
    },
    {
      num: '03',
      gradClass: 'guzel-slide-s3',
      headline:
        lang === 'ar' ? (
          <>
            احجزي موعدكِ
            <br />
            <span className="it text-[1.08em]">المفضل.</span>
          </>
        ) : (
          <>
            Choose your
            <br />
            <span className="it text-[1.08em] tracking-[-0.04rem]">favorite.</span>
          </>
        ),
      b1Tag: lang === 'ar' ? 'مقارنة واختيار مرن' : 'Side-by-side comparison',
      b1Text:
        lang === 'ar'
          ? 'اختاري الأخصائية والموعد المناسب لجدولكِ مع تأكيد فوري للحجز.'
          : 'Keep the rituals and time slots you love from our live schedule.',
      b2Tag: lang === 'ar' ? 'تأكيد سهل وآمن' : 'Easy selection & review',
      b2Text:
        lang === 'ar'
          ? 'تأكيد الحجز بإنستاباي أو فودافون كاش أو الكاش مع إشعار واتساب فوري.'
          : 'Tap to reserve, verify deposit effortlessly, and relax.',
      cards: [
        {
          wide: true,
          imgKey: 'styled2:0',
          caption: lang === 'ar' ? 'جناح الحجر الطبيعي · مختار' : 'Travertine · picked',
          arrow: '→',
        },
        {
          imgKey: 'life:0',
          fy: 0.3,
          pick: true,
          chip: lang === 'ar' ? 'مؤكد' : 'Kept',
        },
        {
          imgKey: 'styled2:2',
        },
        {
          imgKey: 'styled:4',
          pick: true,
          chip: lang === 'ar' ? 'مؤكد' : 'Kept',
        },
      ],
    },
    {
      num: '04',
      gradClass: 'guzel-slide-s4',
      headline:
        lang === 'ar' ? (
          <>
            استمتعي بإشراقة
            <br />
            لا <span className="it text-[1.08em]">تُنسى.</span>
          </>
        ) : (
          <>
            Ready-made
            <br />
            glow <span className="it text-[1.08em] tracking-[-0.04rem]">awaits.</span>
          </>
        ),
      b1Tag: lang === 'ar' ? 'فاتورة QR ذكية بالفرع' : 'Smart in-branch QR tab',
      b1Text:
        lang === 'ar'
          ? 'تابعي جلستكِ وأضيفي أي منتج من جوزال وسددي بمسح رمز QR من موبايلكِ.'
          : 'Enjoy seamless check-in, add-on serums, and instant QR checkout.',
      b2Tag: lang === 'ar' ? 'حجز بضغطة واحدة' : 'One-click reservation',
      b2Text:
        lang === 'ar'
          ? 'احجزي جلستكِ الآن واستعدي ليوم من الدلال والهدوء في جوزال ميديكال سبا.'
          : 'Every ritual and product ready for you in a single click.',
      cards: [
        {
          wide: true,
          imgKey: 'life:2',
          fy: 0.35,
          caption:
            lang === 'ar'
              ? 'حملة إشراقة الصيف من جوزال · ٢٤ جلسة ومنتج'
              : 'Summer glow campaign · 24 rituals',
          arrow: '↓',
        },
        {
          imgKey: 'studio:1',
          fy: 0.2,
        },
        {
          imgKey: 'base:1',
        },
        {
          imgKey: 'pre:1',
          fy: 0.3,
        },
      ],
    },
  ];

  return (
    <section id="list" className="relative mt-20 sm:mt-32 w-full">
      <div className="relative flex flex-col">
        {slides.map((slide, idx) => {
          const p = progresses[idx] || 0;
          const isLast = idx === 3;
          // Tween 1: rotationX 0 -> 40deg, scale 1 -> 0.7, rotationZ 0 -> tilt
          const scale = isLast ? 1 : 1 - p * 0.3;
          const rotX = isLast ? 0 : p * 40;
          const rotZ = isLast ? 0 : p * tilts[idx];
          // Tween 2: fade out in the last stretch
          const opacity = isLast ? 1 : p > 0.65 ? Math.max(0, 1 - (p - 0.65) / 0.35) : 1;

          return (
            <div
              key={slide.num}
              ref={(el) => {
                wrapperRefs.current[idx] = el;
              }}
              className="relative w-full h-[100vh] min-h-[42rem] sticky top-0"
              style={{
                perspective: '250vw',
                zIndex: idx + 1,
              }}
            >
              <div
                className={`w-full h-full flex flex-col justify-between px-4 pt-24 pb-6 sm:px-8 sm:pt-28 sm:pb-10 lg:px-12 lg:pt-28 lg:pb-12 overflow-hidden transition-transform duration-75 ease-out ${slide.gradClass}`}
                style={{
                  color: '#3a1d43',
                  transform: `scale(${scale.toFixed(3)}) rotateX(${rotX.toFixed(1)}deg) rotateZ(${rotZ.toFixed(2)}deg)`,
                  transformOrigin: 'center center',
                  opacity: opacity.toFixed(3),
                }}
              >
                {/* Top Block (st__top) */}
                <div>
                  {/* Title Row */}
                  <div className="flex items-start justify-between gap-4">
                    <h3
                      data-flash-stb
                      className="text-[2.15rem] sm:text-[3.5rem] lg:text-[4.4rem] font-normal leading-[1.04]"
                      style={{
                        letterSpacing: lang === 'ar' ? '0' : '-0.12rem',
                        color: '#3a1d43',
                      }}
                    >
                      {slide.headline}
                    </h3>

                    <div
                      data-flash-stb
                      className="text-[3.4rem] sm:text-[6rem] lg:text-[8.2rem] font-medium leading-[0.85] select-none shrink-0"
                      style={{
                        letterSpacing: '-0.25rem',
                        color: '#3a1d43',
                      }}
                      dir="ltr"
                    >
                      {slide.num}
                    </div>
                  </div>

                  {/* Info Grid: 2 Columns */}
                  <div className="mt-5 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-10 max-w-5xl">
                    <div>
                      <div className="flex items-center gap-2.5 text-[1.05rem] sm:text-[1.35rem] font-medium">
                        <span className="h-3 w-3 rounded-full bg-[#b9a4ea] shrink-0" />
                        <span>{slide.b1Tag}</span>
                      </div>
                      <p className="mt-1.5 ms-5 text-[0.88rem] sm:text-[1.08rem] leading-[1.4] text-[#3a1d43]/75">
                        {slide.b1Text}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 text-[1.05rem] sm:text-[1.35rem] font-medium">
                        <span className="h-3 w-3 rounded-full bg-[#b9a4ea] shrink-0" />
                        <span>{slide.b2Tag}</span>
                      </div>
                      <p className="mt-1.5 ms-5 text-[0.88rem] sm:text-[1.08rem] leading-[1.4] text-[#3a1d43]/75">
                        {slide.b2Text}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Row (st__row): 4 Photo Cards with Glass Captions & Chips */}
                <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:gap-4 h-[17.5rem] sm:h-[min(25rem,36vh)] w-full">
                  {slide.cards.map((card, cIdx) => (
                    <div
                      key={`${slide.num}-${cIdx}`}
                      onClick={onBook}
                      className={[
                        'relative rounded-[1.25rem] sm:rounded-[1.6rem] overflow-hidden cursor-pointer group transition-transform duration-300 hover:scale-[1.01]',
                        card.wide
                          ? 'col-span-2 sm:flex-[1.95] h-36 sm:h-full'
                          : cIdx === 3
                          ? 'hidden sm:block sm:flex-1 sm:h-full'
                          : 'col-span-1 sm:flex-1 h-28 sm:h-full',
                      ].join(' ')}
                      style={{
                        boxShadow: '0 1.5rem 3rem #3a1d431a',
                        outline: card.pick ? '3px solid #ffffff' : 'none',
                        outlineOffset: card.pick ? '-3px' : '0px',
                      }}
                    >
                      <PhImage
                        imgKey={card.imgKey}
                        fy={card.fy ?? 0.5}
                        customImageUrl={card.customImg}
                        className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Top-left Chip (st__chip) */}
                      {(card.chip || card.spinChip) && (
                        <div className="absolute top-3 start-3 z-[2] inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffffffd9] text-[#3a1d43] text-[0.72rem] font-semibold shadow-clean">
                          {card.spinChip && (
                            <GuzelSpinIcon className="w-3.5 h-3.5 animate-spin-step" />
                          )}
                          <span>{card.chip || card.spinChip}</span>
                        </div>
                      )}

                      {/* Bottom Glass Caption (st__cap) */}
                      {card.caption && (
                        <div
                          className="absolute inset-x-3 bottom-3 z-[2] h-9 sm:h-11 px-4 rounded-2xl flex items-center justify-between text-white text-xs sm:text-sm font-medium"
                          style={{
                            backgroundColor: '#2c143352',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                          }}
                        >
                          <span className="truncate">{card.caption}</span>
                          <span className="ms-2 shrink-0">{card.arrow}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
