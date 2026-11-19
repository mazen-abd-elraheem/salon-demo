import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import type { BusinessSettings } from '../../lib/types';
import { getCurrentCustomer, getLocalSettings } from '../../lib/mockData';
import { GuzelLogoIcon } from './GuzelSvgIcons';
import { getVerifiedStaffSession } from '../../lib/staffAuth';

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
  const { lang, toggleLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLabel, setMenuLabel] = useState(lang === 'ar' ? 'القائمة' : 'Menu');
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

  const menuCardRef = useRef<HTMLElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const scrambleTimerRef = useRef<number | null>(null);

  const localSettings = getLocalSettings();
  const activeSettings = settings || localSettings;
  const effectiveLogo = activeSettings?.logo_url || localSettings?.logo_url || null;

  const brandName =
    lang === 'ar'
      ? activeSettings?.business_name?.trim() || 'جوزال ميديكال سبا'
      : activeSettings?.business_name_en?.trim() || 'Guzel Medical Spa';

  const facebookUrl =
    activeSettings?.facebook_url || 'https://www.facebook.com/share/1AFAh6PqQ7/?mibextid=wwXIfr';

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

  // Live Scroll Percentage Readout (Section 8.8)
  useEffect(() => {
    let rafId = 0;
    const updateScroll = () => {
      const docEl = document.documentElement;
      const m = docEl.scrollHeight - window.innerHeight;
      const pct = m <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((window.scrollY / m) * 100)));
      setScrollPercent(pct);
      rafId = requestAnimationFrame(updateScroll);
    };
    rafId = requestAnimationFrame(updateScroll);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Scramble label helper (20 frames × 20ms with '•' character, Section 8.6)
  const scrambleLabel = useCallback((targetText: string) => {
    if (scrambleTimerRef.current) {
      window.clearInterval(scrambleTimerRef.current);
    }
    const T = 20;
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
      if (
        menuCardRef.current &&
        !menuCardRef.current.contains(target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(target)
      ) {
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
      to: '/',
    },
    {
      label: lang === 'ar' ? 'الخدمات والجلسات' : 'Services & Rituals',
      to: '/services',
    },
    {
      label: lang === 'ar' ? 'باقات العروسة والسبا' : 'Bridal & Packages',
      to: '/packages',
    },
    {
      label: lang === 'ar' ? 'منتجات غزل (Guzel Line)' : 'Guzel Skincare Line',
      to: '/products',
    },
    {
      label: lang === 'ar' ? 'رحلة الجمال (٤ خطوات)' : 'How It Works (4 Steps)',
      to: '/how-it-works',
    },
    {
      label: lang === 'ar' ? 'عن غزل سبا وتواصلي معنا' : 'About Guzel & Contact',
      to: '/about',
    },
    {
      label: lang === 'ar' ? 'احجزي جلستك أونلاين' : 'Book Appointment',
      to: '/book',
    },
    {
      label: lang === 'ar' ? 'سداد الفاتورة بالفرع (QR)' : 'In-Branch QR Checkout',
      to: '/checkout',
    },
  ];

  const legalLinks = [
    {
      label: lang === 'ar' ? 'سياسة الخصوصية واستخدام البيانات' : 'Privacy & Data Usage Policy',
      to: '/legal/privacy',
    },
    {
      label: lang === 'ar' ? 'شروط الخدمة واتفاقية المستخدم' : 'Terms of Service & User Agreement',
      to: '/legal/terms',
    },
    {
      label: lang === 'ar' ? 'سياسة ملفات الارتباط (Cookies)' : 'Cookie Policy',
      to: '/legal/cookies',
    },
  ];

  return (
    <>
      {/* Fixed Header (Section 6.2) */}
      <header className="fixed inset-x-0 top-0 z-[999] flex items-center justify-between px-4 py-4 sm:px-8 sm:py-6 transition-all duration-200 pointer-events-none">
        {/* Left Block: Logo + Dynamic Brand Wordmark */}
        <div className="w-auto sm:w-[13.5rem] pointer-events-auto">
          <Link
            to="/"
            onClick={closeMenu}
            aria-label={`${brandName} home`}
            className="inline-flex items-center gap-2.5 no-underline transition-opacity duration-200 hover:opacity-70"
            style={{ color: 'var(--fonts-100, #3a1d43)' }}
          >
            {effectiveLogo ? (
              <img
                src={effectiveLogo}
                alt={brandName}
                className="h-10 w-10 rounded-2xl object-cover border border-[var(--lines)]"
              />
            ) : (
              <GuzelLogoIcon className="h-9 w-9 sm:h-10 sm:w-10 shrink-0" />
            )}
            <span className="hidden sm:inline-block text-[1.35rem] font-medium tracking-tight truncate max-w-[10rem]">
              {brandName}
            </span>
          </Link>
        </div>

        {/* Centre Lilac Pill (header__main) */}
        <div
          className="relative z-[2] flex items-center gap-3 sm:gap-5 h-12 px-2.5 rounded-full shadow-clean pointer-events-auto transition-colors duration-200"
          style={{
            backgroundColor: 'var(--menu, #cbb6ea)',
            color: 'var(--pill-ink, #3a1d43)',
          }}
        >
          {/* Menu Burger + Scrambling Label */}
          <button
            ref={menuBtnRef}
            type="button"
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex items-center gap-2.5 ps-2.5 pe-1 py-1.5 bg-transparent border-0 cursor-pointer transition-opacity duration-200 hover:opacity-65"
            style={{ color: 'var(--pill-ink, #3a1d43)' }}
          >
            <span className="relative flex flex-col items-center justify-center w-[1.5rem] h-[1.5rem]">
              <span
                className="block w-[1.45rem] h-[1.5px] transition-transform duration-250 ease-out"
                style={{
                  backgroundColor: 'var(--pill-ink, #3a1d43)',
                  transform: menuOpen
                    ? 'translateY(0.75px) rotate(45deg)'
                    : 'translateY(-3.5px) rotate(0deg)',
                }}
              />
              <span
                className="block w-[1.45rem] h-[1.5px] transition-transform duration-250 ease-out"
                style={{
                  backgroundColor: 'var(--pill-ink, #3a1d43)',
                  transform: menuOpen
                    ? 'translateY(-0.75px) rotate(-45deg)'
                    : 'translateY(3.5px) rotate(0deg)',
                }}
              />
            </span>
            <span className="u-btn w-[3.4rem] text-start select-none font-medium">
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
            className="grid h-8 w-8 place-items-center rounded-full border transition-colors duration-200 cursor-pointer bg-transparent"
            style={{
              borderColor: 'var(--menu-colors, #3a1d432b)',
              color: 'var(--pill-ink, #3a1d43)',
            }}
          >
            {isBlushTheme ? (
              /* Sun icon in Blush mode */
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-4 h-4">
                <circle cx="10" cy="10" r="3.6" />
                <path strokeLinecap="round" d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M15.3 4.7L14 6M6 14l-1.3 1.3" />
              </svg>
            ) : (
              /* Sparkle/Diamond icon in Luminous White mode */
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
            className="grid h-8 px-2.5 place-items-center rounded-full border text-xs font-semibold transition-colors duration-200 cursor-pointer bg-transparent"
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
            <span id="progress" className="u-btn w-[2.6rem] text-center tabular-nums text-xs sm:text-sm">
              {scrollPercent}%
            </span>
          </div>
        </div>

        {/* Right Block: ONLY Round Login Icon + Book CTA Pill */}
        <div className="hidden sm:flex items-center gap-2.5 pointer-events-auto">
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
            className="is-header-btn relative grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 hover:scale-105"
            style={{
              borderColor: 'var(--fonts-20, #3a1d4333)',
              color: 'var(--fonts-100, #3a1d43)',
              backgroundColor: customer ? 'var(--menu, #cbb6ea)' : 'transparent',
            }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <circle cx="8" cy="5" r="2.6" />
              <path d="M3 13.5c0-2.5 2.2-4.2 5-4.2s5 1.7 5 4.2v.5H3v-.5Z" />
            </svg>
            {customer && (
              <span
                className="absolute -top-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--mainbg)]"
                title={customer.name}
              />
            )}
          </Link>

          {/* Primary Pill CTA ("Get started" / "احجزي جلستك") */}
          <button
            type="button"
            onClick={handleBookClick}
            className="is-header-btn group/stagger h-12 px-6 rounded-full flex items-center justify-center u-btn font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border-0"
            style={{
              backgroundColor: 'var(--btn-bg, #cbb6ea)',
              color: 'var(--btn-ink, #2c1433)',
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

        {/* Mobile Sign-in Icon (top right on mobile) */}
        <div className="flex sm:hidden items-center pointer-events-auto">
          <Link
            to="/login"
            onClick={closeMenu}
            aria-label={lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            className="grid h-10 w-10 place-items-center rounded-full border"
            style={{
              borderColor: 'var(--fonts-20, #3a1d4333)',
              color: 'var(--fonts-100, #3a1d43)',
              backgroundColor: customer ? 'var(--menu, #cbb6ea)' : 'var(--mainbg)',
            }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <circle cx="8" cy="5" r="2.6" />
              <path d="M3 13.5c0-2.5 2.2-4.2 5-4.2s5 1.7 5 4.2v.5H3v-.5Z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Expanding Menu Panel (Section 6.3) */}
      <section
        className="fixed inset-x-0 top-0 z-[998] flex justify-center pt-3 pointer-events-none transition-all duration-300"
        aria-hidden={!menuOpen}
      >
        <div className="w-[21rem] sm:w-[22rem] flex justify-center items-start">
          <nav
            ref={menuCardRef}
            aria-label="Site menu"
            className="flex flex-col justify-between rounded-[2rem] shadow-soft overflow-hidden transition-all duration-400 ease-out"
            style={{
              backgroundColor: 'var(--dots-pattern, #ecdcef)',
              color: 'var(--fonts-100, #3a1d43)',
              width: menuOpen ? '21rem' : '15rem',
              maxHeight: menuOpen ? '44rem' : '2.7rem',
              padding: menuOpen ? '5.25rem 1.5rem 1.75rem 1.5rem' : '0rem',
              transform: menuOpen ? 'translateY(0rem)' : 'translateY(0.75rem)',
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? 'auto' : 'none',
              border: menuOpen ? '1px solid var(--lines, #e8d7e4)' : 'none',
            }}
          >
            {/* Group 1: Main Menu Screens */}
            <div
              className="flex flex-col gap-2 transition-opacity duration-300"
              style={{ opacity: menuOpen ? 1 : 0 }}
            >
              <span className="u-small-text-1 u-fonts-50">
                {lang === 'ar' ? 'القائمة الرئيسية' : 'Menu'}
              </span>
              <div className="flex flex-col gap-1.5">
                {mainMenuLinks.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMenu}
                      className={`group/stagger u-title-3 text-[1.15rem] sm:text-[1.25rem] no-underline transition-opacity duration-200 hover:opacity-65 flex items-center justify-between ${
                        isActive ? 'font-bold' : 'font-medium'
                      }`}
                      style={{ color: 'var(--fonts-100, #3a1d43)' }}
                    >
                      <HoverStaggerText text={item.label} />
                      {isActive && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: 'var(--accent, #e58fb6)' }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Group 2: Legal & User Data Protection */}
            <div
              className="mt-5 pt-4 border-t flex flex-col gap-1.5 transition-opacity duration-300 delay-75"
              style={{
                borderColor: 'var(--fonts-20, #3a1d4333)',
                opacity: menuOpen ? 1 : 0,
              }}
            >
              <span className="u-small-text-1 u-fonts-50">
                {lang === 'ar' ? 'الخصوصية وحماية البيانات' : 'Other & Data Privacy'}
              </span>
              <div className="flex flex-col gap-1">
                {legalLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className="group/stagger u-title-2 no-underline transition-opacity duration-200 hover:opacity-65"
                    style={{ color: 'var(--fonts-100, #3a1d43)' }}
                  >
                    <HoverStaggerText text={item.label} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Group 3: Social Media (Guzel Spa Facebook & Channels) */}
            <div
              className="mt-5 pt-4 border-t flex flex-col gap-2 transition-opacity duration-300 delay-100"
              style={{
                borderColor: 'var(--fonts-20, #3a1d4333)',
                opacity: menuOpen ? 1 : 0,
              }}
            >
              <span className="u-small-text-1 u-fonts-50">
                {lang === 'ar' ? 'تواصلي مع غزل سبا' : 'Social Media'}
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="group/stagger u-title-2 no-underline transition-opacity duration-200 hover:opacity-65 font-semibold"
                  style={{ color: 'var(--fonts-100, #3a1d43)' }}
                >
                  <HoverStaggerText text="Facebook" />
                </a>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="group/stagger u-title-2 no-underline transition-opacity duration-200 hover:opacity-65"
                  style={{ color: 'var(--fonts-100, #3a1d43)' }}
                >
                  <HoverStaggerText text="Instagram" />
                </a>
                <a
                  href={`https://wa.me/2${(activeSettings?.business_phone || '01012345678').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="group/stagger u-title-2 no-underline transition-opacity duration-200 hover:opacity-65"
                  style={{ color: 'var(--fonts-100, #3a1d43)' }}
                >
                  <HoverStaggerText text="WhatsApp" />
                </a>
              </div>
            </div>

            {/* Verified Staff Only Indicator (Never visible to clients!) */}
            {staffSession && (
              <div
                className="mt-4 pt-3 border-t flex items-center justify-between gap-2"
                style={{ borderColor: 'var(--fonts-20, #3a1d4333)' }}
              >
                <Link
                  to="/reception"
                  onClick={closeMenu}
                  className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold bg-white/70 hover:bg-white transition"
                  style={{ color: 'var(--fonts-100, #3a1d43)' }}
                >
                  {lang === 'ar' ? 'شاشة الكاشير' : 'Reception POS'}
                </Link>
                {(staffSession.role === 'admin' || staffSession.role === 'manager') && (
                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold bg-white/70 hover:bg-white transition"
                    style={{ color: 'var(--fonts-100, #3a1d43)' }}
                  >
                    {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Suite'}
                  </Link>
                )}
              </div>
            )}

            {/* Mobile Book Button inside Menu */}
            <div className="mt-4 sm:hidden">
              <button
                type="button"
                onClick={handleBookClick}
                className="w-full h-11 rounded-full flex items-center justify-center u-btn font-semibold border-0 cursor-pointer"
                style={{
                  backgroundColor: 'var(--btn-bg, #cbb6ea)',
                  color: 'var(--btn-ink, #2c1433)',
                }}
              >
                {lang === 'ar' ? 'احجزي جلستك الآن' : 'Book Ritual Now'}
              </button>
            </div>
          </nav>
        </div>
      </section>
    </>
  );
}
