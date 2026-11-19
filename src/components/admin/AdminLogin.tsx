import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { GuzelLogoIcon } from '../public/GuzelSvgIcons';
import PhImage from '../public/PhImage';

interface AdminLoginProps {
  onSubmit: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
  portalTitle?: string;
}

export default function AdminLogin({ onSubmit, loading, error, portalTitle }: AdminLoginProps) {
  const { lang, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError(
        lang === 'ar'
          ? 'من فضلكِ أدخلي البريد الإلكتروني وكلمة المرور الخاصة بالموظفين.'
          : 'Please enter your authorized staff email and password.',
      );
      return;
    }
    const result = await onSubmit(email, password);
    if (!result.ok) {
      setLocalError(
        result.error ?? (lang === 'ar' ? 'تعذر تسجيل الدخول. غير مصرح للعميلات.' : 'Unauthorized access.'),
      );
    }
  }

  const message = localError || error;

  return (
    <div
      className="relative grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-2"
      style={{ backgroundColor: 'var(--mainbg, #f9f0f5)', color: 'var(--fonts-100, #3a1d43)' }}
    >
      {/* Left Brand Panel */}
      <div className="relative hidden overflow-hidden bg-[#25142d] lg:flex">
        <div className="absolute inset-0 opacity-65">
          <PhImage imgKey="ringa:1" className="w-full h-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#25142d] via-[#25142d]/85 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-[#f6e9f4]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#f6e9f4]/80 hover:text-[#f6e9f4] no-underline"
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {lang === 'ar' ? 'الرجوع لموقع جوزال ميديكال سبا' : 'Back to Guzel Medical Spa'}
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#cbb6ea]">
              <GuzelLogoIcon className="h-4 w-4" />
              {portalTitle || (lang === 'ar' ? 'بوابة إدارة جوزال ميديكال سبا' : 'Guzel Medical Spa Staff Portal')}
            </div>
            <h1 className="mt-4 text-4xl xl:text-5xl font-normal leading-tight">
              {lang === 'ar' ? 'إدارة الأناقة،' : 'The Guzel Atelier,'}
              <br />
              <span className="it text-[#cbb6ea]">
                {lang === 'ar' ? 'بأعلى معايير الأمان.' : 'behind the scenes.'}
              </span>
            </h1>
            <p className="mt-5 max-w-md text-sm text-[#f6e9f4]/75 leading-relaxed">
              {lang === 'ar'
                ? 'منطقة محمية مخصصة للإدارة وطاقم العمل المصرح لهم فقط. لا يُسمح لحسابات العميلات بالدخول إلى لوحة الإدارة أو الكاشير.'
                : 'Restricted area for authorized Guzel Medical Spa management and staff only. Client accounts are strictly isolated from administrative controls.'}
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-[#f6e9f4]/50">
            {lang === 'ar' ? 'جوزال ميديكال سبا للجمال والاسترخاء · نظام الإدارة المؤمّن' : 'Guzel Medical Spa · Role-Verified Security Suite'}
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form
          onSubmit={handle}
          className="w-full max-w-md rounded-[2rem] border p-8 shadow-soft"
          style={{
            backgroundColor: 'var(--secondbg, #f3e6f0)',
            borderColor: 'var(--lines, #e8d7e4)',
          }}
        >
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-xs font-medium lg:hidden no-underline"
            style={{ color: 'var(--fonts-64, #3a1d43a3)' }}
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {lang === 'ar' ? 'الرجوع للموقع' : 'Back to website'}
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-[#cbb6ea]/40 text-[#3a1d43]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{portalTitle || (lang === 'ar' ? 'دخول الطاقم والإدارة فقط' : 'Authorized Staff Only')}</span>
          </div>

          <h2 className="mt-4 text-3xl font-semibold">
            {lang === 'ar' ? 'تسجيل دخول الإدارة' : 'Staff Sign In'}
          </h2>
          <p className="mt-1.5 text-xs" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
            {lang === 'ar'
              ? 'أدخلي بيانات حساب الموظف أو المدير المعتمد للوصول للنظام.'
              : 'Sign in with your role-verified staff or administrator credentials.'}
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="field-label">{lang === 'ar' ? 'البريد الإلكتروني الوظيفي' : 'Staff Email'}</label>
              <div className="relative mt-2">
                <Mail
                  className={[
                    'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 opacity-50',
                    isRTL ? 'right-3.5' : 'left-3.5',
                  ].join(' ')}
                />
                <input
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@guzelspa.beauty"
                  className={['field-input mt-0', isRTL ? 'pr-10' : 'pl-10'].join(' ')}
                />
              </div>
            </div>

            <div>
              <label className="field-label">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
              <div className="relative mt-2">
                <KeyRound
                  className={[
                    'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 opacity-50',
                    isRTL ? 'right-3.5' : 'left-3.5',
                  ].join(' ')}
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={['field-input mt-0', isRTL ? 'pr-10' : 'pl-10'].join(' ')}
                />
              </div>
            </div>

            {message && (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={[
                'btn-primary w-full justify-center py-3.5',
                loading && 'cursor-wait opacity-75',
              ].join(' ')}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {lang === 'ar' ? 'جاري التحقق من الصلاحية...' : 'Verifying role…'}
                </>
              ) : lang === 'ar' ? (
                'دخول آمن'
              ) : (
                'Secure Sign In'
              )}
            </button>
          </div>

          <p className="mt-6 text-[11px] leading-relaxed" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
            {lang === 'ar'
              ? 'محمي بنظام التحقق من الأدوار (RBAC). في حال كنتِ عميلة وترغبين في متابعة حجوزاتك، يرجى استخدام بوابة العميلات.'
              : 'Protected by Role-Based Access Control (RBAC). Customers should use the Client Portal.'}
          </p>
        </form>
      </div>
    </div>
  );
}
