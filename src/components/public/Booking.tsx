import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  FileCheck,
  Image as ImageIcon,
  Loader2,
  Phone,
  Plus,
  QrCode,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import type {
  BlockedDate,
  Booking,
  BusinessHour,
  BusinessSettings,
  Package,
  PromoCode,
  Room,
  Service,
  Specialist,
  TimeSlot,
} from '../../lib/types';
import {
  defaultBusinessHours,
  defaultPackages,
  defaultPromoCodes,
  defaultRooms,
  defaultServices,
  defaultSettings,
  defaultSpecialists,
  saveLocalBooking,
} from '../../lib/mockData';
import {
  calculateCartSummary,
  getDualConstraintAvailableSlots,
  normalizeArabicDigits,
  validateEgyptianPhone,
} from '../../lib/availabilityV2';
import {
  WEEKDAY_SHORT,
  WEEKDAY_SHORT_AR,
  getCalendarDays,
} from '../../lib/availability';
import {
  addDays,
  startOfDay,
  toDateString,
  toLongDateLabel,
  toTimeString,
} from '../../lib/time';
import { formatDuration, formatPrice } from '../../lib/format';
import { compressReceiptImage } from '../../lib/imageCompressor';
import { buildDepositApprovalWhatsAppUrl } from '../../lib/whatsapp';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';

interface BookingProps {
  services?: Service[];
  businessHours?: BusinessHour[];
  blockedDates?: BlockedDate[];
  settings?: BusinessSettings | null;
  initialService?: Service | null;
  onReset?: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

export default function Booking({
  services: propServices,
  businessHours: propHours,
  blockedDates: propBlocked,
  settings: propSettings,
  initialService,
  onReset,
}: BookingProps) {
  const { t, lang, isRTL } = useLanguage();

  // Master Data
  const services = propServices && propServices.length > 0 ? propServices : defaultServices;
  const packages = defaultPackages;
  const specialists = defaultSpecialists;
  const rooms = defaultRooms;
  const businessHours = propHours && propHours.length > 0 ? propHours : defaultBusinessHours;
  const blockedDates = propBlocked || [];
  const settings = propSettings || defaultSettings;

  // Wizard Step
  const [step, setStep] = useState<Step>(1);

  // Cart: Multi-service and packages selection
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Package[]>([]);
  const [activeCatalogTab, setActiveCatalogTab] = useState<'services' | 'packages'>('services');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Scheduling State
  const [calendarStart, setCalendarStart] = useState<Date>(startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [preferredSpecialistId, setPreferredSpecialistId] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Client Details & Promo Code
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 50% Deposit Payment
  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'vodafone_cash'>('instapay');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofSizeKb, setProofSizeKb] = useState<number | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Submission & Confirmed state
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Initial service prop hook
  useEffect(() => {
    if (initialService) {
      setSelectedServices([initialService]);
      setSelectedPackages([]);
      setStep(2);
    }
  }, [initialService]);

  // Compute Cart Summary
  const cartSummary = useMemo(() => {
    return calculateCartSummary({
      services: selectedServices,
      packages: selectedPackages,
      promoCode: appliedPromo,
      depositPercentage: settings?.deposit_percentage || 50,
    });
  }, [selectedServices, selectedPackages, appliedPromo, settings]);

  // Calendar days
  const calendarDays = useMemo(() => {
    return getCalendarDays({
      from: calendarStart,
      count: 14,
      businessHours,
      blockedDates,
    });
  }, [calendarStart, businessHours, blockedDates]);

  // Load available slots whenever date, services, or duration changes
  useEffect(() => {
    if (!selectedDate || cartSummary.totalDurationMinutes <= 0) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);

    getDualConstraintAvailableSlots({
      date: selectedDate,
      totalDurationMinutes: cartSummary.totalDurationMinutes,
      services: selectedServices,
      packages: selectedPackages,
      businessHours,
      rooms,
      specialists,
      settings,
      preferredSpecialistId: preferredSpecialistId || null,
      lang,
    })
      .then((s) => setSlots(s))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [
    selectedDate,
    cartSummary.totalDurationMinutes,
    selectedServices,
    selectedPackages,
    preferredSpecialistId,
    businessHours,
    rooms,
    specialists,
    settings,
    lang,
  ]);

  // Category Filtering
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  // Cart operations
  const toggleService = (svc: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === svc.id);
      if (exists) return prev.filter((s) => s.id !== svc.id);
      return [...prev, svc];
    });
  };

  const togglePackage = (pkg: Package) => {
    setSelectedPackages((prev) => {
      const exists = prev.some((p) => p.id === pkg.id);
      if (exists) return prev.filter((p) => p.id !== pkg.id);
      return [...prev, pkg];
    });
  };

  // Promo Code Validation
  const handleApplyPromo = () => {
    const clean = promoInput.trim().toUpperCase();
    if (!clean) return;
    const match = defaultPromoCodes.find((p) => p.code === clean && p.is_active);
    if (match) {
      const minSpend = match.min_spend || 0;
      if (cartSummary.subtotal >= minSpend) {
        setAppliedPromo(match);
        setPromoMessage({ text: t('promoSuccess'), isError: false });
      } else {
        setPromoMessage({
          text: lang === 'ar' ? `الحد الأدنى لتطبيق الكود ${formatPrice(minSpend, 'ar')}` : `Minimum spend is ${formatPrice(minSpend, 'en')}`,
          isError: true,
        });
      }
    } else {
      setPromoMessage({ text: t('promoInvalid'), isError: true });
    }
  };

  // Screenshot Upload with Auto-Compression (<100KB)
  const handleProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCompressing(true);
      const res = await compressReceiptImage(file, 95);
      setProofFile(res.file);
      setProofPreview(res.dataUrl);
      setProofSizeKb(res.sizeKb);
    } catch {
      // ignore
    } finally {
      setCompressing(false);
    }
  };

  // Quick Copy with Visual Feedback
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Phone Validation
  const handlePhoneBlur = () => {
    if (!phone) return;
    const res = validateEgyptianPhone(phone);
    if (!res.isValid) {
      setPhoneError(res.error || 'رقم موبايل غير صحيح');
    } else {
      setPhone(res.normalized);
      setPhoneError(null);
    }
  };

  // Final Booking Submission
  const handleFinalSubmit = async () => {
    if (!selectedDate || !selectedSlot) return;
    const phoneVal = validateEgyptianPhone(phone);
    if (!phoneVal.isValid) {
      setPhoneError(phoneVal.error || 'رقم موبايل غير صحيح');
      setStep(3);
      return;
    }

    setSubmitting(true);
    const bookingNum = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const secretTok = crypto.randomUUID ? crypto.randomUUID() : `tok-${Date.now()}`;
    const holdExpiration = new Date(Date.now() + (settings.deposit_hold_minutes || 30) * 60 * 1000).toISOString();

    const bookingPayload: Booking = {
      id: crypto.randomUUID ? crypto.randomUUID() : `bkg-${Date.now()}`,
      booking_number: bookingNum,
      secret_token: secretTok,
      customer_name: fullName.trim(),
      customer_phone: phoneVal.normalized,
      appointment_date: toDateString(selectedDate),
      start_time: toTimeString(selectedSlot.start),
      end_time: toTimeString(selectedSlot.end),
      subtotal_amount: cartSummary.subtotal,
      discount_amount: cartSummary.discountAmount,
      promo_code_id: appliedPromo?.id || null,
      promo_code: appliedPromo?.code || null,
      total_amount: cartSummary.totalAmount,
      deposit_required: cartSummary.depositRequired,
      deposit_paid: 0,
      status: 'pending_verification',
      notes: notes.trim() || null,
      hold_expires_at: holdExpiration,
      created_at: new Date().toISOString(),
      items: [
        ...selectedServices.map((s, idx) => ({
          id: `item-s-${idx}`,
          booking_id: '',
          service_id: s.id,
          service: s,
          scheduled_start: toTimeString(selectedSlot.start),
          scheduled_end: toTimeString(selectedSlot.end),
          price: s.price,
        })),
        ...selectedPackages.map((p, idx) => ({
          id: `item-p-${idx}`,
          booking_id: '',
          package_id: p.id,
          package: p,
          scheduled_start: toTimeString(selectedSlot.start),
          scheduled_end: toTimeString(selectedSlot.end),
          price: p.price,
        })),
      ],
      payments: [
        {
          id: `pay-${Date.now()}`,
          booking_id: '',
          payment_type: 'deposit',
          method: paymentMethod,
          amount: cartSummary.depositRequired,
          reference_number: referenceNumber.trim() || null,
          proof_image_url: proofPreview || null,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ],
    };

    // Save to local storage first for resilience
    saveLocalBooking(bookingPayload);

    // Attempt remote save to Supabase
    try {
      await supabase.from('bookings').insert({
        id: bookingPayload.id,
        booking_number: bookingPayload.booking_number,
        secret_token: bookingPayload.secret_token,
        customer_name: bookingPayload.customer_name,
        customer_phone: bookingPayload.customer_phone,
        appointment_date: bookingPayload.appointment_date,
        start_time: bookingPayload.start_time,
        end_time: bookingPayload.end_time,
        subtotal_amount: bookingPayload.subtotal_amount,
        discount_amount: bookingPayload.discount_amount,
        promo_code_id: bookingPayload.promo_code_id,
        total_amount: bookingPayload.total_amount,
        deposit_required: bookingPayload.deposit_required,
        deposit_paid: 0,
        status: 'pending_verification',
        notes: bookingPayload.notes,
        hold_expires_at: bookingPayload.hold_expires_at,
      });

      // Insert payment record
      await supabase.from('payments').insert({
        booking_id: bookingPayload.id,
        payment_type: 'deposit',
        method: paymentMethod,
        amount: cartSummary.depositRequired,
        reference_number: referenceNumber.trim() || null,
        proof_image_url: proofPreview || null,
        status: 'pending',
      });
    } catch {
      // Graceful offline fallback
    } finally {
      setSubmitting(false);
      setConfirmedBooking(bookingPayload);
      setStep(5);
    }
  };

  const handleStartOver = () => {
    setSelectedServices([]);
    setSelectedPackages([]);
    setSelectedDate(null);
    setSelectedSlot(null);
    setFullName('');
    setPhone('');
    setPhoneError(null);
    setEmail('');
    setNotes('');
    setAppliedPromo(null);
    setPromoInput('');
    setProofFile(null);
    setProofPreview(null);
    setReferenceNumber('');
    setConfirmedBooking(null);
    setStep(1);
    if (onReset) onReset();
  };

  const totalItemsCount = selectedServices.length + selectedPackages.length;

  return (
    <section id="booking" className="relative py-20 lg:py-28">
      {/* Background tone: calm warm cream */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-ivory" />

      <div className="container-page">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow justify-center">
            <span className="eyebrow-dot" />
            {t('bookingEyebrow')}
          </span>
          <h2 className="heading-display mt-3 text-3xl sm:text-5xl lg:text-[48px] tracking-tight">
            {t('bookingTitle1')}{' '}
            <span className="italic text-rosegold-400">{t('bookingTitle2')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-mocha-600">
            {t('bookingSubtitle')}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as Step[]).map((s) => {
            const isCompleted = step > s;
            const isCurrent = step === s;
            const stepName =
              s === 1
                ? t('step1')
                : s === 2
                ? t('step2')
                : s === 3
                ? t('step3')
                : s === 4
                ? t('step4')
                : t('step5');

            return (
              <div key={s} className="flex flex-col items-center gap-2">
                <div
                  className={[
                    'flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border text-xs font-semibold transition-all duration-300',
                    isCurrent
                      ? 'border-rosegold-300 bg-rosegold-300 text-ivory'
                      : isCompleted
                      ? 'border-espresso bg-espresso text-ivory'
                      : 'border-mocha-400/20 bg-white/70 text-mocha-500',
                  ].join(' ')}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : s}
                </div>
                <span
                  className={[
                    'text-[10px] sm:text-[11px] font-medium tracking-tight text-center',
                    isCurrent ? 'text-espresso font-bold' : 'text-mocha-500',
                  ].join(' ')}
                >
                  {stepName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Active Step Panel */}
          <div className="rounded-2xl border border-pearl/80 bg-white/80 p-6 sm:p-9 shadow-sm">
            {/* STEP 1: SERVICE & PACKAGE CART */}
            {step === 1 && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-pearl/70 pb-5">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-rosegold-400">
                      {lang === 'ar' ? 'الخطوة الأولى' : 'Step 1'}
                    </span>
                    <h3 className="heading-display mt-1 text-2xl sm:text-3xl">
                      {t('step1Title')}
                    </h3>
                  </div>

                  {/* Tabs: Individual Services vs Packages */}
                  <div className="flex items-center rounded-xl border border-mocha-400/20 bg-ivory/80 p-1">
                    <button
                      onClick={() => setActiveCatalogTab('services')}
                      className={[
                        'rounded-lg px-4 py-1.5 text-xs font-semibold transition',
                        activeCatalogTab === 'services'
                          ? 'bg-espresso text-ivory shadow-xs'
                          : 'text-mocha-600 hover:text-espresso',
                      ].join(' ')}
                    >
                      {t('servicesTab')}
                    </button>
                    <button
                      onClick={() => setActiveCatalogTab('packages')}
                      className={[
                        'rounded-lg px-4 py-1.5 text-xs font-semibold transition',
                        activeCatalogTab === 'packages'
                          ? 'bg-espresso text-ivory shadow-xs'
                          : 'text-mocha-600 hover:text-espresso',
                      ].join(' ')}
                    >
                      {t('packagesTab')}
                    </button>
                  </div>
                </div>

                {/* Sub-category filter pills for individual services */}
                {activeCatalogTab === 'services' && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: t('allCategories') },
                      { key: 'moroccan_bath', label: t('catMoroccanBath') },
                      { key: 'skincare', label: t('catSkincare') },
                      { key: 'massage', label: t('catMassage') },
                      { key: 'hair', label: t('catHair') },
                      { key: 'nails', label: t('catNails') },
                      { key: 'bridal', label: t('catBridal') },
                    ].map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setSelectedCategory(c.key)}
                        className={[
                          'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                          selectedCategory === c.key
                            ? 'border-rosegold-300 bg-rosegold-100/50 text-espresso font-semibold'
                            : 'border-pearl/70 bg-white/60 text-mocha-600 hover:border-rosegold-200',
                        ].join(' ')}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Items Grid */}
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeCatalogTab === 'services' ? (
                    filteredServices.map((svc) => {
                      const isSelected = selectedServices.some((s) => s.id === svc.id);
                      const name = lang === 'ar' ? svc.name_ar : svc.name_en || svc.name;
                      const desc = lang === 'ar' ? svc.description_ar : svc.description_en || svc.description;

                      return (
                        <div
                          key={svc.id}
                          className={[
                            'group flex flex-col justify-between rounded-xl border p-4 transition-all duration-200',
                            isSelected
                              ? 'border-rosegold-300 bg-rosegold-50/40 ring-1 ring-rosegold-300'
                              : 'border-pearl/80 bg-white/70 hover:border-rosegold-200',
                          ].join(' ')}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-display text-lg font-bold text-espresso leading-snug">
                                {name}
                              </h4>
                              <span className="font-display text-base font-bold text-rosegold-400 shrink-0">
                                {formatPrice(svc.price, lang)}
                              </span>
                            </div>
                            {desc && (
                              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-mocha-600">
                                {desc}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-pearl/60 pt-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-mocha-500">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDuration(svc.duration_minutes, lang)}
                            </span>
                            <button
                              onClick={() => toggleService(svc)}
                              className={[
                                'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                                isSelected
                                  ? 'bg-espresso text-ivory hover:bg-mocha-700'
                                  : 'border border-mocha-400/25 bg-white text-espresso hover:border-rosegold-300',
                              ].join(' ')}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  {t('inBooking')}
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5" />
                                  {t('addToBooking')}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    packages.map((pkg) => {
                      const isSelected = selectedPackages.some((p) => p.id === pkg.id);
                      const name = lang === 'ar' ? pkg.name_ar : pkg.name_en;
                      const desc = lang === 'ar' ? pkg.description_ar : pkg.description_en;

                      return (
                        <div
                          key={pkg.id}
                          className={[
                            'group flex flex-col justify-between rounded-xl border p-4 transition-all duration-200',
                            isSelected
                              ? 'border-rosegold-300 bg-rosegold-50/40 ring-1 ring-rosegold-300'
                              : 'border-pearl/80 bg-white/70 hover:border-rosegold-200',
                          ].join(' ')}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-display text-lg font-bold text-espresso leading-snug">
                                {name}
                              </h4>
                              <span className="font-display text-base font-bold text-rosegold-400 shrink-0">
                                {formatPrice(pkg.price, lang)}
                              </span>
                            </div>
                            {desc && (
                              <p className="mt-2 text-xs leading-relaxed text-mocha-600">
                                {desc}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-pearl/60 pt-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-mocha-500">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDuration(pkg.duration_minutes, lang)}
                            </span>
                            <button
                              onClick={() => togglePackage(pkg)}
                              className={[
                                'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                                isSelected
                                  ? 'bg-espresso text-ivory hover:bg-mocha-700'
                                  : 'border border-mocha-400/25 bg-white text-espresso hover:border-rosegold-300',
                              ].join(' ')}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  {t('inBooking')}
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5" />
                                  {t('addToBooking')}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Next Step Action */}
                <div className="mt-8 flex items-center justify-end border-t border-pearl/70 pt-5">
                  <button
                    onClick={() => totalItemsCount > 0 && setStep(2)}
                    disabled={totalItemsCount === 0}
                    className={[
                      'btn-primary flex items-center gap-2',
                      totalItemsCount === 0 && 'cursor-not-allowed opacity-50',
                    ].join(' ')}
                  >
                    <span>{t('continueToDateTime')}</span>
                    {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DATE & TIME (DUAL-CONSTRAINT AVAILABILITY) */}
            {step === 2 && (
              <div>
                <div className="border-b border-pearl/70 pb-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-rosegold-400">
                    {lang === 'ar' ? 'الخطوة الثانية' : 'Step 2'}
                  </span>
                  <h3 className="heading-display mt-1 text-2xl sm:text-3xl">
                    {t('step2Title')}
                  </h3>
                  <p className="mt-1 text-xs text-mocha-500">
                    {t('totalDuration')}:{' '}
                    <strong className="text-espresso font-semibold">
                      {formatDuration(cartSummary.totalDurationMinutes, lang)}
                    </strong>
                  </p>
                </div>

                {/* Calendar Days Slider */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-mocha-600">
                    <CalendarRange className="h-4 w-4 text-rosegold-400" />
                    <span>{t('availableSlots')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCalendarStart((d) => addDays(d, -7))}
                      disabled={calendarStart <= startOfDay(new Date())}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-mocha-400/20 transition hover:border-rosegold-300 disabled:opacity-40"
                    >
                      {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setCalendarStart((d) => addDays(d, 7))}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-mocha-400/20 transition hover:border-rosegold-300"
                    >
                      {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {calendarDays.map(({ date, available, reason }) => {
                    const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
                    const dayShort =
                      lang === 'ar'
                        ? WEEKDAY_SHORT_AR[date.getDay()]
                        : WEEKDAY_SHORT[date.getDay()];
                    const monthShort =
                      lang === 'ar'
                        ? date.toLocaleString('ar-EG', { month: 'short' })
                        : date.toLocaleString('en-US', { month: 'short' });

                    return (
                      <button
                        key={date.toISOString()}
                        disabled={!available}
                        onClick={() => setSelectedDate(date)}
                        className={[
                          'flex flex-col items-center rounded-xl border p-2.5 text-center transition-all',
                          isSelected
                            ? 'border-rosegold-300 bg-rosegold-100/50 font-bold'
                            : available
                            ? 'border-pearl/80 bg-white hover:border-rosegold-200'
                            : 'border-pearl/50 bg-cream/30 text-mocha-400/60 line-through opacity-50',
                        ].join(' ')}
                        title={!available ? reason ?? 'Closed' : undefined}
                      >
                        <span className="text-[10px] uppercase tracking-wider text-mocha-500">
                          {dayShort}
                        </span>
                        <span className="mt-0.5 font-display text-xl text-espresso">
                          {lang === 'ar' ? date.getDate().toLocaleString('ar-EG') : date.getDate()}
                        </span>
                        <span className="text-[10px] text-mocha-500">{monthShort}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Optional Specialist Selection */}
                <div className="mt-7">
                  <label className="field-label text-xs">
                    {t('preferredSpecialist')}
                  </label>
                  <select
                    value={preferredSpecialistId}
                    onChange={(e) => setPreferredSpecialistId(e.target.value)}
                    className="field-input mt-1.5"
                  >
                    <option value="">{t('anySpecialist')}</option>
                    {specialists.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {lang === 'ar' ? sp.name_ar : sp.name_en} ({lang === 'ar' ? sp.title_ar : sp.title_en})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Slots */}
                <div className="mt-7">
                  <div className="flex items-center gap-2 text-xs font-semibold text-mocha-600">
                    <Clock className="h-4 w-4 text-rosegold-400" />
                    <span>{t('availableSlots')}</span>
                  </div>

                  {!selectedDate && (
                    <p className="mt-3 rounded-xl border border-dashed border-mocha-400/30 p-6 text-center text-xs text-mocha-500">
                      {t('chooseDateFirst')}
                    </p>
                  )}

                  {selectedDate && loadingSlots && (
                    <div className="mt-4 flex items-center justify-center gap-2 py-6 text-xs text-mocha-500">
                      <Loader2 className="h-4 w-4 animate-spin text-rosegold-400" />
                      <span>{t('loadingSlots')}</span>
                    </div>
                  )}

                  {selectedDate && !loadingSlots && slots.length === 0 && (
                    <p className="mt-3 rounded-xl border border-dashed border-mocha-400/30 p-6 text-center text-xs text-mocha-500">
                      {t('noSlots')}
                    </p>
                  )}

                  {selectedDate && !loadingSlots && slots.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                      {slots.map((s) => {
                        const isSelected =
                          selectedSlot && selectedSlot.start.getTime() === s.start.getTime();
                        return (
                          <button
                            key={s.start.toISOString()}
                            onClick={() => setSelectedSlot(s)}
                            className={[
                              'rounded-xl border px-3 py-2 text-xs font-semibold transition-all text-center',
                              isSelected
                                ? 'border-rosegold-300 bg-rosegold-300 text-ivory shadow-xs'
                                : 'border-pearl/80 bg-white text-espresso hover:border-rosegold-200',
                            ].join(' ')}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-9 flex items-center justify-between border-t border-pearl/70 pt-5">
                  <button onClick={() => setStep(1)} className="btn-ghost flex items-center gap-2">
                    {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    <span>{t('back')}</span>
                  </button>
                  <button
                    onClick={() => selectedSlot && setStep(3)}
                    disabled={!selectedSlot}
                    className={[
                      'btn-primary flex items-center gap-2',
                      !selectedSlot && 'cursor-not-allowed opacity-50',
                    ].join(' ')}
                  >
                    <span>{t('continueToDetails')}</span>
                    {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CLIENT DETAILS & PROMO CODE */}
            {step === 3 && (
              <div>
                <div className="border-b border-pearl/70 pb-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-rosegold-400">
                    {lang === 'ar' ? 'الخطوة الثالثة' : 'Step 3'}
                  </span>
                  <h3 className="heading-display mt-1 text-2xl sm:text-3xl">
                    {t('step3Title')}
                  </h3>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label text-xs">{t('fullName')}</label>
                    <div className="relative mt-1.5">
                      <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mocha-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('fullNamePlaceholder')}
                        className="field-input mt-0 pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label text-xs">
                      {t('phone')}{' '}
                      <span className="text-rosegold-400 font-bold">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mocha-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError(null);
                        }}
                        onBlur={handlePhoneBlur}
                        placeholder={t('phonePlaceholder')}
                        className={[
                          'field-input mt-0 pl-10',
                          phoneError && 'border-blush-500 ring-1 ring-blush-400',
                        ].join(' ')}
                      />
                    </div>
                    {phoneError && (
                      <p className="mt-1 text-[11px] text-blush-600 font-medium">{phoneError}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="field-label text-xs">{t('email')}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      className="field-input mt-1.5"
                    />
                  </div>

                  {/* Promo Code Box */}
                  <div className="sm:col-span-2 rounded-xl border border-pearl/80 bg-cream/30 p-4">
                    <label className="field-label text-xs flex items-center gap-1.5 text-mocha-600">
                      <Tag className="h-3.5 w-3.5 text-rosegold-400" />
                      <span>{t('promoCodeLabel')}</span>
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder={t('promoPlaceholder')}
                        className="field-input mt-0 uppercase tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="btn-secondary px-5 text-xs font-semibold shrink-0"
                      >
                        {t('applyPromo')}
                      </button>
                    </div>
                    {promoMessage && (
                      <p
                        className={[
                          'mt-2 text-xs font-medium',
                          promoMessage.isError ? 'text-blush-600' : 'text-emerald-700',
                        ].join(' ')}
                      >
                        {promoMessage.text}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="field-label text-xs">{t('notes')}</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('notesPlaceholder')}
                      className="field-textarea mt-1.5"
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-pearl/70 pt-5">
                  <button onClick={() => setStep(2)} className="btn-ghost flex items-center gap-2">
                    {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    <span>{t('back')}</span>
                  </button>
                  <button
                    onClick={() => {
                      const res = validateEgyptianPhone(phone);
                      if (!fullName.trim()) {
                        alert(lang === 'ar' ? 'من فضلك ادخلي اسمك' : 'Please enter your full name');
                        return;
                      }
                      if (!res.isValid) {
                        setPhoneError(res.error || 'رقم موبايل غير صحيح');
                        return;
                      }
                      setStep(4);
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <span>{t('continueToDeposit')}</span>
                    {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: MANDATORY 50% DEPOSIT SUBMISSION */}
            {step === 4 && (
              <div>
                <div className="border-b border-pearl/70 pb-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-rosegold-400">
                    {lang === 'ar' ? 'الخطوة الرابعة' : 'Step 4'}
                  </span>
                  <h3 className="heading-display mt-1 text-2xl sm:text-3xl">
                    {t('step4Title')}
                  </h3>
                  <div className="mt-3 rounded-xl border border-rosegold-200/60 bg-rosegold-50/40 p-3.5 text-xs leading-relaxed text-mocha-700">
                    <strong className="text-espresso font-semibold">
                      {t('depositDueNow')}: {formatPrice(cartSummary.depositRequired, lang)}
                    </strong>
                    <p className="mt-1 text-[11px] text-mocha-600">
                      {t('depositNotice')}
                    </p>
                  </div>
                </div>

                {/* Transfer Channel Tabs */}
                <div className="mt-6">
                  <label className="field-label text-xs mb-2">
                    {t('selectPaymentMethod')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('instapay')}
                      className={[
                        'flex flex-col items-start rounded-xl border p-3.5 text-start transition',
                        paymentMethod === 'instapay'
                          ? 'border-rosegold-300 bg-rosegold-100/40 ring-1 ring-rosegold-300 font-semibold'
                          : 'border-pearl/80 bg-white/60 hover:border-rosegold-200',
                      ].join(' ')}
                    >
                      <span className="font-display text-base text-espresso">InstaPay</span>
                      <span className="text-[11px] text-mocha-500 mt-0.5">{t('instapayTitle')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('vodafone_cash')}
                      className={[
                        'flex flex-col items-start rounded-xl border p-3.5 text-start transition',
                        paymentMethod === 'vodafone_cash'
                          ? 'border-rosegold-300 bg-rosegold-100/40 ring-1 ring-rosegold-300 font-semibold'
                          : 'border-pearl/80 bg-white/60 hover:border-rosegold-200',
                      ].join(' ')}
                    >
                      <span className="font-display text-base text-espresso">Vodafone Cash</span>
                      <span className="text-[11px] text-mocha-500 mt-0.5">{t('vodafoneTitle')}</span>
                    </button>
                  </div>
                </div>

                {/* Account Details with One-Click Copy */}
                <div className="mt-5 rounded-xl border border-pearl/80 bg-cream/40 p-4">
                  {paymentMethod === 'instapay' ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-mocha-500">
                            {t('instapayIpa')}
                          </div>
                          <div className="font-display text-base font-bold text-espresso mt-0.5" dir="ltr">
                            {settings.instapay_ipa || 'maisonlumiere@instapay'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.instapay_ipa || 'maisonlumiere@instapay', 'ipa')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-mocha-400/20 bg-white px-3 py-1.5 text-xs font-semibold text-espresso hover:border-rosegold-300 transition"
                        >
                          {copiedKey === 'ipa' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-rosegold-400" />}
                          <span>{copiedKey === 'ipa' ? t('copiedText') : t('copyIpa')}</span>
                        </button>
                      </div>
                      <div className="mt-3 text-xs text-mocha-600">
                        {t('instapayName')}: <strong className="text-espresso">{settings.instapay_name || 'Maison Lumière Spa'}</strong>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-mocha-500">
                            {t('vodafoneNumber')}
                          </div>
                          <div className="font-display text-base font-bold text-espresso mt-0.5" dir="ltr">
                            {settings.vodafone_cash_number || '01012345678'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.vodafone_cash_number || '01012345678', 'voda')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-mocha-400/20 bg-white px-3 py-1.5 text-xs font-semibold text-espresso hover:border-rosegold-300 transition"
                        >
                          {copiedKey === 'voda' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-rosegold-400" />}
                          <span>{copiedKey === 'voda' ? t('copiedText') : t('copyWallet')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Proof of Payment Upload + Compression */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="field-label text-xs mb-1.5">
                      {t('uploadProofLabel')}
                    </label>
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-mocha-400/30 bg-white/70 p-5 text-center cursor-pointer hover:border-rosegold-300 transition">
                      <Upload className="h-5 w-5 text-rosegold-400" />
                      <span className="mt-2 text-xs font-medium text-espresso">
                        {compressing
                          ? 'جاري ضغط الصورة...'
                          : proofFile
                          ? proofFile.name
                          : 'اضغطي لاختيار صورة التحويل'}
                      </span>
                      <span className="mt-0.5 text-[11px] text-mocha-500">
                        {t('compressingNotice')}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofChange}
                        className="hidden"
                      />
                    </label>
                    {proofSizeKb !== null && (
                      <p className="mt-1.5 text-[11px] font-semibold text-emerald-700">
                        ✓ تم ضغط الصورة بنجاح: {proofSizeKb} KB (أقل من الحد الأقصى 100 KB)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="field-label text-xs mb-1.5">
                      {t('senderRefLabel')}
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder={t('senderRefPlaceholder')}
                      className="field-input mt-0"
                    />
                  </div>
                </div>

                {/* 30-Min Hold Notice */}
                <div className="mt-6 rounded-xl border border-pearl bg-cream/30 p-3 text-xs text-mocha-600 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-rosegold-400 shrink-0" />
                  <span>{t('holdTimeAlert')}</span>
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 flex items-center justify-between border-t border-pearl/70 pt-5">
                  <button onClick={() => setStep(3)} className="btn-ghost flex items-center gap-2">
                    {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    <span>{t('back')}</span>
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={submitting || (!proofFile && !referenceNumber.trim())}
                    className={[
                      'btn-primary flex items-center gap-2',
                      (submitting || (!proofFile && !referenceNumber.trim())) &&
                        'cursor-not-allowed opacity-50',
                    ].join(' ')}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('reserving')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('confirmBooking')}</span>
                        {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: DIGITAL PASS & CONFIRMATION SCREEN */}
            {step === 5 && confirmedBooking && (
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-espresso text-ivory">
                  <FileCheck className="h-7 w-7 text-rosegold-300" />
                </div>
                <h3 className="heading-display mt-4 text-2xl sm:text-3xl">
                  {t('step5Title')}
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm leading-relaxed text-mocha-600">
                  {t('step5Subtitle')}
                </p>

                {/* Digital Pass Card */}
                <div className="mx-auto mt-6 max-w-md rounded-2xl border border-pearl/80 bg-white/90 p-5 text-start shadow-sm">
                  <div className="flex items-center justify-between border-b border-pearl/70 pb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-mocha-500">
                        {t('bookingRefLabel')}
                      </span>
                      <div className="font-display text-xl font-bold text-espresso">
                        {confirmedBooking.booking_number}
                      </div>
                    </div>
                    <span className="rounded-lg bg-rosegold-100/60 px-2.5 py-1 text-[11px] font-semibold text-rosegold-500">
                      {t('statusPendingDeposit')}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-y-2.5 text-xs">
                    <div>
                      <dt className="text-mocha-500">{t('fullName')}</dt>
                      <dd className="font-semibold text-espresso">{confirmedBooking.customer_name}</dd>
                    </div>
                    <div>
                      <dt className="text-mocha-500">{t('phone')}</dt>
                      <dd className="font-semibold text-espresso" dir="ltr">{confirmedBooking.customer_phone}</dd>
                    </div>
                    <div>
                      <dt className="text-mocha-500">{t('summaryDate')}</dt>
                      <dd className="font-semibold text-espresso">{confirmedBooking.appointment_date}</dd>
                    </div>
                    <div>
                      <dt className="text-mocha-500">{t('summaryTime')}</dt>
                      <dd className="font-semibold text-espresso">{confirmedBooking.start_time.slice(0, 5)}</dd>
                    </div>
                    <div>
                      <dt className="text-mocha-500">{t('depositDueNow')}</dt>
                      <dd className="font-bold text-rosegold-400">{formatPrice(confirmedBooking.deposit_required, lang)}</dd>
                    </div>
                    <div>
                      <dt className="text-mocha-500">{t('balanceDueAtBranch')}</dt>
                      <dd className="font-semibold text-espresso">
                        {formatPrice(confirmedBooking.total_amount - confirmedBooking.deposit_required, lang)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-pearl/70 pt-3 text-[11px] text-mocha-500">
                    {t('qrPassHint')}
                  </div>
                </div>

                {/* Actions: WhatsApp confirmation & Return */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={buildDepositApprovalWhatsAppUrl(confirmedBooking, settings.business_phone || '01012345678')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <span>{t('openWhatsAppConfirmation')}</span>
                  </a>
                  <button
                    onClick={handleStartOver}
                    className="btn-secondary text-xs font-semibold"
                  >
                    {t('bookAnother')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Cart / Invoice Sidebar */}
          <aside className="rounded-2xl border border-pearl/80 bg-white/70 p-5 shadow-sm h-fit space-y-4">
            <div className="flex items-center justify-between border-b border-pearl/70 pb-3">
              <span className="font-display text-base font-bold text-espresso">
                {t('cartTitle')}
              </span>
              <span className="rounded-md bg-pearl/60 px-2 py-0.5 text-xs font-semibold text-mocha-700">
                {totalItemsCount}
              </span>
            </div>

            {/* Selected items list */}
            {totalItemsCount === 0 ? (
              <p className="text-xs text-mocha-500 py-3 text-center">
                لم يتم اختيار خدمات حتى الآن.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {selectedServices.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-espresso truncate max-w-[190px]">
                      {lang === 'ar' ? s.name_ar : s.name_en || s.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-mocha-600 font-semibold">{formatPrice(s.price, lang)}</span>
                      <button
                        onClick={() => toggleService(s)}
                        className="text-mocha-400 hover:text-blush-600"
                        title={t('removeFromBooking')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {selectedPackages.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-espresso truncate max-w-[190px]">
                      {lang === 'ar' ? p.name_ar : p.name_en}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-mocha-600 font-semibold">{formatPrice(p.price, lang)}</span>
                      <button
                        onClick={() => togglePackage(p)}
                        className="text-mocha-400 hover:text-blush-600"
                        title={t('removeFromBooking')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="border-t border-pearl/70 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-mocha-600">
                <span>{t('totalDuration')}</span>
                <span className="font-semibold text-espresso">
                  {formatDuration(cartSummary.totalDurationMinutes, lang)}
                </span>
              </div>
              <div className="flex justify-between text-mocha-600">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(cartSummary.subtotal, lang)}</span>
              </div>
              {cartSummary.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{t('discountAmount')}</span>
                  <span>-{formatPrice(cartSummary.discountAmount, lang)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-espresso border-t border-pearl/50 pt-2">
                <span>{t('netTotal')}</span>
                <span>{formatPrice(cartSummary.totalAmount, lang)}</span>
              </div>
              <div className="rounded-xl border border-rosegold-200/80 bg-rosegold-50/60 p-3 mt-2">
                <div className="flex justify-between font-bold text-xs text-rosegold-500">
                  <span>{t('depositDueNow')}</span>
                  <span className="text-sm">{formatPrice(cartSummary.depositRequired, lang)}</span>
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-mocha-600">
                  <span>{t('balanceDueAtBranch')}</span>
                  <span>{formatPrice(cartSummary.totalAmount - cartSummary.depositRequired, lang)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
