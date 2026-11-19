import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { BusinessSettings, Product, Service } from '../../lib/types';
import PhImage from './PhImage';
import GuzelThreeCanvas from './GuzelThreeCanvas';

declare global {
  interface Window {
    gsap?: any;
  }
}

interface HeroProps {
  settings: BusinessSettings | null;
  services?: Service[];
  products?: Product[];
  onBook: () => void;
}

const RING_HOLDERS = [
  { deg: 0, key: 'ringa:1' },
  { deg: 45, key: 'ringa:0' },
  { deg: 90, key: 'ringb:1' },
  { deg: 135, key: 'ringa:2' },
  { deg: 180, key: 'ringa:3' },
  { deg: 225, key: 'ringb:0' },
  { deg: 270, key: 'ringb:3' },
  { deg: 315, key: 'ringb:2' },
];

export default function Hero({ settings, services = [], products = [], onBook }: HeroProps) {
  const { lang, isRTL } = useLanguage();
  const sectionRef = useRef<HTMLElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterPhotoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const chipWrapRef = useRef<HTMLDivElement | null>(null);

  // Collect custom images uploaded by Admin in Services or Products
  const customUploads: (string | null)[] = [
    ...services.map((s) => s.image_url || null),
    ...products.map((p) => p.image_url || null),
  ].filter((url): url is string => !!url && url.trim().length > 4);

  const brandName =
    lang === 'ar'
      ? settings?.business_name?.trim() || 'جوزال ميديكال سبا'
      : settings?.business_name_en?.trim() || 'Guzel Medical Spa';

  const tagline =
    lang === 'ar'
      ? settings?.tagline_ar || 'جوزال ميديكال سبا للجمال والاسترخاء'
      : settings?.tagline || 'Guzel Medical Spa for beauty and relaxation';

  const chips =
    lang === 'ar'
      ? [
          'سيروم جوزال باللافندر',
          'هيدرا فيشل طبي عميق',
          'الحمام المغربي الملكي',
          'مساج علاجي واسترخائي',
          'باقات العروسة الملكية',
          'ترميم الشعر بالكافيار',
        ]
      : [
          'Guzel Lavender Serum',
          'Medical HydraFacial',
          'Royal Moroccan Hammam',
          'Therapeutic Massage',
          'Royal Bridal VIP',
          'Caviar Hair Therapy',
        ];

  // GSAP Master Animations: Orbiting Ring + Upright Counter-Rotation + Hero Intro + Parallax
  useEffect(() => {
    const gsap = window.gsap;
    const ringEl = ringRef.current;
    const cards = cardRefs.current.filter(Boolean);
    const photos = counterPhotoRefs.current.filter(Boolean);
    const words = wordRefs.current.filter(Boolean);

    let ringTween: any = null;
    let photoTween: any = null;
    let introTl: any = null;

    if (gsap && ringEl) {
      // 1. Continuous 32s clockwise orbit on the ring container
      gsap.set(ringEl, { rotation: 0 });
      ringTween = gsap.to(ringEl, {
        rotation: 360,
        duration: 32,
        ease: 'none',
        repeat: -1,
      });

      // 2. Synchronous -360deg counter-rotation on every inner photo so all faces stay 100% upright
      if (photos.length > 0) {
        gsap.set(photos, { rotation: 0 });
        photoTween = gsap.to(photos, {
          rotation: -360,
          duration: 32,
          ease: 'none',
          repeat: -1,
        });
      }

      // 3. Opening Choreographed Sequence (Section 8.2 & 8.3)
      const playIntro = () => {
        if (introTl) introTl.kill();
        introTl = gsap.timeline();

        // Cards pop in along the orbit
        if (cards.length > 0) {
          introTl.fromTo(
            cards,
            { opacity: 0, scale: 0.45 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.75,
              stagger: 0.08,
              ease: 'back.out(1.35)',
            },
            0.1,
          );
        }

        // Words flash Violet (#b14bd9) -> Pink (#f28db5) -> Deep Plum Ink (#3a1d43)
        if (words.length > 0) {
          gsap.set(words, { opacity: 0, y: 18, color: '#b14bd9' });
          words.forEach((wordEl, idx) => {
            const startAt = 0.15 + idx * 0.14;
            introTl.to(
              wordEl,
              {
                opacity: 1,
                y: 0,
                color: '#b14bd9',
                duration: 0.14,
                ease: 'power2.out',
              },
              startAt,
            );
            introTl.to(
              wordEl,
              {
                color: '#f28db5',
                duration: 0.12,
                ease: 'none',
              },
              startAt + 0.14,
            );
            introTl.to(
              wordEl,
              {
                color: 'var(--fonts-100, #3a1d43)',
                duration: 0.2,
                ease: 'power2.out',
              },
              startAt + 0.26,
            );
          });
        }

        // Outer chip column slides in
        if (chipWrapRef.current) {
          introTl.fromTo(
            chipWrapRef.current,
            { opacity: 0, x: isRTL ? -30 : 30 },
            { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' },
            0.35,
          );
        }
      };

      playIntro();
      document.addEventListener('preloader:done', playIntro);

      return () => {
        document.removeEventListener('preloader:done', playIntro);
        if (ringTween) ringTween.kill();
        if (photoTween) photoTween.kill();
        if (introTl) introTl.kill();
      };
    }
  }, [isRTL, lang]);

  // Subtle Mouse-Follow Parallax on Center Stage
  useEffect(() => {
    const section = sectionRef.current;
    const center = centerRef.current;
    if (!section || !center) return;

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      center.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full h-[100svh] min-h-[45rem] sm:min-h-[54rem] px-4 pt-24 pb-8 sm:px-8 sm:pb-12 flex items-end justify-center overflow-hidden select-none"
      style={
        {
          '--R': 'min(22.5vw, 33.5svh)',
          backgroundColor: 'var(--mainbg, #f9f0f5)',
          color: 'var(--fonts-100, #3a1d43)',
        } as React.CSSProperties
      }
    >
      <style>{`
        @media screen and (max-width: 991px) {
          #hero { --R: min(29vw, 28svh) !important; }
        }
        @media screen and (max-width: 767px) {
          #hero { --R: min(35vw, 24svh) !important; }
        }
        @keyframes guzelCounterSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .guzel-css-counter {
          animation: guzelCounterSpin 32s linear infinite;
        }
      `}</style>

      {/* Three.js Subtle Ambient Botanical Dew Canvas */}
      <GuzelThreeCanvas />

      {/* 8-Card Orbiting Ring (Section 6.4 & 8.4) */}
      <div
        className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none pt-6 sm:pt-10 pb-14 sm:pb-0"
        aria-hidden="true"
      >
        <div
          ref={ringRef}
          className="relative flex items-center justify-center animate-ring-orbit"
          style={{
            width: 'calc(var(--R) * 2.85)',
            height: 'calc(var(--R) * 2.85)',
            willChange: 'transform',
          }}
        >
          {RING_HOLDERS.map((holder, idx) => {
            const customImg = customUploads[idx] || null;
            return (
              <div
                key={holder.deg}
                data-deg={holder.deg}
                className="absolute flex items-center justify-center"
                style={{
                  transform: `rotate(${holder.deg}deg)`,
                }}
              >
                {/* Orbit Card at distance R above ring center */}
                <div
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  className="relative flex items-center justify-center overflow-hidden shadow-soft border border-white/50"
                  style={{
                    top: 'calc(var(--R) * -1)',
                    width: 'calc(var(--R) * 0.36)',
                    height: 'calc(var(--R) * 0.43)',
                    borderRadius: 'calc(var(--R) * 0.12)',
                    backgroundColor: 'var(--lines, #e8d7e4)',
                    willChange: 'transform, opacity',
                  }}
                >
                  {/* Fixed -deg wrapper guarantees upright orientation at t=0 */}
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: 'calc(var(--R) * 0.56)',
                      height: 'calc(var(--R) * 0.56)',
                      transform: `rotate(-${holder.deg}deg)`,
                    }}
                  >
                    {/* Continuous -360deg counter-rotating inner photo */}
                    <div
                      ref={(el) => {
                        counterPhotoRefs.current[idx] = el;
                      }}
                      className="w-full h-full guzel-css-counter"
                      style={{ willChange: 'transform' }}
                    >
                      <PhImage
                        imgKey={holder.key}
                        customImageUrl={customImg}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Centre Headline Layer Inside the Ring (hero__center) */}
      <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center pointer-events-none pt-6 sm:pt-10 pb-14 sm:pb-0 px-6 text-center">
        <div
          ref={centerRef}
          className="relative flex flex-col items-center justify-center max-w-[26rem] sm:max-w-[32rem] px-6 py-8 rounded-full transition-transform duration-150 ease-out"
          style={{
            background:
              'radial-gradient(circle, var(--mainbg, #f9f0f5) 48%, rgba(249, 240, 245, 0) 78%)',
          }}
        >
          {/* Brand Eyebrow Pill */}
          <span
            className="pointer-events-auto mb-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] sm:text-xs font-semibold tracking-wide border shadow-clean"
            style={{
              backgroundColor: 'var(--secondbg, #f3e6f0)',
              borderColor: 'var(--lines, #e8d7e4)',
              color: 'var(--fonts-100, #3a1d43)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#b14bd9]" />
            <span>{tagline}</span>
          </span>

          {/* Primary H1 Headline (Single H1 for SEO) */}
          <h1
            data-hero-text
            className="pointer-events-auto font-display font-bold text-center tracking-tight"
            style={{
              fontSize: 'calc(var(--R) * 0.165)',
              lineHeight: lang === 'ar' ? 1.24 : 0.98,
            }}
          >
            {lang === 'ar' ? (
              <>
                <span
                  ref={(el) => {
                    wordRefs.current[0] = el;
                  }}
                  className="inline-block"
                >
                  جمالكِ،
                </span>
                <br />
                <span
                  ref={(el) => {
                    wordRefs.current[1] = el;
                  }}
                  className="it inline-block mx-1 text-[#b14bd9]"
                  style={{ fontSize: '1.08em' }}
                >
                  بإشراقة
                </span>{' '}
                <span
                  ref={(el) => {
                    wordRefs.current[2] = el;
                  }}
                  className="inline-block"
                >
                  متجددة.
                </span>
              </>
            ) : (
              <>
                <span
                  ref={(el) => {
                    wordRefs.current[0] = el;
                  }}
                  className="inline-block"
                >
                  Your
                </span>{' '}
                <span
                  ref={(el) => {
                    wordRefs.current[1] = el;
                  }}
                  className="inline-block"
                >
                  beauty,
                </span>
                <br />
                <span
                  ref={(el) => {
                    wordRefs.current[2] = el;
                  }}
                  className="it inline-block"
                  style={{ fontSize: '1.08em', letterSpacing: '-0.02em' }}
                >
                  radiantly
                </span>{' '}
                <span
                  ref={(el) => {
                    wordRefs.current[3] = el;
                  }}
                  className="inline-block"
                >
                  re-imagined.
                </span>
              </>
            )}
          </h1>

          {/* Action Buttons Inside Ring */}
          <div className="pointer-events-auto mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onBook}
              className="rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all duration-200 hover:scale-105 cursor-pointer border-0 shadow-soft"
              style={{
                backgroundColor: 'var(--btn-bg, #cbb6ea)',
                color: 'var(--btn-ink, #2c1433)',
              }}
            >
              <span>{lang === 'ar' ? 'احجزي جلستك الآن' : 'Book Your Ritual'}</span>
              {isRTL ? <ArrowUpLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </button>

            <Link
              to="/services"
              className="rounded-full px-4 py-2.5 text-xs font-semibold no-underline border transition-colors hover:bg-white/80"
              style={{
                borderColor: 'var(--lines, #e8d7e4)',
                backgroundColor: 'var(--secondbg, #f3e6f0)',
                color: 'var(--fonts-100, #3a1d43)',
              }}
            >
              {lang === 'ar' ? 'منيو الخدمات' : 'Explore Menu'}
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Vertical Looping Chip List — Strictly pinned to far outer edge, never overlapping center! */}
      <div
        ref={chipWrapRef}
        className="hidden xl:flex pointer-events-none z-[3] absolute top-[11rem] bottom-[11rem] items-center"
        style={{
          [isRTL ? 'left' : 'right']: '2rem',
        }}
        aria-hidden="true"
      >
        <div className="relative h-[16.5rem] w-48 overflow-hidden flex flex-col items-end">
          {[0, 1].map((dup) => (
            <div
              key={dup}
              className="animate-hero-chips flex flex-col items-end gap-2 pb-2 shrink-0 w-full"
            >
              {chips.map((chip) => (
                <div
                  key={`${dup}-${chip}`}
                  className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shadow-clean"
                  style={{
                    borderColor: 'var(--fonts-20, #3a1d4333)',
                    backgroundColor: 'var(--mainbg, #f9f0f5)',
                    color: 'var(--fonts-100, #3a1d43)',
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          ))}

          <div
            className="absolute inset-x-0 top-0 h-14 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, var(--mainbg), var(--mainbg-gradient))',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-14 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, var(--mainbg-gradient), var(--mainbg))',
            }}
          />
        </div>
      </div>

      {/* Tablet & Mobile Horizontal Chip Strip at Bottom (below the ring) */}
      <div
        className="flex xl:hidden pointer-events-none z-[3] absolute bottom-14 inset-x-0 h-10 items-center justify-center px-4"
        aria-hidden="true"
      >
        <div className="relative w-full max-w-[32rem] h-10 overflow-hidden flex flex-row items-center">
          {[0, 1].map((dup) => (
            <div
              key={dup}
              className="animate-guzel-marquee flex flex-row items-center gap-2 pe-2 shrink-0"
            >
              {chips.map((chip) => (
                <div
                  key={`m-${dup}-${chip}`}
                  className="px-3.5 py-1 rounded-xl border text-xs font-semibold whitespace-nowrap"
                  style={{
                    borderColor: 'var(--fonts-20, #3a1d4333)',
                    backgroundColor: 'var(--mainbg, #f9f0f5)',
                    color: 'var(--fonts-100, #3a1d43)',
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar (hero__wrap) */}
      <div className="relative z-[2] w-full flex items-end justify-between">
        <div className="flex-1 text-xs font-medium opacity-70 hidden sm:block">
          {brandName} · {lang === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}
        </div>

        <div data-hero-text className="u-small-text-2 text-center font-semibold">
          ©<span data-current-year>{new Date().getFullYear()}</span> {brandName}
        </div>

        <div className="flex-1 flex justify-end">
          <a
            href="#how"
            data-hero-text
            className="u-small-text-2 no-underline font-semibold transition-opacity hover:opacity-65"
            style={{ color: 'var(--fonts-100, #3a1d43)' }}
          >
            {lang === 'ar' ? 'اكتشفي المزيد ↓' : 'scroll down ↓'}
          </a>
        </div>
      </div>
    </section>
  );
}
