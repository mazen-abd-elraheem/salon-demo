import { useEffect, useState } from 'react';
import PhImage from './PhImage';
import { GuzelLogoIcon, GuzelSpinIcon } from './GuzelSvgIcons';
import { useLanguage } from '../../context/LanguageContext';

interface GuzelPreloaderProps {
  onDone?: () => void;
  customImages?: (string | null | undefined)[];
}

const PRE_KEYS = ['pre:3', 'pre:0', 'pre:2', 'pre:1'];
const STEPS = [0, 17, 35, 58, 76, 89, 100];

export default function GuzelPreloader({ onDone, customImages }: GuzelPreloaderProps) {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'fade'>('in');
  const [counterText, setCounterText] = useState<string>('0');
  const [activeLayer, setActiveLayer] = useState<number>(3); // starts with last DOM layer (pre:1) on top

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(false);
      onDone?.();
      document.dispatchEvent(new CustomEvent('preloader:done'));
      return;
    }

    let isReturning = false;
    try {
      isReturning = localStorage.getItem('reshoot_preloader_v1') === '1';
      localStorage.setItem('reshoot_preloader_v1', '1');
    } catch {
      // ignore storage errors
    }

    const sp = isReturning ? 0.2 : 1;

    if (isReturning) {
      setCounterText(lang === 'ar' ? 'متزامن' : 'Synced');
    }

    // Hard-cut portrait cycle: pre:3 -> pre:0 -> pre:2 -> pre:1
    let idx = 0;
    const cutInterval = window.setInterval(() => {
      setActiveLayer(idx % 4);
      idx++;
    }, Math.max(80, 500 * sp));

    // Stepped counter for first-time visitors
    const timers: number[] = [];
    if (!isReturning) {
      const segDuration = (2500 / 6) * sp;
      STEPS.forEach((targetVal, stepIdx) => {
        const t = window.setTimeout(() => {
          setCounterText(String(targetVal));
        }, 400 * sp + stepIdx * segDuration);
        timers.push(t);
      });
    }

    // Main timeline phases
    const tHold = window.setTimeout(() => setPhase('hold'), 150 * sp);
    const tOut = window.setTimeout(() => setPhase('out'), 3200 * sp);
    const tFade = window.setTimeout(() => setPhase('fade'), 4100 * sp);
    const tDone = window.setTimeout(() => {
      window.clearInterval(cutInterval);
      setVisible(false);
      onDone?.();
      document.dispatchEvent(new CustomEvent('preloader:done'));
    }, 4600 * sp);

    // 8000ms failsafe
    const tFailsafe = window.setTimeout(() => {
      window.clearInterval(cutInterval);
      setVisible(false);
      onDone?.();
      document.dispatchEvent(new CustomEvent('preloader:done'));
    }, 8000);

    timers.push(tHold, tOut, tFade, tDone, tFailsafe);

    return () => {
      window.clearInterval(cutInterval);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [lang, onDone]);

  if (!visible) return null;

  const isBlurred = phase === 'in' || phase === 'out' || phase === 'fade';
  const isFadingOverlay = phase === 'fade';

  return (
    <section
      className="fixed inset-0 z-[9999] flex flex-col justify-between p-6 sm:p-8 pointer-events-none transition-opacity duration-500"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        opacity: isFadingOverlay ? 0 : 1,
      }}
      aria-hidden="true"
    >
      {/* Top Counter */}
      <div
        className="u-h1 transition-all duration-700"
        style={{
          color: 'var(--fonts-100, #3a1d43)',
          opacity: isBlurred ? 0 : 1,
          filter: isBlurred ? 'blur(20px)' : 'blur(0px)',
        }}
      >
        {counterText}
      </div>

      {/* Centre Hard-Cut Portrait Stack */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700"
        style={{
          opacity: isBlurred ? 0 : 1,
          filter: isBlurred ? 'blur(20px)' : 'blur(0px)',
        }}
      >
        <div className="relative w-[10.5rem] h-[16rem] sm:w-[16rem] sm:h-[24rem] rounded-3xl overflow-hidden shadow-soft border border-[var(--lines)]">
          {PRE_KEYS.map((key, i) => (
            <div
              key={key}
              className="absolute inset-0"
              style={{ zIndex: activeLayer === i ? 9 : 1 }}
            >
              <PhImage
                imgKey={key}
                customImageUrl={customImages?.[i] || null}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Logo Left, Stepped Spinner Right */}
      <div
        className="w-full flex items-center justify-between transition-all duration-700"
        style={{
          color: 'var(--fonts-100, #3a1d43)',
          opacity: isBlurred ? 0 : 1,
          filter: isBlurred ? 'blur(20px)' : 'blur(0px)',
        }}
      >
        <GuzelLogoIcon className="w-10 h-10 sm:w-14 sm:h-14" />
        <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
          <GuzelSpinIcon className="w-10 h-10 sm:w-14 sm:h-14 animate-spin-step" />
        </div>
      </div>
    </section>
  );
}
