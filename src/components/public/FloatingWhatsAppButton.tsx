import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { defaultSettings, getLocalSettings } from '../../lib/mockData';

export default function FloatingWhatsAppButton() {
  const { lang } = useLanguage();
  const { pathname } = useLocation();
  const [phone, setPhone] = useState<string>(
    () => getLocalSettings()?.business_phone || defaultSettings.business_phone || '01012345678',
  );

  useEffect(() => {
    const syncPhone = () => {
      const local = getLocalSettings();
      if (local?.business_phone) {
        setPhone(local.business_phone);
      }
    };
    window.addEventListener('storage', syncPhone);
    window.addEventListener('guzel:data-updated', syncPhone);
    return () => {
      window.removeEventListener('storage', syncPhone);
      window.removeEventListener('guzel:data-updated', syncPhone);
    };
  }, []);

  // Hide on internal staff portals and private invoice checkout pages
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/reception') ||
    pathname.startsWith('/checkout')
  ) {
    return null;
  }

  const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
  const intlPhone = digits.startsWith('20') ? digits : `20${digits || '1012345678'}`;
  const prefilledMessage =
    lang === 'ar'
      ? 'أهلاً جوزال ميديكال سبا، أرغب في الاستفسار أو حجز جلسة ✨'
      : 'Hello Guzel Medical Spa, I would like to inquire or book a session ✨';

  const whatsappHref = `https://wa.me/${intlPhone}?text=${encodeURIComponent(prefilledMessage)}`;

  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={lang === 'ar' ? 'تواصلي معنا عبر واتساب' : 'Chat with Guzel Medical Spa on WhatsApp'}
      className="group fixed bottom-5 end-4 sm:bottom-6 sm:end-6 z-[990] inline-flex items-center gap-0 hover:gap-2.5 h-13 sm:h-14 px-3.5 sm:px-4 rounded-full no-underline transition-all duration-300 hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
      style={{
        backgroundColor: '#25142d',
        color: '#ffffff',
        border: '1px solid rgba(203, 182, 234, 0.28)',
        boxShadow:
          '0 16px 36px -8px rgba(37, 20, 45, 0.45), 0 0 0 1px rgba(16, 185, 129, 0.25)',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Emerald Icon Circle with Live Online Pulse */}
      <span className="relative grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full bg-emerald-500 text-white shadow-sm shrink-0 transition-transform duration-300 group-hover:rotate-6">
        <MessageCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.2} />
        <span className="absolute -top-0.5 -end-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-80" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 ring-2 ring-[#25142d]" />
        </span>
      </span>

      {/* Smooth Expanding Label on Hover (Desktop & Touch-friendly) */}
      <span
        className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[12.5rem] group-hover:opacity-100 group-focus-visible:max-w-[12.5rem] group-focus-visible:opacity-100 transition-all duration-300 text-xs sm:text-sm font-bold tracking-tight text-[#f9f0f5]"
        style={{
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fontFamily: lang === 'ar' ? "'Cairo', 'Tajawal', sans-serif" : undefined,
        }}
      >
        {lang === 'ar' ? 'تواصلي عبر واتساب' : 'WhatsApp Concierge'}
      </span>
    </a>
  );
}
