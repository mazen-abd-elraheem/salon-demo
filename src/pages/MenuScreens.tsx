import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Sparkles,
  ShoppingBag,
  Check,
  MapPin,
  Phone,
  Mail,
  Facebook,
  MessageCircle,
  ShieldCheck,
  Heart,
  Leaf,
  ArrowUpRight,
  ArrowUpLeft,
} from 'lucide-react';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import DataConsentBanner from '../components/public/DataConsentBanner';
import SEOHead from '../components/public/SEOHead';
import GuzelShowcasePanel from '../components/public/GuzelShowcasePanel';
import GuzelHowItWorks from '../components/public/GuzelHowItWorks';
import GuzelStepSlides from '../components/public/GuzelStepSlides';
import Services from '../components/public/Services';
import Booking from '../components/public/Booking';
import PhImage from '../components/public/PhImage';
import { useRealtimeCatalog } from '../hooks/useRealtimeCatalog';
import { useLanguage } from '../context/LanguageContext';
import { formatDuration, formatPrice } from '../lib/format';
import { defaultRooms, defaultSpecialists } from '../lib/mockData';
import type { Service } from '../lib/types';

/* ============================================================================
 * 1. /services — Dedicated Services & Rituals Screen
 * ========================================================================== */
export function ServicesScreen() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { services, packages, products, settings, loading } = useRealtimeCatalog();

  const handleSelectService = (svc: Service) => {
    navigate('/book', { state: { initialService: svc } });
  };

  return (
    <div
      className="min-h-screen flex flex-col pt-24"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <Navbar settings={settings} />

      <main className="flex-1">
        {/* Creative Editorial Header */}
        <section className="container-page pt-10 pb-12">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            {lang === 'ar' ? 'قائمة خدمات غزل سبا' : 'Guzel Spa Menu'}
          </span>
          <h1 className="u-h1 mt-4">
            {lang === 'ar' ? (
              <>
                طقوس الجمال <span className="it text-[#b14bd9]">والاسترخاء.</span>
              </>
            ) : (
              <>
                Signature rituals &amp; <span className="it text-[#b14bd9]">serenity.</span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
            {lang === 'ar'
              ? 'كل جلسة في غزل سبا تتم في كابينة خاصة معقمة باستخدام منتجات غزل الأصلية باللافندر والهيالورونيك على يد خبيرات متخصصات.'
              : 'Every ritual at Guzel Spa takes place in a private, sanitized suite using our botanical lavender and hyaluronic formulations.'}
          </p>
        </section>

        {/* Full Catalog Grid */}
        <Services
          services={services}
          loading={loading}
          onSelect={handleSelectService}
          defaultTab="services"
        />

        {/* Interactive 70rem Showcase Studio */}
        <div className="px-2 sm:px-4 pb-12">
          <GuzelShowcasePanel
            services={services}
            products={products}
            packages={packages}
            onSelectService={handleSelectService}
          />
        </div>
      </main>

      <Footer settings={settings} />
      <DataConsentBanner />
    </div>
  );
}

/* ============================================================================
 * 2. /packages — Dedicated Bridal & Packages Screen
 * ========================================================================== */
export function PackagesScreen() {
  const { lang, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { services, packages, settings } = useRealtimeCatalog();

  const handleBookPackage = (pkgIdx: number) => {
    const pkg = packages[pkgIdx];
    if (!pkg) {
      navigate('/book');
      return;
    }
    const asService: Service = {
      id: pkg.id,
      name: pkg.name_en || pkg.name_ar,
      name_ar: pkg.name_ar,
      name_en: pkg.name_en || pkg.name_ar,
      description_ar: pkg.description_ar,
      description_en: pkg.description_en,
      duration_minutes: pkg.duration_minutes,
      price: pkg.price,
      image_url: pkg.image_url,
      sheet_key: pkg.sheet_key || 'life:2',
      category: 'bridal',
      room_type_required: 'general',
      is_active: true,
    };
    navigate('/book', { state: { initialService: asService } });
  };

  return (
    <div
      className="min-h-screen flex flex-col pt-24"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <Navbar settings={settings} />

      <main className="flex-1 container-page py-12">
        <div className="max-w-3xl">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            {lang === 'ar' ? 'باقات العروسة والدلال الملكي' : 'Curated Bridal & Spa Bundles'}
          </span>
          <h1 className="u-h1 mt-4">
            {lang === 'ar' ? (
              <>
                باقات متكاملة <span className="it text-[#b14bd9]">ليومكِ المميز.</span>
              </>
            ) : (
              <>
                Royal bridal &amp; <span className="it text-[#b14bd9]">retreat</span> bundles.
              </>
            )}
          </h1>
          <p className="mt-4 text-sm sm:text-base" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
            {lang === 'ar'
              ? 'صممنا باقات غزل الملكية لتجمع لكِ بين الحمام المغربي، الهيدرا فيشل بسيروم غزل، المساج العطري، وترميم الشعر في تجربة واحدة متناغمة.'
              : 'Our multi-ritual packages combine Moroccan hammam, Guzel Lavender Serum HydraFacial, aromatherapy massage, and hair therapy into one seamless retreat.'}
          </p>
        </div>

        {/* Featured Packages Editorial Cards */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {packages.map((pkg, idx) => {
            const sheetKey = pkg.sheet_key || (idx === 0 ? 'life:2' : idx === 1 ? 'life:1' : 'studio:0');
            return (
              <div
                key={pkg.id}
                className="group rounded-[2.25rem] border-2 border-[#cbb6ea] overflow-hidden flex flex-col justify-between shadow-soft transition duration-300 hover:-translate-y-1"
                style={{ backgroundColor: 'var(--secondbg, #f3e6f0)' }}
              >
                <div>
                  <div className="relative h-64 overflow-hidden">
                    <PhImage
                      imgKey={sheetKey}
                      customImageUrl={pkg.image_url}
                      className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#25142d]/70 via-transparent to-transparent" />
                    <span className="absolute top-4 end-4 rounded-full bg-[#cbb6ea] text-[#2c1433] px-3.5 py-1 text-xs font-bold shadow-clean">
                      {lang === 'ar' ? 'باقة VIP مجمعة' : 'VIP Retreat Bundle'}
                    </span>
                    <div className="absolute bottom-4 start-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 text-[#3a1d43] px-3 py-1 text-xs font-semibold">
                      <Clock className="h-3.5 w-3.5 text-[#b14bd9]" />
                      <span>{formatDuration(pkg.duration_minutes, lang)}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-bold leading-snug">
                        {lang === 'ar' ? pkg.name_ar : pkg.name_en}
                      </h2>
                      <span className="text-xl font-bold text-[#b14bd9] whitespace-nowrap">
                        {formatPrice(pkg.price, lang)}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
                      {lang === 'ar' ? pkg.description_ar : pkg.description_en}
                    </p>

                    <div className="mt-5 pt-4 border-t border-[var(--lines)] space-y-2">
                      <div className="text-xs font-semibold">
                        {lang === 'ar' ? 'تشمل الباقة:' : 'Included in this ritual:'}
                      </div>
                      {services.slice(0, 4).map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-xs opacity-80">
                          <Check className="h-3.5 w-3.5 text-[#b14bd9] shrink-0" />
                          <span>{lang === 'ar' ? s.name_ar : s.name_en}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => handleBookPackage(idx)}
                    className="w-full py-3 px-5 rounded-full bg-[#cbb6ea] text-[#2c1433] hover:bg-[#e58fb6] text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer border-0"
                  >
                    <span>{lang === 'ar' ? 'احجزي هذه الباقة الآن' : 'Reserve This Package'}</span>
                    {isRTL ? <ArrowUpLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer settings={settings} />
      <DataConsentBanner />
    </div>
  );
}

/* ============================================================================
 * 3. /products — Dedicated Guzel Skincare Boutique & Products Screen
 * ========================================================================== */
export function ProductsScreen() {
  const { lang } = useLanguage();
  const { products, settings } = useRealtimeCatalog();
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [reservedToast, setReservedToast] = useState<string | null>(null);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const filtered =
    selectedCat === 'all' ? products : products.filter((p) => p.category === selectedCat);

  const handleReserveProduct = (prodName: string) => {
    setReservedToast(
      lang === 'ar'
        ? `تمت إضافة "${prodName}" لطلبكِ! يمكنكِ استلامه من الفرع أو إضافته لجلستكِ.`
        : `"${prodName}" reserved for your in-branch pickup or session!`,
    );
    window.setTimeout(() => setReservedToast(null), 4000);
  };

  return (
    <div
      className="min-h-screen flex flex-col pt-24"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <Navbar settings={settings} />

      <main className="flex-1 container-page py-12">
        {/* Hero Trio Packshot Banner (prod:0) */}
        <div
          className="rounded-[2.5rem] border overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-soft"
          style={{
            backgroundColor: 'var(--secondbg, #f3e6f0)',
            borderColor: 'var(--lines, #e8d7e4)',
          }}
        >
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#cbb6ea] text-[#2c1433] px-3.5 py-1 text-xs font-semibold w-fit">
              <Sparkles className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'خط العناية الحصري من غزل سبا' : 'Guzel Signature Skincare Line'}
            </span>
            <h1 className="mt-4 text-3xl sm:text-5xl font-normal leading-tight">
              {lang === 'ar' ? (
                <>
                  مستحضرات <span className="it text-[#b14bd9]">غزل</span> باللافندر والهيالورونيك.
                </>
              ) : (
                <>
                  The <span className="it text-[#b14bd9]">Guzel</span> botanical skincare trio.
                </>
              )}
            </h1>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
              {lang === 'ar'
                ? 'سيروم غزل الزجاجي بالقطارة، أنبوب الترطيب باللافندر المات، وجار الكريم الوردي المخملي — جميع الصور والمنتجات محدثة لحظياً من مخزون الإدارة.'
                : 'Featuring the frosted lavender glass dropper serum, matte lavender hydrating squeeze tube, and frosted blush-pink velvet cream jar — synced live with our studio inventory.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/book" className="btn-primary no-underline text-xs">
                {lang === 'ar' ? 'احجزي جلسة + منتج غزل' : 'Book Ritual + Skincare'}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[20rem] sm:min-h-[26rem]">
            <PhImage imgKey="prod:0" className="w-full h-full" />
          </div>
        </div>

        {reservedToast && (
          <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-300 px-5 py-3.5 text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <span>{reservedToast}</span>
            <Link to="/book" className="underline font-bold">
              {lang === 'ar' ? 'إكمال الحجز ←' : 'Complete Booking →'}
            </Link>
          </div>
        )}

        {/* Category Filter */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">
            {lang === 'ar' ? 'جميع المنتجات المتوفرة بالفرع' : 'Available Studio Products'}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                selectedCat === 'all'
                  ? 'bg-[#3a1d43] text-[#f9f0f5] border-[#3a1d43]'
                  : 'bg-white/70 border-[var(--lines)]'
              }`}
            >
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCat(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  selectedCat === c
                    ? 'bg-[#3a1d43] text-[#f9f0f5] border-[#3a1d43]'
                    : 'bg-white/70 border-[var(--lines)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prod, idx) => {
            const sheetKey =
              prod.sheet_key ||
              ['styled:0', 'styled:1', 'styled2:1', 'prod:0', 'styled2:0', 'styled2:2'][idx % 6];
            const displayName = lang === 'ar' ? prod.name_ar : prod.name_en;
            const displayDesc =
              lang === 'ar'
                ? prod.description_ar || 'منتج أصلي من مجموعة غزل للعناية الفائقة.'
                : prod.description_en || 'Authentic Guzel botanical formulation.';

            return (
              <div
                key={prod.id}
                className="group rounded-[1.75rem] border overflow-hidden flex flex-col justify-between shadow-clean hover:shadow-soft transition duration-300"
                style={{
                  backgroundColor: 'var(--secondbg, #f3e6f0)',
                  borderColor: 'var(--lines, #e8d7e4)',
                }}
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <PhImage
                      imgKey={sheetKey}
                      customImageUrl={prod.image_url}
                      className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 start-3 rounded-full bg-white/90 text-[#3a1d43] px-3 py-1 text-[11px] font-semibold">
                      {prod.stock_quantity > 0
                        ? lang === 'ar'
                          ? `متوفر (${prod.stock_quantity} قطعة)`
                          : `In Stock (${prod.stock_quantity})`
                        : lang === 'ar'
                        ? 'نفد المخزون'
                        : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold leading-snug">{displayName}</h3>
                      <span className="text-base font-bold text-[#b14bd9] whitespace-nowrap">
                        {formatPrice(prod.price, lang)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
                      {displayDesc}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    type="button"
                    disabled={prod.stock_quantity <= 0}
                    onClick={() => handleReserveProduct(displayName)}
                    className="w-full py-2.5 px-4 rounded-full bg-[#cbb6ea] text-[#2c1433] hover:bg-[#e58fb6] text-xs font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer border-0 disabled:opacity-40"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>
                      {lang === 'ar' ? 'حجز المنتج للاستلام بالفرع' : 'Reserve for Branch Pickup'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer settings={settings} />
      <DataConsentBanner />
    </div>
  );
}

/* ============================================================================
 * 4. /how-it-works — Dedicated 4 Steps & Philosophy Screen
 * ========================================================================== */
export function HowItWorksScreen() {
  const navigate = useNavigate();
  const { services, products, settings } = useRealtimeCatalog();

  return (
    <div
      className="min-h-screen flex flex-col pt-20"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <Navbar settings={settings} onBook={() => navigate('/book')} />

      <main className="flex-1">
        <GuzelHowItWorks />
        <GuzelStepSlides
          services={services}
          products={products}
          onBook={() => navigate('/book')}
        />
      </main>

      <Footer settings={settings} />
      <DataConsentBanner />
    </div>
  );
}

/* ============================================================================
 * 5. /about — Dedicated About Guzel Spa & Contact Screen
 * ========================================================================== */
export function AboutScreen() {
  const { lang } = useLanguage();
  const { settings, businessHours } = useRealtimeCatalog();

  const brand =
    lang === 'ar'
      ? settings?.business_name || 'جوزال ميديكال سبا'
      : settings?.business_name_en || 'Guzel Medical Spa';
  const facebookUrl =
    settings?.facebook_url || 'https://www.facebook.com/share/1AFAh6PqQ7/?mibextid=wwXIfr';
  const phone = settings?.business_phone || '01012345678';
  const address = settings?.business_address || '١٥ شارع البرازيل، الزمالك، القاهرة';

  const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const values = [
    {
      icon: Leaf,
      title: lang === 'ar' ? 'منتجات غزل الطبيعية ١٠٠٪' : '100% Botanical Guzel Formulas',
      body:
        lang === 'ar'
          ? 'نستخدم سيروم وكريمات غزل باللافندر والهيالورونيك، وصابون مغربي بلدي أصلي.'
          : 'Formulated with pure lavender, hyaluronic acid, and authentic Moroccan argan.',
    },
    {
      icon: ShieldCheck,
      title: lang === 'ar' ? 'أخصائيات محترفات وتعقيم طبي' : 'Certified Specialists & Hygiene',
      body:
        lang === 'ar'
          ? 'فريق نسائي بالكامل مدرب على أعلى مستوى مع أدوات معقمة مخصصة لكل عميلة.'
          : 'All-female specialist team with hospital-grade sterilization for every guest.',
    },
    {
      icon: Heart,
      title: lang === 'ar' ? 'خصوصية تامة وأجنحة منفصلة' : 'Complete Privacy & Suites',
      body:
        lang === 'ar'
          ? 'كل جلسة لها جناحها الخاص المعطر باللافندر لضمان راحتكِ وخصوصيتكِ الكاملة.'
          : 'Dedicated private suites for Moroccan bath, HydraFacial, and aromatherapy.',
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col pt-24"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <Navbar settings={settings} />

      <main className="flex-1 container-page py-12 space-y-16">
        {/* Story Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {lang === 'ar' ? 'قصتنا وهويتنا' : 'Our Story & Sanctuary'}
            </span>
            <h1 className="u-h1 mt-4">
              {lang === 'ar' ? (
                <>
                  أهلاً بكِ في عالم <span className="it text-[#b14bd9]">جوزال ميديكال سبا.</span>
                </>
              ) : (
                <>
                  Welcome to <span className="it text-[#b14bd9]">Guzel Medical Spa.</span>
                </>
              )}
            </h1>
            <p className="mt-5 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--fonts-64, #3a1d43a3)' }}>
              {lang === 'ar'
                ? 'تأسس جوزال ميديكال سبا (Guzel Medical Spa) في مصر ليكون ملاذاً نسائياً هادئاً يجمع بين أرقى تقنيات العناية الطبية بالبشرة والشعر وبين طقوس الاسترخاء الشرقية والمغربية الأصيلة.'
                : 'Founded in Egypt, Guzel Medical Spa is an all-female luxury sanctuary blending clinical skincare innovation with timeless Moroccan hammam and aromatherapy traditions.'}
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-3xl border p-5"
                  style={{
                    backgroundColor: 'var(--secondbg, #f3e6f0)',
                    borderColor: 'var(--lines, #e8d7e4)',
                  }}
                >
                  <span className="h-9 w-9 rounded-2xl bg-[#cbb6ea] text-[#2c1433] grid place-items-center">
                    <v.icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold">{v.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed opacity-75">{v.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="h-72 sm:h-96 rounded-[2rem] overflow-hidden shadow-soft">
              <PhImage imgKey="life:0" className="w-full h-full" />
            </div>
            <div className="h-72 sm:h-96 rounded-[2rem] overflow-hidden shadow-soft mt-8">
              <PhImage imgKey="ringa:1" className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Specialists & Private Suites */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div
            className="rounded-[2rem] border p-8"
            style={{
              backgroundColor: 'var(--secondbg, #f3e6f0)',
              borderColor: 'var(--lines, #e8d7e4)',
            }}
          >
            <h2 className="text-2xl font-bold mb-4">
              {lang === 'ar' ? 'خبيرات وأخصائيات غزل سبا' : 'Our Senior Specialists'}
            </h2>
            <div className="space-y-3">
              {defaultSpecialists.map((sp) => (
                <div
                  key={sp.id}
                  className="rounded-2xl bg-white/75 p-4 flex items-center justify-between border border-[var(--lines)]"
                >
                  <div>
                    <div className="font-bold text-sm">{lang === 'ar' ? sp.name_ar : sp.name_en}</div>
                    <div className="text-xs opacity-70">{lang === 'ar' ? sp.title_ar : sp.title_en}</div>
                  </div>
                  <Link to="/book" className="text-xs font-semibold text-[#b14bd9] no-underline hover:underline">
                    {lang === 'ar' ? 'احجزي معها ←' : 'Book →'}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-[2rem] border p-8"
            style={{
              backgroundColor: 'var(--secondbg, #f3e6f0)',
              borderColor: 'var(--lines, #e8d7e4)',
            }}
          >
            <h2 className="text-2xl font-bold mb-4">
              {lang === 'ar' ? 'مواعيد العمل والتواصل المباشر' : 'Working Hours & Direct Contact'}
            </h2>

            <div className="space-y-2 text-xs mb-6">
              {businessHours.map((bh) => (
                <div key={bh.weekday} className="flex items-center justify-between py-1.5 border-b border-[var(--lines)]">
                  <span className="font-semibold">
                    {lang === 'ar' ? dayNamesAr[bh.weekday] : dayNamesEn[bh.weekday]}
                  </span>
                  <span dir="ltr" className="font-mono">
                    {bh.is_open ? `${bh.start_time.slice(0, 5)} – ${bh.end_time.slice(0, 5)}` : lang === 'ar' ? 'مغلق' : 'Closed'}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#b14bd9]" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#b14bd9]" />
                <span dir="ltr">{phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#b14bd9]" />
                <span>{settings?.business_email || 'concierge@guzelspa.beauty'}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary no-underline text-xs inline-flex items-center gap-2"
              >
                <Facebook className="h-4 w-4" />
                <span>{lang === 'ar' ? 'صفحة غزل سبا على فيسبوك' : 'Guzel Spa on Facebook'}</span>
              </a>
              <a
                href={`https://wa.me/2${phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary no-underline text-xs inline-flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تواصلي عبر واتساب' : 'WhatsApp Concierge'}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Suites Overview */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {lang === 'ar' ? 'أجنحة وكبائن غزل سبا الخاصة' : 'Private Suites & Cabins'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultRooms.map((room) => (
              <div
                key={room.id}
                className="rounded-3xl border p-5"
                style={{
                  backgroundColor: 'var(--secondbg, #f3e6f0)',
                  borderColor: 'var(--lines, #e8d7e4)',
                }}
              >
                <div className="font-bold text-base">
                  {lang === 'ar' ? room.name_ar : room.name_en}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {lang === 'ar'
                    ? `سعة الجناح: ${room.capacity} عميلة بخصوصية تامة`
                    : `Suite capacity: ${room.capacity} guest(s) in complete privacy`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer settings={settings} />
      <DataConsentBanner />
    </div>
  );
}

/* ============================================================================
 * 6. /book — Dedicated Online Booking Screen
 * ========================================================================== */
export function BookScreen() {
  const { services, settings, businessHours, blockedDates } = useRealtimeCatalog();

  return (
    <div
      className="min-h-screen flex flex-col pt-20"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      <Navbar settings={settings} />

      <main className="flex-1">
        <Booking
          services={services}
          businessHours={businessHours}
          blockedDates={blockedDates}
          settings={settings}
        />
      </main>

      <Footer settings={settings} />
      <DataConsentBanner />
    </div>
  );
}

