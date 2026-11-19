import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Upload,
  AlertCircle,
  CreditCard,
  Printer,
  Home,
  MessageCircle,
  ShieldCheck,
  KeyRound,
  Phone,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../lib/format';
import {
  getLocalBookingByToken,
  getLocalBookingByPhone,
  getLocalBookings,
  getPublicPaymentGateways,
  getLocalSettings,
  saveLocalBooking,
  defaultSettings,
} from '../lib/mockData';
import type { Booking, Payment, PaymentGatewayProvider } from '../lib/types';
import { compressReceiptImage } from '../lib/imageCompressor';
import { playNotificationChime } from '../lib/soundEffects';
import { GuzelLogoIcon } from '../components/public/GuzelSvgIcons';
import { getVerifiedStaffSession } from '../lib/staffAuth';

interface CheckoutPageProps {
  embeddedInReception?: boolean;
  initialBookingId?: string | null;
  onSettled?: (booking: Booking) => void;
}

export default function CheckoutPage({
  embeddedInReception = false,
  initialBookingId = null,
  onSettled,
}: CheckoutPageProps) {
  const { token } = useParams<{ token?: string }>();
  const { lang, toggleLang, isRTL } = useLanguage();

  const staffSession = useMemo(() => getVerifiedStaffSession(), []);
  const isAuthorizedStaff =
    embeddedInReception &&
    !!staffSession &&
    (staffSession.role === 'admin' ||
      staffSession.role === 'manager' ||
      staffSession.role === 'receptionist');

  const settings = useMemo(() => getLocalSettings() || defaultSettings, []);

  // Search state if no token provided
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupCode, setLookupCode] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Active booking
  const [booking, setBooking] = useState<Booking | null>(null);
  const [, setLoading] = useState(true);

  // Payment form state (Connected to Public-Safe Payment Gateways without secret keys)
  const qrGateways = useMemo(
    () => getPublicPaymentGateways().filter((g) => g.enabled && g.supports_in_branch_qr),
    [],
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentGatewayProvider>('instapay');
  const [senderInfo, setSenderInfo] = useState('');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Normalize Egyptian Arabic digits
  const normalizeDigits = (str: string) =>
    str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

  // Sync initialBookingId when embedded in Receptionist POS
  useEffect(() => {
    if (embeddedInReception && initialBookingId) {
      const all = getLocalBookings();
      const matched = all.find((b) => b.id === initialBookingId);
      if (matched) setBooking(matched);
    }
  }, [embeddedInReception, initialBookingId]);

  // Load booking by token or listen to changes
  const reloadBooking = () => {
    if (token) {
      const found = getLocalBookingByToken(token);
      if (found) {
        setBooking(found);
      }
    } else if (booking) {
      const all = getLocalBookings();
      const updated = all.find((b) => b.id === booking.id);
      if (updated) setBooking(updated);
    }
    setLoading(false);
  };

  useEffect(() => {
    reloadBooking();
    const handleStorage = () => reloadBooking();
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(reloadBooking, 2500);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [token]);

  // Verified lookup: public visitors MUST provide BOTH Phone + Booking Reference Code
  const handlePhoneLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const cleanPhone = normalizeDigits(lookupPhone.trim().replace(/\D/g, ''));
    const cleanCode = normalizeDigits(lookupCode.trim());

    if (cleanPhone.length !== 11) {
      setLookupError(
        lang === 'ar'
          ? 'يرجى إدخال رقم الهاتف المسجل بالحجز بشكل صحيح (١١ رقم)'
          : 'Please enter a valid 11-digit registered phone number.',
      );
      return;
    }

    if (!isAuthorizedStaff && cleanCode.length < 3) {
      setLookupError(
        lang === 'ar'
          ? 'لحماية خصوصية بياناتك، يرجى إدخال كود الحجز المرجعي (مثال: BK-2026-1042 أو آخر ٤ أرقام)'
          : 'For your privacy, please enter your booking reference code (e.g. BK-2026-1042 or last 4 digits).',
      );
      return;
    }

    const found = getLocalBookingByPhone(
      cleanPhone,
      isAuthorizedStaff && !cleanCode ? undefined : cleanCode,
    );
    if (!found) {
      setLookupError(
        lang === 'ar'
          ? 'بيانات التحقق غير مطابقة لأي فاتورة مفتوحة حالياً. يرجى التأكد من رقم الهاتف وكود الحجز أو مسح رمز QR من مكتب الاستقبال.'
          : 'Verification failed: No active invoice matches this phone and booking code. Please check with reception.',
      );
      return;
    }
    setBooking(found);
  };

  // Totals calculations
  const totals = useMemo(() => {
    if (!booking) return { subtotal: 0, addonsTotal: 0, discount: 0, total: 0, deposit: 0, remaining: 0 };
    const subtotal = Number(booking.subtotal_amount || 0);
    const addonsTotal = (booking.addons || []).reduce(
      (sum, a) => sum + Number(a.price) * (a.quantity || 1),
      0,
    );
    const discount = Number(booking.discount_amount || 0);
    const total = Math.max(0, subtotal + addonsTotal - discount);
    const deposit = Number(booking.deposit_paid || 0);
    const remaining = Math.max(0, total - deposit);
    return { subtotal, addonsTotal, discount, total, deposit, remaining };
  }, [booking]);

  useEffect(() => {
    if (totals.remaining && !cashTendered) {
      setCashTendered(String(totals.remaining));
    }
  }, [totals.remaining, cashTendered]);

  // Handle proof screenshot upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const res = await compressReceiptImage(file, 95, 1024);
      setProofImage(res.dataUrl);
      setCompressing(false);
    } catch {
      setCompressing(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
    }
  };

  // Submit settlement payment (Customer submits as pending; Staff inside Reception POS can settle immediately)
  const handleSubmitPayment = (e: React.FormEvent, instantStaffVerify = false) => {
    e.preventDefault();
    if (!booking) return;

    setSubmitting(true);
    const cashNum = paymentMethod === 'cash' ? (Number(cashTendered) || totals.remaining) : undefined;
    const verifiedNow = isAuthorizedStaff && instantStaffVerify;

    const newPayment: Payment = {
      id: 'pay-set-' + Date.now(),
      booking_id: booking.id,
      payment_type: 'settlement',
      method: paymentMethod,
      amount: totals.remaining,
      cash_tendered: cashNum,
      reference_number:
        paymentMethod === 'cash'
          ? lang === 'ar'
            ? `المبلغ المسلم بالدرج: ${cashNum} ج.م`
            : `Cash handed: ${cashNum} EGP`
          : senderInfo.trim() || undefined,
      proof_image_url: proofImage || undefined,
      status: verifiedNow ? 'verified' : 'pending',
      verified_by_staff_name: verifiedNow ? staffSession?.name || 'موظفة الاستقبال' : undefined,
      verified_at: verifiedNow ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
    };

    const updatedBooking: Booking = {
      ...booking,
      status: verifiedNow ? 'completed' : 'checkout_pending',
      payments: [
        ...(booking.payments || []).filter(
          (p) => !(p.payment_type === 'settlement' && p.status === 'pending'),
        ),
        newPayment,
      ],
    };

    saveLocalBooking(updatedBooking);
    setBooking(updatedBooking);
    setSubmitting(false);
    playNotificationChime();
    onSettled?.(updatedBooking);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeReceptionTabs = useMemo(() => {
    if (!isAuthorizedStaff) return [];
    return getLocalBookings().filter(
      (b) =>
        b.status === 'checked_in' ||
        b.status === 'checkout_pending' ||
        b.status === 'confirmed',
    );
  }, [isAuthorizedStaff, booking]);

  const content = (
    <div className={embeddedInReception ? 'w-full' : 'max-w-2xl mx-auto px-4 py-8 sm:py-12'}>
      {/* Staff-Only Quick Active Customer Selector (ONLY rendered inside authenticated Reception POS) */}
      {isAuthorizedStaff && (
        <div
          className="mb-6 rounded-3xl p-5 border backdrop-blur-xl transition-all"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.86)',
            borderColor: 'rgba(58, 29, 67, 0.09)',
            boxShadow: '0 14px 36px -14px rgba(58, 29, 67, 0.09)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#cbb6ea]/45 text-[#3a1d43]">
                <ShieldCheck className="w-4 h-4 text-[#73358c]" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#3a1d43]">
                  {lang === 'ar'
                    ? 'اختيار سريع لفاتورة العميلة بالفرع (خاص بموظفة الاستقبال)'
                    : 'Receptionist Quick Customer Tab Selector'}
                </h3>
                <p className="text-[11px] text-[#3a1d43]/60">
                  {lang === 'ar'
                    ? 'اضغطي على اسم العميلة لفتح فاتورتها وتحصيل المتبقي أو إغلاق الحساب فوراً'
                    : 'Select an active customer tab to preview invoice and process settlement'}
                </p>
              </div>
            </div>
            {booking && (
              <button
                type="button"
                onClick={() => setBooking(null)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#3a1d43]/15 bg-[#f9f0f5] hover:bg-[#cbb6ea]/40 text-[#3a1d43] transition cursor-pointer"
              >
                {lang === 'ar' ? 'بحث برقم هاتف آخر' : 'Lookup Another Phone'}
              </button>
            )}
          </div>

          {activeReceptionTabs.length === 0 ? (
            <div className="text-xs text-[#3a1d43]/60 py-2">
              {lang === 'ar' ? 'لا توجد فواتير مفتوحة حالياً بالفرع.' : 'No active customer tabs right now.'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeReceptionTabs.map((b) => {
                const isSelected = booking?.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBooking(b)}
                    className="px-3.5 py-2.5 rounded-2xl border text-xs text-start transition-all duration-200 flex items-center gap-2.5 cursor-pointer active:scale-95"
                    style={{
                      backgroundColor: isSelected ? '#3a1d43' : 'rgba(249, 240, 245, 0.85)',
                      borderColor: isSelected ? '#3a1d43' : 'rgba(58, 29, 67, 0.12)',
                      color: isSelected ? '#ffffff' : '#3a1d43',
                      boxShadow: isSelected ? '0 8px 20px -6px rgba(58,29,67,0.35)' : 'none',
                    }}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-[#e58fb6]' : 'text-[#b14bd9]'}`} />
                    <div>
                      <div className="font-bold">{b.customer_name}</div>
                      <div className={`text-[10px] font-mono ${isSelected ? 'text-white/75' : 'text-[#3a1d43]/60'}`}>
                        #{b.booking_number} • {b.customer_phone}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* If no booking is selected yet, show Secure Verified Lookup Card */}
      {!booking ? (
        <div
          className="rounded-[2rem] border p-7 sm:p-10 text-center backdrop-blur-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            borderColor: 'rgba(58, 29, 67, 0.09)',
            boxShadow: '0 24px 60px -18px rgba(58, 29, 67, 0.12)',
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 border"
            style={{
              backgroundColor: 'rgba(203, 182, 234, 0.32)',
              borderColor: 'rgba(177, 75, 217, 0.2)',
              color: '#3a1d43',
            }}
          >
            <CreditCard className="w-6 h-6 text-[#73358c]" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#f3e6f0] text-[#73358c] border border-[#e8d7e4] mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {lang === 'ar' ? 'بوابة الفاتورة الرقمية المؤمّنة' : 'Secured Digital Invoice Portal'}
            </span>
          </span>

          <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#3a1d43] mb-2">
            {lang === 'ar' ? 'الفاتورة الرقمية الذكية بالفرع' : 'In-Branch Smart Checkout'}
          </h2>
          <p className="text-xs sm:text-sm text-[#3a1d43]/65 max-w-md mx-auto mb-7 leading-relaxed">
            {lang === 'ar'
              ? 'أدخلي رقم الهاتف المسجل بالحجز مع كود الحجز المرجعي للاطلاع على تفاصيل فاتورتك وسداد المبلغ المتبقي بأمان.'
              : 'Enter your registered phone number and booking reference code to view your itemized invoice and complete settlement securely.'}
          </p>

          <form onSubmit={handlePhoneLookup} className="space-y-4 max-w-sm mx-auto text-start">
            <div>
              <label className="block text-xs font-bold text-[#3a1d43]/80 mb-1.5">
                {lang === 'ar' ? 'رقم الموبايل المسجل بالحجز (١١ رقم):' : 'Registered Mobile Number (11 digits):'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#3a1d43]/45 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="01012345678"
                  dir="ltr"
                  required
                  className="w-full text-center tracking-widest font-mono text-sm px-10 py-3.5 rounded-2xl border border-[#e8d7e4] focus:border-[#b14bd9] focus:ring-2 focus:ring-[#cbb6ea]/45 focus:outline-none bg-[#f9f0f5]/70 text-[#3a1d43] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3a1d43]/80 mb-1.5">
                {lang === 'ar'
                  ? isAuthorizedStaff
                    ? 'كود الحجز المرجعي (اختياري لموظفة الاستقبال):'
                    : 'كود الحجز المرجعي (مثال: BK-2026-1042 أو 1042):'
                  : isAuthorizedStaff
                  ? 'Booking Code (Optional for staff):'
                  : 'Booking Reference Code (e.g. BK-2026-1042):'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#3a1d43]/45 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value)}
                  placeholder="BK-2026-XXXX"
                  dir="ltr"
                  required={!isAuthorizedStaff}
                  className="w-full text-center tracking-wider font-mono text-sm px-10 py-3.5 rounded-2xl border border-[#e8d7e4] focus:border-[#b14bd9] focus:ring-2 focus:ring-[#cbb6ea]/45 focus:outline-none bg-[#f9f0f5]/70 text-[#3a1d43] uppercase transition"
                />
              </div>
            </div>

            {lookupError && (
              <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs text-start flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-relaxed">{lookupError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-full font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-0 active:scale-[0.98]"
              style={{
                backgroundColor: '#3a1d43',
                color: '#ffffff',
                boxShadow: '0 12px 28px -8px rgba(58, 29, 67, 0.35)',
              }}
            >
              <Search className="w-4 h-4 text-[#cbb6ea]" />
              <span>{lang === 'ar' ? 'عرض الفاتورة الآن' : 'Verify & View Invoice'}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Invoice Header & Itemized Breakdown Card */}
          <div
            className="rounded-[2rem] border p-6 sm:p-8 text-start backdrop-blur-xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: 'rgba(58, 29, 67, 0.09)',
              boxShadow: '0 20px 50px -16px rgba(58, 29, 67, 0.1)',
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-[#e8d7e4]">
              <div>
                <span className="text-[11px] font-bold text-[#b14bd9] uppercase tracking-wider">
                  {lang === 'ar' ? 'فاتورة خدمات وعناية جوزال ميديكال سبا' : 'Guzel Medical Spa Service Invoice'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#3a1d43] font-display mt-1">
                  {lang === 'ar' ? `أهلاً بكِ يا ${booking.customer_name} ✨` : `Welcome, ${booking.customer_name} ✨`}
                </h2>
                <p className="text-xs text-[#3a1d43]/60 font-mono mt-1">
                  {lang === 'ar' ? 'رقم الحجز:' : 'Booking ID:'} #{booking.booking_number} • {booking.customer_phone}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {booking.status === 'completed' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'تم السداد وإغلاق الفاتورة' : 'Paid & Closed'}
                  </span>
                ) : booking.status === 'checkout_pending' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#f3e6f0] text-[#73358c] border border-[#cbb6ea]">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    {lang === 'ar' ? 'بانتظار تأكيد الكاشير' : 'Awaiting Cashier'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#cbb6ea]/35 text-[#3a1d43] border border-[#cbb6ea]">
                    <Sparkles className="w-3.5 h-3.5 text-[#b14bd9]" />
                    {lang === 'ar' ? 'فاتورة مفتوحة بالفرع' : 'Active Tab'}
                  </span>
                )}

                {!token && (
                  <button
                    type="button"
                    onClick={() => setBooking(null)}
                    className="text-[11px] font-semibold text-[#73358c] hover:underline cursor-pointer bg-transparent border-0"
                  >
                    {lang === 'ar' ? 'إغلاق المعاينة' : 'Close invoice view'}
                  </button>
                )}
              </div>
            </div>

            {/* Itemized Services & Products */}
            <div className="mt-5 space-y-2.5">
              <p className="text-xs font-bold text-[#3a1d43]/75">
                {lang === 'ar' ? 'تفاصيل الجلسات والمنتجات:' : 'Itemized Services & Add-ons:'}
              </p>

              {/* Initial Services */}
              {(booking.items || []).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f9f0f5]/80 border border-[#e8d7e4] text-xs"
                >
                  <div>
                    <div className="font-bold text-[#3a1d43]">
                      {lang === 'ar'
                        ? item.service?.name_ar || 'جلسة جوزال ميديكال سبا'
                        : item.service?.name_en || 'Guzel Medical Spa Service'}
                    </div>
                    <div className="text-[11px] text-[#3a1d43]/60 mt-0.5">
                      {item.specialist?.name_ar || (lang === 'ar' ? 'جوزال ميديكال سبا' : 'Guzel Medical Spa')}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-[#3a1d43] text-sm">
                    {formatPrice(item.price, lang)}
                  </div>
                </div>
              ))}

              {/* Add-ons */}
              {(booking.addons || []).map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f3e6f0]/65 border border-[#cbb6ea]/60 text-xs"
                >
                  <div>
                    <div className="font-bold text-[#3a1d43] flex items-center gap-2">
                      <span>{lang === 'ar' ? addon.name_ar : addon.name_en || addon.name_ar}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cbb6ea]/50 text-[#3a1d43] font-semibold">
                        {addon.type === 'service'
                          ? lang === 'ar'
                            ? 'إضافة بالفرع'
                            : 'Add-on'
                          : lang === 'ar'
                          ? 'منتج عناية'
                          : 'Retail Product'}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#3a1d43]/60 mt-0.5 font-mono">
                      {addon.quantity > 1
                        ? lang === 'ar'
                          ? `الكمية: ${addon.quantity}`
                          : `Qty: ${addon.quantity}`
                        : lang === 'ar'
                        ? 'مضاف بالفرع'
                        : 'In-branch addition'}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-[#3a1d43] text-sm">
                    {formatPrice(addon.price * (addon.quantity || 1), lang)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculation Summary */}
            <div className="mt-6 pt-5 border-t border-[#e8d7e4] space-y-2.5 text-xs text-[#3a1d43]/75">
              <div className="flex justify-between">
                <span>{lang === 'ar' ? 'إجمالي الخدمات والمنتجات:' : 'Subtotal:'}</span>
                <span className="font-mono font-bold text-[#3a1d43]">
                  {formatPrice(totals.total + totals.discount, lang)}
                </span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>{lang === 'ar' ? 'خصم البروموكود:' : 'Promo Discount:'}</span>
                  <span className="font-mono font-bold">-{formatPrice(totals.discount, lang)}</span>
                </div>
              )}

              <div className="flex justify-between text-emerald-700">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'العربون المسدد مسبقاً (٥٠٪):' : 'Deposit Paid (50%):'}</span>
                </span>
                <span className="font-mono font-bold">-{formatPrice(totals.deposit, lang)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-3.5 border-t border-[#e8d7e4] text-sm font-bold text-[#3a1d43]">
                <span>{lang === 'ar' ? 'المبلغ المتبقي للسداد:' : 'Remaining Balance Due:'}</span>
                <span className="text-2xl font-mono font-extrabold text-[#73358c]">
                  {formatPrice(totals.remaining, lang)}
                </span>
              </div>
            </div>
          </div>

          {/* If completed, show celebration confirmation */}
          {booking.status === 'completed' ? (
            <div
              className="rounded-[2rem] border border-emerald-200 p-7 sm:p-9 text-center backdrop-blur-xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                boxShadow: '0 20px 50px -16px rgba(16, 185, 129, 0.14)',
              }}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold font-display text-[#3a1d43] mb-1.5">
                {lang === 'ar' ? 'تم سداد الفاتورة وإغلاق الحساب بنجاح ✨' : 'Invoice Paid & Settled Successfully!'}
              </h3>
              <p className="text-xs sm:text-sm text-[#3a1d43]/65 max-w-md mx-auto mb-6 leading-relaxed">
                {lang === 'ar'
                  ? 'شكراً لزيارتكِ جوزال ميديكال سبا. سعدنا بخدمتكِ ونتمنى لكِ يوماً مشرقاً وجميلاً!'
                  : 'Thank you for visiting Guzel Medical Spa. We look forward to welcoming you again!'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e8d7e4] bg-[#f9f0f5] hover:bg-[#f3e6f0] text-xs font-bold text-[#3a1d43] transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'طباعة / حفظ الفاتورة' : 'Print Invoice'}</span>
                </button>

                <a
                  href={`https://wa.me/2${(settings.business_phone || '01012345678').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `شكراً لكم على الخدمة الرائعة في جوزال ميديكال سبا - حجز رقم ${booking.booking_number} 💕`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition no-underline"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تقييم الجلسة عبر واتساب' : 'Review on WhatsApp'}</span>
                </a>
              </div>
            </div>
          ) : booking.status === 'checkout_pending' && !isAuthorizedStaff ? (
            /* Awaiting cashier approval (Customer view) */
            <div
              className="rounded-[2rem] border border-[#cbb6ea] p-7 sm:p-9 text-center backdrop-blur-xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                boxShadow: '0 20px 50px -16px rgba(58, 29, 67, 0.12)',
              }}
            >
              <div className="w-14 h-14 rounded-full bg-[#f3e6f0] flex items-center justify-center text-[#73358c] mx-auto mb-3.5">
                <Clock className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-[#3a1d43] mb-1.5">
                {lang === 'ar' ? 'تم استلام إشعار السداد بنجاح' : 'Payment Notification Received'}
              </h3>
              <p className="text-xs sm:text-sm text-[#3a1d43]/65 max-w-sm mx-auto mb-5 leading-relaxed">
                {lang === 'ar'
                  ? 'جاري مراجعة واعتماد السداد من قِبل موظفة الاستقبال بالفرع، سيتم تحديث الشاشة فوراً عند إغلاق الفاتورة...'
                  : 'Our receptionist is verifying your payment. This screen will update automatically.'}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f3e6f0] text-[#73358c] text-xs font-bold border border-[#cbb6ea]">
                <span className="w-2 h-2 rounded-full bg-[#b14bd9] animate-ping" />
                <span>{lang === 'ar' ? 'جاري المزامنة اللحظية مع الكاشير...' : 'Syncing with reception POS...'}</span>
              </div>
            </div>
          ) : (
            /* Payment Settlement Form */
            <form
              onSubmit={(e) => handleSubmitPayment(e, false)}
              className="rounded-[2rem] border p-6 sm:p-8 text-start space-y-5 backdrop-blur-xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                borderColor: 'rgba(58, 29, 67, 0.09)',
                boxShadow: '0 20px 50px -16px rgba(58, 29, 67, 0.1)',
              }}
            >
              <h3 className="font-bold text-sm text-[#3a1d43]">
                {lang === 'ar' ? 'اختاري وسيلة سداد المبلغ المتبقي:' : 'Select Settlement Payment Method:'}
              </h3>

              {/* Method Selector Tabs (Synced with Public-Safe Payment Gateways) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {qrGateways.map((gw) => {
                  const active = paymentMethod === gw.id;
                  return (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(gw.id);
                        if (gw.id === 'paymob' || gw.id === 'fawry' || gw.id === 'kashier') {
                          setSenderInfo(`${gw.id.toUpperCase()}-${Date.now().toString().slice(-6)}`);
                        }
                      }}
                      className="p-3.5 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      style={{
                        backgroundColor: active ? 'rgba(203, 182, 234, 0.35)' : '#ffffff',
                        borderColor: active ? '#b14bd9' : 'rgba(58, 29, 67, 0.12)',
                        color: '#3a1d43',
                        boxShadow: active ? '0 0 0 2px rgba(177, 75, 217, 0.15)' : 'none',
                      }}
                    >
                      <CreditCard className={`w-4 h-4 ${active ? 'text-[#b14bd9]' : 'text-[#3a1d43]/55'}`} />
                      <span className="text-xs font-bold">
                        {lang === 'ar' ? gw.name_ar.split('(')[0].trim() : gw.name_en.split('(')[0].trim()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {(paymentMethod === 'paymob' || paymentMethod === 'fawry' || paymentMethod === 'kashier') && (
                <div className="p-4 rounded-2xl bg-[#f9f0f5] border border-[#e8d7e4] space-y-2 text-xs">
                  <div className="font-bold text-[#3a1d43]">
                    {lang === 'ar'
                      ? `الدفع الإلكتروني الفوري عبر (${paymentMethod.toUpperCase()})`
                      : `Instant Electronic Settlement (${paymentMethod.toUpperCase()})`}
                  </div>
                  <div className="text-[#3a1d43]/75">
                    {lang === 'ar'
                      ? 'رقم المعاملة الإلكترونية المولد تلقائياً:'
                      : 'Generated Electronic Transaction Reference:'}{' '}
                    <strong className="font-mono text-[#3a1d43]">{senderInfo}</strong>
                  </div>
                </div>
              )}

              {/* Method Details */}
              {paymentMethod === 'instapay' && (
                <div className="p-4 rounded-2xl bg-[#f9f0f5] border border-[#e8d7e4] space-y-3.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[#3a1d43]/60 text-[11px]">
                        {lang === 'ar' ? 'عنوان انستا باي الرسمي (IPA):' : 'Official InstaPay Address (IPA):'}
                      </span>
                      <div className="font-mono font-bold text-[#3a1d43] text-sm mt-0.5">
                        {settings.instapay_ipa || defaultSettings.instapay_ipa}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(settings.instapay_ipa || defaultSettings.instapay_ipa || '', 'ipa')
                      }
                      className="px-3 py-1.5 rounded-full border border-[#e8d7e4] bg-white text-[#3a1d43] text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#f3e6f0] transition cursor-pointer"
                    >
                      {copiedKey === 'ipa' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'ipa' ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : lang === 'ar' ? 'نسخ العنوان' : 'Copy IPA'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[#3a1d43]/75 font-semibold mb-1.5 text-[11px]">
                      {lang === 'ar' ? 'رقم العملية المرجعي أو اسم الحساب المحول منه:' : 'Reference Number / Sender Handle:'}
                    </label>
                    <input
                      type="text"
                      value={senderInfo}
                      onChange={(e) => setSenderInfo(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: IP-982410 أو اسم الحساب' : 'e.g. IP-982410'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d7e4] focus:border-[#b14bd9] focus:outline-none bg-white text-xs text-[#3a1d43]"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'vodafone_cash' && (
                <div className="p-4 rounded-2xl bg-[#f9f0f5] border border-[#e8d7e4] space-y-3.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[#3a1d43]/60 text-[11px]">
                        {lang === 'ar' ? 'رقم محفظة فودافون كاش:' : 'Vodafone Cash Wallet:'}
                      </span>
                      <div className="font-mono font-bold text-[#3a1d43] text-sm tracking-wider mt-0.5">
                        {settings.vodafone_cash_number || defaultSettings.vodafone_cash_number}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          settings.vodafone_cash_number || defaultSettings.vodafone_cash_number || '',
                          'vf',
                        )
                      }
                      className="px-3 py-1.5 rounded-full border border-[#e8d7e4] bg-white text-[#3a1d43] text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#f3e6f0] transition cursor-pointer"
                    >
                      {copiedKey === 'vf' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'vf' ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : lang === 'ar' ? 'نسخ الرقم' : 'Copy Number'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[#3a1d43]/75 font-semibold mb-1.5 text-[11px]">
                      {lang === 'ar' ? 'رقم الهاتف المحول منه (المحفظة):' : 'Sender Wallet Phone:'}
                    </label>
                    <input
                      type="tel"
                      value={senderInfo}
                      onChange={(e) => setSenderInfo(e.target.value)}
                      placeholder="010XXXXXXXX"
                      dir="ltr"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d7e4] focus:border-[#b14bd9] focus:outline-none bg-white text-xs font-mono text-[#3a1d43]"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="p-4 rounded-2xl bg-emerald-50/75 border border-emerald-200 text-xs space-y-3 text-emerald-950">
                  <div>
                    <p className="font-bold text-sm text-emerald-900">
                      {lang === 'ar' ? 'الدفع نقداً في مكتب الاستقبال' : 'Cash payment at reception desk'}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {lang === 'ar' ? 'المبلغ المطلوب سداده للفاتورة:' : 'Required total due:'}{' '}
                      <strong className="font-mono text-[#3a1d43] font-bold">
                        {formatPrice(totals.remaining, lang)}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-emerald-950 font-semibold mb-1.5 text-xs">
                      {lang === 'ar'
                        ? 'المبلغ المسلم نقداً لموظفة الاستقبال (ج.م):'
                        : 'Exact cash amount handed to receptionist (EGP):'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        placeholder={String(totals.remaining)}
                        className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 focus:border-emerald-600 focus:outline-none bg-white text-[#3a1d43] font-mono font-bold text-base"
                      />
                      <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700">
                        {lang === 'ar' ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                    {Number(cashTendered) > totals.remaining && (
                      <p className="mt-1.5 text-[11px] text-emerald-700 font-semibold">
                        {lang === 'ar' ? 'الباقي المستحق للعميلة:' : 'Change due to customer:'}{' '}
                        <strong className="font-mono">
                          {formatPrice(Number(cashTendered) - totals.remaining, lang)}
                        </strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Screenshot if InstaPay or Vodafone Cash */}
              {(paymentMethod === 'instapay' || paymentMethod === 'vodafone_cash') && (
                <div>
                  <label className="block text-xs font-bold text-[#3a1d43] mb-1.5">
                    {lang === 'ar'
                      ? 'صورة إشعار أو سكرين شوت التحويل (اختياري):'
                      : 'Upload Receipt Screenshot (Optional):'}
                  </label>
                  <div className="relative border-2 border-dashed border-[#cbb6ea] rounded-2xl p-3.5 text-center bg-[#f9f0f5]/60 hover:bg-[#f3e6f0]/60 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-[#3a1d43]/75 font-medium">
                      <Upload className="w-4 h-4 text-[#b14bd9]" />
                      <span>
                        {compressing
                          ? lang === 'ar'
                            ? 'جاري ضغط الصورة (<100KB)...'
                            : 'Compressing image...'
                          : proofImage
                          ? lang === 'ar'
                            ? 'تم إرفاق صورة الإيصال بنجاح ✓'
                            : 'Screenshot attached ✓'
                          : lang === 'ar'
                          ? 'اضغطي لاختيار صورة الإيصال'
                          : 'Click to attach receipt screenshot'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting || compressing}
                  className="flex-1 py-3.5 px-5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-0 active:scale-[0.98]"
                  style={{
                    backgroundColor: isAuthorizedStaff ? '#f3e6f0' : '#3a1d43',
                    color: isAuthorizedStaff ? '#3a1d43' : '#ffffff',
                    boxShadow: isAuthorizedStaff
                      ? 'none'
                      : '0 12px 28px -8px rgba(58, 29, 67, 0.35)',
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#b14bd9]" />
                  <span>
                    {submitting
                      ? lang === 'ar'
                        ? 'جاري الإرسال...'
                        : 'Submitting...'
                      : lang === 'ar'
                      ? `إرسال إشعار السداد • ${formatPrice(totals.remaining, 'ar')}`
                      : `Submit Payment Notice • ${formatPrice(totals.remaining, 'en')}`}
                  </span>
                </button>

                {/* Instant Cashier Verification Button when inside Receptionist POS */}
                {isAuthorizedStaff && (
                  <button
                    type="button"
                    disabled={submitting || compressing}
                    onClick={(e) => handleSubmitPayment(e as unknown as React.FormEvent, true)}
                    className="flex-1 py-3.5 px-5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-0 active:scale-[0.98]"
                    style={{
                      backgroundColor: '#3a1d43',
                      color: '#ffffff',
                      boxShadow: '0 12px 28px -8px rgba(58, 29, 67, 0.35)',
                    }}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {lang === 'ar'
                        ? `اعتماد الكاشير وإغلاق الفاتورة فوراً • ${formatPrice(totals.remaining, 'ar')}`
                        : `Instant Cashier Settle & Close • ${formatPrice(totals.remaining, 'en')}`}
                    </span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );

  if (embeddedInReception) {
    return content;
  }

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        backgroundColor: 'var(--mainbg, #f9f0f5)',
        color: 'var(--fonts-100, #3a1d43)',
      }}
    >
      {/* Top Floating Editorial Header */}
      <header
        className="sticky top-0 z-30 border-b px-4 sm:px-8 py-3.5 backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(249, 240, 245, 0.85)',
          borderColor: 'rgba(58, 29, 67, 0.08)',
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 no-underline"
            style={{ color: 'var(--fonts-100, #3a1d43)' }}
          >
            <span className="w-9 h-9 rounded-full bg-[#cbb6ea] flex items-center justify-center text-[#3a1d43] shadow-xs">
              <GuzelLogoIcon className="w-5 h-5" />
            </span>
            <span className="font-display font-bold text-base">
              {lang === 'ar' ? 'جوزال ميديكال سبا' : 'Guzel Medical Spa'}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-full border border-[#3a1d43]/15 bg-white/80 hover:bg-white text-xs font-bold text-[#3a1d43] transition cursor-pointer"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#3a1d43]/15 bg-white/80 hover:bg-white text-xs font-semibold text-[#3a1d43] transition no-underline"
              title={lang === 'ar' ? 'الرئيسية' : 'Home'}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
              {isRTL ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
            </Link>
          </div>
        </div>
      </header>

      <main>{content}</main>
    </div>
  );
}
