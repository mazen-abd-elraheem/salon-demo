import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  X,
  Sparkles,
  Globe,
  User,
  LogOut,
  QrCode,
  Store,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { BusinessSettings } from '../../lib/types';
import { getCurrentCustomer, logoutCustomer, getLocalSettings } from '../../lib/mockData';

interface NavbarProps {
  settings: BusinessSettings | null;
  onBook: () => void;
}

export default function Navbar({ settings, onBook }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [customer, setCustomer] = useState(getCurrentCustomer());
  const { lang, toggleLang, t } = useLanguage();
  const portalRef = useRef<HTMLDivElement | null>(null);

  const localSettings = getLocalSettings();
  const effectiveLogo = settings?.logo_url || localSettings?.logo_url || null;

  const links = [
    { label: t('navServices'), href: '#services' },
    { label: t('navAtelier'), href: '#about' },
    { label: t('navBooking'), href: '#booking' },
    { label: t('navContact'), href: '#footer' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close portal dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (portalRef.current && !portalRef.current.contains(e.target as Node)) {
        setPortalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutCustomer();
    setCustomer(null);
    setPortalOpen(false);
  };

  const brand = lang === 'ar' ? 'ميزون لوميير' : (settings?.business_name?.trim() || 'Maison Lumière');

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-pearl/80 bg-ivory/95 shadow-softer backdrop-blur-md'
          : 'bg-transparent',
      ].join(' ')}
    >
      <div className="container-page flex h-20 items-center justify-between">
        {/* Brand identity */}
        <a href="#top" className="flex items-center gap-3.5 group">
          {effectiveLogo ? (
            <img
              src={effectiveLogo}
              alt={brand}
              className="h-11 w-11 rounded-2xl object-cover border border-pearl/80 shadow-clean transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-espresso text-ivory shadow-clean transition duration-300 group-hover:bg-mocha-700">
              <Sparkles className="h-5 w-5 text-champagne-300" />
            </span>
          )}
          <span className="flex flex-col leading-tight">
            <span className="font-display text-xl font-semibold tracking-wide text-espresso">
              {brand}
            </span>
            <span className="text-[10px] uppercase tracking-wider-3 text-mocha-500 font-medium">
              {t('brandSubtitle')}
            </span>
          </span>
        </a>

        {/* Clean Central Links */}
        <nav className="hidden items-center gap-9 lg:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="group relative text-sm font-medium text-mocha-700 transition-colors hover:text-espresso"
            >
              {l.label}
              <span className="absolute -bottom-1 start-0 h-0.5 w-0 bg-rosegold-400 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Left Actions: CTA + Language + Unified Portal Dropdown */}
        <div className="hidden items-center gap-3 sm:flex">
          {/* Language Switch */}
          <button
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 rounded-full border border-pearl/90 bg-white/70 px-3 py-1.5 text-xs font-semibold text-espresso transition hover:border-mocha-400 hover:bg-white"
            title="Switch language / تغيير اللغة"
          >
            <Globe className="h-3.5 w-3.5 text-rosegold-400" />
            <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          {/* Unified Studio Portals Menu */}
          <div className="relative" ref={portalRef}>
            <button
              onClick={() => setPortalOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-pearl/90 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-espresso transition hover:border-rosegold-300 hover:bg-white"
            >
              {customer ? (
                <>
                  <User className="h-3.5 w-3.5 text-rosegold-400" />
                  <span className="max-w-[90px] truncate">{customer.name}</span>
                </>
              ) : (
                <>
                  <Store className="h-3.5 w-3.5 text-mocha-500" />
                  <span>{lang === 'ar' ? 'بوابات الصالون' : 'Studio Portals'}</span>
                </>
              )}
              <ChevronDown className={['h-3 w-3 text-mocha-400 transition-transform duration-200', portalOpen ? 'rotate-180' : ''].join(' ')} />
            </button>

            {portalOpen && (
              <div className="absolute end-0 mt-2 w-64 rounded-2xl border border-pearl/90 bg-white p-2 shadow-soft backdrop-blur-md animate-fade-in z-50">
                {customer && (
                  <div className="mb-2 rounded-xl bg-ivory/80 p-3 border border-pearl/60">
                    <div className="text-xs font-semibold text-espresso">{customer.name}</div>
                    <div className="text-[11px] text-mocha-500" dir="ltr">{customer.phone}</div>
                    <button
                      onClick={handleLogout}
                      className="mt-2 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}</span>
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <Link
                    to="/checkout"
                    onClick={() => setPortalOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-mocha-700 hover:bg-ivory hover:text-espresso transition"
                  >
                    <QrCode className="h-4 w-4 text-rosegold-400" />
                    <div>
                      <div className="font-semibold">{lang === 'ar' ? 'سداد الفاتورة بالفرع (QR)' : 'In-Branch QR Checkout'}</div>
                      <div className="text-[10px] text-mocha-400">{lang === 'ar' ? 'للعميلات لإنهاء الحساب' : 'Fast mobile invoice'}</div>
                    </div>
                  </Link>

                  {!customer && (
                    <Link
                      to="/login"
                      onClick={() => setPortalOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-mocha-700 hover:bg-ivory hover:text-espresso transition"
                    >
                      <User className="h-4 w-4 text-mocha-500" />
                      <div>
                        <div className="font-semibold">{lang === 'ar' ? 'حساب العميلة' : 'Customer Account'}</div>
                        <div className="text-[10px] text-mocha-400">{lang === 'ar' ? 'دخول أو إنشاء حساب' : 'Track appointments'}</div>
                      </div>
                    </Link>
                  )}

                  <div className="my-1 border-t border-pearl/60" />

                  <Link
                    to="/reception"
                    onClick={() => setPortalOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-mocha-700 hover:bg-ivory hover:text-espresso transition"
                  >
                    <Store className="h-4 w-4 text-mocha-500" />
                    <div>
                      <div className="font-semibold">{lang === 'ar' ? 'شاشة الاستقبال والكاشير' : 'Reception & POS'}</div>
                      <div className="text-[10px] text-mocha-400">{lang === 'ar' ? 'إدارة التسكين وحضور الموظفات' : 'Check-in & Orders'}</div>
                    </div>
                  </Link>

                  <Link
                    to="/admin"
                    onClick={() => setPortalOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-mocha-700 hover:bg-ivory hover:text-espresso transition"
                  >
                    <Shield className="h-4 w-4 text-mocha-500" />
                    <div>
                      <div className="font-semibold">{lang === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Suite'}</div>
                      <div className="text-[10px] text-mocha-400">{lang === 'ar' ? 'التقارير والمخزون والإعدادات' : 'Management & Reports'}</div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Primary Book CTA */}
          <button onClick={onBook} className="btn-primary">
            {t('bookSession')}
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={toggleLang}
            className="inline-flex items-center gap-1 rounded-full border border-pearl/90 bg-white/80 px-2.5 py-1 text-xs font-semibold text-espresso"
          >
            <Globe className="h-3.5 w-3.5 text-rosegold-400" />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          <button
            className="grid h-10 w-10 place-items-center rounded-xl border border-pearl/90 bg-white/80 text-espresso"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4 text-espresso" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-pearl/80 bg-ivory/98 backdrop-blur-md sm:hidden animate-fade-in shadow-soft">
          <div className="container-page flex flex-col gap-1 py-4">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-mocha-700 hover:bg-pearl/50"
              >
                {l.label}
              </a>
            ))}

            <div className="my-2 border-t border-pearl/70" />

            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-rosegold-600 hover:bg-rosegold-50 flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              <span>{lang === 'ar' ? 'سداد الفاتورة بالفرع (QR)' : 'In-Branch QR Checkout'}</span>
            </Link>

            <Link
              to="/reception"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-mocha-700 hover:bg-pearl/50 flex items-center gap-2"
            >
              <Store className="h-4 w-4 text-mocha-500" />
              <span>{lang === 'ar' ? 'شاشة الاستقبال والكاشير' : 'Reception POS'}</span>
            </Link>

            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-mocha-700 hover:bg-pearl/50 flex items-center gap-2"
            >
              <Shield className="h-4 w-4 text-mocha-500" />
              <span>{lang === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Suite'}</span>
            </Link>

            <button
              onClick={() => {
                setOpen(false);
                onBook();
              }}
              className="btn-primary mt-3 w-full"
            >
              {t('bookSession')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}