import { Mail, MapPin, Phone, Facebook, Instagram, MessageCircle, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import type { BusinessSettings } from '../../lib/types';
import { getLocalSettings } from '../../lib/mockData';
import { GuzelLogoIcon } from './GuzelSvgIcons';

interface FooterProps {
  settings: BusinessSettings | null;
}

export default function Footer({ settings }: FooterProps) {
  const { lang } = useLanguage();
  const localSettings = getLocalSettings();
  const active = settings || localSettings;
  const logo = active?.logo_url || localSettings?.logo_url || null;
  const brand =
    lang === 'ar'
      ? active?.business_name?.trim() || 'غزل سبا للجمال والاسترخاء'
      : active?.business_name_en?.trim() || 'Guzel Spa';
  const email = active?.business_email?.trim() || 'concierge@guzelspa.beauty';
  const phone = active?.business_phone?.trim() || '01012345678';
  const address =
    lang === 'ar'
      ? active?.business_address?.trim() || '١٥ شارع البرازيل، الزمالك، القاهرة'
      : '15 Brazil St, Zamalek, Cairo, Egypt';
  const facebookUrl =
    active?.facebook_url || 'https://www.facebook.com/share/1AFAh6PqQ7/?mibextid=wwXIfr';

  return (
    <footer
      id="footer"
      className="relative mt-20 overflow-hidden border-t"
      style={{
        backgroundColor: 'var(--secondbg, #f3e6f0)',
        borderColor: 'var(--lines, #e8d7e4)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <div className="container-page relative grid grid-cols-1 gap-10 py-16 lg:grid-cols-12">
        {/* Brand Column */}
        <div className="lg:col-span-4">
          <Link to="/" className="inline-flex items-center gap-3 no-underline" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
            {logo ? (
              <img
                src={logo}
                alt={brand}
                className="h-10 w-10 rounded-2xl object-cover border border-[var(--lines)]"
              />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#cbb6ea] text-[#2c1433]">
                <GuzelLogoIcon className="h-5 w-5" />
              </span>
            )}
            <span className="text-2xl font-semibold tracking-tight">{brand}</span>
          </Link>

          <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
            {lang === 'ar'
              ? 'غزل سبا للجمال والاسترخاء — ملاذكِ الهادئ لجلسات الهيدرا فيشل، الحمام المغربي الملكي، المساج العطري، ومنتجات غزل الأصلية للعناية بالبشرة.'
              : 'Discover ultimate tranquility at Guzel Spa. Explore our luxury beauty and relaxation services, from rejuvenating facials to soothing massages and signature Guzel skincare.'}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full border transition hover:bg-[#cbb6ea] hover:text-[#2c1433]"
              style={{ borderColor: 'var(--fonts-20, #3a1d4333)', color: 'var(--fonts-100, #3a1d43)' }}
              aria-label="Guzel Spa Facebook"
              title="Guzel Spa Official Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full border transition hover:bg-[#cbb6ea] hover:text-[#2c1433]"
              style={{ borderColor: 'var(--fonts-20, #3a1d4333)', color: 'var(--fonts-100, #3a1d43)' }}
              aria-label="Guzel Spa Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={`https://wa.me/2${phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full border transition hover:bg-[#cbb6ea] hover:text-[#2c1433]"
              style={{ borderColor: 'var(--fonts-20, #3a1d4333)', color: 'var(--fonts-100, #3a1d43)' }}
              aria-label="Guzel Spa WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Main Menu Screens Column */}
        <div className="lg:col-span-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fonts-50, #3a1d4380)' }}>
            {lang === 'ar' ? 'أقسام غزل سبا' : 'Explore Guzel'}
          </div>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/services" className="no-underline hover:opacity-65 transition" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
                {lang === 'ar' ? 'الخدمات والجلسات' : 'Services & Rituals'}
              </Link>
            </li>
            <li>
              <Link to="/packages" className="no-underline hover:opacity-65 transition" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
                {lang === 'ar' ? 'باقات العروسة والسبا' : 'Bridal & Packages'}
              </Link>
            </li>
            <li>
              <Link to="/products" className="no-underline hover:opacity-65 transition" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
                {lang === 'ar' ? 'منتجات غزل للعناية' : 'Guzel Skincare Line'}
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="no-underline hover:opacity-65 transition" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
                {lang === 'ar' ? 'رحلة الجمال (٤ خطوات)' : 'How It Works (4 Steps)'}
              </Link>
            </li>
            <li>
              <Link to="/about" className="no-underline hover:opacity-65 transition" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
                {lang === 'ar' ? 'عن غزل سبا وتواصلي معنا' : 'About Guzel & Contact'}
              </Link>
            </li>
            <li>
              <Link to="/book" className="no-underline font-semibold text-[#b14bd9] hover:opacity-75 transition">
                {lang === 'ar' ? 'احجزي جلستكِ أونلاين' : 'Book Online Now'}
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Client Account Column */}
        <div className="lg:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fonts-50, #3a1d4380)' }}>
            {lang === 'ar' ? 'الخصوصية والحساب' : 'Privacy & Account'}
          </div>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/login" className="no-underline hover:opacity-65 transition" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
                {lang === 'ar' ? 'تسجيل الدخول / حسابي' : 'Client Login / Profile'}
              </Link>
            </li>
            <li>
              <Link to="/checkout" className="inline-flex items-center gap-1.5 no-underline hover:opacity-65 transition font-medium" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
                <QrCode className="h-3.5 w-3.5 text-[#b14bd9]" />
                <span>{lang === 'ar' ? 'سداد الفاتورة QR' : 'In-Branch QR Pay'}</span>
              </Link>
            </li>
            <li>
              <Link to="/legal/privacy" className="no-underline hover:opacity-65 transition" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
                {lang === 'ar' ? 'سياسة الخصوصية والبيانات' : 'Privacy & Data Policy'}
              </Link>
            </li>
            <li>
              <Link to="/legal/terms" className="no-underline hover:opacity-65 transition" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
                {lang === 'ar' ? 'شروط الخدمة واتفاقية المستخدم' : 'Terms & User Agreement'}
              </Link>
            </li>
            <li>
              <Link to="/legal/cookies" className="no-underline hover:opacity-65 transition" style={{ color: 'var(--fonts-100, #3a1d43)' }}>
                {lang === 'ar' ? 'سياسة ملفات الارتباط' : 'Cookie Policy'}
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & Location Column */}
        <div className="lg:col-span-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fonts-50, #3a1d4380)' }}>
            {lang === 'ar' ? 'العنوان والتواصل' : 'Visit & Contact'}
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 text-[#b14bd9] shrink-0" />
              <span>{address}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 text-[#b14bd9] shrink-0" />
              <span dir="ltr">{phone}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 text-[#b14bd9] shrink-0" />
              <span>{email}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: 'var(--lines, #e8d7e4)' }}>
        <div
          className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs sm:flex-row"
          style={{ color: 'var(--fonts-50, #3a1d4380)' }}
        >
          <span>
            © {new Date().getFullYear()} {brand}.{' '}
            {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </span>
          <span>
            {lang === 'ar'
              ? 'غزل سبا للجمال والاسترخاء · بالحجز المسبق'
              : 'Guzel spa for beauty and relaxation · By Appointment'}
          </span>
        </div>
      </div>
    </footer>
  );
}
