import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Loader2, ShieldOff, Sparkles } from 'lucide-react';
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
import { supabase } from '../lib/supabase';
import type { BusinessSettings } from '../lib/types';
import { useLanguage } from '../context/LanguageContext';

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

  // Loading state: only while we genuinely don't know yet.
  if (auth.loading) {
    return <LoadingScreen />;
  }

  // No session → show login form.
  if (!auth.session) {
    return (
      <AdminLogin
        loading={auth.loading}
        error={auth.error}
        onSubmit={auth.signIn}
      />
    );
  }

  // Signed in but NOT in admin_users.
  if (auth.isAdmin === false) {
    return (
      <UnauthorizedScreen
        email={auth.user?.email ?? null}
        onSignOut={auth.signOut}
      />
    );
  }

  // Session present but admin check hasn't resolved yet — keep waiting.
  if (auth.isAdmin === null) {
    return <LoadingScreen subtitle="Verifying admin access…" />;
  }

  return (
    <AdminLayout user={auth.user} onSignOut={auth.signOut} brand={brand}>
      <Routes>
        <Route path="/" element={<Overview brand={brand} />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/services" element={<Services />} />
        <Route path="/hours" element={<BusinessHours />} />
        <Route path="/blocked" element={<BlockedDates />} />
        <Route path="/reconciliation" element={<Reconciliation />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/roles" element={<RoleManagement />} />
        <Route path="/attendance" element={<Attendance />} />
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
    <div className="grid min-h-screen place-items-center bg-ivory">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-rosegold-200 to-rosegold-400 text-ivory">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="mt-5 font-display text-2xl text-espresso">
          {lang === 'ar' ? 'ميزون لوميير • إدارة الصالون' : 'Studio Suite'}
        </p>
        <p className="mt-2 inline-flex items-center gap-2 text-sm text-mocha-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {subtitle ?? (lang === 'ar' ? 'جاري التحميل...' : 'Loading…')}
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
    <div className="grid min-h-screen place-items-center bg-ivory p-6">
      <div className="card-soft max-w-md p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush-100 text-blush-600">
          <ShieldOff className="h-5 w-5" />
        </div>
        <h1 className="font-display mt-5 text-3xl text-espresso">
          {lang === 'ar' ? 'غير مصرح بالدخول' : 'Access not granted'}
        </h1>
        <p className="mt-3 text-sm text-mocha-600">
          {lang === 'ar' ? (
            <>
              تم تسجيل الدخول {email && <strong>({email})</strong>}، لكن هذا الحساب ليس لديه صلاحيات الإدارة. يرجى مراجعة إدارة الصالون.
            </>
          ) : (
            <>
              You are signed in {email && <strong>({email})</strong>}, but you are not authorized as an admin. Ask the studio owner to add your user id to the admin list.
            </>
          )}
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link to="/" className="btn-secondary">
            {lang === 'ar' ? 'الرجوع للموقع' : 'Return to website'}
          </Link>
          <button onClick={onSignOut} className="btn-primary">
            {lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
}
