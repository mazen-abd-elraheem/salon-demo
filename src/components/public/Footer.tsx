import { Mail, MapPin, Phone, Sparkles, Instagram, Facebook, Music, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import type { BusinessSettings } from '../../lib/types';
import { getLocalSettings } from '../../lib/mockData';

interface FooterProps {
  settings: BusinessSettings | null;
}

export default function Footer({ settings }: FooterProps) {
  const { t, lang } = useLanguage();
  const localSettings = getLocalSettings();
  const logo = settings?.logo_url || localSettings?.logo_url || null;
  const brand = lang === 'ar' ? 'ميزون لوميير' : (settings?.business_name?.trim() || 'Maison Lumière');
  const email = settings?.business_email?.trim();
  const phone = settings?.business_phone?.trim();
  const address = lang === 'ar' ? t('cairoAddress') : (settings?.business_address?.trim() || '15 Brazil St, Zamalek, Cairo');

  return (
    <footer id="footer" className="relative mt-20 overflow-hidden bg-espresso text-ivory border-t border-espresso/90">
      <div className="container-page relative grid grid-cols-1 gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt={brand}
                className="h-10 w-10 rounded-xl object-cover border border-white/20"
              />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-rosegold-400 text-espresso">
                <Sparkles className="h-4 w-4" />
              </span>
            )}
            <span className="font-display text-2xl font-semibold tracking-wide">{brand}</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/70">
            {t('footerAbout')}
          </p>

          <div className="mt-6 flex items-center gap-3">
            {[Instagram, Facebook, Music].map((Icon, idx) => (
              <a
                key={idx}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-xl border border-ivory/20 text-ivory/80 transition hover:border-rosegold-300 hover:text-rosegold-200"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="text-[11px] uppercase tracking-wider-3 text-rosegold-200">
            {t('visit')}
          </div>
          <ul className="mt-4 space-y-3 text-sm text-ivory/85">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 text-rosegold-200 shrink-0" />
              <span>{address}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 text-rosegold-200 shrink-0" />
              <span dir="ltr">{phone || '+20 100 123 4567'}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 text-rosegold-200 shrink-0" />
              <span>{email || 'contact@maisonlumiere.beauty'}</span>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="text-[11px] uppercase tracking-wider-3 text-rosegold-200">
            {t('explore')}
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-ivory/85">
            <li><a href="#services" className="hover:text-rosegold-200 transition">{t('navServices')}</a></li>
            <li><a href="#about" className="hover:text-rosegold-200 transition">{t('navAtelier')}</a></li>
            <li><a href="#booking" className="hover:text-rosegold-200 transition">{t('navBooking')}</a></li>
            <li>
              <Link to="/checkout" className="inline-flex items-center gap-1.5 text-rosegold-300 hover:text-rosegold-200 transition font-medium">
                <QrCode className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'سداد QR بالفرع' : 'QR Checkout'}</span>
              </Link>
            </li>
            <li><Link to="/login" className="hover:text-rosegold-200 transition">{lang === 'ar' ? 'حساب العميلات' : 'Client Login'}</Link></li>
            <li><Link to="/admin" className="hover:text-rosegold-200 transition">{t('studioLogin')}</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="text-[11px] uppercase tracking-wider-3 text-rosegold-200">
            {t('studioHours')}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-ivory/85">
            <li>{t('hours1')}</li>
            <li>{t('hours2')}</li>
            <li>{t('hours3')}</li>
            <li>{t('hours4')}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-ivory/50 sm:flex-row">
          <span>© {new Date().getFullYear()} {brand}. {t('copyright')}</span>
          <span>{t('byAppointment')}</span>
        </div>
      </div>
    </footer>
  );
}
