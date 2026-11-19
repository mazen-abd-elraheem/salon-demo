import { useCallback, useRef, useState } from 'react';
import Navbar from '../components/public/Navbar';
import Hero from '../components/public/Hero';
import GuzelPreloader from '../components/public/GuzelPreloader';
import GuzelHowItWorks from '../components/public/GuzelHowItWorks';
import GuzelShowcasePanel from '../components/public/GuzelShowcasePanel';
import GuzelStepSlides from '../components/public/GuzelStepSlides';
import Services from '../components/public/Services';
import Booking from '../components/public/Booking';
import Footer from '../components/public/Footer';
import DataConsentBanner from '../components/public/DataConsentBanner';
import { useRealtimeCatalog } from '../hooks/useRealtimeCatalog';
import type { Service } from '../lib/types';

export default function HomePage() {
  const {
    services,
    packages,
    products,
    settings,
    businessHours,
    blockedDates,
    loading,
  } = useRealtimeCatalog();

  const [initialService, setInitialService] = useState<Service | null>(null);
  const bookingRef = useRef<HTMLDivElement | null>(null);

  const scrollToBooking = useCallback(() => {
    const el = document.getElementById('booking');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSelectService = useCallback(
    (svc: Service) => {
      setInitialService(svc);
      window.setTimeout(() => scrollToBooking(), 60);
    },
    [scrollToBooking],
  );

  const customPreloaderImages = [
    ...services.map((s) => s.image_url),
    ...products.map((p) => p.image_url),
  ].filter(Boolean);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      {/* 1. Stepped Preloader with Hard-Cut Portraits */}
      <GuzelPreloader customImages={customPreloaderImages} />

      {/* 2. Fixed Header + Expanding Scrambling Menu Panel */}
      <Navbar settings={settings} onBook={scrollToBooking} />

      <main className="page flex flex-col min-h-[100svh]">
        {/* 3. Section 1: Hero with 8-Card Orbiting Ring & Three.js Canvas */}
        <Hero
          settings={settings}
          services={services}
          products={products}
          onBook={scrollToBooking}
        />

        {/* 4. Section 2: How It Works (Crawling Column + Wordmark Marquee) */}
        <GuzelHowItWorks />

        {/* 5. Section 3: 70rem Interactive Services & Products Showcase Panel */}
        <div className="px-2 sm:px-4">
          <GuzelShowcasePanel
            services={services}
            products={products}
            packages={packages}
            onSelectService={handleSelectService}
          />
        </div>

        {/* 6. Section 4: Four Pinned 3D-Stacking Step Slides */}
        <GuzelStepSlides
          services={services}
          products={products}
          onBook={scrollToBooking}
        />

        {/* 7. Full Interactive Services & Bridal Packages Menu */}
        <Services
          services={services}
          loading={loading}
          onSelect={handleSelectService}
        />

        {/* 8. Online Booking Engine with User Data Usage Agreement */}
        <div ref={bookingRef}>
          <Booking
            services={services}
            businessHours={businessHours}
            blockedDates={blockedDates}
            settings={settings}
            initialService={initialService}
            onReset={() => setInitialService(null)}
          />
        </div>
      </main>

      <Footer settings={settings} />
      <DataConsentBanner />
    </div>
  );
}
