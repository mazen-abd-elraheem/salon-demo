import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  UserCheck,
  PlusCircle,
  ShoppingBag,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowRight,
  Phone,
  FileText,
  AlertCircle,
  Volume2,
  VolumeX,
  CreditCard,
  Send,
  Eye,
  X,
  Store,
  Check,
  LogOut,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../lib/format';
import {
  defaultServices,
  defaultProducts,
  defaultShifts,
  getLocalBookings,
  getLocalServices,
  getLocalProducts,
  getLocalSettings,
  saveLocalBooking,
  addTabAddonToLocal,
  removeTabAddonFromLocal,
  updateLocalBookingStatus,
  getLocalStaffUsers,
  clockInStaff,
  clockOutStaff,
  getActiveStaffAttendance,
  normalizePinDigits,
} from '../lib/mockData';
import { supabase } from '../lib/supabase';
import type {
  Booking,
  Service,
  Product,
  TabAddon,
  Payment,
  AttendanceRecord,
  ShiftType,
} from '../lib/types';
import { playNotificationChime } from '../lib/soundEffects';
import {
  buildDepositApprovalWhatsAppUrl,
  buildInvoiceLinkWhatsAppUrl,
  buildCompletionWhatsAppUrl,
} from '../lib/whatsapp';
import { DynamicQRCode } from '../lib/qrCode';
import CheckoutPage from './CheckoutPage';
import { clearVerifiedStaffSession, getVerifiedStaffSession } from '../lib/staffAuth';
import { GuzelLogoIcon } from '../components/public/GuzelSvgIcons';

export default function ReceptionPage() {
  const { lang, toggleLang, isRTL } = useLanguage();
  const [activeView, setActiveView] = useState<'pos' | 'smart_checkout'>('pos');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [salonLogo, setSalonLogo] = useState<string | null>(() => getLocalSettings()?.logo_url || null);

  const staffSession = getVerifiedStaffSession();
  const canViewAdmin = staffSession?.role === 'admin' || staffSession?.role === 'manager';

  // Modals
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const catalogServices = useMemo(() => {
    const local = getLocalServices();
    return local.length > 0 ? local : defaultServices;
  }, [showAddServiceModal]);

  const catalogProducts = useMemo(() => {
    const local = getLocalProducts();
    return local.length > 0 ? local : defaultProducts;
  }, [showAddProductModal]);

  // Active cashier
  const activeStaffName = staffSession?.name
    ? `${staffSession.name} (${
        staffSession.role === 'admin'
          ? 'المدير العام'
          : staffSession.role === 'manager'
          ? 'مديرة الفرع'
          : 'الاستقبال والكاشير'
      })`
    : 'رنا نبيل (الكاشير)';
  const currentShift = defaultShifts[1]; // Evening shift

  // Sync salon logo live
  useEffect(() => {
    const syncLogo = () => {
      const local = getLocalSettings();
      if (local?.logo_url) setSalonLogo(local.logo_url);
    };
    syncLogo();
    (async () => {
      try {
        const { data } = await supabase
          .from('business_settings')
          .select('logo_url')
          .limit(1)
          .maybeSingle();
        if (data?.logo_url) setSalonLogo(data.logo_url);
      } catch {
        // ignore
      }
    })();
    window.addEventListener('guzel:data-updated', syncLogo);
    return () => window.removeEventListener('guzel:data-updated', syncLogo);
  }, []);

  // Load bookings
  const reloadData = () => {
    const list = getLocalBookings();
    setBookings([...list]);
    if (!selectedBookingId && list.length > 0) {
      setSelectedBookingId(list[0].id);
    }
  };

  useEffect(() => {
    reloadData();
    const handleStorage = () => reloadData();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('guzel:data-updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('guzel:data-updated', handleStorage);
    };
  }, []);

  // Staff Attendance System in POS
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [activeStaffAttendance, setActiveStaffAttendance] = useState<AttendanceRecord[]>(
    getActiveStaffAttendance(),
  );
  const [staffUsers, setStaffUsers] = useState(() => getLocalStaffUsers());
  const [attStaffId, setAttStaffId] = useState('');
  const [attPin, setAttPin] = useState('');
  const [attShift, setAttShift] = useState<ShiftType>('morning');
  const [attError, setAttError] = useState<string | null>(null);
  const [clockOutTargetId, setClockOutTargetId] = useState<string | null>(null);
  const [clockOutPin, setClockOutPin] = useState('');

  useEffect(() => {
    const refreshStaff = () => {
      setStaffUsers(getLocalStaffUsers());
      setActiveStaffAttendance(getActiveStaffAttendance());
    };
    window.addEventListener('storage', refreshStaff);
    window.addEventListener('guzel:data-updated', refreshStaff);
    return () => {
      window.removeEventListener('storage', refreshStaff);
      window.removeEventListener('guzel:data-updated', refreshStaff);
    };
  }, []);

  const reloadAttendance = () => {
    setStaffUsers(getLocalStaffUsers());
    setActiveStaffAttendance(getActiveStaffAttendance());
  };

  const handleClockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttError(null);
    if (!attStaffId) {
      setAttError(lang === 'ar' ? 'يرجى اختيار الموظفة' : 'Please select staff member');
      return;
    }
    const res = clockInStaff(attStaffId, attPin, attShift);
    if (!res.success) {
      setAttError(res.error || 'حدث خطأ');
      return;
    }
    reloadAttendance();
    setAttPin('');
    setAttStaffId('');
    if (soundEnabled) playNotificationChime();
    triggerToast(lang === 'ar' ? 'تم تسجيل حضور الموظفة بنجاح ✨' : 'Staff clocked in successfully!');
  };

  const handleClockOutQuick = (staffId: string, verifyPin = false, pinVal = '') => {
    setAttError(null);
    const res = clockOutStaff(
      staffId,
      verifyPin
        ? lang === 'ar'
          ? 'انصراف مؤكد برمز PIN الشخصي'
          : 'Verified PIN clock-out'
        : lang === 'ar'
        ? 'تسجيل انصراف بإشراف الإدارة/الاستقبال'
        : 'Supervisor override clock-out',
      pinVal,
      verifyPin,
    );
    if (!res.success) {
      setAttError(res.error || 'حدث خطأ أثناء تسجيل الانصراف');
      return;
    }
    setClockOutTargetId(null);
    setClockOutPin('');
    reloadAttendance();
    if (soundEnabled) playNotificationChime();
    triggerToast(lang === 'ar' ? 'تم تسجيل انصراف الموظفة وإنهاء الوردية ✨' : 'Staff clocked out successfully!');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const normalizeDigits = (str: string) =>
    str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    const query = normalizeDigits(searchQuery.trim().toLowerCase());
    return bookings.filter((b) => {
      const matchQuery =
        !query ||
        normalizeDigits(b.customer_phone).includes(query) ||
        normalizeDigits(b.booking_number.toLowerCase()).includes(query) ||
        b.customer_name.toLowerCase().includes(query);

      if (!matchQuery) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active')
        return b.status === 'checked_in' || b.status === 'checkout_pending';
      if (statusFilter === 'pending_verification')
        return b.status === 'pending_verification' || b.status === 'pending_deposit';
      if (statusFilter === 'confirmed') return b.status === 'confirmed';
      if (statusFilter === 'completed') return b.status === 'completed';
      return true;
    });
  }, [bookings, searchQuery, statusFilter]);

  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.id === selectedBookingId) || filteredBookings[0] || null;
  }, [bookings, selectedBookingId, filteredBookings]);

  const totals = useMemo(() => {
    if (!selectedBooking)
      return { subtotal: 0, addonsTotal: 0, discount: 0, total: 0, deposit: 0, remaining: 0 };
    const subtotal = Number(selectedBooking.subtotal_amount || 0);
    const addonsTotal = (selectedBooking.addons || []).reduce(
      (sum, a) => sum + Number(a.price) * (a.quantity || 1),
      0,
    );
    const discount = Number(selectedBooking.discount_amount || 0);
    const total = Math.max(0, subtotal + addonsTotal - discount);
    const deposit = Number(selectedBooking.deposit_paid || 0);
    const remaining = Math.max(0, total - deposit);
    return { subtotal, addonsTotal, discount, total, deposit, remaining };
  }, [selectedBooking]);

  const handleCheckIn = (b: Booking) => {
    updateLocalBookingStatus(b.id, 'checked_in');
    reloadData();
    if (soundEnabled) playNotificationChime();
    triggerToast(lang === 'ar' ? 'تم تسجيل حضور العميلة وفتح الفاتورة ✨' : 'Client checked in!');
  };

  const handleApproveDeposit = (b: Booking) => {
    const payment = b.payments?.find((p) => p.payment_type === 'deposit');
    const depositAmount = payment ? payment.amount : b.deposit_required;

    const verifiedPayment: Payment = payment
      ? {
          ...payment,
          status: 'verified',
          verified_by_staff_name: activeStaffName,
          verified_at: new Date().toISOString(),
          shift_name: currentShift.name_ar,
        }
      : {
          id: 'pay-' + Date.now(),
          booking_id: b.id,
          payment_type: 'deposit',
          method: 'instapay',
          amount: depositAmount,
          status: 'verified',
          verified_by_staff_name: activeStaffName,
          verified_at: new Date().toISOString(),
          shift_name: currentShift.name_ar,
          created_at: new Date().toISOString(),
        };

    const updated: Booking = {
      ...b,
      deposit_paid: depositAmount,
      status: 'confirmed',
      payments: [...(b.payments || []).filter((p) => p.payment_type !== 'deposit'), verifiedPayment],
    };

    saveLocalBooking(updated);
    reloadData();
    if (soundEnabled) playNotificationChime();
    triggerToast(lang === 'ar' ? 'تم اعتماد العربون وتأكيد الحجز بنجاح' : 'Deposit approved!');
  };

  const handleAddServiceAddon = (service: Service) => {
    if (!selectedBooking) return;
    const addon: TabAddon = {
      id: 'addon-' + Date.now(),
      booking_id: selectedBooking.id,
      type: 'service',
      item_id: service.id,
      name_ar: service.name_ar,
      name_en: service.name_en,
      quantity: 1,
      price: service.price,
      added_by_staff_id: activeStaffName,
      created_at: new Date().toISOString(),
    };
    addTabAddonToLocal(selectedBooking.id, addon);
    reloadData();
    setShowAddServiceModal(false);
    triggerToast(lang === 'ar' ? `تمت إضافة خدمة: ${service.name_ar}` : `Service added: ${service.name_en}`);
  };

  const handleAddProductAddon = (product: Product) => {
    if (!selectedBooking) return;
    const addon: TabAddon = {
      id: 'addon-' + Date.now(),
      booking_id: selectedBooking.id,
      type: 'product',
      item_id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      quantity: 1,
      price: product.price,
      added_by_staff_id: activeStaffName,
      created_at: new Date().toISOString(),
    };
    addTabAddonToLocal(selectedBooking.id, addon);
    reloadData();
    setShowAddProductModal(false);
    triggerToast(lang === 'ar' ? `تمت إضافة منتج: ${product.name_ar}` : `Product added: ${product.name_en}`);
  };

  const handleRemoveAddon = (addonId: string) => {
    if (!selectedBooking) return;
    removeTabAddonFromLocal(selectedBooking.id, addonId);
    reloadData();
    triggerToast(lang === 'ar' ? 'تم حذف العنصر من الفاتورة' : 'Item removed from tab');
  };

  const handleApproveFinalSettlement = () => {
    if (!selectedBooking) return;
    const existingSettlement = selectedBooking.payments?.find(
      (p) => p.payment_type === 'settlement' && p.status === 'pending',
    );

    const settlementPayment: Payment = existingSettlement
      ? {
          ...existingSettlement,
          status: 'verified',
          verified_by_staff_name: activeStaffName,
          verified_at: new Date().toISOString(),
          shift_name: currentShift.name_ar,
          shift_id: currentShift.id,
        }
      : {
          id: 'pay-set-' + Date.now(),
          booking_id: selectedBooking.id,
          payment_type: 'settlement',
          method: 'cash',
          amount: totals.remaining,
          status: 'verified',
          verified_by_staff_name: activeStaffName,
          verified_at: new Date().toISOString(),
          shift_name: currentShift.name_ar,
          shift_id: currentShift.id,
          created_at: new Date().toISOString(),
        };

    const updated: Booking = {
      ...selectedBooking,
      status: 'completed',
      payments: [
        ...(selectedBooking.payments || []).filter(
          (p) => !(p.payment_type === 'settlement' && p.status === 'pending'),
        ),
        settlementPayment,
      ],
    };

    saveLocalBooking(updated);
    reloadData();
    if (soundEnabled) playNotificationChime();
    triggerToast(lang === 'ar' ? 'تم اعتماد السداد وإغلاق الفاتورة بنجاح ✨' : 'Invoice closed!');
  };

  const renderStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {lang === 'ar' ? 'متواجدة بالفرع' : 'Checked-In'}
          </span>
        );
      case 'checkout_pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#f3e6f0] text-[#73358c] border border-[#cbb6ea]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b14bd9] animate-pulse" />
            {lang === 'ar' ? 'بانتظار اعتماد السداد' : 'Checkout Pending'}
          </span>
        );
      case 'pending_verification':
      case 'pending_deposit':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'مراجعة العربون' : 'Pending Deposit'}
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#cbb6ea]/45 text-[#3a1d43] border border-[#cbb6ea]">
            <Check className="w-3.5 h-3.5 text-[#73358c]" />
            {lang === 'ar' ? 'مؤكد جاهز للدخول' : 'Confirmed'}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#f9f0f5] text-[#3a1d43]/70 border border-[#e8d7e4]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {lang === 'ar' ? 'مكتمل ومغلق' : 'Completed'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3e6f0] text-[#3a1d43]">
            {status}
          </span>
        );
    }
  };

  const checkoutUrl = selectedBooking
    ? `${window.location.origin}/checkout/${selectedBooking.secret_token || selectedBooking.id}`
    : '';

  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: '#f9f0f5', color: '#3a1d43' }}
    >
      {/* Ultra-Clean Floating Glass Reception Header with Salon Logo */}
      <header
        className="sticky top-0 z-30 px-3 sm:px-6 lg:px-8 pt-3 pb-2"
        style={{
          background: 'linear-gradient(180deg, rgba(249,240,245,0.96) 65%, rgba(249,240,245,0) 100%)',
        }}
      >
        <div
          className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 rounded-full border px-3 sm:px-5 py-2.5 backdrop-blur-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            borderColor: 'rgba(58, 29, 67, 0.09)',
            boxShadow: '0 10px 30px -12px rgba(58, 29, 67, 0.12)',
          }}
        >
          {/* Brand Logo + Reception Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="shrink-0 no-underline"
              title={lang === 'ar' ? 'الرئيسية' : 'Home'}
            >
              {salonLogo ? (
                <img
                  src={salonLogo}
                  alt="Guzel Medical Spa"
                  className="h-10 w-10 rounded-full object-cover border border-[#3a1d43]/12 bg-white shadow-xs"
                />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#cbb6ea] text-[#3a1d43]">
                  <GuzelLogoIcon className="w-5 h-5" />
                </span>
              )}
            </Link>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[#3a1d43] font-display truncate">
                  {lang === 'ar' ? 'جوزال ميديكال سبا • الاستقبال والكاشير' : 'Guzel Medical Spa • Reception POS'}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#f3e6f0] text-[#73358c] font-bold border border-[#e8d7e4]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b14bd9]" />
                  {currentShift.name_ar}
                </span>
              </div>
              <p className="text-[11px] text-[#3a1d43]/60 truncate">{activeStaffName}</p>
            </div>
          </div>

          {/* Right Compact Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Staff Clock Button */}
            <button
              type="button"
              onClick={() => setAttendanceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-emerald-200 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">
                {lang === 'ar' ? 'حضور الطاقم' : 'Staff Clock'}
              </span>
              <span className="h-5 min-w-[20px] px-1 rounded-full bg-emerald-600 text-white text-[10px] grid place-items-center font-mono font-bold">
                {activeStaffAttendance.length}
              </span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'تنبيهات الصوت مفعلة' : 'الصوت مكتوم'}
              className="grid h-9 w-9 place-items-center rounded-full border transition cursor-pointer"
              style={{
                borderColor: soundEnabled ? 'rgba(177,75,217,0.28)' : 'rgba(58,29,67,0.1)',
                backgroundColor: soundEnabled ? '#f3e6f0' : '#ffffff',
                color: soundEnabled ? '#73358c' : 'rgba(58,29,67,0.45)',
              }}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#3a1d43]/12 bg-[#f9f0f5] hover:bg-[#f3e6f0] text-xs font-bold text-[#3a1d43] transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#b14bd9]" />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Admin Link OR Sign Out */}
            {canViewAdmin ? (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3a1d43] hover:opacity-90 text-xs font-bold text-white transition shadow-xs no-underline"
              >
                <span>{lang === 'ar' ? 'لوحة الإدارة' : 'Admin Suite'}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  clearVerifiedStaffSession();
                  window.location.href = '/login';
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#3a1d43]/12 bg-white hover:bg-rose-50 hover:text-rose-700 text-xs font-bold text-[#3a1d43] transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'خروج' : 'Sign Out'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bento KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="p-4 sm:p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-[#e8d7e4] shadow-[0_12px_32px_-16px_rgba(58,29,67,0.1)]">
            <p className="text-[11px] font-bold text-[#3a1d43]/60 mb-1">
              {lang === 'ar' ? 'فواتير مفتوحة بالفرع' : 'In-Branch Open Tabs'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#3a1d43]">
              {bookings.filter((b) => b.status === 'checked_in' || b.status === 'checkout_pending').length}
            </p>
          </div>
          <div className="p-4 sm:p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-[#e8d7e4] shadow-[0_12px_32px_-16px_rgba(58,29,67,0.1)]">
            <p className="text-[11px] font-bold text-[#3a1d43]/60 mb-1">
              {lang === 'ar' ? 'عربين بانتظار المراجعة' : 'Pending Deposits'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#b14bd9]">
              {bookings.filter((b) => b.status === 'pending_verification').length}
            </p>
          </div>
          <div className="p-4 sm:p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-[#e8d7e4] shadow-[0_12px_32px_-16px_rgba(58,29,67,0.1)]">
            <p className="text-[11px] font-bold text-[#3a1d43]/60 mb-1">
              {lang === 'ar' ? 'حجوزات اليوم المؤكدة' : 'Confirmed Today'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#3a1d43]">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="p-4 sm:p-5 rounded-3xl bg-[#3a1d43] text-white border border-[#3a1d43] shadow-[0_16px_36px_-14px_rgba(58,29,67,0.35)]">
            <p className="text-[11px] font-bold text-[#cbb6ea] mb-1">
              {lang === 'ar' ? 'فواتير مكتملة ومقفلة' : 'Completed Invoices'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {bookings.filter((b) => b.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Mode Switcher Pill Bar */}
        <div
          className="mb-6 p-1.5 rounded-full border inline-flex flex-wrap items-center gap-1.5 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(58, 29, 67, 0.09)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveView('pos')}
            className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer border-0"
            style={{
              backgroundColor: activeView === 'pos' ? '#3a1d43' : 'transparent',
              color: activeView === 'pos' ? '#ffffff' : '#3a1d43',
              boxShadow: activeView === 'pos' ? '0 8px 20px -6px rgba(58,29,67,0.3)' : 'none',
            }}
          >
            <Store className="w-4 h-4" />
            <span>
              {lang === 'ar' ? 'إدارة الفواتير والطلبات الحية (POS)' : 'Live Customer Tabs & POS'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('smart_checkout')}
            className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer border-0"
            style={{
              backgroundColor: activeView === 'smart_checkout' ? '#3a1d43' : 'transparent',
              color: activeView === 'smart_checkout' ? '#ffffff' : '#3a1d43',
              boxShadow: activeView === 'smart_checkout' ? '0 8px 20px -6px rgba(58,29,67,0.3)' : 'none',
            }}
          >
            <CreditCard className="w-4 h-4 text-[#e58fb6]" />
            <span>
              {lang === 'ar'
                ? 'الفاتورة الرقمية وشاشة الدفع الذكي بالفرع'
                : 'In-Branch Smart Checkout & Settlement'}
            </span>
          </button>
        </div>

        {activeView === 'smart_checkout' ? (
          <CheckoutPage
            embeddedInReception
            initialBookingId={selectedBookingId}
            onSettled={() => {
              reloadData();
              triggerToast(
                lang === 'ar'
                  ? 'تم تحصيل وإغلاق الفاتورة بنجاح من شاشة الدفع الذكي ✨'
                  : 'Invoice settled and closed!',
              );
            }}
          />
        ) : (
          /* Clean 2-Pane Glassmorphic POS Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Queue Column (5 cols) */}
            <div className="lg:col-span-5">
              <div
                className="p-4 sm:p-5 rounded-3xl border backdrop-blur-xl"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderColor: 'rgba(58, 29, 67, 0.09)',
                  boxShadow: '0 16px 44px -18px rgba(58, 29, 67, 0.1)',
                }}
              >
                {/* Search Input */}
                <div className="relative mb-3.5">
                  <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a1d43]/45" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'بحث برقم الهاتف (٠١٠...) أو كود الحجز أو الاسم...'
                        : 'Search phone, booking #, or client name…'
                    }
                    className="w-full ps-10 pe-4 py-2.5 text-xs sm:text-sm rounded-full border border-[#e8d7e4] bg-[#f9f0f5]/75 text-[#3a1d43] focus:border-[#b14bd9] focus:bg-white focus:outline-none transition"
                  />
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap gap-1.5 pb-3.5 border-b border-[#e8d7e4]">
                  {[
                    { id: 'active', label: lang === 'ar' ? 'بالفرع / مفتوح' : 'Open Tabs' },
                    { id: 'pending_verification', label: lang === 'ar' ? 'العربون' : 'Deposits' },
                    { id: 'confirmed', label: lang === 'ar' ? 'مؤكد' : 'Confirmed' },
                    { id: 'completed', label: lang === 'ar' ? 'مكتمل' : 'Completed' },
                    { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
                  ].map((tab) => {
                    const active = statusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer border"
                        style={{
                          backgroundColor: active ? '#3a1d43' : '#f9f0f5',
                          borderColor: active ? '#3a1d43' : '#e8d7e4',
                          color: active ? '#ffffff' : '#3a1d43',
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Queue List */}
                <div className="mt-3.5 space-y-2.5 max-h-[620px] overflow-y-auto admin-scroll pe-1">
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[#3a1d43]/55">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-[#cbb6ea]" />
                      {lang === 'ar' ? 'لا توجد حجوزات مطابقة حالياً' : 'No matching bookings found'}
                    </div>
                  ) : (
                    filteredBookings.map((b) => {
                      const isSelected = selectedBooking?.id === b.id;
                      const bAddons = (b.addons || []).reduce(
                        (s, a) => s + Number(a.price) * (a.quantity || 1),
                        0,
                      );
                      const bTotal = Math.max(
                        0,
                        Number(b.subtotal_amount || 0) + bAddons - Number(b.discount_amount || 0),
                      );
                      const bRemaining = Math.max(0, bTotal - Number(b.deposit_paid || 0));

                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBookingId(b.id)}
                          className="w-full text-start p-4 rounded-2xl border transition-all duration-200 cursor-pointer"
                          style={{
                            backgroundColor: isSelected ? 'rgba(203, 182, 234, 0.25)' : '#ffffff',
                            borderColor: isSelected ? '#b14bd9' : '#e8d7e4',
                            boxShadow: isSelected ? '0 0 0 2px rgba(177, 75, 217, 0.14)' : 'none',
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <span className="font-bold text-[#3a1d43] text-sm block truncate">
                                {b.customer_name}
                              </span>
                              <span className="text-[11px] font-mono text-[#3a1d43]/60" dir="ltr">
                                #{b.booking_number} • {b.customer_phone}
                              </span>
                            </div>
                            {renderStatusBadge(b.status)}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[#e8d7e4]/70">
                            <span className="inline-flex items-center gap-1 font-mono text-[#3a1d43]/65">
                              <Clock className="w-3.5 h-3.5 text-[#b14bd9]" />
                              {b.start_time.slice(0, 5)}
                            </span>
                            <span className="font-mono font-bold text-[#73358c]">
                              {b.status === 'completed'
                                ? lang === 'ar'
                                  ? 'مسدد بالكامل ✓'
                                  : 'Settled ✓'
                                : `${lang === 'ar' ? 'متبقي:' : 'Due:'} ${formatPrice(bRemaining, lang)}`}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Active Customer Tab Workspace (7 cols) */}
            <div className="lg:col-span-7">
              {selectedBooking ? (
                <div className="space-y-4">
                  {/* Customer Header & Quick Action Bar */}
                  <div
                    className="p-5 sm:p-6 rounded-3xl border backdrop-blur-xl"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      borderColor: 'rgba(58, 29, 67, 0.09)',
                      boxShadow: '0 16px 44px -18px rgba(58, 29, 67, 0.1)',
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#e8d7e4]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-xl font-bold text-[#3a1d43] font-display">
                            {selectedBooking.customer_name}
                          </h2>
                          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#f3e6f0] text-[#73358c] border border-[#e8d7e4]">
                            #{selectedBooking.booking_number}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#3a1d43]/65 font-mono">
                          <span className="inline-flex items-center gap-1" dir="ltr">
                            <Phone className="w-3.5 h-3.5 text-[#b14bd9]" />
                            {selectedBooking.customer_phone}
                          </span>
                          <span>•</span>
                          <span dir="ltr">
                            {selectedBooking.appointment_date} ({selectedBooking.start_time.slice(0, 5)})
                          </span>
                        </div>
                      </div>
                      {renderStatusBadge(selectedBooking.status)}
                    </div>

                    {/* Action Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                      {selectedBooking.status === 'pending_verification' && (
                        <button
                          type="button"
                          onClick={() => handleApproveDeposit(selectedBooking)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer border-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'اعتماد العربون وتأكيد الحجز' : 'Approve Deposit'}</span>
                        </button>
                      )}

                      {selectedBooking.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(selectedBooking)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3a1d43] hover:opacity-90 text-white text-xs font-bold transition cursor-pointer border-0"
                        >
                          <UserCheck className="w-4 h-4 text-[#cbb6ea]" />
                          <span>{lang === 'ar' ? 'تسجيل حضور وفتح الفاتورة' : 'Check-In & Open Tab'}</span>
                        </button>
                      )}

                      {selectedBooking.status !== 'completed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowAddServiceModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#cbb6ea] bg-[#f3e6f0] hover:bg-[#cbb6ea]/50 text-[#3a1d43] text-xs font-bold transition cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-[#73358c]" />
                            <span>{lang === 'ar' ? 'إضافة خدمة' : 'Add Service'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowAddProductModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#cbb6ea] bg-[#f3e6f0] hover:bg-[#cbb6ea]/50 text-[#3a1d43] text-xs font-bold transition cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-[#73358c]" />
                            <span>{lang === 'ar' ? 'إضافة منتج' : 'Add Product'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowQRModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#3a1d43]/15 bg-white hover:bg-[#f9f0f5] text-[#3a1d43] text-xs font-bold transition cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#b14bd9]" />
                            <span>{lang === 'ar' ? 'QR الفاتورة' : 'Invoice QR'}</span>
                          </button>
                        </>
                      )}

                      {/* WhatsApp Notification Shortcut */}
                      <a
                        href={
                          selectedBooking.status === 'completed'
                            ? buildCompletionWhatsAppUrl(selectedBooking)
                            : selectedBooking.status === 'confirmed'
                            ? buildDepositApprovalWhatsAppUrl(selectedBooking)
                            : buildInvoiceLinkWhatsAppUrl(selectedBooking, checkoutUrl)
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition no-underline"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'واتساب العميلة' : 'WhatsApp'}</span>
                      </a>
                    </div>
                  </div>

                  {/* Itemized Open Tab Card */}
                  <div
                    className="p-5 sm:p-6 rounded-3xl border backdrop-blur-xl"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      borderColor: 'rgba(58, 29, 67, 0.09)',
                      boxShadow: '0 16px 44px -18px rgba(58, 29, 67, 0.1)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-[#3a1d43]">
                        {lang === 'ar' ? 'تفاصيل الفاتورة والخدمات المفتوحة' : 'Itemized Customer Tab'}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#73358c] bg-[#f3e6f0] px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b14bd9]" />
                        {lang === 'ar' ? 'مزامنة لحظية' : 'Live Sync'}
                      </span>
                    </div>

                    <div className="space-y-2.5 mb-5">
                      {(selectedBooking.items || []).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f9f0f5]/80 border border-[#e8d7e4] text-xs"
                        >
                          <div>
                            <div className="font-bold text-[#3a1d43]">
                              {lang === 'ar'
                                ? item.service?.name_ar || 'جلسة علاجية'
                                : item.service?.name_en || 'Spa Ritual'}
                            </div>
                            <div className="text-[11px] text-[#3a1d43]/60 mt-0.5 font-mono">
                              {item.scheduled_start?.slice(0, 5)} – {item.scheduled_end?.slice(0, 5)} •{' '}
                              <span className="font-sans">
                                {item.specialist?.name_ar || 'أخصائية جوزال'}
                              </span>
                            </div>
                          </div>
                          <div className="font-mono font-bold text-sm text-[#3a1d43]">
                            {formatPrice(item.price, lang)}
                          </div>
                        </div>
                      ))}

                      {(selectedBooking.addons || []).map((addon) => (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f3e6f0]/75 border border-[#cbb6ea]/70 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#cbb6ea]/55 text-[#3a1d43]">
                              {addon.type === 'service'
                                ? lang === 'ar'
                                  ? 'إضافة'
                                  : 'Add-on'
                                : lang === 'ar'
                                ? 'منتج'
                                : 'Product'}
                            </span>
                            <div>
                              <div className="font-bold text-[#3a1d43]">
                                {lang === 'ar' ? addon.name_ar : addon.name_en || addon.name_ar}
                              </div>
                              <div className="text-[10px] text-[#3a1d43]/60">
                                {addon.quantity > 1 ? `الكمية: ${addon.quantity}` : 'مضاف بالفرع'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-sm text-[#3a1d43]">
                              {formatPrice(addon.price * (addon.quantity || 1), lang)}
                            </span>
                            {selectedBooking.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAddon(addon.id)}
                                className="p-1 rounded-full text-[#3a1d43]/50 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer bg-transparent border-0"
                                title="حذف"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="border-t border-[#e8d7e4] pt-4 space-y-2 text-xs text-[#3a1d43]/75">
                      <div className="flex justify-between">
                        <span>{lang === 'ar' ? 'إجمالي الخدمات والمنتجات:' : 'Subtotal:'}</span>
                        <span className="font-mono font-bold text-[#3a1d43]">
                          {formatPrice(totals.total + totals.discount, lang)}
                        </span>
                      </div>
                      {totals.discount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>{lang === 'ar' ? 'خصم البروموكود:' : 'Discount:'}</span>
                          <span className="font-mono font-bold">-{formatPrice(totals.discount, lang)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-emerald-700">
                        <span>{lang === 'ar' ? 'العربون المسدد مسبقاً:' : 'Deposit Paid:'}</span>
                        <span className="font-mono font-bold">-{formatPrice(totals.deposit, lang)}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-3 border-t border-[#e8d7e4] text-sm font-bold text-[#3a1d43]">
                        <span>{lang === 'ar' ? 'المبلغ المتبقي للتحصيل:' : 'Remaining Balance:'}</span>
                        <span className="text-xl font-mono font-extrabold text-[#73358c]">
                          {formatPrice(totals.remaining, lang)}
                        </span>
                      </div>
                    </div>

                    {/* Payments Log */}
                    {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                      <div className="mt-4 p-3.5 rounded-2xl bg-[#f9f0f5] border border-[#e8d7e4] text-xs">
                        <p className="font-bold text-[#3a1d43] mb-2">
                          {lang === 'ar' ? 'سجل المدفوعات والإيصالات:' : 'Payment Submissions:'}
                        </p>
                        <div className="space-y-1.5">
                          {selectedBooking.payments.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e8d7e4]"
                            >
                              <div>
                                <div className="font-bold text-[#3a1d43] flex items-center gap-1.5">
                                  <span>
                                    {p.method === 'instapay'
                                      ? 'InstaPay'
                                      : p.method === 'vodafone_cash'
                                      ? 'Vodafone Cash'
                                      : 'كاش بالدرج'}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f3e6f0] text-[#73358c]">
                                    {p.payment_type === 'deposit' ? 'عربون' : 'سداد نهائي'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#3a1d43]/60 font-mono mt-0.5">
                                  {p.reference_number ? `مرجع: ${p.reference_number}` : ''}{' '}
                                  {p.verified_by_staff_name ? `• ${p.verified_by_staff_name}` : ''}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#3a1d43]">
                                  {formatPrice(p.amount, lang)}
                                </span>
                                {p.proof_image_url && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImageUrl(p.proof_image_url || null)}
                                    className="p-1.5 rounded-full bg-[#f3e6f0] hover:bg-[#cbb6ea] text-[#3a1d43] transition cursor-pointer border-0"
                                    title="عرض الإيصال"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    p.status === 'verified'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-[#f3e6f0] text-[#73358c] border border-[#cbb6ea]'
                                  }`}
                                >
                                  {p.status === 'verified' ? 'معتمد' : 'بانتظار المراجعة'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Settlement Actions */}
                    {selectedBooking.status !== 'completed' && (
                      <div className="mt-5 pt-4 border-t border-[#e8d7e4] flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveView('smart_checkout')}
                          className="flex-1 py-3 px-4 rounded-full border border-[#cbb6ea] bg-[#f3e6f0] hover:bg-[#cbb6ea]/50 text-[#3a1d43] font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4 text-[#73358c]" />
                          <span>
                            {lang === 'ar'
                              ? 'فتح شاشة الدفع الذكي والفاتورة'
                              : 'Open Smart Checkout Screen'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleApproveFinalSettlement}
                          className="flex-1 py-3 px-4 rounded-full bg-[#3a1d43] hover:opacity-90 text-white font-bold text-xs sm:text-sm transition shadow-[0_10px_24px_-8px_rgba(58,29,67,0.35)] flex items-center justify-center gap-2 cursor-pointer border-0"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#cbb6ea]" />
                          <span>
                            {lang === 'ar'
                              ? `اعتماد وإغلاق • ${formatPrice(totals.remaining, 'ar')}`
                              : `Approve & Close • ${formatPrice(totals.remaining, 'en')}`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-3xl bg-white/90 border border-[#e8d7e4] text-center text-[#3a1d43]/55">
                  <FileText className="w-10 h-10 mx-auto text-[#cbb6ea] mb-2" />
                  <p className="text-sm font-semibold">
                    {lang === 'ar' ? 'يرجى اختيار حجز من القائمة لإدارته' : 'Select a booking to view open tab'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add Extra Service */}
      {showAddServiceModal && (
        <div
          onClick={() => setShowAddServiceModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#25142d]/45 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-[#e8d7e4] w-full max-w-md p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e8d7e4]">
              <h3 className="font-display font-bold text-[#3a1d43] text-base">
                {lang === 'ar' ? 'إضافة خدمة إضافية للفاتورة' : 'Add In-Branch Extra Service'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddServiceModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f3e6f0] text-[#3a1d43]/60 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto admin-scroll pe-1">
              {catalogServices.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => handleAddServiceAddon(svc)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/50 hover:border-[#b14bd9] hover:bg-[#f3e6f0]/70 transition text-start cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#3a1d43]">
                      {lang === 'ar' ? svc.name_ar : svc.name_en}
                    </div>
                    <div className="text-[11px] font-mono text-[#3a1d43]/60 mt-0.5">
                      {svc.duration_minutes} min
                    </div>
                  </div>
                  <div className="font-mono font-bold text-xs text-[#73358c]">
                    +{formatPrice(svc.price, lang)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Retail Product */}
      {showAddProductModal && (
        <div
          onClick={() => setShowAddProductModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#25142d]/45 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-[#e8d7e4] w-full max-w-md p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e8d7e4]">
              <h3 className="font-display font-bold text-[#3a1d43] text-base">
                {lang === 'ar' ? 'إضافة منتج من مجموعة جوزال' : 'Add Guzel Retail Product'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f3e6f0] text-[#3a1d43]/60 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto admin-scroll pe-1">
              {catalogProducts.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleAddProductAddon(prod)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/50 hover:border-[#b14bd9] hover:bg-[#f3e6f0]/70 transition text-start cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#3a1d43]">
                      {lang === 'ar' ? prod.name_ar : prod.name_en}
                    </div>
                    <div className="text-[11px] font-mono text-[#3a1d43]/60 mt-0.5">
                      {lang === 'ar' ? `المخزون: ${prod.stock_quantity}` : `Stock: ${prod.stock_quantity}`}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-xs text-[#73358c]">
                    +{formatPrice(prod.price, lang)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dynamic QR Code for Customer Settlement */}
      {showQRModal && selectedBooking && (
        <div
          onClick={() => setShowQRModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#25142d]/45 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-[#e8d7e4] w-full max-w-sm p-6 shadow-2xl text-center"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e8d7e4]">
              <h3 className="font-display font-bold text-[#3a1d43] text-base">
                {lang === 'ar' ? 'رمز QR لسداد الفاتورة' : 'Customer Invoice QR'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f3e6f0] text-[#3a1d43]/60 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 flex flex-col items-center">
              <div className="p-4 rounded-3xl bg-[#f9f0f5] border border-[#cbb6ea] inline-block">
                <DynamicQRCode value={checkoutUrl} size={180} />
              </div>
              <p className="mt-3 font-bold text-sm text-[#3a1d43]">{selectedBooking.customer_name}</p>
              <p className="text-xs font-mono text-[#73358c] mt-0.5">
                {lang === 'ar' ? 'المتبقي للسداد:' : 'Balance Due:'}{' '}
                <strong>{formatPrice(totals.remaining, lang)}</strong>
              </p>
            </div>

            <a
              href={buildInvoiceLinkWhatsAppUrl(selectedBooking, checkoutUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-full bg-[#3a1d43] hover:opacity-90 text-white text-xs font-bold flex items-center justify-center gap-2 transition no-underline"
            >
              <Send className="w-3.5 h-3.5 text-[#cbb6ea]" />
              <span>{lang === 'ar' ? 'إرسال رابط الفاتورة عبر واتساب' : 'Send Private Invoice Link'}</span>
            </a>
          </div>
        </div>
      )}

      {/* Ultra-Premium Redesigned Staff Clock-In / Clock-Out PIN Modal */}
      {attendanceModalOpen && (
        <div
          onClick={() => {
            setAttendanceModalOpen(false);
            setAttError(null);
            setClockOutTargetId(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#25142d]/45 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-[2rem] border p-6 sm:p-7 shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              borderColor: 'rgba(58, 29, 67, 0.1)',
              color: '#3a1d43',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e8d7e4]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f3e6f0] border border-[#cbb6ea] text-[#73358c]">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#3a1d43]">
                    {lang === 'ar' ? 'تسجيل حضور وانصراف الطاقم' : 'Staff Attendance & PIN Clock'}
                  </h3>
                  <p className="text-[11px] text-[#3a1d43]/60">
                    {lang === 'ar'
                      ? 'تحقق شخصي مؤمّن برمز الـ PIN الخاص بكل موظفة'
                      : 'Verified personal PIN check-in & shift tracking'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAttendanceModalOpen(false);
                  setAttError(null);
                  setClockOutTargetId(null);
                }}
                className="grid h-9 w-9 place-items-center rounded-full border border-[#e8d7e4] bg-[#f9f0f5] hover:bg-[#f3e6f0] text-[#3a1d43] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {attError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{attError}</span>
              </div>
            )}

            {/* Quick Clock-In Form Card */}
            <form
              onSubmit={handleClockInSubmit}
              className="mt-4 p-4 sm:p-5 rounded-3xl bg-[#f9f0f5] border border-[#e8d7e4] space-y-3.5"
            >
              <div className="font-bold text-xs text-[#73358c]">
                {lang === 'ar' ? 'تسجيل حضور جديد بالوردية:' : 'Clock In for Shift:'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#3a1d43]/70 block mb-1.5">
                    {lang === 'ar' ? 'الموظفة' : 'Staff Member'}
                  </label>
                  <select
                    required
                    value={attStaffId}
                    onChange={(e) => setAttStaffId(e.target.value)}
                    className="w-full rounded-2xl border border-[#e8d7e4] bg-white px-3 py-2.5 text-xs font-semibold text-[#3a1d43] outline-none focus:border-[#b14bd9]"
                  >
                    <option value="">{lang === 'ar' ? '-- اختاري الموظفة --' : '-- Select --'}</option>
                    {staffUsers
                      .filter((s) => s.is_active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#3a1d43]/70 block mb-1.5">
                    {lang === 'ar' ? 'الوردية' : 'Shift'}
                  </label>
                  <select
                    value={attShift}
                    onChange={(e) => setAttShift(e.target.value as ShiftType)}
                    className="w-full rounded-2xl border border-[#e8d7e4] bg-white px-3 py-2.5 text-xs font-semibold text-[#3a1d43] outline-none focus:border-[#b14bd9]"
                  >
                    <option value="morning">{lang === 'ar' ? 'صباحية (10ص - 4م)' : 'Morning'}</option>
                    <option value="evening">{lang === 'ar' ? 'مسائية (4م - 10م)' : 'Evening'}</option>
                    <option value="full_day">{lang === 'ar' ? 'يوم كامل' : 'Full Day'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#3a1d43]/70 block mb-1.5">
                    {lang === 'ar' ? 'رمز الـ PIN الشخصي' : 'Personal PIN'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    dir="ltr"
                    placeholder="••••"
                    value={attPin}
                    onChange={(e) => setAttPin(normalizePinDigits(e.target.value))}
                    className="w-full rounded-2xl border border-[#e8d7e4] bg-white px-3 py-2.5 text-xs font-mono font-bold text-[#3a1d43] outline-none tracking-[0.35em] text-center focus:border-[#b14bd9]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#3a1d43] hover:opacity-90 text-white text-xs font-bold transition shadow-[0_10px_24px_-8px_rgba(58,29,67,0.35)] cursor-pointer border-0"
              >
                {lang === 'ar' ? '✓ تأكيد وتسجيل الحضور الآن' : '✓ Verify PIN & Clock In'}
              </button>
            </form>

            {/* Active Staff on Floor */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-[#3a1d43]">
                  {lang === 'ar' ? 'الموظفات الحاضرات بالفرع حالياً:' : 'Currently Clocked In:'}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                  {activeStaffAttendance.length} {lang === 'ar' ? 'حاضرات' : 'Active'}
                </span>
              </div>

              {activeStaffAttendance.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#3a1d43]/55 bg-[#f9f0f5]/60 rounded-2xl border border-[#e8d7e4]">
                  {lang === 'ar' ? 'لا يوجد موظفات مسجلات حضور حالياً' : 'No staff currently clocked in'}
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto admin-scroll pe-1">
                  {activeStaffAttendance.map((rec) => {
                    const inTime = new Date(rec.clock_in).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between gap-2 p-3.5 rounded-2xl border border-[#e8d7e4] bg-white"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#3a1d43] truncate">
                              {rec.staff_name}
                            </div>
                            <div className="text-[10px] text-[#3a1d43]/60">
                              {rec.shift === 'morning'
                                ? 'وردية صباحية'
                                : rec.shift === 'evening'
                                ? 'وردية مسائية'
                                : 'يوم كامل'}{' '}
                              • منذ <span className="font-mono">{inTime}</span>
                            </div>
                          </div>
                        </div>

                        {clockOutTargetId === rec.staff_id ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="password"
                              inputMode="numeric"
                              maxLength={6}
                              dir="ltr"
                              value={clockOutPin}
                              onChange={(e) => setClockOutPin(normalizePinDigits(e.target.value))}
                              placeholder="PIN"
                              className="w-20 rounded-full border border-[#cbb6ea] bg-[#f9f0f5] px-2.5 py-1.5 text-center font-mono text-xs font-bold text-[#3a1d43] outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleClockOutQuick(rec.staff_id, true, clockOutPin)}
                              className="px-3 py-1.5 rounded-full bg-[#3a1d43] text-white text-[11px] font-bold cursor-pointer border-0"
                            >
                              {lang === 'ar' ? 'تأكيد' : 'OK'}
                            </button>
                            {canViewAdmin && (
                              <button
                                type="button"
                                onClick={() => handleClockOutQuick(rec.staff_id, false)}
                                className="px-2.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold cursor-pointer"
                              >
                                {lang === 'ar' ? 'تجاوز' : 'Override'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setClockOutTargetId(rec.staff_id);
                              setClockOutPin('');
                              setAttError(null);
                            }}
                            className="px-3.5 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer shrink-0"
                          >
                            {lang === 'ar' ? 'تسجيل انصراف' : 'Clock Out'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Receipt Image Preview */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#25142d]/60 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-white rounded-3xl p-5 shadow-2xl border border-[#e8d7e4]"
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 end-4 p-1.5 rounded-full bg-[#f3e6f0] text-[#3a1d43] hover:bg-[#cbb6ea] cursor-pointer border-0"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs font-bold text-[#3a1d43] mb-3">
              {lang === 'ar' ? 'صورة إيصال التحويل' : 'Transfer Receipt'}
            </p>
            <img
              src={previewImageUrl}
              alt="Receipt Preview"
              className="rounded-2xl max-h-[70vh] w-full object-contain mx-auto border border-[#e8d7e4]"
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#3a1d43] text-white text-xs font-bold shadow-2xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#cbb6ea]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
