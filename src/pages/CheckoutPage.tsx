import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Copy,
  Check,
  Upload,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Home,
  MessageCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../lib/format';
import {
  getLocalBookingByToken,
  getLocalBookingByPhone,
  getLocalBookings,
  saveLocalBooking,
  defaultSettings,
} from '../lib/mockData';
import type { Booking, Payment } from '../lib/types';
import { compressReceiptImage } from '../lib/imageCompressor';
import { playNotificationChime } from '../lib/soundEffects';

export default function CheckoutPage() {
  const { token } = useParams<{ token?: string }>();
  const { lang, toggleLang, isRTL } = useLanguage();

  // Search state if no token provided
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Active booking
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'vodafone_cash' | 'cash'>('instapay');
  const [senderInfo, setSenderInfo] = useState('');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Normalize Egyptian Arabic digits
  const normalizeDigits = (str: string) =>
    str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

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
    // Interval polling for realtime-like simulation
    const interval = setInterval(reloadBooking, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [token]);

  // Lookup by phone
  const handlePhoneLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const clean = normalizeDigits(lookupPhone.trim().replace(/\D/g, ''));
    if (clean.length < 10) {
      setLookupError(lang === 'ar' ? 'يرجى إدخال رقم هاتف صحيح (١١ رقم)' : 'Please enter a valid 11-digit phone number');
      return;
    }
    const found = getLocalBookingByPhone(clean);
    if (!found) {
      setLookupError(
        lang === 'ar'
          ? 'لم يتم العثور على فاتورة مفتوحة بهذا الرقم اليوم. يرجى مراجعة الاستقبال'
          : 'No active tab found for this phone number. Please check with reception.',
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

  // Submit settlement payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setSubmitting(true);
    const cashNum = paymentMethod === 'cash' ? (Number(cashTendered) || totals.remaining) : undefined;
    const newPayment: Payment = {
      id: 'pay-set-' + Date.now(),
      booking_id: booking.id,
      payment_type: 'settlement',
      method: paymentMethod,
      amount: totals.remaining,
      cash_tendered: cashNum,
      reference_number:
        paymentMethod === 'cash'
          ? (lang === 'ar' ? `المبلغ المسلم بالدرج: ${cashNum} ج.م` : `Cash handed: ${cashNum} EGP`)
          : (senderInfo.trim() || undefined),
      proof_image_url: proofImage || undefined,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const updatedBooking = { ...booking };
    updatedBooking.status = 'checkout_pending';
    updatedBooking.payments = (updatedBooking.payments || []).filter(
      (p) => !(p.payment_type === 'settlement' && p.status === 'pending'),
    );
    updatedBooking.payments.push(newPayment);

    saveLocalBooking(updatedBooking);
    setBooking(updatedBooking);
    setSubmitting(false);
    playNotificationChime();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-espresso font-sans">
      {/* Top Navbar */}
      <header className="border-b border-pearl/80 bg-ivory/95 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-rosegold-200 to-rosegold-400 flex items-center justify-center text-ivory">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-display font-bold text-base text-espresso">
              {lang === 'ar' ? 'ميزون لوميير بيوتي سنتر' : 'Maison Lumière'}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="px-2.5 py-1 rounded-xl border border-mocha-400/20 bg-pearl/40 hover:bg-pearl/80 text-xs font-semibold text-espresso transition"
            >
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <Link
              to="/"
              className="p-1.5 rounded-xl border border-pearl hover:bg-pearl text-mocha-500 transition"
              title={lang === 'ar' ? 'الرئيسية' : 'Home'}
            >
              <Home className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* If no booking is selected yet, show Lookup Form */}
        {!booking ? (
          <div className="bg-white rounded-2xl border border-pearl/80 p-6 sm:p-8 shadow-soft text-center">
            <div className="w-12 h-12 rounded-2xl bg-rosegold-100 flex items-center justify-center text-rosegold-600 mx-auto mb-4">
              <CreditCard className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold font-display text-espresso mb-1">
              {lang === 'ar' ? 'الفاتورة الرقمية الذكية بالفرع' : 'In-Branch Smart Checkout'}
            </h2>
            <p className="text-xs text-mocha-500 mb-6">
              {lang === 'ar'
                ? 'أدخلي رقم الهاتف المسجل بالحجز للاطلاع على حسابك وسداد المتبقي'
                : 'Enter your booking phone number to view invoice and complete payment'}
            </p>

            <form onSubmit={handlePhoneLookup} className="space-y-4 max-w-sm mx-auto">
              <div>
                <input
                  type="tel"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="01012345678"
                  dir="ltr"
                  className="w-full text-center tracking-widest font-mono text-base px-4 py-3 rounded-xl border border-pearl focus:border-rosegold-400 focus:outline-none bg-ivory/50"
                />
              </div>

              {lookupError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-start flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{lookupError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory font-semibold text-sm transition shadow-soft flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>{lang === 'ar' ? 'عرض الفاتورة الآن' : 'View Invoice'}</span>
              </button>
            </form>

            {/* Quick 1-tap tab switcher on same device */}
            <div className="mt-8 pt-6 border-t border-pearl/80 text-start">
              <p className="text-xs font-bold text-mocha-600 mb-2.5 flex items-center justify-between">
                <span>
                  {lang === 'ar'
                    ? 'فواتير العميلات المفتوحة حالياً (فتح مباشر على هذا الجهاز):'
                    : 'Active Tabs Today (Direct Open on This Device):'}
                </span>
                <span className="text-[10px] text-rosegold-700 font-semibold px-2 py-0.5 rounded-full bg-rosegold-50 border border-rosegold-200">
                  {lang === 'ar' ? 'بدون كاميرا' : 'No Camera'}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {getLocalBookings()
                  .filter((b) => b.status === 'checked_in' || b.status === 'checkout_pending')
                  .map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBooking(b)}
                      className="px-3 py-2 rounded-xl border border-rosegold-300 bg-rosegold-50/50 hover:bg-rosegold-100 text-xs text-start transition flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rosegold-600" />
                      <div>
                        <div className="font-semibold text-espresso">{b.customer_name}</div>
                        <div className="text-[10px] text-mocha-400 font-mono">
                          #{b.booking_number} • {b.customer_phone}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Invoice Header Card */}
            <div className="bg-white rounded-2xl border border-pearl/80 p-6 shadow-soft text-start">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-pearl/70">
                <div>
                  <span className="text-[11px] font-semibold text-rosegold-600 uppercase tracking-wider">
                    {lang === 'ar' ? 'فاتورة خدمات وضيافة' : 'Service & Hospitality Invoice'}
                  </span>
                  <h2 className="text-lg font-bold text-espresso font-display mt-0.5">
                    {lang === 'ar' ? `أهلاً بك يا ${booking.customer_name} ✨` : `Welcome, ${booking.customer_name} ✨`}
                  </h2>
                  <p className="text-xs text-mocha-400 font-mono mt-1">
                    {lang === 'ar' ? 'رقم الحجز:' : 'Booking ID:'} #{booking.booking_number}
                  </p>
                </div>

                <div className="text-end">
                  {booking.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'تم السداد وإغلاق الفاتورة' : 'Paid & Closed'}
                    </span>
                  ) : booking.status === 'checkout_pending' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      {lang === 'ar' ? 'بانتظار تأكيد الكاشير' : 'Awaiting Cashier'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rosegold-50 text-rosegold-700 border border-rosegold-200">
                      <Sparkles className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'فاتورة مفتوحة بالفرع' : 'Active Tab'}
                    </span>
                  )}
                </div>
              </div>

              {/* Itemized Services & Products */}
              <div className="mt-5 space-y-2.5">
                <p className="text-xs font-bold text-mocha-600">
                  {lang === 'ar' ? 'تفاصيل الجلسات والمنتجات:' : 'Itemized Services & Add-ons:'}
                </p>

                {/* Initial Services */}
                {(booking.items || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-ivory/60 border border-pearl/60 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-espresso">
                        {lang === 'ar'
                          ? item.service?.name_ar || 'جلسة صالون'
                          : item.service?.name_en || 'Salon Service'}
                      </div>
                      <div className="text-[11px] text-mocha-400">
                        {item.specialist?.name_ar || 'صالون ميزون لوميير'}
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-espresso">
                      {formatPrice(item.price, lang)}
                    </div>
                  </div>
                ))}

                {/* Add-ons */}
                {(booking.addons || []).map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-rosegold-50/30 border border-rosegold-200/80 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-espresso flex items-center gap-1.5">
                        <span>{lang === 'ar' ? addon.name_ar : addon.name_en || addon.name_ar}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rosegold-100 text-rosegold-800 font-normal">
                          {addon.type === 'service'
                            ? lang === 'ar'
                              ? 'إضافة بالفرع'
                              : 'Add-on'
                            : lang === 'ar'
                            ? 'منتج عناية'
                            : 'Retail Product'}
                        </span>
                      </div>
                      <div className="text-[10px] text-mocha-400">
                        {addon.quantity > 1 ? `الكمية: ${addon.quantity}` : 'مضاف بالفرع'}
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-espresso">
                      {formatPrice(addon.price * (addon.quantity || 1), lang)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation Summary */}
              <div className="mt-5 pt-4 border-t border-pearl/80 space-y-2 text-xs text-mocha-600">
                <div className="flex justify-between">
                  <span>{lang === 'ar' ? 'إجمالي الخدمات والمنتجات:' : 'Subtotal:'}</span>
                  <span className="font-mono font-semibold text-espresso">
                    {formatPrice(totals.total + totals.discount, lang)}
                  </span>
                </div>

                {totals.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>{lang === 'ar' ? 'خصم البروموكود:' : 'Discount:'}</span>
                    <span className="font-mono font-semibold">-{formatPrice(totals.discount, lang)}</span>
                  </div>
                )}

                <div className="flex justify-between text-emerald-700">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'العربون المسدد مسبقاً (٥٠٪):' : 'Deposit Paid (50%):'}</span>
                  </span>
                  <span className="font-mono font-semibold">-{formatPrice(totals.deposit, lang)}</span>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t border-pearl text-sm font-bold text-espresso">
                  <span>{lang === 'ar' ? 'المبلغ المتبقي للسداد:' : 'Remaining Balance:'}</span>
                  <span className="text-xl font-mono text-rosegold-700">
                    {formatPrice(totals.remaining, lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* If completed, show celebration confirmation */}
            {booking.status === 'completed' ? (
              <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-soft text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <h3 className="text-lg font-bold font-display text-espresso mb-1">
                  {lang === 'ar' ? 'تم سداد الفاتورة وإغلاق الحساب بنجاح ✨' : 'Invoice Paid & Settled Successfully!'}
                </h3>
                <p className="text-xs text-mocha-500 max-w-md mx-auto mb-6">
                  {lang === 'ar'
                    ? 'شكراً لزيارتك لميزون لوميير بيوتي سنتر وسبا. سعدنا بخدمتك ونتمنى لكِ يوماً مشرقاً وجميلاً!'
                    : 'Thank you for visiting Maison Lumière Beauty Center & Spa. We look forward to welcoming you again!'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-mocha-400/20 bg-pearl/40 hover:bg-pearl/80 text-xs font-semibold text-espresso transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'طباعة / حفظ الفاتورة' : 'Print Invoice'}</span>
                  </button>

                  <a
                    href={`https://wa.me/201012345678?text=${encodeURIComponent(
                      `شكراً لكم على الخدمة الرائعة في حجز رقم ${booking.booking_number} 💕`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-ivory text-xs font-semibold transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تقييم الجلسة عبر واتساب' : 'Review on WhatsApp'}</span>
                  </a>
                </div>
              </div>
            ) : booking.status === 'checkout_pending' ? (
              /* Awaiting cashier approval */
              <div className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 shadow-soft text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-3">
                  <Clock className="w-6 h-6 animate-spin" />
                </div>
                <h3 className="text-base font-bold text-espresso mb-1">
                  {lang === 'ar' ? 'تم استلام إشعار السداد' : 'Payment Notification Sent'}
                </h3>
                <p className="text-xs text-mocha-500 max-w-sm mx-auto mb-4">
                  {lang === 'ar'
                    ? 'جاري مراجعة واعتماد السداد من قِبل موظفة الاستقبال بالفرع، سيتم تحديث الشاشة فوراً عند الإغلاق...'
                    : 'The receptionist is reviewing your payment. This screen will update automatically.'}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>{lang === 'ar' ? 'جاري المزامنة مع الكاشير...' : 'Syncing with cashier...'}</span>
                </div>
              </div>
            ) : (
              /* Payment Settlement Form */
              <form
                onSubmit={handleSubmitPayment}
                className="bg-white rounded-2xl border border-pearl/80 p-6 shadow-soft text-start space-y-5"
              >
                <h3 className="font-bold text-sm text-espresso">
                  {lang === 'ar' ? 'اختاري وسيلة سداد المبلغ المتبقي:' : 'Select Settlement Payment Method:'}
                </h3>

                {/* Method Selector Tabs */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('instapay')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'instapay'
                        ? 'border-rosegold-400 bg-rosegold-50/50 text-espresso ring-1 ring-rosegold-300 font-semibold'
                        : 'border-pearl bg-white hover:bg-pearl/30 text-mocha-500'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-rosegold-500" />
                    <span className="text-xs font-medium">InstaPay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('vodafone_cash')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'vodafone_cash'
                        ? 'border-rosegold-400 bg-rosegold-50/50 text-espresso ring-1 ring-rosegold-300 font-semibold'
                        : 'border-pearl bg-white hover:bg-pearl/30 text-mocha-500'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-medium">فودافون كاش</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      paymentMethod === 'cash'
                        ? 'border-rosegold-400 bg-rosegold-50/50 text-espresso ring-1 ring-rosegold-300 font-semibold'
                        : 'border-pearl bg-white hover:bg-pearl/30 text-mocha-500'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium">كاش لموظفة الفرع</span>
                  </button>
                </div>

                {/* Method Details */}
                {paymentMethod === 'instapay' && (
                  <div className="p-4 rounded-xl bg-ivory border border-pearl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-mocha-400 text-[11px]">عنوان انستا باي (IPA):</span>
                        <div className="font-mono font-bold text-espresso text-sm">
                          {defaultSettings.instapay_ipa}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(defaultSettings.instapay_ipa || '', 'ipa')}
                        className="px-2.5 py-1 rounded-lg border border-pearl bg-white text-espresso text-[11px] font-medium flex items-center gap-1 hover:bg-pearl/50"
                      >
                        {copiedKey === 'ipa' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'ipa' ? 'تم النسخ' : 'نسخ العنوان'}</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-mocha-600 mb-1 text-[11px]">
                        {lang === 'ar' ? 'رقم العملية المرجعي أو اسم الحساب المحول منه:' : 'Reference Number / Sender:'}
                      </label>
                      <input
                        type="text"
                        value={senderInfo}
                        onChange={(e) => setSenderInfo(e.target.value)}
                        placeholder="مثال: IP-982410 أو سارة محمود"
                        className="w-full px-3 py-2 rounded-xl border border-pearl focus:border-rosegold-400 focus:outline-none bg-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'vodafone_cash' && (
                  <div className="p-4 rounded-xl bg-ivory border border-pearl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-mocha-400 text-[11px]">رقم محفظة فودافون كاش:</span>
                        <div className="font-mono font-bold text-espresso text-sm tracking-wider">
                          {defaultSettings.vodafone_cash_number}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(defaultSettings.vodafone_cash_number || '', 'vf')}
                        className="px-2.5 py-1 rounded-lg border border-pearl bg-white text-espresso text-[11px] font-medium flex items-center gap-1 hover:bg-pearl/50"
                      >
                        {copiedKey === 'vf' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'vf' ? 'تم النسخ' : 'نسخ الرقم'}</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-mocha-600 mb-1 text-[11px]">
                        {lang === 'ar' ? 'رقم الهاتف المحول منه (المحفظة):' : 'Sender Wallet Phone:'}
                      </label>
                      <input
                        type="tel"
                        value={senderInfo}
                        onChange={(e) => setSenderInfo(e.target.value)}
                        placeholder="010XXXXXXXX"
                        dir="ltr"
                        className="w-full px-3 py-2 rounded-xl border border-pearl focus:border-rosegold-400 focus:outline-none bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-3 text-emerald-950">
                    <div>
                      <p className="font-semibold text-sm text-emerald-900">
                        {lang === 'ar'
                          ? 'الدفع نقداً في مكتب الاستقبال'
                          : 'Cash payment at reception desk'}
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        {lang === 'ar'
                          ? 'المبلغ المطلوب سداده للفاتورة:'
                          : 'Required total due:'}{' '}
                        <strong className="font-mono text-espresso font-bold">
                          {formatPrice(totals.remaining, lang)}
                        </strong>
                      </p>
                    </div>

                    <div>
                      <label className="block text-emerald-950 font-semibold mb-1.5 text-xs">
                        {lang === 'ar'
                          ? 'اكتبي المبلغ الذي قمتِ بتسليمه باليد لموظفة الاستقبال (ج.م):'
                          : 'Enter the exact cash amount handed to receptionist (EGP):'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          placeholder={String(totals.remaining)}
                          className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 focus:border-emerald-600 focus:outline-none bg-white text-espresso font-mono font-bold text-base"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-700">
                          ج.م
                        </span>
                      </div>
                      {Number(cashTendered) > totals.remaining && (
                        <p className="mt-1.5 text-[11px] text-emerald-700 font-medium">
                          {lang === 'ar' ? 'الباقي المتوقع استلامه من الكاشير:' : 'Expected change to receive:'}{' '}
                          <strong className="font-mono">{formatPrice(Number(cashTendered) - totals.remaining, lang)}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload Screenshot if InstaPay or Vodafone Cash */}
                {(paymentMethod === 'instapay' || paymentMethod === 'vodafone_cash') && (
                  <div>
                    <label className="block text-xs font-semibold text-espresso mb-1.5">
                      {lang === 'ar' ? 'صورة إشعار أو سكرين شوت التحويل (اختياري/مفضل):' : 'Upload Receipt Screenshot:'}
                    </label>
                    <div className="relative border-2 border-dashed border-pearl rounded-xl p-3 text-center bg-ivory/40 hover:bg-ivory transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex items-center justify-center gap-2 text-xs text-mocha-500">
                        <Upload className="w-4 h-4 text-rosegold-500" />
                        <span>
                          {compressing
                            ? lang === 'ar'
                              ? 'جاري ضغط الصورة (<100KB)...'
                              : 'Compressing...'
                            : proofImage
                            ? lang === 'ar'
                              ? 'تم إرفاق صورة الإيصال بنجاح ✓'
                              : 'Screenshot attached ✓'
                            : lang === 'ar'
                            ? 'اضغطي لاختيار صورة الإيصال'
                            : 'Click to choose receipt photo'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || compressing}
                  className="w-full py-3.5 px-4 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory font-semibold text-sm transition shadow-soft flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-rosegold-300" />
                  <span>
                    {submitting
                      ? lang === 'ar'
                        ? 'جاري الإرسال...'
                        : 'Submitting...'
                      : lang === 'ar'
                      ? `إرسال إشعار السداد للكاشير • ${formatPrice(totals.remaining, 'ar')}`
                      : `Submit Payment • ${formatPrice(totals.remaining, 'en')}`}
                  </span>
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
