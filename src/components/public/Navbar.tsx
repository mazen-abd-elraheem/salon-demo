import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpLeft,
  ArrowUpRight,
  CalendarCheck,
  Compass,
  Crown,
  Droplets,
  HeartHandshake,
  Home,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { BusinessSettings } from '../../lib/types';
import { getCurrentCustomer, getLocalSettings } from '../../lib/mockData';
import { GuzelLogoIcon } from './GuzelSvgIcons';
import { getVerifiedStaffSession } from '../../lib/staffAuth';
import { sanitizeSafeUrl } from '../../lib/security';

interface NavbarProps {
  settings?: BusinessSettings | null;
  onBook?: () => void;
}

export function HoverStaggerText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={`group/stagger relative inline-block overflow-hidden align-middle ${className}`}>
      <span className="inline-block transition-transform duration-200 ease-out group-hover/stagger:-translate-y-full">
        {text}
      </span>
      <span
        className="absolute inset-x-0 top-full inline-block transition-transform duration-200 ease-out group-hover/stagger:-translate-y-full"
        aria-hidden="true"
      >
        {text}
      </span>
    </span>
  );
}

export default function Navbar({ settings, onBook }: NavbarProps) {
  const { lang, isRTL, toggleLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLabel, setMenuLabel] = useState(lang === 'ar' ? 'القائمة' : 'Menu');
  const [scrolled, setScrolled] = useState(false);
  const [isBlushTheme, setIsBlushTheme] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('reshoot-light');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [customer, setCustomer] = useState(() => getCurrentCustomer());
  const [staffSession, setStaffSession] = useState(() => getVerifiedStaffSession());

  const desktopMenuCardRef = useRef<HTMLElement | null>(null);
  const mobileMenuCardRef = useRef<HTMLElement | null>(null);
  const desktopMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const scrambleTimerRef = useRef<number | null>(null);

  const localSettings = getLocalSettings();
  const activeSettings = settings || localSettings;
  const effectiveLogo = activeSettings?.logo_url || localSettings?.logo_url || null;

  const brandName =
    lang === 'ar'
      ? activeSettings?.business_name?.trim() || 'جوزال ميديكال سبا'
      : activeSettings?.business_name_en?.trim() || 'Guzel Medical Spa';

  const facebookUrl = sanitizeSafeUrl(
    activeSettings?.facebook_url,
    'https://www.facebook.com/share/1AFAh6PqQ7/?mibextid=wwXIfr',
  );

  const whatsappUrl = `https://wa.me/2${(activeSettings?.business_phone || '01012345678').replace(/\D/g, '')}`;

  // Apply Blush (.body.light) vs Luminous White (.body) theme
  useEffect(() => {
    const body = document.body;
    body.classList.add('body');
    if (isBlushTheme) {
      body.classList.add('light');
    } else {
      body.classList.remove('light');
    }
    try {
      localStorage.setItem('reshoot-light', isBlushTheme ? 'true' : 'false');
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: isBlushTheme }));
  }, [isBlushTheme]);

  // Refresh customer & staff session state on route change or storage update
  useEffect(() => {
    const syncAuth = () => {
      setCustomer(getCurrentCustomer());
      setStaffSession(getVerifiedStaffSession());
    };
    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('guzel:auth-updated', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('guzel:auth-updated', syncAuth);
    };
  }, [location.pathname]);

  // Lock body scroll on mobile when menu drawer is open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (menuOpen && window.innerWidth < 640) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [menuOpen]);

  // Event-driven Scroll Percentage Readout + Scrolled elevation (Zero idle CPU usage)
  useEffect(() => {
    let rafId = 0;
    let ticking = false;
    let lastPct = -1;
    let lastScrolled: boolean | null = null;

    const compute = () => {
      ticking = false;
      const docEl = document.documentElement;
      const m = docEl.scrollHeight - window.innerHeight;
      const sy = window.scrollY;
      const pct = m <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((sy / m) * 100)));
      const nextScrolled = sy > 16;

      if (pct !== lastPct) {
        lastPct = pct;
        setScrollPercent(pct);
      }
      if (nextScrolled !== lastScrolled) {
        lastScrolled = nextScrolled;
        setScrolled(nextScrolled);
      }
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true;
        rafId = requestAnimationFrame(compute);
      }
    };

    compute();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  // Scramble label helper (20 frames × 20ms with '•' character)
  const scrambleLabel = useCallback((targetText: string) => {
    if (scrambleTimerRef.current) {
      window.clearInterval(scrambleTimerRef.current);
    }
    const T = 16;
    const L = Math.max(targetText.length, 5);
    let frame = 0;

    scrambleTimerRef.current = window.setInterval(() => {
      frame++;
      if (frame >= T) {
        setMenuLabel(targetText);
        if (scrambleTimerRef.current) window.clearInterval(scrambleTimerRef.current);
        return;
      }
      let out = '';
      for (let i = 0; i < targetText.length; i++) {
        if (frame / T > i / L) {
          out += targetText[i];
        } else {
          out += '•';
        }
      }
      setMenuLabel(out);
    }, 20);
  }, []);

  // Update label when language changes
  useEffect(() => {
    const target = menuOpen
      ? lang === 'ar'
        ? 'إغلاق'
        : 'Close'
      : lang === 'ar'
      ? 'القائمة'
      : 'Menu';
    setMenuLabel(target);
  }, [lang, menuOpen]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => {
      const next = !prev;
      const target = next
        ? lang === 'ar'
          ? 'إغلاق'
          : 'Close'
        : lang === 'ar'
        ? 'القائمة'
        : 'Menu';
      scrambleLabel(target);
      return next;
    });
  }, [lang, scrambleLabel]);

  const closeMenu = useCallback(() => {
    if (!menuOpen) return;
    setMenuOpen(false);
    scrambleLabel(lang === 'ar' ? 'القائمة' : 'Menu');
  }, [lang, menuOpen, scrambleLabel]);

  // Close on outside click & Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as Node;
      const insideDesktopMenu = desktopMenuCardRef.current?.contains(target);
      const insideMobileMenu = mobileMenuCardRef.current?.contains(target);
      const insideDesktopBtn = desktopMenuBtnRef.current?.contains(target);
      const insideMobileBtn = mobileMenuBtnRef.current?.contains(target);
      if (!insideDesktopMenu && !insideMobileMenu && !insideDesktopBtn && !insideMobileBtn) {
        closeMenu();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [closeMenu, menuOpen]);

  const handleBookClick = () => {
    closeMenu();
    if (onBook && location.pathname === '/') {
      onBook();
    } else {
      navigate('/book');
    }
  };

  const mainMenuLinks = [
    {
      label: lang === 'ar' ? 'الرئيسية' : 'Home',
      sub: lang === 'ar' ? 'الواجهة والترحيب' : 'Editorial landing',
      to: '/',
      icon: Home,
    },
    {
      label: lang === 'ar' ? 'الخدمات والجلسات' : 'Services & Rituals',
      sub: lang === 'ar' ? 'بشرة، حمام مغربي، مساج' : 'Facials, hammam & spa',
      to: '/services',
      icon: Sparkles,
    },
    {
      label: lang === 'ar' ? 'باقات العروسة والسبا' : 'Bridal & Packages',
      sub: lang === 'ar' ? 'تجهيز ملكي وعروض مميزة' : 'Curated VIP bundles',
      to: '/packages',
      icon: Crown,
    },
    {
      label: lang === 'ar' ? 'منتجات جوزال للعناية' : 'Guzel Skincare Line',
      sub: lang === 'ar' ? 'سيروم ومستحضرات أصلية' : 'Botanical serum collection',
      to: '/products',
      icon: Droplets,
    },
    {
      label: lang === 'ar' ? 'رحلة الجمال (٤ خطوات)' : 'How It Works (4 Steps)',
      sub: lang === 'ar' ? 'تجربة العناية المتكاملة' : 'Our clinical care journey',
      to: '/how-it-works',
      icon: Compass,
    },
    {
      label: lang === 'ar' ? 'عن جوزال ميديكال سبا' : 'About Guzel Medical Spa',
      sub: lang === 'ar' ? 'قصتنا، الفروع والتواصل' : 'Our story & location',
      to: '/about',
      icon: HeartHandshake,
    },
    {
      label: lang === 'ar' ? 'احجزي جلستك أونلاين' : 'Book Appointment',
      sub: lang === 'ar' ? 'تأكيد فوري للموعد' : 'Instant slot reservation',
      to: '/book',
      icon: CalendarCheck,
    },
  ];

  const legalLinks = [
    {
      label: lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy',
      to: '/legal/privacy',
    },
    {
      label: lang === 'ar' ? 'شروط الاستخدام' : 'Terms of Service',
      to: '/legal/terms',
    },
    {
      label: lang === 'ar' ? 'ملفات الارتباط' : 'Cookies',
      to: '/legal/cookies',
    },
  ];

  const ArrowIcon = isRTL ? ArrowUpLeft : ArrowUpRight;

  return (
    <>
      {/* =================================================================== */}
      {/* 1. MOBILE HEADER (< 640px) — Unified Floating Glass Capsule         */}
      {/* =================================================================== */}
      <header className="fixed inset-x-0 top-0 z-[999] flex sm:hidden items-center justify-center px-3 pt-3 pointer-events-none">
        <div
          className="pointer-events-auto w-full flex items-center justify-between gap-2 h-[3.6rem] px-2.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: menuOpen
              ? 'rgba(255, 255, 255, 0.94)'
              : scrolled
              ? 'rgba(255, 255, 255, 0.86)'
              : 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(58, 29, 67, 0.08)',
            boxShadow:
              scrolled || menuOpen
                ? '0 10px 30px -6px rgba(58, 29, 67, 0.12), 0 2px 6px rgba(58, 29, 67, 0.04)'
                : '0 4px 18px -4px rgba(58, 29, 67, 0.07)',
          }}
        >
          {/* Brand Logo + Clean Name */}
          <Link
            to="/"
            onClick={closeMenu}
            aria-label={`${brandName} home`}
            className="flex items-center gap-2.5 ps-1 pe-1 min-w-0 no-underline active:scale-[0.98] transition-transform duration-150"
            style={{ color: 'var(--fonts-100, #3a1d43)' }}
          >
            {effectiveLogo ? (
              <img
                src={effectiveLogo}
                alt={brandName}
                className="h-9 w-9 rounded-full object-cover shrink-0 border border-[#3a1d43]/10 bg-white shadow-xs"
              />
            ) : (
              <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-[#f3e6f0] border border-[#3a1d43]/10">
                <GuzelLogoIcon className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-col min-w-0 leading-tight">
              <span
                className="text-[0.875rem] font-bold tracking-tight truncate"
                style={{
                  fontFamily:
                    lang === 'ar' ? "'Cairo', 'Tajawal', sans-serif" : undefined,
                }}
              >
                {brandName}
              </span>
              <span className="text-[0.65rem] font-medium opacity-55 truncate">
                {lang === 'ar' ? 'ميديكال سبا وتجميل' : 'Medical Spa'}
              </span>
            </div>
          </Link>

          {/* Compact Action Pair: ONLY Login Icon + Main Menu Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Round Login / Profile Icon */}
            <Link
              to="/login"
              onClick={closeMenu}
              aria-label={
                customer
                  ? `${lang === 'ar' ? 'حسابي:' : 'My account:'} ${customer.name}`
                  : lang === 'ar'
                  ? 'تسجيل الدخول'
                  : 'Sign in'
              }
              className="relative grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b14bd9]/50"
              style={{
                borderColor: customer
                  ? 'rgba(177, 75, 217, 0.25)'
                  : 'rgba(58, 29, 67, 0.1)',
                color: 'var(--fonts-100, #3a1d43)',
                backgroundColor: customer
                  ? 'rgba(203, 182, 234, 0.4)'
                  : 'rgba(249, 240, 245, 0.85)',
              }}
            >
              <User className="w-[1.05rem] h-[1.05rem]" strokeWidth={2} />
              {customer && (
                <span
                  className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"
                  title={customer.name}
                />
              )}
            </Link>

            {/* Primary Menu Pill Button */}
            <button
              ref={mobileMenuBtnRef}
              type="button"
              onClick={toggleMenu}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="flex items-center gap-2 h-10 px-3.5 rounded-full border-0 cursor-pointer transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b14bd9]/50"
              style={{
                backgroundColor: menuOpen
                  ? '#3a1d43'
                  : 'var(--menu, #cbb6ea)',
                color: menuOpen ? '#ffffff' : 'var(--pill-ink, #3a1d43)',
                boxShadow: menuOpen
                  ? '0 4px 14px rgba(58, 29, 67, 0.25)'
                  : '0 2px 8px rgba(58, 29, 67, 0.08)',
              }}
            >
              <span className="relative flex flex-col items-center justify-center w-4 h-4">
                <span
                  className="block w-4 h-[1.6px] rounded-full transition-transform duration-300"
                  style={{
                    backgroundColor: 'currentColor',
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    transform: menuOpen
                      ? 'translateY(0.8px) rotate(45deg)'
                      : 'translateY(-3px) rotate(0deg)',
                  }}
                />
                <span
                  className="block w-4 h-[1.6px] rounded-full transition-transform duration-300"
                  style={{
                    backgroundColor: 'currentColor',
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    transform: menuOpen
                      ? 'translateY(-0.8px) rotate(-45deg)'
                      : 'translateY(3px) rotate(0deg)',
                  }}
                />
              </span>
              <span
                className="text-[0.8rem] font-semibold tracking-tight select-none min-w-[2.6rem] text-center"
                style={{
                  fontFamily:
                    lang === 'ar' ? "'Cairo', 'Tajawal', sans-serif" : undefined,
                }}
              >
                {menuLabel}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. MOBILE LUXURY FLOATING SHEET MENU (< 640px)                      */}
      {/* =================================================================== */}
      {/* Frosted Scrim Backdrop */}
      <div
        onClick={closeMenu}
        aria-hidden="true"
        className={`fixed inset-0 z-[997] sm:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: 'rgba(37, 20, 45, 0.32)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Mobile Floating Sheet Card (Zero Clipping, Pinned Header & Footer) */}
      <div
        className={`fixed inset-x-3 top-[4.85rem] bottom-3 z-[998] sm:hidden flex flex-col pointer-events-none`}
        aria-hidden={!menuOpen}
      >
        <nav
          ref={mobileMenuCardRef}
          aria-label="Mobile navigation"
          className="flex flex-col w-full max-h-full rounded-[1.75rem] overflow-hidden"
          style={{
            backgroundColor: 'rgba(251, 245, 250, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            color: 'var(--fonts-100, #3a1d43)',
            border: '1px solid rgba(58, 29, 67, 0.09)',
            boxShadow:
              '0 24px 60px -12px rgba(37, 20, 45, 0.24), 0 4px 16px rgba(58, 29, 67, 0.08)',
            transform: menuOpen
              ? 'translate3d(0, 0, 0) scale(1)'
              : 'translate3d(0, -14px, 0) scale(0.97)',
            opacity: menuOpen ? 1 : 0,
            pointerEvents: menuOpen ? 'auto' : 'none',
            transition:
              'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease',
            willChange: 'transform, opacity',
          }}
        >
          {/* Pinned Top Utility Controls (Theme, Language, Scroll Progress) */}
          <div
            className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b"
            style={{
              borderColor: 'rgba(58, 29, 67, 0.07)',
              backgroundColor: 'rgba(255, 255, 255, 0.55)',
            }}
          >
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <button
                type="button"
                onClick={toggleLang}
                aria-label="Switch language"
                className="h-8 px-3 rounded-full text-xs font-bold border transition-all duration-150 active:scale-95 cursor-pointer"
                style={{
                  borderColor: 'rgba(58, 29, 67, 0.12)',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  color: 'var(--fonts-100, #3a1d43)',
                }}
              >
                {lang === 'ar' ? 'English' : 'العربية'}
              </button>

              {/* Theme Toggle Pill */}
              <button
                type="button"
                onClick={() => setIsBlushTheme((v) => !v)}
                data-theme-toggle
                aria-pressed={!isBlushTheme}
                aria-label={lang === 'ar' ? 'تغيير مظهر الألوان' : 'Toggle theme'}
                className="h-8 px-3 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer"
                style={{
                  borderColor: 'rgba(58, 29, 67, 0.12)',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  color: 'var(--fonts-100, #3a1d43)',
                }}
              >
                {isBlushTheme ? (
                  <>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                      <circle cx="10" cy="10" r="3.6" />
                      <path strokeLinecap="round" d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M15.3 4.7L14 6M6 14l-1.3 1.3" />
                    </svg>
                    <span>{lang === 'ar' ? 'وردي' : 'Blush'}</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 9.8A5.8 5.8 0 0 1 6.2 2.5a5.8 5.8 0 1 0 7.3 7.3Z" />
                    </svg>
                    <span>{lang === 'ar' ? 'أبيض نقي' : 'Pure'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Monospace Scroll Readout */}
            <div
              className="h-7 px-2.5 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold tabular-nums"
              style={{
                backgroundColor: 'rgba(58, 29, 67, 0.06)',
                color: 'rgba(58, 29, 67, 0.72)',
              }}
            >
              {scrollPercent}%
            </div>
          </div>

          {/* Scrollable Middle Region: Main Links + Staff Portal + Legal & Social */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-4">
            {/* Section Label */}
            <div className="px-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-45">
                {lang === 'ar' ? 'استكشفي المركز' : 'Explore'}
              </span>
              {customer && (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 no-underline"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="truncate max-w-[9rem]">{customer.name}</span>
                </Link>
              )}
            </div>

            {/* Navigation Items — Tactile Editorial List */}
            <div className="flex flex-col gap-1">
              {mainMenuLinks.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl no-underline transition-all duration-200 active:scale-[0.985]"
                    style={{
                      backgroundColor: isActive
                        ? 'rgba(203, 182, 234, 0.34)'
                        : 'transparent',
                      border: isActive
                        ? '1px solid rgba(177, 75, 217, 0.18)'
                        : '1px solid transparent',
                      color: 'var(--fonts-100, #3a1d43)',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="grid h-9 w-9 place-items-center rounded-xl shrink-0 transition-colors duration-200"
                        style={{
                          backgroundColor: isActive
                            ? '#3a1d43'
                            : 'rgba(255, 255, 255, 0.85)',
                          color: isActive ? '#ffffff' : '#6b3a7e',
                          border: isActive
                            ? '1px solid transparent'
                            : '1px solid rgba(58, 29, 67, 0.08)',
                        }}
                      >
                        <Icon className="w-[1.05rem] h-[1.05rem]" strokeWidth={1.8} />
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`text-[0.94rem] leading-snug truncate ${
                            isActive ? 'font-bold' : 'font-semibold'
                          }`}
                          style={{
                            fontFamily:
                              lang === 'ar' ? "'Cairo', 'Tajawal', sans-serif" : undefined,
                          }}
                        >
                          {item.label}
                        </span>
                        <span className="text-[0.72rem] opacity-55 truncate">
                          {item.sub}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isActive ? (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: '#b14bd9' }}
                        />
                      ) : (
                        <ArrowIcon className="w-4 h-4 opacity-35 group-hover:opacity-80 transition-opacity" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Verified Staff Only Indicator (Never visible to clients!) */}
            {staffSession && (
              <div
                className="p-2.5 rounded-2xl border space-y-2"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.72)',
                  borderColor: 'rgba(58, 29, 67, 0.09)',
                }}
              >
                <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold opacity-65">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#73358c]" />
                  <span>{lang === 'ar' ? 'بوابة فريق العمل' : 'Staff Portal'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/reception"
                    onClick={closeMenu}
                    className="text-center py-2.5 px-3 rounded-xl text-xs font-bold bg-[#f3e6f0] hover:bg-[#e8d7e4] transition no-underline"
                    style={{ color: 'var(--fonts-100, #3a1d43)' }}
                  >
                    {lang === 'ar' ? 'شاشة الاستقبال' : 'Reception POS'}
                  </Link>
                  {(staffSession.role === 'admin' || staffSession.role === 'manager') && (
                    <Link
                      to="/admin"
                      onClick={closeMenu}
                      className="text-center py-2.5 px-3 rounded-xl text-xs font-bold bg-[#3a1d43] text-white hover:opacity-90 transition no-underline"
                    >
                      {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Suite'}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Compact Social & Legal Strip */}
            <div
              className="pt-3 px-2 border-t space-y-3"
              style={{ borderColor: 'rgba(58, 29, 67, 0.08)' }}
            >
              {/* Social Chips */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold opacity-45">
                  {lang === 'ar' ? 'تواصلي معنا' : 'Connect'}
                </span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold border no-underline transition-colors hover:bg-white"
                    style={{
                      borderColor: 'rgba(58, 29, 67, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.65)',
                      color: 'var(--fonts-100, #3a1d43)',
                    }}
                  >
                    Facebook
                  </a>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold border no-underline transition-colors hover:bg-white"
                    style={{
                      borderColor: 'rgba(58, 29, 67, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.65)',
                      color: 'var(--fonts-100, #3a1d43)',
                    }}
                  >
                    Instagram
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold border no-underline transition-colors hover:bg-white"
                    style={{
                      borderColor: 'rgba(58, 29, 67, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.65)',
                      color: 'var(--fonts-100, #3a1d43)',
                    }}
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Subtle Inline Legal Row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-1">
                {legalLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className="text-[11px] font-medium opacity-55 hover:opacity-100 no-underline transition-opacity"
                    style={{ color: 'var(--fonts-100, #3a1d43)' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Pinned Sticky Bottom CTA — Always 100% Visible, Never Cut Off */}
          <div
            className="shrink-0 p-3 border-t"
            style={{
              borderColor: 'rgba(58, 29, 67, 0.08)',
              backgroundColor: 'rgba(255, 255, 255, 0.78)',
            }}
          >
            <button
              type="button"
              onClick={handleBookClick}
              className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-[0.94rem] border-0 cursor-pointer transition-all duration-200 active:scale-[0.985]"
              style={{
                backgroundColor: '#3a1d43',
                color: '#ffffff',
                boxShadow: '0 10px 24px -6px rgba(58, 29, 67, 0.35)',
                fontFamily:
                  lang === 'ar' ? "'Cairo', 'Tajawal', sans-serif" : undefined,
              }}
            >
              <Sparkles className="w-4 h-4 text-[#e58fb6]" />
              <span>{lang === 'ar' ? 'احجزي جلستك الآن' : 'Book Ritual Now'}</span>
            </button>
          </div>
        </nav>
      </div>

      {/* =================================================================== */}
      {/* 3. DESKTOP HEADER (>= 640px) — Editorial 3-Zone Floating Header     */}
      {/* =================================================================== */}
      <header className="hidden sm:flex fixed inset-x-0 top-0 z-[999] items-center justify-between px-8 py-5 transition-all duration-200 pointer-events-none">
        {/* Left Block: Logo + Dynamic Brand Wordmark */}
        <div className="w-[15rem] pointer-events-auto">
          <Link
            to="/"
            onClick={closeMenu}
            aria-label={`${brandName} home`}
            className="inline-flex items-center gap-2.5 no-underline transition-opacity duration-200 hover:opacity-75"
            style={{ color: 'var(--fonts-100, #3a1d43)' }}
          >
            {effectiveLogo ? (
              <img
                src={effectiveLogo}
                alt={brandName}
                className="h-10 w-10 rounded-2xl object-cover border border-[var(--lines)] shadow-xs"
              />
            ) : (
              <GuzelLogoIcon className="h-10 w-10 shrink-0" />
            )}
            <span
              className="text-[1.18rem] font-bold tracking-tight truncate max-w-[11.5rem]"
              style={{
                fontFamily:
                  lang === 'ar' ? "'Cairo', 'Tajawal', sans-serif" : undefined,
              }}
            >
              {brandName}
            </span>
          </Link>
        </div>

        {/* Centre Lilac Pill (header__main) */}
        <div
          className="relative z-[2] flex items-center gap-4 h-12 px-2.5 rounded-full pointer-events-auto transition-all duration-200"
          style={{
            backgroundColor: 'var(--menu, #cbb6ea)',
            color: 'var(--pill-ink, #3a1d43)',
            boxShadow:
              '0 8px 24px -6px rgba(58, 29, 67, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
          }}
        >
          {/* Menu Burger + Scrambling Label */}
          <button
            ref={desktopMenuBtnRef}
            type="button"
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex items-center gap-2.5 ps-2.5 pe-1 py-1.5 bg-transparent border-0 cursor-pointer transition-opacity duration-200 hover:opacity-70"
            style={{ color: 'var(--pill-ink, #3a1d43)' }}
          >
            <span className="relative flex flex-col items-center justify-center w-[1.45rem] h-[1.45rem]">
              <span
                className="block w-[1.35rem] h-[1.5px] rounded-full transition-transform duration-300"
                style={{
                  backgroundColor: 'var(--pill-ink, #3a1d43)',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: menuOpen
                    ? 'translateY(0.75px) rotate(45deg)'
                    : 'translateY(-3.5px) rotate(0deg)',
                }}
              />
              <span
                className="block w-[1.35rem] h-[1.5px] rounded-full transition-transform duration-300"
                style={{
                  backgroundColor: 'var(--pill-ink, #3a1d43)',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: menuOpen
                    ? 'translateY(-0.75px) rotate(-45deg)'
                    : 'translateY(3.5px) rotate(0deg)',
                }}
              />
            </span>
            <span className="u-btn w-[3.4rem] text-start select-none font-semibold">
              {menuLabel}
            </span>
          </button>

          {/* Theme Toggle (Blush vs Luminous White) */}
          <button
            type="button"
            onClick={() => setIsBlushTheme((v) => !v)}
            data-theme-toggle
            aria-pressed={!isBlushTheme}
            aria-label={
              lang === 'ar'
                ? isBlushTheme
                  ? 'التبديل للثيم الأبيض النقي'
                  : 'التبديل لثيم البلاش الوردي'
                : 'Toggle Blush / White theme'
            }
            title={
              lang === 'ar'
                ? isBlushTheme
                  ? 'الثيم الأبيض النقي'
                  : 'ثيم البلاش الوردي'
                : isBlushTheme
                ? 'Switch to Luminous White'
                : 'Switch to Blush Pink'
            }
            className="grid h-8 w-8 place-items-center rounded-full border transition-all duration-200 hover:scale-105 cursor-pointer bg-transparent"
            style={{
              borderColor: 'var(--menu-colors, #3a1d432b)',
              color: 'var(--pill-ink, #3a1d43)',
            }}
          >
            {isBlushTheme ? (
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-4 h-4">
                <circle cx="10" cy="10" r="3.6" />
                <path strokeLinecap="round" d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M15.3 4.7L14 6M6 14l-1.3 1.3" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 9.8A5.8 5.8 0 0 1 6.2 2.5a5.8 5.8 0 1 0 7.3 7.3Z" />
              </svg>
            )}
          </button>

          {/* Language Toggle Pill */}
          <button
            type="button"
            onClick={toggleLang}
            aria-label="Switch language"
            className="grid h-8 px-2.5 place-items-center rounded-full border text-xs font-semibold transition-all duration-200 hover:scale-105 cursor-pointer bg-transparent"
            style={{
              borderColor: 'var(--menu-colors, #3a1d432b)',
              color: 'var(--pill-ink, #3a1d43)',
            }}
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>

          {/* Live Scroll Percentage Readout (#progress) */}
          <div
            className="flex items-center justify-center h-8 px-2.5 rounded-full"
            style={{ backgroundColor: 'var(--prc, #3a1d431a)' }}
          >
            <span id="progress" className="font-mono font-semibold w-[2.6rem] text-center tabular-nums text-xs">
              {scrollPercent}%
            </span>
          </div>
        </div>

        {/* Right Block: ONLY Round Login Icon + Book CTA Pill */}
        <div className="w-[15rem] flex items-center justify-end gap-2.5 pointer-events-auto">
          {/* Round Sign-In / Profile Icon */}
          <Link
            to="/login"
            onClick={closeMenu}
            aria-label={
              customer
                ? `${lang === 'ar' ? 'حسابي:' : 'My account:'} ${customer.name}`
                : lang === 'ar'
                ? 'تسجيل الدخول'
                : 'Sign in'
            }
            title={
              customer
                ? `${customer.name} (${customer.phone})`
                : lang === 'ar'
                ? 'تسجيل الدخول / حسابي'
                : 'Sign in / Account'
            }
            className="is-header-btn relative grid h-11 w-11 place-items-center rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md"
            style={{
              borderColor: 'rgba(58, 29, 67, 0.14)',
              color: 'var(--fonts-100, #3a1d43)',
              backgroundColor: customer
                ? 'var(--menu, #cbb6ea)'
                : 'rgba(255, 255, 255, 0.72)',
            }}
          >
            <User className="w-[1.1rem] h-[1.1rem]" strokeWidth={1.9} />
            {customer && (
              <span
                className="absolute top-0.5 end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                title={customer.name}
              />
            )}
          </Link>

          {/* Primary Pill CTA ("Book Ritual" / "احجزي جلستك") */}
          <button
            type="button"
            onClick={handleBookClick}
            className="is-header-btn group/stagger h-11 px-5 rounded-full flex items-center justify-center u-btn font-semibold whitespace-nowrap transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-0"
            style={{
              backgroundColor: 'var(--btn-bg, #cbb6ea)',
              color: 'var(--btn-ink, #2c1433)',
              boxShadow: '0 6px 18px -4px rgba(58, 29, 67, 0.12)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent, #e58fb6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--btn-bg, #cbb6ea)';
            }}
          >
            <HoverStaggerText text={lang === 'ar' ? 'احجزي جلستك' : 'Book Ritual'} />
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 4. DESKTOP EXPANDING MENU PANEL (>= 640px)                          */}
      {/* =================================================================== */}
      <section
        className="hidden sm:flex fixed inset-x-0 top-0 z-[998] justify-center pt-3 pointer-events-none"
        aria-hidden={!menuOpen}
      >
        <div className="w-[24rem] flex justify-center items-start">
          <nav
            ref={desktopMenuCardRef}
            aria-label="Site menu"
            className="flex flex-col justify-between rounded-[2rem] overflow-hidden"
            style={{
              backgroundColor: 'rgba(247, 236, 246, 0.96)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              color: 'var(--fonts-100, #3a1d43)',
              width: menuOpen ? '24rem' : '15rem',
              maxHeight: menuOpen ? 'calc(100svh - 2rem)' : '2.7rem',
              padding: menuOpen ? '4.75rem 1.35rem 1.5rem 1.35rem' : '0rem',
              transform: menuOpen ? 'translateY(0rem)' : 'translateY(0.5rem)',
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? 'auto' : 'none',
              border: menuOpen ? '1px solid rgba(58, 29, 67, 0.1)' : 'none',
              boxShadow: menuOpen
                ? '0 24px 60px -12px rgba(37, 20, 45, 0.18), 0 4px 16px rgba(58, 29, 67, 0.06)'
                : 'none',
              transition:
                'all 380ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div className="overflow-y-auto pr-0.5 space-y-5">
              {/* Group 1: Main Menu Screens */}
              <div
                className="flex flex-col gap-1.5 transition-opacity duration-300"
                style={{ opacity: menuOpen ? 1 : 0 }}
              >
                <span className="px-2 text-[11px] font-bold uppercase tracking-wider opacity-45">
                  {lang === 'ar' ? 'القائمة الرئيسية' : 'Menu'}
                </span>
                <div className="flex flex-col gap-1">
                  {mainMenuLinks.map((item) => {
                    const isActive = location.pathname === item.to;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={closeMenu}
                        className={`group/stagger px-2.5 py-2 rounded-xl no-underline transition-all duration-200 flex items-center justify-between hover:bg-white/60 ${
                          isActive ? 'font-bold bg-white/75' : 'font-medium'
                        }`}
                        style={{ color: 'var(--fonts-100, #3a1d43)' }}
                      >
                        <span className="flex items-center gap-2.5 text-[1.02rem]">
                          <Icon className="w-4 h-4 opacity-65 shrink-0" strokeWidth={1.8} />
                          <HoverStaggerText text={item.label} />
                        </span>
                        {isActive && (
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: '#b14bd9' }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Legal & User Data Protection */}
              <div
                className="pt-3.5 px-2 border-t flex flex-col gap-1.5 transition-opacity duration-300 delay-75"
                style={{
                  borderColor: 'rgba(58, 29, 67, 0.09)',
                  opacity: menuOpen ? 1 : 0,
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-45">
                  {lang === 'ar' ? 'الخصوصية وحماية البيانات' : 'Privacy & Legal'}
                </span>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {legalLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMenu}
                      className="text-xs font-medium opacity-75 hover:opacity-100 no-underline transition-opacity"
                      style={{ color: 'var(--fonts-100, #3a1d43)' }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Group 3: Social Media */}
              <div
                className="pt-3.5 px-2 border-t flex items-center justify-between gap-2 transition-opacity duration-300 delay-100"
                style={{
                  borderColor: 'rgba(58, 29, 67, 0.09)',
                  opacity: menuOpen ? 1 : 0,
                }}
              >
                <span className="text-[11px] font-bold opacity-45">
                  {lang === 'ar' ? 'تواصلي مع جوزال ميديكال سبا' : 'Social Media'}
                </span>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="no-underline hover:opacity-65 transition-opacity"
                    style={{ color: 'var(--fonts-100, #3a1d43)' }}
                  >
                    Facebook
                  </a>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="no-underline hover:opacity-65 transition-opacity"
                    style={{ color: 'var(--fonts-100, #3a1d43)' }}
                  >
                    Instagram
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="no-underline hover:opacity-65 transition-opacity"
                    style={{ color: 'var(--fonts-100, #3a1d43)' }}
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Verified Staff Only Indicator (Never visible to clients!) */}
              {staffSession && (
                <div
                  className="pt-3 border-t flex items-center justify-between gap-2"
                  style={{ borderColor: 'rgba(58, 29, 67, 0.09)' }}
                >
                  <Link
                    to="/reception"
                    onClick={closeMenu}
                    className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold bg-white/80 hover:bg-white transition no-underline"
                    style={{ color: 'var(--fonts-100, #3a1d43)' }}
                  >
                    {lang === 'ar' ? 'شاشة الاستقبال' : 'Reception POS'}
                  </Link>
                  {(staffSession.role === 'admin' || staffSession.role === 'manager') && (
                    <Link
                      to="/admin"
                      onClick={closeMenu}
                      className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold bg-[#3a1d43] text-white hover:opacity-90 transition no-underline"
                    >
                      {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Suite'}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      </section>
    </>
  );
}
