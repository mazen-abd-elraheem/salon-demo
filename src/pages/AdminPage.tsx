import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2, ShieldOff } from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import AdminLogin from '../components/admin/AdminLogin';
import AdminLayout from '../components/admin/AdminLayout';
import Overview from '../components/admin/Overview';
import Appointments from '../components/admin/Appointments';
import Services from '../components/admin/Services';
import BusinessHours from '../components/admin/BusinessHours';
import BlockedDates from '../components/admin/BlockedDates';
import BusinessSettingsPage from '../components/admin/BusinessSettingsPage';
import Reconciliation from '../components/admin/Reconciliation';
import Packages from '../components/admin/Packages';
import Inventory from '../components/admin/Inventory';
import RoleManagement from '../components/admin/RoleManagement';
import Attendance from '../components/admin/Attendance';
import PaymentGatewaysPage from '../components/admin/PaymentGatewaysPage';
import { supabase } from '../lib/supabase';
import type { BusinessSettings } from '../lib/types';
import { useLanguage } from '../context/LanguageContext';
import { GuzelLogoIcon } from '../components/public/GuzelSvgIcons';

export default function AdminPage() {
  const auth = useAdminAuth();
  const [brand, setBrand] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAdmin) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('business_settings')
        .select('business_name')
        .limit(1)
        .maybeSingle();
      if (!cancelled) setBrand((data as BusinessSettings | null)?.business_name ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.isAdmin]);

  if (auth.loading) {
    return <LoadingScreen />;
  }

  if (!auth.session) {
    return (
      <AdminLogin
        loading={auth.loading}
        error={auth.error}
        onSubmit={auth.signIn}
      />
    );
  }

  // If authenticated staff is a receptionist, redirect immediately to /reception POS
  if (auth.role === 'receptionist') {
    return <Navigate to="/reception" replace />;
  }

  // Signed in but NOT an authorized admin or manager
  if (auth.isAdmin === false) {
    return (
      <UnauthorizedScreen
        email={auth.user?.email ?? null}
        onSignOut={auth.signOut}
      />
    );
  }

  if (auth.isAdmin === null) {
    return <LoadingScreen subtitle="Verifying admin access…" />;
  }

  const isSuperAdmin = auth.role === 'admin' || !auth.role;

  return (
    <AdminLayout user={auth.user} role={auth.role} onSignOut={auth.signOut} brand={brand}>
      <Routes>
        <Route path="/" element={<Overview brand={brand} />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/services" element={<Services />} />
        <Route path="/hours" element={<BusinessHours />} />
        <Route path="/blocked" element={<BlockedDates />} />
        <Route path="/reconciliation" element={<Reconciliation />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route
          path="/roles"
          element={isSuperAdmin ? <RoleManagement /> : <Navigate to="/admin" replace />}
        />
        <Route path="/attendance" element={<Attendance />} />
        <Route
          path="/payment-gateways"
          element={isSuperAdmin ? <PaymentGatewaysPage /> : <Navigate to="/admin" replace />}
        />
        <Route
          path="/settings"
          element={
            <BusinessSettingsPage onSaved={(s) => setBrand(s.business_name ?? null)} />
          }
        />
      </Routes>
    </AdminLayout>
  );
}

function LoadingScreen({ subtitle }: { subtitle?: string }) {
  const { lang } = useLanguage();
  return (
    <div
      className="grid min-h-screen place-items-center"
      style={{ backgroundColor: 'var(--mainbg, #f9f0f5)', color: 'var(--fonts-100, #3a1d43)' }}
    >
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#cbb6ea] text-[#3a1d43] shadow-soft">
          <GuzelLogoIcon className="h-7 w-7" />
        </div>
        <p className="mt-5 font-display font-bold text-2xl text-[#3a1d43]">
          {lang === 'ar' ? 'جوزال ميديكال سبا • لوحة الإدارة' : 'Guzel Medical Spa Suite'}
        </p>
        <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#3a1d43]/65">
          <Loader2 className="h-4 w-4 animate-spin text-[#b14bd9]" />
          {subtitle ?? (lang === 'ar' ? 'جاري التحقق والتحميل...' : 'Loading…')}
        </p>
      </div>
    </div>
  );
}

function UnauthorizedScreen({
  email,
  onSignOut,
}: {
  email: string | null;
  onSignOut: () => void;
}) {
  const { lang } = useLanguage();
  return (
    <div
      className="grid min-h-screen place-items-center p-6"
      style={{ backgroundColor: 'var(--mainbg, #f9f0f5)', color: 'var(--fonts-100, #3a1d43)' }}
    >
      <div className="card-soft max-w-md p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600">
          <ShieldOff className="h-6 w-6" />
        </div>
        <h1 className="font-display font-bold mt-5 text-2xl sm:text-3xl text-[#3a1d43]">
          {lang === 'ar' ? 'غير مصرح بالدخول' : 'Access Restricted'}
        </h1>
        <p className="mt-3 text-sm text-[#3a1d43]/70 leading-relaxed">
          {lang === 'ar' ? (
            <>
              تم تسجيل الدخول {email && <strong>({email})</strong>}، لكن هذا الحساب ليس لديه صلاحيات الإدارة العليا.
            </>
          ) : (
            <>
              You are signed in {email && <strong>({email})</strong>}, but you are not authorized as an administrator.
            </>
          )}
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link to="/" className="btn-secondary no-underline">
            {lang === 'ar' ? 'الرجوع للموقع' : 'Return to website'}
          </Link>
          <button onClick={onSignOut} className="btn-primary cursor-pointer border-0">
            {lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
}
