import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Mail, Sparkles, Wand2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AdminLoginProps {
  onSubmit: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
}

export default function AdminLogin({ onSubmit, loading, error }: AdminLoginProps) {
  const { lang, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError(lang === 'ar' ? 'من فضلك اكتبي الإيميل وكلمة السر.' : 'Please enter your email and password.');
      return;
    }
    const result = await onSubmit(email, password);
    if (!result.ok) setLocalError(result.error ?? (lang === 'ar' ? 'تعذر تسجيل الدخول.' : 'Unable to sign in.'));
  }

  function fillDemo() {
    setEmail('admin@maisonlumiere.beauty');
    setPassword('admin123');
    setLocalError(null);
  }

  const message = localError || error;

  return (
    <div className="relative grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-espresso lg:flex">
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=80"
          alt="Beauty studio atmosphere"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-espresso via-espresso/80 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-ivory">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-ivory/80 hover:text-ivory">
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {lang === 'ar' ? 'الرجوع للموقع' : 'Back to website'}
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider-3 text-ivory/70">
              <Sparkles className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'بوابة إدارة الصالون' : 'Studio Portal'}
            </div>
            <h1 className="font-display mt-4 text-5xl leading-[1.05]">
              {lang === 'ar' ? 'كواليس الأناقة،' : 'The atelier,'}
              <br />
              <span className="italic text-rosegold-200">
                {lang === 'ar' ? 'وإدارة مواعيدك بكل هدوء.' : 'behind the scenes.'}
              </span>
            </h1>
            <p className="mt-5 max-w-md text-ivory/70">
              {lang === 'ar'
                ? 'سجلي دخولك للتحكم في المواعيد، قائمة الخدمات، ساعات العمل، ومتابعة طلبات الحجز أول بأول.'
                : 'Sign in to manage your beauty studio — appointments, services, business hours and more.'}
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-wider-2 text-ivory/50">
            {lang === 'ar' ? 'ميزون لوميير · لوحة التحكم' : 'Maison Lumière · Studio Suite'}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-ivory p-8">
        <form onSubmit={handle} className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-mocha-500 lg:hidden"
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {lang === 'ar' ? 'الرجوع للموقع' : 'Back to website'}
          </Link>

          <span className="eyebrow">
            <span className="eyebrow-dot" />
            {lang === 'ar' ? 'دخول الإدارة' : 'Studio Access'}
          </span>
          <h2 className="heading-display mt-3 text-4xl">
            {lang === 'ar' ? 'أهلاً بيكي من تاني.' : 'Welcome back.'}
          </h2>
          <p className="mt-2 text-sm text-mocha-500">
            {lang === 'ar'
              ? 'سجلي دخولك ببيانات حساب الإدارة الخاص بيكي.'
              : 'Sign in with your studio admin credentials.'}
          </p>

          {/* Quick Demo Fill Pill */}
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-pearl bg-white/70 p-3">
            <div className="text-xs text-mocha-600">
              <span className="font-semibold text-espresso">
                {lang === 'ar' ? 'حساب تجريبي سريع:' : 'Quick Demo Admin:'}
              </span>{' '}
              <span className="text-[11px] text-mocha-500">admin@maisonlumiere.beauty / admin123</span>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="inline-flex items-center gap-1 rounded-xl bg-rosegold-100/60 px-2.5 py-1 text-xs font-semibold text-rosegold-500 hover:bg-rosegold-200/60 transition"
            >
              <Wand2 className="h-3 w-3" />
              {lang === 'ar' ? 'ملء سريع' : 'Autofill'}
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="field-label">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <div className="relative mt-2">
                <Mail
                  className={[
                    'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-mocha-400',
                    isRTL ? 'right-3.5' : 'left-3.5',
                  ].join(' ')}
                />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@maisonlumiere.beauty"
                  className={[
                    'field-input mt-0',
                    isRTL ? 'pr-10' : 'pl-10',
                  ].join(' ')}
                />
              </div>
            </div>

            <div>
              <label className="field-label">{lang === 'ar' ? 'كلمة السر' : 'Password'}</label>
              <div className="relative mt-2">
                <KeyRound
                  className={[
                    'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-mocha-400',
                    isRTL ? 'right-3.5' : 'left-3.5',
                  ].join(' ')}
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={[
                    'field-input mt-0',
                    isRTL ? 'pr-10' : 'pl-10',
                  ].join(' ')}
                />
              </div>
            </div>

            {message && (
              <div className="rounded-2xl border border-blush-300/60 bg-blush-50 px-4 py-3 text-sm text-blush-600">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={[
                'btn-primary w-full justify-center',
                loading && 'cursor-wait opacity-75',
              ].join(' ')}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {lang === 'ar' ? 'جاري التحقق...' : 'Signing in…'}
                </>
              ) : (
                lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'
              )}
            </button>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-mocha-500">
            {lang === 'ar'
              ? 'هذه اللوحة مخصصة لفريق عمل الصالون. يتم منح الصلاحيات بإضافة معرف المستخدم إلى جدول admin_users في Supabase.'
              : 'This area is for studio staff only. Access is granted by adding your Supabase Auth user id to the admin_users table.'}
          </p>
        </form>
      </div>
    </div>
  );
}
