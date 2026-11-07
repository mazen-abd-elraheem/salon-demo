import { useEffect } from 'react';
import { ArrowRight, ArrowLeft, Sparkles, Star, ShieldCheck, CreditCard, Smartphone } from 'lucide-react';
import { heroImages } from '../../lib/images';
import { useLanguage } from '../../context/LanguageContext';
import type { BusinessSettings } from '../../lib/types';

interface HeroProps {
  settings: BusinessSettings | null;
  onBook: () => void;
}

export default function Hero({ settings, onBook }: HeroProps) {
  const { t, isRTL, lang } = useLanguage();
  const city = settings?.business_address?.split(',').slice(-2, -1)[0]?.trim();

  // Structured Data Schema for Local SEO
  useEffect(() => {
    const scriptId = 'salon-ld-json';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BeautySalon',
      'name': lang === 'ar' ? 'ميزون لوميير بيوتي سنتر وسبا' : (settings?.business_name || 'Maison Lumière Beauty Atelier'),
      'description': 'مركز تجميل وسبا فاخر يقدم جلسات العناية بالبشرة، الحمام المغربي، تصفيف الشعر، وباقات العرائس في مصر.',
      'telephone': settings?.business_phone || '+201001234567',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': '15 شارع البرازيل، الزمالك',
        'addressLocality': 'القاهرة',
        'addressRegion': 'Cairo',
        'addressCountry': 'EG',
      },
      'currenciesAccepted': 'EGP',
      'paymentAccepted': 'Cash, InstaPay, Vodafone Cash',
      'priceRange': '$$',
    };
    script.text = JSON.stringify(schema);
  }, [settings, lang]);

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 lg:pt-32 lg:pb-24">
      {/* Editorial subtle backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-ivory" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grain opacity-30" />

      <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
        {/* Editorial Copy */}
        <div className="lg:col-span-6 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-pearl/90 bg-white/70 px-3.5 py-1.5 text-xs text-mocha-600 shadow-clean">
            <span className="h-1.5 w-1.5 rounded-full bg-rosegold-400" />
            <span>{t('heroEyebrow')} {city ? `· ${city}` : ''}</span>
          </div>

          <h1 className="heading-display mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.14] text-espresso">
            {t('heroTitle1')}
            <br />
            <span className="italic font-normal text-rosegold-500">{t('heroTitle2')}</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-mocha-600">
            {t('heroSubtitle')}
          </p>

          {/* Clean Trust Pillars */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs text-mocha-600">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-pearl/80 bg-white/70 px-3.5 py-1.5 shadow-clean">
              <ShieldCheck className="h-3.5 w-3.5 text-rosegold-500" />
              <span>{lang === 'ar' ? 'تأكيد الحجز بعربون 50%' : '50% Verified Deposit'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-pearl/80 bg-white/70 px-3.5 py-1.5 shadow-clean">
              <Smartphone className="h-3.5 w-3.5 text-rosegold-500" />
              <span>{lang === 'ar' ? 'إنستاباي & فودافون كاش' : 'InstaPay & Vodafone Cash'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-pearl/80 bg-white/70 px-3.5 py-1.5 shadow-clean">
              <CreditCard className="h-3.5 w-3.5 text-rosegold-500" />
              <span>{lang === 'ar' ? 'فاتورة QR ذكية بالفرع' : 'In-Branch QR Settlement'}</span>
            </div>
          </div>

          {/* Primary & Secondary CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button onClick={onBook} className="btn-primary group">
              {t('reserveBtn')}
              {isRTL ? (
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              ) : (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              )}
            </button>
            <a href="#services" className="btn-secondary">
              {t('exploreBtn')}
            </a>
          </div>

          {/* Quantitative Stats - Clean, no awkward plus wrap */}
          <div className="mt-12 grid grid-cols-3 max-w-md gap-6 border-t border-pearl/80 pt-6">
            <Stat label={t('stat1Label')} value={t('stat1Value')} />
            <Stat label={t('stat2Label')} value={t('stat2Value')} icon />
            <Stat label={t('stat3Label')} value={t('stat3Value')} />
          </div>
        </div>

        {/* Editorial Visual Layout - Flawless, zero clipping, zero overlapping cutoff */}
        <div className="relative lg:col-span-6 animate-fade-up">
          <div className="space-y-4">
            {/* Main Visual Frame */}
            <div className="relative h-[380px] sm:h-[420px] w-full overflow-hidden rounded-3xl border border-pearl/80 shadow-soft">
              <img
                src={heroImages.primary}
                alt="صالون وسبا ميزون لوميير الفاخر"
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent" />

              {/* Discreet luxury badge */}
              <div className="absolute start-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-espresso/50 px-3.5 py-1.5 text-xs text-white backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-champagne-300" />
                <span>{t('signatureAtelier')}</span>
              </div>
            </div>

            {/* Testimonial Quote Card - Clean & spacious, no clipping */}
            <div className="rounded-2xl border border-pearl/80 bg-white p-5 shadow-clean">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-rosegold-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] font-medium text-mocha-400">
                  {t('quoteAuthor')}
                </span>
              </div>
              <p className="mt-2.5 font-display text-base italic leading-relaxed text-espresso">
                {t('quoteText')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-display text-2xl font-semibold text-espresso">
        <span>{value}</span>
        {icon && <Star className="h-4 w-4 fill-rosegold-400 text-rosegold-400" />}
      </div>
      <div className="mt-1 text-xs text-mocha-500 leading-snug">
        {label}
      </div>
    </div>
  );
}