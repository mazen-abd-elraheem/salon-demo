import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Phone,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Home,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { loginCustomer, registerCustomer, getLocalSettings } from '../lib/mockData';

interface AuthPageProps {
  mode?: 'login' | 'register';
}

export default function AuthPage({ mode: initialMode = 'login' }: AuthPageProps) {
  const { lang, isRTL, toggleLang } = useLanguage();
  const navigate = useNavigate();
  const settings = getLocalSettings();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال رقم الهاتف أو البريد الإلكتروني' : 'Please enter your phone or email');
      return;
    }

    const res = loginCustomer(identifier, password);
    if (res.ok) {
      setSuccess(lang === 'ar' ? 'تم تسجيل الدخول بنجاح! جاري تحويلك...' : 'Signed in successfully! Redirecting…');
      setTimeout(() => navigate('/'), 1200);
    } else {
      setError(res.error || (lang === 'ar' ? 'فشل تسجيل الدخول' : 'Sign in failed'));
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال الاسم ورقم الهاتف' : 'Please enter your name and phone');
      return;
    }

    const res = registerCustomer(name, phone, email);
    if (res.ok) {
      setSuccess(lang === 'ar' ? 'تم إنشاء الحساب بنجاح! أهلاً بكِ في ميزون لوميير' : 'Account created! Welcome to Maison Lumière');
      setTimeout(() => navigate('/'), 1200);
    } else {
      setError(res.error || (lang === 'ar' ? 'فشل إنشاء الحساب' : 'Registration failed'));
    }
  };

  const fillDemo = () => {
    setIdentifier('01098765432');
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-espresso font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-pearl/70 bg-ivory/80 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-8 h-8 object-contain rounded-xl" />
          ) : (
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-rosegold-200 to-rosegold-400 flex items-center justify-center text-ivory">
              <Sparkles className="w-4 h-4" />
            </span>
          )}
          <span className="font-display font-bold text-base text-espresso">
            {lang === 'ar' ? settings.business_name || 'ميزون لوميير' : settings.business_name_en || 'Maison Lumière'}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLang}
            className="px-2.5 py-1 rounded-xl border border-pearl text-xs font-semibold text-espresso hover:bg-pearl/40"
          >
            {lang === 'ar' ? 'English' : 'عربي'}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-mocha-500 hover:text-espresso"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </Link>
        </div>
      </header>

      {/* Main Auth Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl border border-pearl/80 p-8 shadow-soft text-start">
          <div className="text-center mb-6">
            <span className="w-12 h-12 rounded-2xl bg-rosegold-50 text-rosegold-600 inline-flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </span>
            <h1 className="font-display font-bold text-2xl text-espresso">
              {mode === 'login'
                ? lang === 'ar'
                  ? 'تسجيل الدخول'
                  : 'Welcome Back'
                : lang === 'ar'
                ? 'إنشاء حساب جديد'
                : 'Create Account'}
            </h1>
            <p className="text-xs text-mocha-500 mt-1">
              {mode === 'login'
                ? lang === 'ar'
                  ? 'سجلي دخولك لمتابعة مواعيدك وفواتيرك السابقة'
                  : 'Sign in to access your appointments and past invoices'
                : lang === 'ar'
                ? 'انضمي لعميلات ميزون لوميير واستمتعي بحجز سريع وعروض حصرية'
                : 'Join Maison Lumière for fast booking and exclusive rituals'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-ivory p-1 border border-pearl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'login'
                  ? 'bg-espresso text-ivory shadow-xs'
                  : 'text-mocha-500 hover:text-espresso'
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
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'register'
                  ? 'bg-espresso text-ivory shadow-xs'
                  : 'text-mocha-500 hover:text-espresso'
              }`}
            >
              {lang === 'ar' ? 'حساب جديد' : 'Register'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'رقم الهاتف أو البريد الإلكتروني:' : 'Phone or Email:'}
                </label>
                <div className="relative">
                  <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-pearl focus:border-rosegold-400 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'كلمة المرور:' : 'Password:'}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-pearl focus:border-rosegold-400 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory font-semibold text-xs transition shadow-soft"
              >
                {lang === 'ar' ? 'دخول' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={fillDemo}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-rosegold-300 text-rosegold-700 bg-rosegold-50/40 hover:bg-rosegold-100/60 text-xs font-medium transition"
              >
                {lang === 'ar' ? '✨ ملء بيانات عميلة تجريبية سريعة' : 'Fill demo customer'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'الاسم بالكامل:' : 'Full Name:'}
                </label>
                <div className="relative">
                  <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: ياسمين كمال"
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-pearl focus:border-rosegold-400 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'رقم الموبايل المصري (١١ رقم):' : 'Egyptian Mobile (11 digits):'}
                </label>
                <div className="relative">
                  <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    dir="ltr"
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-pearl focus:border-rosegold-400 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'البريد الإلكتروني (اختياري):' : 'Email (Optional):'}
                </label>
                <div className="relative">
                  <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-pearl focus:border-rosegold-400 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'كلمة المرور:' : 'Password:'}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-pearl focus:border-rosegold-400 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory font-semibold text-xs transition shadow-soft"
              >
                {lang === 'ar' ? 'إنشاء الحساب والبدء' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-pearl text-center">
            <Link
              to="/admin"
              className="text-xs text-mocha-400 hover:text-rosegold-600 transition"
            >
              {lang === 'ar' ? 'دخول موظفي الإدارة والاستقبال ←' : 'Staff & Admin Login →'}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-4 text-center text-xs text-mocha-400 border-t border-pearl/60">
        © {new Date().getFullYear()} {settings.business_name || 'ميزون لوميير بيوتي سنتر وسبا'}. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
