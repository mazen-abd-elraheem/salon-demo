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

  // Check if user already saw preloader in this tab session
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const seen = sessionStorage.getItem('guzel_preloader_seen');
      return seen !== '1';
    } catch {
      return true;
    }
  });

  const [phase, setPhase] = useState<'hold' | 'fade'>('hold');
  const [counterText, setCounterText] = useState<string>('0');
  const [activeLayer, setActiveLayer] = useState<number>(3);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If preloader was already seen in this session, dispatch done event immediately and return
    if (!visible) {
      document.dispatchEvent(new CustomEvent('preloader:done'));
      onDone?.();
      return;
    }

    let isReturning = false;
    try {
      isReturning = localStorage.getItem('reshoot_preloader_v1') === '1';
      localStorage.setItem('reshoot_preloader_v1', '1');
      sessionStorage.setItem('guzel_preloader_seen', '1');
    } catch {
      // ignore storage errors
    }

    if (isReturning) {
      setCounterText(lang === 'ar' ? 'متزامن' : 'Synced');
    }

    const timers: number[] = [];

    // Hard-cut portrait cycle: pre:3 -> pre:0 -> pre:2 -> pre:1
    let idx = 0;
    const cutInterval = window.setInterval(() => {
      setActiveLayer(idx % 4);
      idx++;
    }, isReturning ? 150 : 250);

    // Stepped counter for first-time visitors
    if (!isReturning) {
      const stepDuration = 110;
      STEPS.forEach((targetVal, stepIdx) => {
        const t = window.setTimeout(() => {
          setCounterText(String(targetVal));
        }, stepIdx * stepDuration);
        timers.push(t);
      });
    }

    // Completion timing
    const fadeDelay = isReturning ? 400 : 900;
    const doneDelay = isReturning ? 650 : 1250;

    const tFade = window.setTimeout(() => setPhase('fade'), fadeDelay);
    const tDone = window.setTimeout(() => {
      window.clearInterval(cutInterval);
      setVisible(false);
      onDone?.();
      document.dispatchEvent(new CustomEvent('preloader:done'));
    }, doneDelay);

    // Maximum 1.8s failsafe to guarantee preloader is never stuck
    const tFailsafe = window.setTimeout(() => {
      window.clearInterval(cutInterval);
      setVisible(false);
      onDone?.();
      document.dispatchEvent(new CustomEvent('preloader:done'));
    }, 1800);

    timers.push(tFade, tDone, tFailsafe);

    return () => {
      window.clearInterval(cutInterval);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [lang, onDone, visible]);

  if (!visible) return null;

  const isFading = phase === 'fade';

  return (
    <section
      className="fixed inset-0 z-[9999] flex flex-col justify-between p-6 sm:p-8 pointer-events-none transition-opacity duration-400 ease-out"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        opacity: isFading ? 0 : 1,
      }}
      aria-hidden="true"
    >
      {/* Top Counter */}
      <div
        className="u-h1 font-mono font-bold tracking-tight select-none transition-all duration-300"
        style={{
          color: 'var(--fonts-100, #3a1d43)',
          opacity: isFading ? 0 : 1,
        }}
      >
        {counterText}
        {!isNaN(Number(counterText)) && <span className="text-sm align-super ml-0.5">%</span>}
      </div>

      {/* Centre Hard-Cut Portrait Stack */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-400"
        style={{
          opacity: isFading ? 0 : 1,
        }}
      >
        <div className="relative w-[10.5rem] h-[16rem] sm:w-[15rem] sm:h-[22rem] rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(58,29,67,0.12)] border border-white/60">
          {PRE_KEYS.map((key, i) => (
            <div
              key={key}
              className="absolute inset-0 transition-opacity duration-100"
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
        className="w-full flex items-center justify-between transition-all duration-300"
        style={{
          color: 'var(--fonts-100, #3a1d43)',
          opacity: isFading ? 0 : 1,
        }}
      >
        <GuzelLogoIcon className="w-9 h-9 sm:w-12 sm:h-12" />
        <div className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center">
          <GuzelSpinIcon className="w-8 h-8 sm:w-10 sm:h-10 animate-spin-step" />
        </div>
      </div>
    </section>
  );
}
