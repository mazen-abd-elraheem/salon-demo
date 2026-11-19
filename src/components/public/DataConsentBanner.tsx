import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const CONSENT_KEY = 'guzel_data_consent_v1';

export default function DataConsentBanner() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(CONSENT_KEY);
      if (!accepted) {
        setVisible(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:end-6 sm:max-w-md z-[990] rounded-3xl border p-5 shadow-soft backdrop-blur-md transition-all duration-300"
      style={{
        backgroundColor: 'var(--dots-pattern, #ecdcef)',
        borderColor: 'var(--lines, #e8d7e4)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <div className="flex items-start gap-3">
        <span className="h-9 w-9 rounded-2xl bg-[#cbb6ea] text-[#2c1433] grid place-items-center shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="text-xs leading-relaxed">
          <div className="font-bold text-sm mb-1">
            {lang === 'ar'
              ? 'اتفاقية الخصوصية واستخدام البيانات'
              : 'Data Usage & Privacy Agreement'}
          </div>
          {lang === 'ar' ? (
            <p className="opacity-80">
              يستخدم موقع <strong>غزل سبا (Guzel Spa)</strong> ملفات الارتباط والبيانات الشخصية لتحسين تجربتكِ، حفظ تفضيلات الثيم واللغة، وإدارة مواعيد الحجز الخاصة بكِ بأمان وفقاً لـ{' '}
              <Link to="/legal/privacy" className="underline font-semibold text-[#b14bd9]">
                سياسة الخصوصية
              </Link>{' '}
              و{' '}
              <Link to="/legal/terms" className="underline font-semibold text-[#b14bd9]">
                شروط الاستخدام
              </Link>
              .
            </p>
          ) : (
            <p className="opacity-80">
              <strong>Guzel Spa</strong> uses cookies and personal data solely to personalize your experience, save your theme &amp; language preferences, and manage your reservations securely under our{' '}
              <Link to="/legal/privacy" className="underline font-semibold text-[#b14bd9]">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/legal/terms" className="underline font-semibold text-[#b14bd9]">
                User Agreement
              </Link>
              .
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="px-4 py-1.5 rounded-full bg-[#3a1d43] text-[#f9f0f5] text-xs font-semibold hover:bg-[#b14bd9] transition cursor-pointer border-0"
            >
              {lang === 'ar' ? 'موافقة ومتابعة' : 'Accept & Continue'}
            </button>
            <Link
              to="/legal/cookies"
              className="px-3 py-1.5 rounded-full text-xs font-medium no-underline hover:underline"
              style={{ color: 'var(--fonts-100, #3a1d43)' }}
            >
              {lang === 'ar' ? 'التفاصيل' : 'Details'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

