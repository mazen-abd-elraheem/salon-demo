import { Leaf, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { aboutImages } from '../../lib/images';
import { useLanguage } from '../../context/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  const values = [
    {
      icon: Leaf,
      title: t('val1Title'),
      body: t('val1Body'),
    },
    {
      icon: ShieldCheck,
      title: t('val2Title'),
      body: t('val2Body'),
    },
    {
      icon: Heart,
      title: t('val3Title'),
      body: t('val3Body'),
    },
    {
      icon: Sparkles,
      title: t('val4Title'),
      body: t('val4Body'),
    },
  ];

  return (
    <section id="about" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Architectural Image */}
        <div className="relative lg:col-span-6 animate-fade-up">
          <div className="relative h-[420px] sm:h-[480px] w-full overflow-hidden rounded-3xl border border-pearl/80 shadow-soft">
            <img
              src={aboutImages.studio}
              alt="أجواء صالون وسبا ميزون لوميير الهادئة"
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 via-transparent to-transparent" />

            {/* Experience Pill */}
            <div className="absolute bottom-6 start-6 rounded-2xl border border-white/20 bg-white/95 p-4 shadow-clean backdrop-blur-md">
              <div className="font-display text-2xl font-bold text-espresso">
                ١٢<span className="text-rosegold-500">+</span>
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wider-2 text-mocha-500">
                {t('expYears')}
              </div>
            </div>
          </div>
        </div>

        {/* Editorial Copy */}
        <div className="lg:col-span-6 animate-fade-up">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            {t('aboutEyebrow')}
          </span>

          <h2 className="heading-display mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.15] text-espresso">
            {t('aboutTitle1')}{' '}
            <span className="italic font-normal text-rosegold-500">{t('aboutTitle2')}</span>
          </h2>

          <p className="mt-6 text-sm sm:text-base leading-relaxed text-mocha-600">
            {t('aboutP1')}
          </p>

          <p className="mt-3 text-sm leading-relaxed text-mocha-500">
            {t('aboutP2')}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="group rounded-2xl border border-pearl/80 bg-white/80 p-4 transition duration-300 hover:border-rosegold-300 hover:bg-white hover:shadow-clean"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rosegold-100/60 text-rosegold-600 transition group-hover:bg-rosegold-500 group-hover:text-white">
                  <v.icon className="h-4 w-4" />
                </div>
                <div className="mt-3 font-display text-base font-semibold text-espresso">
                  {v.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-mocha-600">
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}