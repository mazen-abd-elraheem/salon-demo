import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  defaultBlockedDates,
  defaultBusinessHours,
  getLocalPackages,
  getLocalProducts,
  getLocalServices,
  getLocalSettings,
} from '../lib/mockData';
import type {
  BlockedDate,
  BusinessHour,
  BusinessSettings,
  Package,
  Product,
  Service,
} from '../lib/types';

export function useRealtimeCatalog() {
  const [services, setServices] = useState<Service[]>(() => getLocalServices());
  const [packages, setPackages] = useState<Package[]>(() => getLocalPackages());
  const [products, setProducts] = useState<Product[]>(() => getLocalProducts());
  const [settings, setSettings] = useState<BusinessSettings>(() => getLocalSettings());
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(defaultBusinessHours);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(defaultBlockedDates);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const localSvcs = getLocalServices();
    const localPkgs = getLocalPackages();
    const localProds = getLocalProducts();
    const localSet = getLocalSettings();

    try {
      const [svcRes, pkgRes, prodRes, hoursRes, blockedRes, settingsRes] = await Promise.all([
        supabase.from('services').select('*').eq('is_active', true).order('price', { ascending: true }),
        supabase.from('packages').select('*').eq('is_active', true).order('price', { ascending: true }),
        supabase.from('products').select('*').eq('is_active', true).order('price', { ascending: true }),
        supabase.from('business_hours').select('*').order('weekday'),
        supabase.from('blocked_dates').select('*'),
        supabase.from('business_settings').select('*').limit(1).maybeSingle(),
      ]);

      const dbSvcs = (svcRes?.data as Service[] | null) ?? [];
      const dbPkgs = (pkgRes?.data as Package[] | null) ?? [];
      const dbProds = (prodRes?.data as Product[] | null) ?? [];
      const dbHours = (hoursRes?.data as BusinessHour[] | null) ?? [];
      const dbBlocked = (blockedRes?.data as BlockedDate[] | null) ?? [];
      const dbSettings = (settingsRes?.data as BusinessSettings | null) ?? null;

      // Merge DB with local custom fields (such as uploaded base64 image_url or sheet_key)
      if (dbSvcs.length > 0) {
        const mergedSvcs = dbSvcs.map((dbItem, idx) => {
          const localMatch = localSvcs.find(
            (l) => l.id === dbItem.id || l.name_ar === dbItem.name_ar || l.name_en === dbItem.name_en,
          );
          return {
            ...localMatch,
            ...dbItem,
            image_url: dbItem.image_url || localMatch?.image_url || null,
            sheet_key: dbItem.sheet_key || localMatch?.sheet_key || localSvcs[idx % localSvcs.length]?.sheet_key || 'ringa:1',
          };
        });
        setServices(mergedSvcs);
      } else {
        setServices(localSvcs);
      }

      if (dbPkgs.length > 0) {
        const mergedPkgs = dbPkgs.map((dbItem, idx) => {
          const localMatch = localPkgs.find(
            (l) => l.id === dbItem.id || l.name_ar === dbItem.name_ar,
          );
          return {
            ...localMatch,
            ...dbItem,
            image_url: dbItem.image_url || localMatch?.image_url || null,
            sheet_key: dbItem.sheet_key || localMatch?.sheet_key || localPkgs[idx % localPkgs.length]?.sheet_key || 'life:2',
          };
        });
        setPackages(mergedPkgs);
      } else {
        setPackages(localPkgs);
      }

      if (dbProds.length > 0) {
        const mergedProds = dbProds.map((dbItem, idx) => {
          const localMatch = localProds.find(
            (l) => l.id === dbItem.id || l.sku === dbItem.sku || l.name_ar === dbItem.name_ar,
          );
          return {
            ...localMatch,
            ...dbItem,
            image_url: dbItem.image_url || localMatch?.image_url || null,
            sheet_key: dbItem.sheet_key || localMatch?.sheet_key || localProds[idx % localProds.length]?.sheet_key || 'styled:0',
          };
        });
        setProducts(mergedProds);
      } else {
        setProducts(localProds);
      }

      setBusinessHours(dbHours.length > 0 ? dbHours : defaultBusinessHours);
      setBlockedDates(dbBlocked.length > 0 ? dbBlocked : defaultBlockedDates);

      if (dbSettings) {
        setSettings({
          ...localSet,
          ...dbSettings,
          logo_url: dbSettings.logo_url || localSet.logo_url || null,
          facebook_url: dbSettings.facebook_url || localSet.facebook_url || 'https://www.facebook.com/share/1AFAh6PqQ7/?mibextid=wwXIfr',
        });
      } else {
        setSettings(localSet);
      }
    } catch {
      setServices(localSvcs);
      setPackages(localPkgs);
      setProducts(localProds);
      setSettings(localSet);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    // Listen to local admin updates in real time
    const handleLocalUpdate = () => {
      fetchAll();
    };
    window.addEventListener('guzel:data-updated', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);

    // Subscribe to Supabase Realtime Postgres Changes
    const channel = supabase
      .channel('guzel-realtime-catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_settings' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_hours' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_dates' }, () => fetchAll())
      .subscribe();

    return () => {
      window.removeEventListener('guzel:data-updated', handleLocalUpdate);
      window.removeEventListener('storage', handleLocalUpdate);
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  return {
    services,
    packages,
    products,
    settings,
    businessHours,
    blockedDates,
    loading,
    refresh: fetchAll,
  };
}

