import { ReactNode, useState } from 'react';
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
  const location = useLocation();
  const { lang, toggleLang, isRTL } = useLanguage();
  const display = lang === 'ar' ? 'جوزال ميديكال سبا' : brand?.trim() || 'Guzel Medical Spa';

  const localSettings = getLocalSettings();
  const salonLogo = localSettings?.logo_url || null;
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
                label: lang === 'ar' ? 'المستخدمين والصلاحيات' : 'Staff & Roles (RBAC)',
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
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      {/* Floating / Docked Editorial Glass Sidebar */}
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
          backgroundColor: 'rgba(243, 230, 240, 0.92)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderColor: 'rgba(58, 29, 67, 0.09)',
        }}
      >
        {/* Top Brand Header */}
        <div
          className="shrink-0 flex h-20 items-center justify-between px-5 border-b"
          style={{ borderColor: 'rgba(58, 29, 67, 0.07)' }}
        >
          <Link to="/" className="flex items-center gap-3 no-underline">
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
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#73358c]">
                {lang === 'ar' ? 'لوحة الإدارة المؤمّنة' : 'Executive Suite'}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#3a1d43]/15 bg-white/70 text-[#3a1d43] lg:hidden cursor-pointer"
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
                        : 'text-[#3a1d43]/80 font-semibold hover:bg-white/70 hover:text-[#3a1d43]',
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
              backgroundColor: 'rgba(255, 255, 255, 0.82)',
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
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#3a1d43]/15 bg-[#f9f0f5] px-3 py-2 text-xs font-bold text-[#3a1d43] transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 cursor-pointer"
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

      {/* Main Content Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Floating Glass Bar */}
        <header
          className="sticky top-0 z-20 flex h-16 items-center justify-between border-b px-4 backdrop-blur-xl md:px-8"
          style={{
            backgroundColor: 'rgba(249, 240, 245, 0.86)',
            borderColor: 'rgba(58, 29, 67, 0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#3a1d43]/15 bg-white/80 text-[#3a1d43] lg:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#3a1d43]/60">
              <span>{lang === 'ar' ? 'جوزال ميديكال سبا' : 'Guzel Suite'}</span>
              <span className="opacity-40">/</span>
              <span className="font-bold text-[#3a1d43]">
                {titleFromPath(location.pathname, lang)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/reception"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#cbb6ea]/50 hover:bg-[#cbb6ea] px-3.5 py-1.5 text-xs font-bold text-[#3a1d43] transition no-underline"
            >
              <Store className="h-3.5 w-3.5 text-[#73358c]" />
              <span>{lang === 'ar' ? 'شاشة الاستقبال والدفع' : 'Reception POS'}</span>
            </Link>

            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#3a1d43]/15 bg-white/80 hover:bg-white px-3 py-1.5 text-xs font-bold text-[#3a1d43] shadow-xs transition cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-[#b14bd9]" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#3a1d43]/15 bg-white/80 hover:bg-white px-3.5 py-1.5 text-xs font-bold text-[#3a1d43] transition no-underline"
            >
              <span>{lang === 'ar' ? 'عرض الموقع' : 'Public Site'}</span>
              <ExternalLink className="h-3 w-3 opacity-65" />
            </Link>
          </div>
        </header>

        <main className="admin-scroll flex-1 overflow-x-hidden px-4 py-8 md:px-8 md:py-10 max-w-7xl w-full mx-auto">
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
  if (path.startsWith('/admin/roles')) return lang === 'ar' ? 'المستخدمين والصلاحيات' : 'Staff & Roles';
  if (path.startsWith('/admin/attendance')) return lang === 'ar' ? 'سجل الحضور والانصراف' : 'Staff Attendance';
  if (path.startsWith('/admin/reconciliation')) return lang === 'ar' ? 'التقفيل المالي والورديات' : 'Financial Reconciliation';
  if (path.startsWith('/admin/services')) return lang === 'ar' ? 'الخدمات والجلسات' : 'Services & Rituals';
  if (path.startsWith('/admin/hours')) return lang === 'ar' ? 'مواعيد العمل' : 'Business Hours';
  if (path.startsWith('/admin/blocked')) return lang === 'ar' ? 'الأيام المغلقة' : 'Blocked Dates';
  if (path.startsWith('/admin/settings')) return lang === 'ar' ? 'إعدادات المركز' : 'Business Settings';
  return lang === 'ar' ? 'الإدارة' : 'Suite';
}
