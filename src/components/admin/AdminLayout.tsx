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
  Sparkles,
  X,
  Globe,
  DollarSign,
  Store,
  Layers,
  ShoppingBag,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalSettings } from '../../lib/mockData';

interface AdminLayoutProps {
  children: ReactNode;
  user: User | null;
  onSignOut: () => void;
  brand?: string | null;
}

export default function AdminLayout({
  children,
  user,
  onSignOut,
  brand,
}: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { lang, toggleLang, isRTL } = useLanguage();
  const display = lang === 'ar' ? 'ميزون لوميير' : (brand?.trim() || 'Maison Lumière');

  const localSettings = getLocalSettings();
  const salonLogo = localSettings?.logo_url || null;

  const links = [
    { label: lang === 'ar' ? 'نظرة عامة' : 'Overview', to: '/admin', end: true, Icon: Gauge },
    { label: lang === 'ar' ? 'الحجوزات' : 'Appointments', to: '/admin/appointments', Icon: Calendar },
    { label: lang === 'ar' ? 'الباقات والعروض' : 'Packages & Bundles', to: '/admin/packages', Icon: Layers },
    { label: lang === 'ar' ? 'المخزون والمنتجات' : 'Retail & Inventory', to: '/admin/inventory', Icon: ShoppingBag },
    { label: lang === 'ar' ? 'التقفيل المالي والورديات' : 'Reconciliation', to: '/admin/reconciliation', Icon: DollarSign },
    { label: lang === 'ar' ? 'الحضور والانصراف' : 'Staff Attendance', to: '/admin/attendance', Icon: UserCheck },
    { label: lang === 'ar' ? 'شاشة الاستقبال والكاشير' : 'Reception POS', to: '/reception', Icon: Store },
    { label: lang === 'ar' ? 'المستخدمين والصلاحيات' : 'Staff & Roles', to: '/admin/roles', Icon: ShieldCheck },
    { label: lang === 'ar' ? 'الخدمات' : 'Services', to: '/admin/services', Icon: Scissors },
    { label: lang === 'ar' ? 'مواعيد العمل' : 'Business Hours', to: '/admin/hours', Icon: Clock },
    { label: lang === 'ar' ? 'الأيام المغلقة' : 'Blocked Dates', to: '/admin/blocked', Icon: CalendarOff },
    { label: lang === 'ar' ? 'إعدادات الصالون' : 'Business Settings', to: '/admin/settings', Icon: Settings2 },
  ];

  return (
    <div className="flex min-h-screen bg-cream/40">
      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 start-0 z-40 w-72 transform border-e border-pearl/70 bg-ivory/90 backdrop-blur-sm transition-transform duration-300 ease-out lg:static lg:translate-x-0',
          mobileOpen
            ? 'translate-x-0'
            : isRTL
              ? 'translate-x-full'
              : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            {salonLogo ? (
              <img
                src={salonLogo}
                alt="Salon Logo"
                className="h-10 w-10 rounded-xl object-cover border border-pearl/80"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rosegold-200 to-rosegold-400 text-ivory">
                <Sparkles className="h-4 w-4" />
              </span>
            )}
            <div className="leading-tight">
              <div className="font-display text-lg text-espresso">{display}</div>
              <div className="text-[10px] uppercase tracking-wider-3 text-mocha-500">
                {lang === 'ar' ? 'لوحة تحكم الصالون' : 'Studio Suite'}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full border border-mocha-400/30 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-2 space-y-1 px-4">
          {links.map(({ label, to, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end as any}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-espresso text-ivory shadow-soft'
                    : 'text-mocha-600 hover:bg-pearl/60 hover:text-espresso',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-6">
          <div className="rounded-2xl border border-pearl/70 bg-white/80 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rosegold-200 to-rosegold-400 text-ivory">
                {(user?.email?.[0] || 'A').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-medium text-espresso">
                  {user?.email || (lang === 'ar' ? 'مدير الصالون' : 'Admin')}
                </div>
                <div className="text-[10px] uppercase tracking-wider-2 text-mocha-500">
                  {lang === 'ar' ? 'مسجل الدخول' : 'Signed in'}
                </div>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-mocha-400/20 px-3 py-2 text-xs font-medium text-mocha-600 transition hover:border-mocha-500 hover:text-espresso"
            >
              <LogOut className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-espresso/30 lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-pearl/70 bg-ivory/85 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full border border-mocha-400/30 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="text-[11px] uppercase tracking-wider-2 text-mocha-500">
              {lang === 'ar' ? 'إدارة الصالون' : 'Studio Suite'}
              <span className="mx-2 text-mocha-400/50">/</span>
              <span className="text-espresso">{titleFromPath(location.pathname, lang)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 rounded-full border border-mocha-400/30 bg-ivory/80 px-2.5 py-1 text-xs font-semibold text-espresso shadow-xs transition hover:border-rosegold-300"
            >
              <Globe className="h-3 w-3 text-rosegold-400" />
              <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
            </button>
            <Link
              to="/"
              className="hidden text-xs font-medium uppercase tracking-wider-2 text-mocha-500 transition hover:text-espresso md:inline-flex"
            >
              {lang === 'ar' ? 'عرض الموقع ←' : 'View public site →'}
            </Link>
          </div>
        </header>

        <main className="admin-scroll flex-1 overflow-x-hidden px-4 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function titleFromPath(path: string, lang: 'en' | 'ar'): string {
  if (path === '/admin') return lang === 'ar' ? 'نظرة عامة' : 'Overview';
  if (path.startsWith('/admin/appointments')) return lang === 'ar' ? 'الحجوزات' : 'Appointments';
  if (path.startsWith('/admin/packages')) return lang === 'ar' ? 'الباقات والعروض' : 'Packages & Bundles';
  if (path.startsWith('/admin/inventory')) return lang === 'ar' ? 'المخزون والمنتجات' : 'Retail & Inventory';
  if (path.startsWith('/admin/roles')) return lang === 'ar' ? 'المستخدمين والصلاحيات' : 'Staff & Roles';
  if (path.startsWith('/admin/attendance')) return lang === 'ar' ? 'سجل الحضور والانصراف' : 'Staff Attendance';
  if (path.startsWith('/admin/reconciliation')) return lang === 'ar' ? 'التقفيل المالي والورديات' : 'Financial Reconciliation';
  if (path.startsWith('/admin/services')) return lang === 'ar' ? 'الخدمات' : 'Services';
  if (path.startsWith('/admin/hours')) return lang === 'ar' ? 'مواعيد العمل' : 'Business Hours';
  if (path.startsWith('/admin/blocked')) return lang === 'ar' ? 'الأيام المغلقة' : 'Blocked Dates';
  if (path.startsWith('/admin/settings')) return lang === 'ar' ? 'إعدادات الصالون' : 'Business Settings';
  return lang === 'ar' ? 'الصالون' : 'Studio';
}
