import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const WORDMARK_TILES = [
  { text: 'Guzel', style: 'a' },
  { text: 'Kivra', style: 'b' },
  { text: 'Noora', style: 'c' },
  { text: 'velēn', style: 'd' },
  { text: 'oriel.', style: 'e' },
  { text: 'Maisy & Co', style: 'b' },
  { text: 'softa', style: 'a' },
  { text: 'Lirae', style: 'c' },
  { text: 'dewlab', style: 'd' },
  { text: 'petalé', style: 'e' },
] as const;

export default function GuzelHowItWorks() {
  const { lang } = useLanguage();
  const sectionRef = useRef<HTMLElement | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const phraseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [flashPhase, setFlashPhase] = useState<number>(3);

  // Scroll word flash when section enters viewport (Section 8.10)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setFlashPhase(1);
          window.setTimeout(() => setFlashPhase(2), 180);
          window.setTimeout(() => setFlashPhase(3), 340);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Viewport-aware Brightness Loop for the 6 crawling phrases (pauses automatically when offscreen)
  useEffect(() => {
    let rafId = 0;
    let isVisible = false;
    const fadeFinish = 0.15;

    const tick = () => {
      if (!isVisible || document.hidden) {
        rafId = 0;
        return;
      }
      const win = windowRef.current;
      if (win) {
        const winRect = win.getBoundingClientRect();
        const H = winRect.height;
        if (H > 0) {
          for (const phraseEl of phraseRefs.current) {
            if (!phraseEl) continue;
            const rect = phraseEl.getBoundingClientRect();
            const top = rect.top - winRect.top;
            const bottom = top + rect.height;
            let op = 0.2;
            if (bottom > 0 && top < H) {
              const n = Math.min(1, Math.max(0, 1 - bottom / H));
              const p = Math.min(1, Math.max(0, n / (1 - fadeFinish)));
              op = 0.2 + 0.8 * p;
            }
            phraseEl.style.opacity = op.toFixed(3);
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!rafId && isVisible && !document.hidden) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const el = sectionRef.current;
    let obs: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== 'undefined') {
      obs = new IntersectionObserver(
        (entries) => {
          isVisible = Boolean(entries[0]?.isIntersecting);
          if (isVisible) {
            startLoop();
          } else if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
        },
        { threshold: 0.01 },
      );
      obs.observe(el);
    } else {
      isVisible = true;
      startLoop();
    }

    const onVisibility = () => {
      if (!document.hidden && isVisible) startLoop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      obs?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const flashColor =
    flashPhase === 1
      ? 'var(--flash-a, #b14bd9)'
      : flashPhase === 2
      ? 'var(--flash-b, #f28db5)'
      : 'var(--fonts-100, #3a1d43)';

  const renderPhrases = (colIdx: number) => {
    const items =
      lang === 'ar'
        ? [
            { id: 0, content: <>جلسات متقنة</> },
            { id: 1, content: <>استرخاء عميق</> },
            {
              id: 2,
              content: (
                <>
                  نضارة <span className="it text-[1.06em] font-normal">تدوم</span>
                </>
              ),
            },
          ]
        : [
            { id: 0, content: <>Shoots images</> },
            { id: 1, content: <>Restores balance</> },
            {
              id: 2,
              content: (
                <>
                  Keeps the <span className="it text-[1.06em] font-normal">glow</span>
                </>
              ),
            },
          ];

    return items.map((item, i) => {
      const refIndex = colIdx * 3 + i;
      return (
        <div
          key={`${colIdx}-${item.id}`}
          ref={(el) => {
            phraseRefs.current[refIndex] = el;
          }}
          className="py-4 sm:py-7 transition-opacity duration-75"
          style={{ opacity: 0.4 }}
        >
          <div
            className="text-[2.5rem] sm:text-[4.5rem] xl:text-[6.2rem] font-medium leading-none whitespace-nowrap"
            style={{
              letterSpacing: lang === 'ar' ? '0' : '-0.2rem',
              color: 'var(--fonts-100, #3a1d43)',
            }}
          >
            {item.content}
          </div>
        </div>
      );
    });
  };

  return (
    <section
      id="how"
      ref={sectionRef}
      className="relative flex flex-col px-4 pt-20 pb-14 sm:px-8 sm:pt-32 sm:pb-24 border-t"
      style={{
        borderColor: 'var(--lines, #e8d7e4)',
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      {/* Top Row (how__main) */}
      <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-16">
        {/* Left Column */}
        <div className="w-full lg:w-[32rem] shrink-0 pt-4 flex flex-col gap-6 lg:gap-12">
          <span className="u-tag" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
            {lang === 'ar' ? 'كيف نعتني بجمالكِ' : 'How it works'}
          </span>

          <h2
            data-flash
            className="text-[2.4rem] sm:text-[3.6rem] lg:text-[4.4rem] font-normal leading-[1.06] transition-colors duration-300"
            style={{
              letterSpacing: lang === 'ar' ? '0' : '-0.12rem',
              color: flashColor,
            }}
          >
            {lang === 'ar' ? (
              <>
                من <span className="it text-[1.08em]">أمنيتكِ</span>
                <br />
                إلى إشراقة
                <br />
                وجمال حقيقي.
              </>
            ) : (
              <>
                From your <span className="it text-[1.06em]">idea</span>
                <br />
                to radiant
                <br />
                relaxation.
              </>
            )}
          </h2>
        </div>

        {/* Right Column: Masked Infinite Crawling Phrases */}
        <div
          ref={windowRef}
          className="how-crawl-mask flex-1 h-[15rem] sm:h-[26rem] lg:h-[33rem] flex flex-col overflow-hidden"
        >
          <div className="animate-column-crawl flex flex-col shrink-0">
            {renderPhrases(0)}
          </div>
          <div className="animate-column-crawl flex flex-col shrink-0" aria-hidden="true">
            {renderPhrases(1)}
          </div>
        </div>
      </div>

      {/* Bottom Row: Trusted By Marquee (how__bottom, Section 6.5 & 8.13) */}
      <div
        className="mt-10 sm:mt-16 pt-8 sm:pt-10 border-t flex flex-col lg:flex-row items-start gap-6 lg:gap-12"
        style={{ borderColor: 'var(--lines, #e8d7e4)' }}
      >
        <div className="w-full lg:w-[32rem] shrink-0">
          <span className="u-tag" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
            {lang === 'ar' ? 'علامات وطقوس جوزال المعتمدة' : 'Trusted by'}
          </span>
        </div>

        <div className="relative flex-1 min-w-0 w-full flex overflow-hidden" dir="ltr">
          {[0, 1].map((dup) => (
            <div
              key={dup}
              aria-hidden={dup === 1 ? 'true' : undefined}
              className="animate-guzel-marquee flex items-center gap-3 sm:gap-5 pr-3 sm:pr-5 shrink-0"
            >
              {WORDMARK_TILES.map((tile) => (
                <div
                  key={`${dup}-${tile.text}`}
                  className="w-[9rem] h-[6.5rem] sm:w-[13rem] sm:h-[9.5rem] rounded-2xl flex items-center justify-center shrink-0 select-none"
                  style={{
                    backgroundColor: 'var(--secondbg, #f3e6f0)',
                    color: 'var(--fonts-100, #3a1d43)',
                  }}
                >
                  {tile.style === 'a' && (
                    <span className="text-[1.2rem] sm:text-[1.65rem] font-semibold tracking-[-0.06rem] whitespace-nowrap">
                      {tile.text}
                    </span>
                  )}
                  {tile.style === 'b' && (
                    <span className="it text-[1.45rem] sm:text-[2rem] whitespace-nowrap">
                      {tile.text}
                    </span>
                  )}
                  {tile.style === 'c' && (
                    <span className="text-[0.78rem] sm:text-[1.05rem] font-normal uppercase tracking-[0.32rem] whitespace-nowrap">
                      {tile.text}
                    </span>
                  )}
                  {tile.style === 'd' && (
                    <span className="text-[1.2rem] sm:text-[1.65rem] font-medium tracking-[-0.03rem] whitespace-nowrap inline-flex items-center">
                      <i className="inline-block w-[0.42em] h-[0.42em] rounded-full bg-current mr-[0.3em]" />
                      {tile.text}
                    </span>
                  )}
                  {tile.style === 'e' && (
                    <span className="text-[1.2rem] sm:text-[1.65rem] font-light tracking-[0.05rem] whitespace-nowrap">
                      {tile.text}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Right & Left Edge Fades */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 z-10"
            style={{
              background: 'linear-gradient(-90deg, var(--mainbg), var(--mainbg-gradient))',
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 z-10"
            style={{
              background: 'linear-gradient(90deg, var(--mainbg), var(--mainbg-gradient))',
            }}
          />
        </div>
      </div>
    </section>
  );
}

