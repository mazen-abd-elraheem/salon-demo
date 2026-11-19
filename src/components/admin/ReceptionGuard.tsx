import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShieldOff } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import AdminLogin from './AdminLogin';
import { useLanguage } from '../../context/LanguageContext';

export default function ReceptionGuard({ children }: { children: React.ReactNode }) {
  const auth = useAdminAuth();
  const { lang } = useLanguage();

  if (auth.loading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-8 text-center"
        style={{ backgroundColor: 'var(--mainbg, #f9f0f5)', color: 'var(--fonts-100, #3a1d43)' }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-[#b14bd9]" />
        <p className="mt-3 text-sm font-medium">
          {lang === 'ar' ? 'جاري التحقق من صلاحية موظف الاستقبال...' : 'Verifying reception staff credentials…'}
        </p>
      </div>
    );
  }

  if (!auth.session) {
    return (
      <AdminLogin
        loading={auth.loading}
        error={auth.error}
        onSubmit={auth.signIn}
        portalTitle={lang === 'ar' ? 'بوابة الاستقبال والكاشير (POS)' : 'Reception & POS Staff Portal'}
      />
    );
  }

  if (auth.isStaff === false) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-8"
        style={{ backgroundColor: 'var(--mainbg, #f9f0f5)', color: 'var(--fonts-100, #3a1d43)' }}
      >
        <div
          className="max-w-md rounded-3xl border p-8 text-center shadow-soft"
          style={{
            backgroundColor: 'var(--secondbg, #f3e6f0)',
            borderColor: 'var(--lines, #e8d7e4)',
          }}
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-600">
            <ShieldOff className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-2xl font-bold">
            {lang === 'ar' ? 'غير مصرح بالدخول' : 'Access Restricted'}
          </h2>
          <p className="mt-2 text-sm opacity-75">
            {lang === 'ar'
              ? 'هذه الشاشة مخصصة لموظفات الاستقبال والإدارة فقط. لا يمكن لحسابات العميلات الوصول لشاشة الكاشير.'
              : 'This POS terminal is restricted to authorized receptionists and managers. Client accounts cannot access staff controls.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={auth.signOut} className="btn-secondary">
              {lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
            </button>
            <Link to="/" className="btn-primary no-underline">
              {lang === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

