import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Calendar,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  getCurrentCustomer,
  getLocalBookings,
  getLocalSettings,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
} from '../lib/mockData';
import { authenticateStaffCredentials, clearVerifiedStaffSession } from '../lib/staffAuth';
import Navbar from '../components/public/Navbar';
import { GuzelLogoIcon } from '../components/public/GuzelSvgIcons';
import { formatPrice } from '../lib/format';

interface AuthPageProps {
  mode?: 'login' | 'register';
}

export default function AuthPage({ mode: initialMode = 'login' }: AuthPageProps) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const settings = getLocalSettings();

  const [customer, setCustomer] = useState(() => getCurrentCustomer());
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Mandatory User Data Usage Agreement
  const [dataConsent, setDataConsent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError(
        lang === 'ar'
          ? 'يرجى إدخال رقم الهاتف أو البريد الإلكتروني'
          : 'Please enter your phone or email',
      );
      return;
    }

    if (!dataConsent) {
      setError(
        lang === 'ar'
          ? 'يرجى الموافقة على اتفاقية استخدام البيانات وسياسة الخصوصية للمتابعة.'
          : 'Please agree to the User Data Usage Agreement & Privacy Policy to continue.',
      );
      return;
    }

    // Check if credentials belong to an authorized staff member
    const staffCheck = authenticateStaffCredentials(identifier, password);
    if (staffCheck.ok) {
      logoutCustomer();
      setSuccess(
        lang === 'ar'
          ? `مرحباً بكِ (${staffCheck.session.name}) — جاري تحويلك للبوابة المخصصة لدورك...`
          : `Welcome ${staffCheck.session.name} — Redirecting to your authorized portal…`,
      );
      const targetRoute =
        staffCheck.session.role === 'admin' || staffCheck.session.role === 'manager'
          ? '/admin'
          : '/reception';
      setTimeout(() => navigate(targetRoute), 900);
      return;
    }

    // Ensure customer login never retains any staff session
    clearVerifiedStaffSession();

    const res = loginCustomer(identifier, password);
    if (res.ok && res.user) {
      setCustomer(res.user);
      window.dispatchEvent(new CustomEvent('guzel:auth-updated'));
      setSuccess(
        lang === 'ar'
          ? 'تم تسجيل الدخول بنجاح كعميلة في جوزال ميديكال سبا!'
          : 'Signed in successfully to your Guzel Medical Spa client account!',
      );
    } else {
      setError(res.error || (lang === 'ar' ? 'فشل تسجيل الدخول' : 'Sign in failed'));
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError(
        lang === 'ar' ? 'يرجى إدخال الاسم ورقم الهاتف' : 'Please enter your name and phone',
      );
      return;
    }

    if (!dataConsent) {
      setError(
        lang === 'ar'
          ? 'يرجى الموافقة على اتفاقية استخدام البيانات وسياسة الخصوصية لإنشاء الحساب.'
          : 'Please agree to the User Data Usage Agreement & Privacy Policy to create your account.',
      );
      return;
    }

    // Ensure registering customer never has staff access
    clearVerifiedStaffSession();

    const res = registerCustomer(name, phone, email, regPassword);
    if (res.ok && res.user) {
      setCustomer(res.user);
      window.dispatchEvent(new CustomEvent('guzel:auth-updated'));
      setSuccess(
        lang === 'ar'
          ? 'تم إنشاء حسابكِ بنجاح! أهلاً بكِ في جوزال ميديكال سبا للجمال والاسترخاء.'
          : 'Account created! Welcome to Guzel Medical Spa for beauty and relaxation.',
      );
    } else {
      setError(res.error || (lang === 'ar' ? 'فشل إنشاء الحساب' : 'Registration failed'));
    }
  };

  const handleSignOutCustomer = () => {
    logoutCustomer();
    setCustomer(null);
    window.dispatchEvent(new CustomEvent('guzel:auth-updated'));
  };

  const customerBookings = customer
    ? getLocalBookings().filter(
        (b) => b.customer_phone.replace(/\D/g, '') === customer.phone.replace(/\D/g, ''),
      )
    : [];

  return (
    <div
      className="min-h-screen flex flex-col justify-between pt-24"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <Navbar settings={settings} />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {customer ? (
          /* Logged-In Client Account Dashboard (Isolated from Admin) */
          <div
            className="max-w-2xl w-full rounded-[2rem] border p-8 shadow-soft"
            style={{
              backgroundColor: 'var(--secondbg, #f3e6f0)',
              borderColor: 'var(--lines, #e8d7e4)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[var(--lines)]">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-[#cbb6ea] text-[#2c1433] grid place-items-center font-bold text-lg">
                  {customer.name.slice(0, 1)}
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-semibold">
                    <ShieldCheck className="h-3 w-3" />
                    {lang === 'ar' ? 'حساب عميلة جوزال ميديكال سبا' : 'Verified Client Account'}
                  </span>
                  <h1 className="text-xl font-bold mt-1">{customer.name}</h1>
                  <p className="text-xs opacity-70" dir="ltr">
                    {customer.phone} {customer.email ? `· ${customer.email}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOutCustomer}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#b14bd9]" />
                  <span>{lang === 'ar' ? 'مواعيدي وحجوزاتي' : 'My Appointments & Rituals'}</span>
                </h2>
                <Link to="/book" className="btn-primary py-2 px-4 text-xs no-underline">
                  {lang === 'ar' ? '+ حجز جلسة جديدة' : '+ Book New Ritual'}
                </Link>
              </div>

              {customerBookings.length === 0 ? (
                <div className="rounded-2xl border border-[var(--lines)] bg-white/70 p-8 text-center">
                  <p className="text-sm font-medium">
                    {lang === 'ar'
                      ? 'لا توجد حجوزات مسجلة بهذا الرقم حتى الآن.'
                      : 'No appointments found for your number yet.'}
                  </p>
                  <Link
                    to="/services"
                    className="mt-3 inline-block text-xs font-semibold text-[#b14bd9] underline"
                  >
                    {lang === 'ar' ? 'استكشفي قائمة جلسات ومنتجات جوزال ←' : 'Explore Guzel Services & Products →'}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerBookings.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-2xl border border-[var(--lines)] bg-white/80 p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-mono opacity-65">{b.booking_number}</div>
                        <div className="text-sm font-semibold mt-0.5">
                          {b.appointment_date} · {b.start_time.slice(0, 5)}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-sm font-bold text-[#b14bd9]">
                          {formatPrice(b.total_amount, lang)}
                        </div>
                        <div className="text-[11px] opacity-70">{b.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Sign In / Register Card */
          <div
            className="max-w-md w-full rounded-[2rem] border p-8 shadow-soft text-start"
            style={{
              backgroundColor: 'var(--secondbg, #f3e6f0)',
              borderColor: 'var(--lines, #e8d7e4)',
            }}
          >
            <div className="text-center mb-6">
              <span className="w-12 h-12 rounded-2xl bg-[#cbb6ea] text-[#2c1433] inline-flex items-center justify-center mb-3">
                <GuzelLogoIcon className="w-6 h-6" />
              </span>
              <h1 className="font-bold text-2xl">
                {mode === 'login'
                  ? lang === 'ar'
                    ? 'تسجيل الدخول إلى جوزال ميديكال سبا'
                    : 'Sign In to Guzel Medical Spa'
                  : lang === 'ar'
                  ? 'إنشاء حساب عميلة جديد'
                  : 'Create Your Guzel Account'}
              </h1>
              <p className="text-xs opacity-70 mt-1">
                {mode === 'login'
                  ? lang === 'ar'
                    ? 'سجلي دخولكِ لمتابعة مواعيدكِ وجلسات السبا الخاصة بكِ'
                    : 'Access your beauty rituals, bookings and preferences'
                  : lang === 'ar'
                  ? 'انضمي لعميلات جوزال ميديكال سبا واستمتعي بحجز فوري وعروض حصرية'
                  : 'Join Guzel Medical Spa for seamless booking and exclusive skincare'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div
              className="flex rounded-full p-1 border mb-6"
              style={{
                backgroundColor: 'var(--mainbg, #f9f0f5)',
                borderColor: 'var(--lines, #e8d7e4)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-full transition cursor-pointer border-0 ${
                  mode === 'login'
                    ? 'bg-[#cbb6ea] text-[#2c1433] shadow-clean'
                    : 'bg-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-full transition cursor-pointer border-0 ${
                  mode === 'register'
                    ? 'bg-[#cbb6ea] text-[#2c1433] shadow-clean'
                    : 'bg-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {lang === 'ar' ? 'حساب جديد' : 'Register'}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {lang === 'ar' ? 'رقم الهاتف أو البريد الإلكتروني:' : 'Phone or Email:'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="field-input mt-0 ps-10 pe-4 py-2.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {lang === 'ar' ? 'كلمة المرور:' : 'Password:'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="field-input mt-0 ps-10 pe-4 py-2.5 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Mandatory User Data Usage Agreement */}
                <div
                  className="rounded-2xl border p-3.5"
                  style={{
                    backgroundColor: 'var(--mainbg, #f9f0f5)',
                    borderColor: 'var(--lines, #e8d7e4)',
                  }}
                >
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dataConsent}
                      onChange={(e) => {
                        setDataConsent(e.target.checked);
                        if (e.target.checked) setError(null);
                      }}
                      className="mt-0.5 h-4 w-4 rounded accent-[#b14bd9] shrink-0"
                    />
                    <span className="text-[11px] leading-relaxed">
                      {lang === 'ar' ? (
                        <>
                          أوافق على{' '}
                          <Link to="/legal/privacy" className="underline font-semibold text-[#b14bd9]">
                            سياسة الخصوصية واستخدام البيانات
                          </Link>{' '}
                          و{' '}
                          <Link to="/legal/terms" className="underline font-semibold text-[#b14bd9]">
                            شروط الخدمة
                          </Link>{' '}
                          الخاصة بجوزال ميديكال سبا لحفظ وإدارة بيانات حجوزاتي.
                        </>
                      ) : (
                        <>
                          I agree to Guzel Medical Spa&apos;s{' '}
                          <Link to="/legal/privacy" className="underline font-semibold text-[#b14bd9]">
                            Privacy &amp; Data Usage Policy
                          </Link>{' '}
                          and{' '}
                          <Link to="/legal/terms" className="underline font-semibold text-[#b14bd9]">
                            Terms of Service
                          </Link>{' '}
                          for processing my account and booking data.
                        </>
                      )}
                    </span>
                  </label>
                </div>

                <button type="submit" className="btn-primary w-full py-3 text-xs font-semibold">
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {lang === 'ar' ? 'الاسم بالكامل:' : 'Full Name:'}
                  </label>
                  <div className="relative">
                    <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: ياسمين كمال' : 'e.g. Yasmine Kamal'}
                      className="field-input mt-0 ps-10 pe-4 py-2.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {lang === 'ar' ? 'رقم الموبايل المصري (١١ رقم):' : 'Egyptian Mobile (11 digits):'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      dir="ltr"
                      className="field-input mt-0 ps-10 pe-4 py-2.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {lang === 'ar' ? 'البريد الإلكتروني (اختياري):' : 'Email (Optional):'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="field-input mt-0 ps-10 pe-4 py-2.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {lang === 'ar' ? 'كلمة المرور:' : 'Password:'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="field-input mt-0 ps-10 pe-4 py-2.5 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Mandatory User Data Usage Agreement */}
                <div
                  className="rounded-2xl border p-3.5"
                  style={{
                    backgroundColor: 'var(--mainbg, #f9f0f5)',
                    borderColor: 'var(--lines, #e8d7e4)',
                  }}
                >
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dataConsent}
                      onChange={(e) => {
                        setDataConsent(e.target.checked);
                        if (e.target.checked) setError(null);
                      }}
                      className="mt-0.5 h-4 w-4 rounded accent-[#b14bd9] shrink-0"
                    />
                    <span className="text-[11px] leading-relaxed">
                      {lang === 'ar' ? (
                        <>
                          <strong>موافقة صريحة على استخدام البيانات:</strong> أوافق على قيام{' '}
                          <strong>جوزال ميديكال سبا (Guzel Medical Spa)</strong> بحفظ ومعالجة بياناتي الشخصية لإدارة حجوزاتي والتواصل معي، وفقاً لـ{' '}
                          <Link to="/legal/privacy" className="underline font-semibold text-[#b14bd9]">
                            سياسة الخصوصية واستخدام البيانات
                          </Link>{' '}
                          و{' '}
                          <Link to="/legal/terms" className="underline font-semibold text-[#b14bd9]">
                            شروط الخدمة
                          </Link>
                          .
                        </>
                      ) : (
                        <>
                          <strong>Explicit Data Usage Consent:</strong> I consent to{' '}
                          <strong>Guzel Medical Spa</strong> storing and processing my personal information to manage my bookings and notifications under the{' '}
                          <Link to="/legal/privacy" className="underline font-semibold text-[#b14bd9]">
                            Privacy &amp; Data Usage Policy
                          </Link>{' '}
                          and{' '}
                          <Link to="/legal/terms" className="underline font-semibold text-[#b14bd9]">
                            Terms of Service
                          </Link>
                          .
                        </>
                      )}
                    </span>
                  </label>
                </div>

                <button type="submit" className="btn-primary w-full py-3 text-xs font-semibold">
                  {lang === 'ar' ? 'إنشاء الحساب والبدء' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      <footer
        className="py-5 text-center text-xs border-t"
        style={{
          borderColor: 'var(--lines, #e8d7e4)',
          color: 'var(--fonts-64, #3a1d43a3)',
        }}
      >
        © {new Date().getFullYear()}{' '}
        {lang === 'ar'
          ? settings.business_name || 'جوزال ميديكال سبا'
          : settings.business_name_en || 'Guzel Medical Spa'}
        . {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
      </footer>
    </div>
  );
}
