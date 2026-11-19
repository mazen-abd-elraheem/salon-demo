import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Calendar,
  CalendarOff,
  Clock,
  Gauge,
  LogOut,
  Menu,
  Scissors,
  Settings2,
  X,
  Globe,
  DollarSign,
  Store,
  Layers,
  ShoppingBag,
  ShieldCheck,
  UserCheck,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalSettings } from '../../lib/mockData';
import { supabase } from '../../lib/supabase';
import { GuzelLogoIcon } from '../public/GuzelSvgIcons';
import type { StaffRole } from '../../lib/types';

interface AdminLayoutProps {
  children: ReactNode;
  user: User | null;
  role?: StaffRole | null;
  onSignOut: () => void;
  brand?: string | null;
}

export default function AdminLayout({
  children,
  user,
  role = 'admin',
  onSignOut,
  brand,
}: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [salonLogo, setSalonLogo] = useState<string | null>(() => getLocalSettings()?.logo_url || null);
  const location = useLocation();
  const { lang, toggleLang, isRTL } = useLanguage();
  const display = lang === 'ar' ? 'جوزال ميديكال سبا' : brand?.trim() || 'Guzel Medical Spa';

  // Keep salon logo synced live across all admin tabs
  useEffect(() => {
    const syncLogo = () => {
      const local = getLocalSettings();
      if (local?.logo_url) setSalonLogo(local.logo_url);
    };
    syncLogo();
    (async () => {
      try {
        const { data } = await supabase
          .from('business_settings')
          .select('logo_url')
          .limit(1)
          .maybeSingle();
        if (data?.logo_url) setSalonLogo(data.logo_url);
      } catch {
        // fallback to local logo
      }
    })();
    window.addEventListener('storage', syncLogo);
    window.addEventListener('guzel:data-updated', syncLogo);
    return () => {
      window.removeEventListener('storage', syncLogo);
      window.removeEventListener('guzel:data-updated', syncLogo);
    };
  }, []);

  const isSuperAdmin = role === 'admin' || !role;

  const navGroups = [
    {
      title: lang === 'ar' ? 'العمليات والفرع' : 'Operations & POS',
      items: [
        { label: lang === 'ar' ? 'نظرة عامة' : 'Overview', to: '/admin', end: true, Icon: Gauge },
        { label: lang === 'ar' ? 'الحجوزات والمواعيد' : 'Appointments', to: '/admin/appointments', Icon: Calendar },
        {
          label: lang === 'ar' ? 'الاستقبال والدفع الذكي' : 'Reception & Smart POS',
          to: '/reception',
          Icon: Store,
          badge: lang === 'ar' ? 'مباشر' : 'POS',
        },
        { label: lang === 'ar' ? 'التقفيل المالي والورديات' : 'Reconciliation', to: '/admin/reconciliation', Icon: DollarSign },
        { label: lang === 'ar' ? 'الحضور والانصراف' : 'Staff Attendance', to: '/admin/attendance', Icon: UserCheck },
      ],
    },
    {
      title: lang === 'ar' ? 'الكتالوج والمنتجات' : 'Catalog & Retail',
      items: [
        { label: lang === 'ar' ? 'الخدمات والجلسات' : 'Services & Rituals', to: '/admin/services', Icon: Scissors },
        { label: lang === 'ar' ? 'الباقات والعروض' : 'Packages & Bundles', to: '/admin/packages', Icon: Layers },
        { label: lang === 'ar' ? 'المخزون ومنتجات جوزال' : 'Retail & Inventory', to: '/admin/inventory', Icon: ShoppingBag },
      ],
    },
    {
      title: lang === 'ar' ? 'الإدارة والأمان' : 'System & Security',
      items: [
        ...(isSuperAdmin
          ? [
              {
                label: lang === 'ar' ? 'بوابات الدفع الإلكتروني' : 'Payment Gateways',
                to: '/admin/payment-gateways',
                Icon: CreditCard,
              },
              {
                label: lang === 'ar' ? 'الحسابات والـ PIN والصلاحيات' : 'Staff, PINs & Roles',
                to: '/admin/roles',
                Icon: ShieldCheck,
              },
            ]
          : []),
        { label: lang === 'ar' ? 'مواعيد العمل' : 'Business Hours', to: '/admin/hours', Icon: Clock },
        { label: lang === 'ar' ? 'الأيام المغلقة' : 'Blocked Dates', to: '/admin/blocked', Icon: CalendarOff },
        { label: lang === 'ar' ? 'إعدادات المركز' : 'Business Settings', to: '/admin/settings', Icon: Settings2 },
      ],
    },
  ];

  const userName =
    (user?.user_metadata as any)?.name ||
    user?.email ||
    (lang === 'ar' ? 'مدير النظام' : 'Administrator');

  const roleBadgeLabel =
    role === 'manager'
      ? lang === 'ar'
        ? 'مديرة المركز'
        : 'Manager'
      : lang === 'ar'
      ? 'المدير العام (Admin)'
      : 'Super Admin';

  return (
    <div
      className="flex min-h-screen font-sans"
      style={{
        backgroundColor: '#f9f0f5',
        color: '#3a1d43',
      }}
    >
      {/* Docked Editorial Glass Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 start-0 z-40 w-72 flex flex-col transform border-e transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen
            ? 'translate-x-0'
            : isRTL
            ? 'translate-x-full'
            : '-translate-x-full',
        ].join(' ')}
        style={{
          backgroundColor: 'rgba(243, 230, 240, 0.94)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderColor: 'rgba(58, 29, 67, 0.08)',
        }}
      >
        {/* Sidebar Brand Mark */}
        <div
          className="shrink-0 flex h-[4.5rem] items-center justify-between px-5 border-b"
          style={{ borderColor: 'rgba(58, 29, 67, 0.07)' }}
        >
          <Link to="/admin" className="flex items-center gap-3 no-underline">
            {salonLogo ? (
              <img
                src={salonLogo}
                alt={display}
                className="h-10 w-10 rounded-2xl object-cover border border-[#3a1d43]/10 bg-white shadow-xs"
              />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#cbb6ea] text-[#3a1d43] shadow-xs">
                <GuzelLogoIcon className="h-5 w-5" />
              </span>
            )}
            <div className="leading-tight">
              <div className="font-display font-bold text-base text-[#3a1d43]">{display}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#73358c]">
                {lang === 'ar' ? 'لوحة الإدارة التنفيذية' : 'Executive Suite'}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#3a1d43]/15 bg-white/80 text-[#3a1d43] lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto admin-scroll px-3.5 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#3a1d43]/45">
                {group.title}
              </div>
              {group.items.map(({ label, to, end, Icon, badge }: any) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end as any}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      'group flex items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] transition-all duration-200 no-underline',
                      isActive
                        ? 'bg-[#3a1d43] text-white font-bold shadow-[0_10px_24px_-8px_rgba(58,29,67,0.4)]'
                        : 'text-[#3a1d43]/80 font-semibold hover:bg-white/75 hover:text-[#3a1d43]',
                    ].join(' ')
                  }
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 opacity-85" />
                    <span className="truncate">{label}</span>
                  </span>
                  {badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#cbb6ea] text-[#3a1d43]">
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Pinned Bottom Staff Profile & Sign-Out Card */}
        <div
          className="shrink-0 p-3.5 border-t"
          style={{ borderColor: 'rgba(58, 29, 67, 0.07)' }}
        >
          <div
            className="rounded-2xl border p-3.5"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderColor: 'rgba(58, 29, 67, 0.09)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#cbb6ea] text-[#3a1d43] font-bold text-xs shrink-0">
                {(userName?.[0] || 'A').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-xs font-bold text-[#3a1d43]">
                  {userName}
                </div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#73358c]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{roleBadgeLabel}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#3a1d43]/12 bg-[#f9f0f5] px-3 py-2 text-xs font-bold text-[#3a1d43] transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'تسجيل الخروج الآمن' : 'Secure Sign Out'}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Scrim Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-[#25142d]/35 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Ultra-Clean Unified Admin Header Showing Salon Logo */}
        <header
          className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 pt-3 pb-2"
          style={{
            background: 'linear-gradient(180deg, rgba(249,240,245,0.96) 65%, rgba(249,240,245,0) 100%)',
          }}
        >
          <div
            className="mx-auto max-w-7xl flex h-[3.85rem] items-center justify-between gap-3 rounded-full border px-3 sm:px-4 backdrop-blur-xl transition-all"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.86)',
              borderColor: 'rgba(58, 29, 67, 0.09)',
              boxShadow: '0 10px 30px -12px rgba(58, 29, 67, 0.12)',
            }}
          >
            {/* Start: Mobile Menu Button + Salon Logo + Brand & Active Screen Pill */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#3a1d43]/12 bg-[#f9f0f5] text-[#3a1d43] lg:hidden cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              <Link
                to="/admin"
                className="flex items-center gap-2.5 no-underline shrink-0"
              >
                {salonLogo ? (
                  <img
                    src={salonLogo}
                    alt={display}
                    className="h-9 w-9 rounded-full object-cover border border-[#3a1d43]/12 bg-white shadow-xs"
                  />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#cbb6ea] text-[#3a1d43]">
                    <GuzelLogoIcon className="h-4.5 w-4.5" />
                  </span>
                )}
                <span className="hidden sm:inline-block font-display font-bold text-sm text-[#3a1d43]">
                  {display}
                </span>
              </Link>

              <span className="hidden sm:inline-block h-4 w-px bg-[#3a1d43]/12" />

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e6f0] border border-[#e8d7e4] px-3 py-1 text-xs font-bold text-[#73358c] truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b14bd9] shrink-0" />
                <span className="truncate">{titleFromPath(location.pathname, lang)}</span>
              </span>
            </div>

            {/* End: Clean Compact Action Pills */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/reception"
                className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[#3a1d43] hover:opacity-90 px-4 py-2 text-xs font-bold text-white transition no-underline shadow-xs"
              >
                <Store className="h-3.5 w-3.5 text-[#cbb6ea]" />
                <span>{lang === 'ar' ? 'شاشة الاستقبال' : 'Reception POS'}</span>
              </Link>

              <button
                onClick={toggleLang}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#3a1d43]/12 bg-[#f9f0f5] hover:bg-[#f3e6f0] px-3 py-1.5 text-xs font-bold text-[#3a1d43] transition cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5 text-[#b14bd9]" />
                <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
              </button>

              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#3a1d43]/12 bg-white hover:bg-[#f9f0f5] px-3.5 py-1.5 text-xs font-bold text-[#3a1d43] transition no-underline"
              >
                <span className="hidden sm:inline">{lang === 'ar' ? 'الموقع' : 'Site'}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#73358c]" />
              </Link>
            </div>
          </div>
        </header>

        <main className="admin-scroll flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function titleFromPath(path: string, lang: 'en' | 'ar'): string {
  if (path === '/admin') return lang === 'ar' ? 'نظرة عامة' : 'Overview';
  if (path.startsWith('/admin/appointments')) return lang === 'ar' ? 'الحجوزات والمواعيد' : 'Appointments';
  if (path.startsWith('/admin/packages')) return lang === 'ar' ? 'الباقات والعروض' : 'Packages & Bundles';
  if (path.startsWith('/admin/inventory')) return lang === 'ar' ? 'المخزون ومنتجات جوزال' : 'Retail & Inventory';
  if (path.startsWith('/admin/payment-gateways')) return lang === 'ar' ? 'بوابات الدفع الإلكتروني' : 'Payment Gateways';
  if (path.startsWith('/admin/roles')) return lang === 'ar' ? 'الحسابات والـ PIN والصلاحيات' : 'Staff, PINs & Roles';
  if (path.startsWith('/admin/attendance')) return lang === 'ar' ? 'سجل الحضور والانصراف' : 'Staff Attendance';
  if (path.startsWith('/admin/reconciliation')) return lang === 'ar' ? 'التقفيل المالي والورديات' : 'Financial Reconciliation';
  if (path.startsWith('/admin/services')) return lang === 'ar' ? 'الخدمات والجلسات' : 'Services & Rituals';
  if (path.startsWith('/admin/hours')) return lang === 'ar' ? 'مواعيد العمل' : 'Business Hours';
  if (path.startsWith('/admin/blocked')) return lang === 'ar' ? 'الأيام المغلقة' : 'Blocked Dates';
  if (path.startsWith('/admin/settings')) return lang === 'ar' ? 'إعدادات المركز' : 'Business Settings';
  return lang === 'ar' ? 'الإدارة' : 'Suite';
}
