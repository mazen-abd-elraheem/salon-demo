import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { BusinessSettings, Product, Service } from '../../lib/types';
import PhImage from './PhImage';
import GuzelThreeCanvas from './GuzelThreeCanvas';

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
  const { lang } = useLanguage();
  const [introStep, setIntroStep] = useState<number>(0);

  // Word-flash intro sequence triggered when preloader finishes (Section 8.3)
  useEffect(() => {
    const startIntro = () => {
      setIntroStep(1); // Violet flash (--flash-a)
      const t2 = window.setTimeout(() => setIntroStep(2), 180); // Pink flash (--flash-b)
      const t3 = window.setTimeout(() => setIntroStep(3), 380); // Settle to ink (--fonts-100)
      return () => {
        window.clearTimeout(t2);
        window.clearTimeout(t3);
      };
    };

    const tInitial = window.setTimeout(startIntro, 250);
    document.addEventListener('preloader:done', startIntro);
    return () => {
      window.clearTimeout(tInitial);
      document.removeEventListener('preloader:done', startIntro);
    };
  }, []);

  // Collect custom images uploaded by Admin in Services or Products to feed into ring cards
  const customUploads: (string | null)[] = [
    ...services.map((s) => s.image_url || null),
    ...products.map((p) => p.image_url || null),
  ].filter((url): url is string => !!url && url.trim().length > 4);

  const brandName =
    lang === 'ar'
      ? settings?.business_name?.trim() || 'غزل سبا'
      : settings?.business_name_en?.trim() || 'Guzel';

  const tagline =
    lang === 'ar'
      ? settings?.tagline_ar || 'غزل سبا للجمال والاسترخاء'
      : settings?.tagline || 'Guzel spa for beauty and relaxation';

  const chips =
    lang === 'ar'
      ? [
          'سيروم غزل باللافندر',
          'هيدرا فيشل ملكي',
          'حمام مغربي بالأعشاب',
          'مساج استرخائي عطري',
          'باقات العروسة VIP',
          'ترميم الشعر بالكافيار',
        ]
      : [
          'Guzel Lavender Serum',
          'Royal HydraFacial',
          'Moroccan Hammam',
          'Aromatherapy Massage',
          'Bridal VIP Suites',
          'Caviar Hair Revival',
        ];

  const getFlashColor = (wordOffset: number) => {
    if (introStep === 1) return 'var(--flash-a, #b14bd9)';
    if (introStep === 2) return wordOffset % 2 === 0 ? 'var(--flash-b, #f28db5)' : 'var(--flash-a, #b14bd9)';
    return 'var(--fonts-100, #3a1d43)';
  };

  return (
    <section
      id="hero"
      className="relative w-full h-[100svh] min-h-[44rem] sm:min-h-[54rem] px-4 pt-24 pb-10 sm:px-8 sm:pb-14 flex items-end justify-center overflow-hidden select-none"
      style={
        {
          '--R': 'min(22vw, 34svh)',
          backgroundColor: 'var(--mainbg, #f9f0f5)',
          color: 'var(--fonts-100, #3a1d43)',
        } as React.CSSProperties
      }
    >
      {/* Responsive radius override for tablet & mobile */}
      <style>{`
        @media screen and (max-width: 991px) {
          #hero { --R: min(29vw, 29svh) !important; }
        }
        @media screen and (max-width: 767px) {
          #hero { --R: min(34vw, 25svh) !important; }
        }
      `}</style>

      {/* Three.js Subtle Ambient Botanical Dew Canvas */}
      <GuzelThreeCanvas />

      {/* 8-Card Orbiting Ring (Section 6.4 & 8.4) */}
      <div
        className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none pt-6 sm:pt-10 pb-12 sm:pb-0"
        aria-hidden="true"
      >
        <div
          className="relative flex items-center justify-center animate-ring-orbit"
          style={{
            width: 'calc(var(--R) * 2.9)',
            height: 'calc(var(--R) * 2.9)',
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
                <div
                  className="relative flex items-center justify-center overflow-hidden shadow-clean transition-transform duration-700"
                  style={{
                    top: 'calc(var(--R) * -1)',
                    width: 'calc(var(--R) * 0.37)',
                    height: 'calc(var(--R) * 0.44)',
                    borderRadius: 'calc(var(--R) * 0.12)',
                    backgroundColor: 'var(--lines, #e8d7e4)',
                  }}
                >
                  {/* Counter-rotating upright photo (.52R × .52R) */}
                  <div
                    className="shrink-0 animate-ring-counter"
                    style={
                      {
                        width: 'calc(var(--R) * 0.54)',
                        height: 'calc(var(--R) * 0.54)',
                        '--init-rot': `-${holder.deg}deg`,
                      } as React.CSSProperties
                    }
                  >
                    <PhImage
                      imgKey={holder.key}
                      customImageUrl={customImg}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Centre Headline Layer Inside the Ring (hero__center) */}
      <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center pointer-events-none pt-6 sm:pt-10 pb-12 sm:pb-0 px-6 text-center">
        <span
          className="pointer-events-auto mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium tracking-wide border"
          style={{
            backgroundColor: 'var(--secondbg, #f3e6f0)',
            borderColor: 'var(--lines, #e8d7e4)',
            color: 'var(--fonts-64, #3a1d43a3)',
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#e58fb6]" />
          {tagline}
        </span>

        <h1
          data-hero-text
          className="pointer-events-auto font-normal text-center transition-colors duration-300"
          style={{
            fontSize: 'calc(var(--R) * 0.168)',
            lineHeight: lang === 'ar' ? 1.18 : 0.98,
            letterSpacing: lang === 'ar' ? '0em' : '-0.04em',
          }}
        >
          {lang === 'ar' ? (
            <>
              <span style={{ color: getFlashColor(0) }}>جمالكِ،</span>
              <br />
              <span
                className="it inline-block mx-1"
                style={{
                  fontSize: '1.1em',
                  color: getFlashColor(1),
                }}
              >
                بإشراقة
              </span>{' '}
              <span style={{ color: getFlashColor(2) }}>متجددة.</span>
            </>
          ) : (
            <>
              <span style={{ color: getFlashColor(0) }}>Your</span>{' '}
              <span style={{ color: getFlashColor(1) }}>beauty,</span>
              <br />
              <span
                className="it"
                style={{
                  fontSize: '1.08em',
                  letterSpacing: '-0.02em',
                  color: getFlashColor(2),
                }}
              >
                radiantly
              </span>{' '}
              <span style={{ color: getFlashColor(3) }}>re-shot.</span>
            </>
          )}
        </h1>

        <div className="pointer-events-auto mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onBook}
            className="rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105 cursor-pointer border-0 shadow-clean"
            style={{
              backgroundColor: 'var(--btn-bg, #cbb6ea)',
              color: 'var(--btn-ink, #2c1433)',
            }}
          >
            {lang === 'ar' ? 'احجزي جلستك الآن' : 'Reserve Your Ritual'}
          </button>
        </div>
      </div>

      {/* Looping Chip List (hero__slider, Section 6.4 & 8.5) */}
      <div
        className="
          pointer-events-none z-[3]
          absolute
          lg:top-[10rem] lg:bottom-[10rem] lg:end-8 lg:left-auto lg:h-auto lg:w-auto lg:flex lg:items-center lg:justify-end
          max-lg:bottom-[4.5rem] max-lg:inset-x-0 max-lg:h-10 max-lg:flex max-lg:items-center max-lg:justify-center
        "
        aria-hidden="true"
      >
        <div className="relative overflow-hidden lg:h-[17rem] lg:w-52 max-lg:w-full max-lg:max-w-[34rem] max-lg:h-10 flex lg:flex-col lg:items-end max-lg:flex-row max-lg:items-center">
          {/* Two identical rows for seamless infinite loop */}
          {[0, 1].map((dup) => (
            <div
              key={dup}
              className="animate-hero-chips flex lg:flex-col lg:items-end lg:gap-2 lg:pb-2 max-lg:flex-row max-lg:items-center max-lg:gap-2 max-lg:pe-2 shrink-0"
            >
              {chips.map((chip) => (
                <div
                  key={`${dup}-${chip}`}
                  className="px-4 py-1.5 rounded-lg border text-xs sm:text-sm font-medium whitespace-nowrap"
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

          {/* Top & Bottom Fades (Desktop) */}
          <div
            className="hidden lg:block absolute inset-x-0 top-0 h-16 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, var(--mainbg), var(--mainbg-gradient))',
            }}
          />
          <div
            className="hidden lg:block absolute inset-x-0 bottom-0 h-16 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, var(--mainbg-gradient), var(--mainbg))',
            }}
          />

          {/* Left & Right Fades (Tablet/Mobile) */}
          <div
            className="lg:hidden absolute inset-y-0 left-0 w-16 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, var(--mainbg), var(--mainbg-gradient))',
            }}
          />
          <div
            className="lg:hidden absolute inset-y-0 right-0 w-16 pointer-events-none"
            style={{
              background: 'linear-gradient(-90deg, var(--mainbg), var(--mainbg-gradient))',
            }}
          />
        </div>
      </div>

      {/* Bottom Bar (hero__wrap) */}
      <div className="relative z-[2] w-full flex items-end justify-between">
        <div className="flex-1 text-xs opacity-60 hidden sm:block">
          {brandName} · {lang === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}
        </div>

        <div data-hero-text className="u-small-text-2 text-center">
          ©<span data-current-year>{new Date().getFullYear()}</span> {brandName}
        </div>

        <div className="flex-1 flex justify-end">
          <a
            href="#how"
            data-hero-text
            className="u-small-text-2 no-underline transition-opacity hover:opacity-65"
            style={{ color: 'var(--fonts-100, #3a1d43)' }}
          >
            {lang === 'ar' ? 'اكتشفي المزيد ↓' : 'scroll down'}
          </a>
        </div>
      </div>
    </section>
  );
}
