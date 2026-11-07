import { useCallback, useEffect, useRef, useState } from 'react';
import Navbar from '../components/public/Navbar';
import Hero from '../components/public/Hero';
import Services from '../components/public/Services';
import About from '../components/public/About';
import Booking from '../components/public/Booking';
import Footer from '../components/public/Footer';
import { supabase } from '../lib/supabase';
import {
  defaultServices,
  defaultBusinessHours,
  defaultBlockedDates,
  defaultSettings,
} from '../lib/mockData';
import type {
  BlockedDate,
  BusinessHour,
  BusinessSettings,
  Service,
} from '../lib/types';

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loadingServices, setLoadingServices] = useState(true);

  const [initialService, setInitialService] = useState<Service | null>(null);
  const bookingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [svcRes, hoursRes, blockedRes, settingsRes] = await Promise.all([
          supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true }),
          supabase.from('business_hours').select('*').order('weekday'),
          supabase.from('blocked_dates').select('*'),
          supabase.from('business_settings').select('*').limit(1).maybeSingle(),
        ]);

        if (cancelled) return;

        const loadedServices = (svcRes?.data as Service[]) ?? [];
        const loadedHours = (hoursRes?.data as BusinessHour[]) ?? [];
        const loadedBlocked = (blockedRes?.data as BlockedDate[]) ?? [];
        const loadedSettings = (settingsRes?.data as BusinessSettings | null) ?? null;

        setServices(loadedServices.length > 0 ? loadedServices : defaultServices);
        setBusinessHours(loadedHours.length > 0 ? loadedHours : defaultBusinessHours);
        setBlockedDates(loadedBlocked.length > 0 ? loadedBlocked : defaultBlockedDates);
        setSettings(loadedSettings || defaultSettings);
      } catch (err) {
        if (!cancelled) {
          setServices(defaultServices);
          setBusinessHours(defaultBusinessHours);
          setBlockedDates(defaultBlockedDates);
          setSettings(defaultSettings);
        }
      } finally {
        if (!cancelled) {
          setLoadingServices(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToBooking = useCallback(() => {
    const el = document.getElementById('booking');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSelectService = useCallback(
    (svc: Service) => {
      setInitialService(svc);
      // Force re-init on subsequent selections by clearing then setting.
      setTimeout(() => scrollToBooking(), 50);
    },
    [scrollToBooking],
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ivory">
      <Navbar settings={settings} onBook={scrollToBooking} />
      <main>
        <Hero settings={settings} onBook={scrollToBooking} />
        <Services
          services={services}
          loading={loadingServices}
          onSelect={handleSelectService}
        />
        <About />
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
    </div>
  );
}
