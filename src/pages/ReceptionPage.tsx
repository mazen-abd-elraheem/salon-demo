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
  XCircle,
  Clock,
  ArrowRight,
  Phone,
  FileText,
  AlertCircle,
  Volume2,
  VolumeX,
  CreditCard,
  DollarSign,
  Send,
  Eye,
  X,
  Store,
  Calendar,
  Layers,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../lib/format';
import {
  defaultServices,
  defaultProducts,
  defaultSpecialists,
  defaultRooms,
  defaultShifts,
  getLocalBookings,
  saveLocalBooking,
  addTabAddonToLocal,
  removeTabAddonFromLocal,
  addPaymentToLocal,
  updateLocalBookingStatus,
  getLocalStaffUsers,
  clockInStaff,
  clockOutStaff,
  getActiveStaffAttendance,
} from '../lib/mockData';
import type { Booking, Service, Product, TabAddon, Payment, AttendanceRecord, ShiftType } from '../lib/types';
import { playNotificationChime } from '../lib/soundEffects';
import {
  buildDepositApprovalWhatsAppUrl,
  buildInvoiceLinkWhatsAppUrl,
  buildCompletionWhatsAppUrl,
} from '../lib/whatsapp';
import { DynamicQRCode } from '../lib/qrCode';

export default function ReceptionPage() {
  const { lang, toggleLang, isRTL } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active cashier
  const activeStaffName = 'رنا نبيل (الكاشير)';
  const currentShift = defaultShifts[1]; // Evening shift

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
    // Poll local changes or storage events
    const handleStorage = () => reloadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Staff Attendance System in POS
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [activeStaffAttendance, setActiveStaffAttendance] = useState<AttendanceRecord[]>(getActiveStaffAttendance());
  const [attStaffId, setAttStaffId] = useState('');
  const [attPin, setAttPin] = useState('');
  const [attShift, setAttShift] = useState<ShiftType>('morning');
  const [attError, setAttError] = useState<string | null>(null);

  const staffUsers = getLocalStaffUsers();

  const reloadAttendance = () => {
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

  const handleClockOutQuick = (staffId: string) => {
    const res = clockOutStaff(staffId);
    if (!res.success) {
      alert(res.error);
      return;
    }
    reloadAttendance();
    if (soundEnabled) playNotificationChime();
    triggerToast(lang === 'ar' ? 'تم تسجيل انصراف الموظفة وإنهاء الوردية' : 'Staff clocked out successfully!');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Convert Arabic numerals to Western digits for searching
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

  // Calculations for selected booking
  const totals = useMemo(() => {
    if (!selectedBooking) return { subtotal: 0, addonsTotal: 0, discount: 0, total: 0, deposit: 0, remaining: 0 };
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

  // Actions
  const handleCheckIn = (b: Booking) => {
    updateLocalBookingStatus(b.id, 'checked_in');
    reloadData();
    if (soundEnabled) playNotificationChime();
    triggerToast(lang === 'ar' ? 'تم تسجيل حضور العميلة بنجاح وفتح الفاتورة ✨' : 'Client checked in successfully!');
  };

  const handleApproveDeposit = (b: Booking) => {
    // Find pending deposit payment
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

    b.deposit_paid = depositAmount;
    b.status = 'confirmed';
    b.payments = (b.payments || []).filter((p) => p.payment_type !== 'deposit');
    b.payments.push(verifiedPayment);

    saveLocalBooking(b);
    reloadData();
    if (soundEnabled) playNotificationChime();
    triggerToast(lang === 'ar' ? 'تم اعتماد العربون وتأكيد الحجز بنجاح' : 'Deposit approved and booking confirmed!');
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

    // Check if there is a pending settlement payment from customer
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

    const b = { ...selectedBooking };
    b.status = 'completed';
    b.payments = (b.payments || []).filter(
      (p) => !(p.payment_type === 'settlement' && p.status === 'pending'),
    );
    b.payments.push(settlementPayment);

    saveLocalBooking(b);
    reloadData();
    if (soundEnabled) playNotificationChime();
    triggerToast(lang === 'ar' ? 'تم اعتماد السداد وإغلاق الفاتورة بنجاح ✨' : 'Invoice approved and closed successfully!');
  };

  // Status badges
  const renderStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {lang === 'ar' ? 'متواجدة بالفرع (فاتورة مفتوحة)' : 'Checked-In (Open Tab)'}
          </span>
        );
      case 'checkout_pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {lang === 'ar' ? 'بانتظار اعتماد السداد' : 'Checkout Pending'}
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'بانتظار مراجعة العربون' : 'Pending Deposit'}
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Check className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'حجز مؤكد جاهز للدخول' : 'Confirmed'}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pearl/60 text-mocha-600 border border-pearl">
            <CheckCircle2 className="w-3.5 h-3.5 text-rosegold-500" />
            {lang === 'ar' ? 'مكتمل ومغلق' : 'Completed'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Dynamic QR checkout URL
  const checkoutUrl = selectedBooking
    ? `${window.location.origin}/checkout/${selectedBooking.secret_token || selectedBooking.id}`
    : '';

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-espresso font-sans">
      {/* Top Banner & Header */}
      <header className="sticky top-0 z-30 border-b border-pearl/80 bg-ivory/95 backdrop-blur-md px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rosegold-300 to-rosegold-500 flex items-center justify-center text-ivory shadow-soft">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-espresso font-display">
                  {lang === 'ar' ? 'ميزون لوميير • شاشة الاستقبال والكاشير' : 'Maison Lumière • Reception & POS'}
                </h1>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-rosegold-100/60 text-rosegold-700 font-medium">
                  {currentShift.name_ar} (16:00 - 23:00)
                </span>
              </div>
              <p className="text-xs text-mocha-500">
                {lang === 'ar'
                  ? `الكاشير المناوب: ${activeStaffName}`
                  : `Active Staff: ${activeStaffName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Staff Attendance Quick Button */}
            <button
              type="button"
              onClick={() => setAttendanceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition shadow-xs"
              title={lang === 'ar' ? 'تسجيل حضور وانصراف الموظفات' : 'Staff Attendance'}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'حضور الموظفات' : 'Staff Clock'}</span>
              <span className="h-5 min-w-[20px] px-1 rounded-full bg-emerald-600 text-white text-[10px] grid place-items-center font-bold">
                {activeStaffAttendance.length}
              </span>
            </button>

            {/* Sound toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'تنبيهات الصوت مفعلة' : 'الصوت مكتوم'}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? 'border-rosegold-300 bg-rosegold-50 text-rosegold-600'
                  : 'border-pearl bg-pearl/30 text-mocha-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Language toggle */}
            <button
              type="button"
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-xl border border-mocha-400/20 bg-pearl/40 hover:bg-pearl/80 text-xs font-semibold text-espresso transition"
            >
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>

            {/* Link to Admin */}
            <Link
              to="/admin/appointments"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-mocha-400/25 bg-white hover:bg-pearl/30 text-xs font-medium text-espresso transition shadow-xs"
            >
              <span>{lang === 'ar' ? 'لوحة التحكم' : 'Admin'}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {/* KPI Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-white border border-pearl/80 shadow-soft">
            <p className="text-xs font-medium text-mocha-500 mb-1">
              {lang === 'ar' ? 'فواتير مفتوحة بالفرع' : 'In-Branch Open Tabs'}
            </p>
            <p className="text-2xl font-bold text-espresso">
              {bookings.filter((b) => b.status === 'checked_in').length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-pearl/80 shadow-soft">
            <p className="text-xs font-medium text-mocha-500 mb-1">
              {lang === 'ar' ? 'عربين بانتظار المراجعة' : 'Pending Deposits'}
            </p>
            <p className="text-2xl font-bold text-rose-600">
              {bookings.filter((b) => b.status === 'pending_verification').length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-pearl/80 shadow-soft">
            <p className="text-xs font-medium text-mocha-500 mb-1">
              {lang === 'ar' ? 'حجوزات اليوم المؤكدة' : 'Confirmed Today'}
            </p>
            <p className="text-2xl font-bold text-espresso">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-pearl/80 shadow-soft">
            <p className="text-xs font-medium text-mocha-500 mb-1">
              {lang === 'ar' ? 'فواتير مكتملة اليوم' : 'Completed Invoices'}
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {bookings.filter((b) => b.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Sidebar Column: Search & Bookings List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-pearl/80 shadow-soft">
              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'بحث برقم الهاتف (٠١٠...) أو رقم الحجز...'
                      : 'Search by 11-digit phone or BK-...'
                  }
                  className="w-full ps-9 pe-4 py-2 text-sm rounded-xl border border-pearl focus:border-rosegold-400 focus:outline-none transition bg-ivory/50"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-pearl/50">
                {[
                  { id: 'active', label: lang === 'ar' ? 'بالفرع / مفتوح' : 'Open Tab' },
                  { id: 'pending_verification', label: lang === 'ar' ? 'العربون' : 'Deposits' },
                  { id: 'confirmed', label: lang === 'ar' ? 'مؤكد' : 'Confirmed' },
                  { id: 'completed', label: lang === 'ar' ? 'مكتمل' : 'Completed' },
                  { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1 text-xs rounded-xl font-medium transition ${
                      statusFilter === tab.id
                        ? 'bg-espresso text-ivory shadow-xs'
                        : 'bg-pearl/30 text-mocha-600 hover:bg-pearl/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Bookings List */}
              <div className="mt-3 space-y-2 max-h-[580px] overflow-y-auto pe-1 admin-scroll">
                {filteredBookings.length === 0 ? (
                  <div className="p-8 text-center text-mocha-400 text-sm">
                    {lang === 'ar' ? 'لا توجد حجوزات مطابقة للبحث' : 'No bookings found'}
                  </div>
                ) : (
                  filteredBookings.map((b) => {
                    const isSelected = b.id === selectedBooking?.id;
                    const remaining = Math.max(0, Number(b.total_amount) - Number(b.deposit_paid));
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBookingId(b.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition text-start ${
                          isSelected
                            ? 'border-rosegold-400 bg-rosegold-50/40 ring-1 ring-rosegold-300'
                            : 'border-pearl/80 bg-white hover:border-mocha-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="font-semibold text-espresso text-sm flex items-center gap-1.5">
                            <span>{b.customer_name}</span>
                            <span className="text-xs font-mono text-mocha-400">
                              #{b.booking_number}
                            </span>
                          </div>
                          {renderStatusBadge(b.status)}
                        </div>

                        <div className="flex items-center justify-between text-xs text-mocha-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-mocha-400" />
                            {b.customer_phone}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-mocha-400" />
                            {b.start_time.slice(0, 5)}
                          </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-pearl/60 flex items-center justify-between text-xs">
                          <span className="text-mocha-500">
                            {lang === 'ar' ? 'المتبقي:' : 'Remaining:'}{' '}
                            <strong className="text-espresso font-semibold">
                              {formatPrice(remaining, lang)}
                            </strong>
                          </span>

                          {/* Quick 1-click button */}
                          {b.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckIn(b);
                              }}
                              className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-ivory text-[11px] font-semibold hover:bg-emerald-700 transition"
                            >
                              {lang === 'ar' ? 'تسجيل دخول' : 'Check-In'}
                            </button>
                          )}

                          {b.status === 'pending_verification' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveDeposit(b);
                              }}
                              className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-ivory text-[11px] font-semibold hover:bg-rose-700 transition"
                            >
                              {lang === 'ar' ? 'اعتماد العربون' : 'Approve'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Booking Workspace & Open Tab (7 cols) */}
          <div className="lg:col-span-7">
            {selectedBooking ? (
              <div className="space-y-4">
                {/* Active Tab Header Card */}
                <div className="p-5 rounded-2xl bg-white border border-pearl/80 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-espresso">
                          {selectedBooking.customer_name}
                        </h2>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-pearl text-espresso">
                          {selectedBooking.booking_number}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-mocha-500">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-rosegold-500" />
                          {selectedBooking.customer_phone}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-rosegold-500" />
                          {selectedBooking.appointment_date}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-rosegold-500" />
                          {selectedBooking.start_time.slice(0, 5)} -{' '}
                          {selectedBooking.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderStatusBadge(selectedBooking.status)}
                    </div>
                  </div>

                  {/* Primary Workflow Actions based on status */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-pearl/70">
                    {selectedBooking.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(selectedBooking)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-ivory text-xs font-semibold hover:bg-emerald-700 transition shadow-soft"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'تسجيل دخول العميلة (متواجدة بالفرع)' : 'Check-In Client'}</span>
                      </button>
                    )}

                    {selectedBooking.status === 'pending_verification' && (
                      <button
                        type="button"
                        onClick={() => handleApproveDeposit(selectedBooking)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-ivory text-xs font-semibold hover:bg-rose-700 transition shadow-soft"
                      >
                        <Check className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'اعتماد العربون وتأكيد الحجز' : 'Approve Deposit'}</span>
                      </button>
                    )}

                    {(selectedBooking.status === 'checked_in' ||
                      selectedBooking.status === 'checkout_pending') && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowAddServiceModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-pearl bg-pearl/30 hover:bg-pearl text-xs font-medium text-espresso transition"
                        >
                          <PlusCircle className="w-4 h-4 text-rosegold-500" />
                          <span>{lang === 'ar' ? 'إضافة خدمة بالفرع' : '+ Add Service'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowAddProductModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-pearl bg-pearl/30 hover:bg-pearl text-xs font-medium text-espresso transition"
                        >
                          <ShoppingBag className="w-4 h-4 text-rosegold-500" />
                          <span>{lang === 'ar' ? 'إضافة منتج عناية' : '+ Add Product'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowQRModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rosegold-300 bg-rosegold-50 hover:bg-rosegold-100 text-xs font-semibold text-rosegold-700 transition"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'عرض QR السداد' : 'Show Checkout QR'}</span>
                        </button>
                      </>
                    )}

                    {/* WhatsApp Action */}
                    <a
                      href={
                        selectedBooking.status === 'confirmed'
                          ? buildDepositApprovalWhatsAppUrl(selectedBooking)
                          : selectedBooking.status === 'completed'
                          ? buildCompletionWhatsAppUrl(selectedBooking)
                          : buildInvoiceLinkWhatsAppUrl(selectedBooking, checkoutUrl)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition ms-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'إرسال عبر واتساب' : 'WhatsApp'}</span>
                    </a>
                  </div>
                </div>

                {/* Open Tab Itemized Invoice */}
                <div className="p-5 rounded-2xl bg-white border border-pearl/80 shadow-soft">
                  <h3 className="text-sm font-bold text-espresso mb-3 flex items-center justify-between">
                    <span>{lang === 'ar' ? 'تفاصيل الحساب والفاتورة المفتوحة' : 'Itemized Open Tab'}</span>
                    <span className="text-xs font-normal text-mocha-400">
                      {lang === 'ar' ? 'تحديث تلقائي وفوري' : 'Live Sync'}
                    </span>
                  </h3>

                  <div className="space-y-2 mb-4">
                    {/* Booked Initial Services */}
                    {(selectedBooking.items || []).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-ivory border border-pearl/60 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-espresso">
                            {lang === 'ar'
                              ? item.service?.name_ar || 'جلسة علاجية'
                              : item.service?.name_en || 'Salon Service'}
                          </div>
                          <div className="text-[11px] text-mocha-400">
                            {item.scheduled_start?.slice(0, 5)} - {item.scheduled_end?.slice(0, 5)} •{' '}
                            {item.specialist?.name_ar || 'أخصائية التجميل'}
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-espresso">
                          {formatPrice(item.price, lang)}
                        </div>
                      </div>
                    ))}

                    {/* In-Branch Tab Addons (Extra Services & Products) */}
                    {(selectedBooking.addons || []).map((addon) => (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-rosegold-50/30 border border-rosegold-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              addon.type === 'service'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {addon.type === 'service'
                              ? lang === 'ar'
                                ? 'خدمة إضافية'
                                : 'Add-on'
                              : lang === 'ar'
                              ? 'منتج عناية'
                              : 'Product'}
                          </span>
                          <div>
                            <div className="font-semibold text-espresso">
                              {lang === 'ar' ? addon.name_ar : addon.name_en || addon.name_ar}
                            </div>
                            <div className="text-[10px] text-mocha-400">
                              {addon.quantity > 1 ? `الكمية: ${addon.quantity}` : 'مضاف بالفرع'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-espresso">
                            {formatPrice(addon.price * (addon.quantity || 1), lang)}
                          </span>
                          {selectedBooking.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAddon(addon.id)}
                              className="text-mocha-400 hover:text-rose-600 transition"
                              title="حذف"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="border-t border-pearl/80 pt-3 space-y-1.5 text-xs text-mocha-600">
                    <div className="flex justify-between">
                      <span>{lang === 'ar' ? 'إجمالي الخدمات والمنتجات:' : 'Subtotal:'}</span>
                      <span className="font-mono font-medium text-espresso">
                        {formatPrice(totals.total + totals.discount, lang)}
                      </span>
                    </div>

                    {totals.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>{lang === 'ar' ? 'خصم البروموكود:' : 'Promo Discount:'}</span>
                        <span className="font-mono font-medium">-{formatPrice(totals.discount, lang)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-emerald-700">
                      <span>{lang === 'ar' ? 'العربون المسدد مسبقاً (٥٠٪):' : 'Deposit Paid:'}</span>
                      <span className="font-mono font-medium">-{formatPrice(totals.deposit, lang)}</span>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-pearl text-sm font-bold text-espresso">
                      <span>{lang === 'ar' ? 'المبلغ المتبقي للتحصيل:' : 'Remaining Balance:'}</span>
                      <span className="text-lg font-mono text-rosegold-700">
                        {formatPrice(totals.remaining, lang)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Verification / Proof Card */}
                  {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-ivory border border-pearl/80 text-xs">
                      <p className="font-semibold text-espresso mb-2">
                        {lang === 'ar' ? 'سجل المدفوعات والإيصالات:' : 'Payment Submissions:'}
                      </p>
                      <div className="space-y-1.5">
                        {selectedBooking.payments.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white border border-pearl/60"
                          >
                            <div>
                              <div className="font-medium text-espresso flex items-center gap-1.5">
                                <span>
                                  {p.method === 'instapay'
                                    ? 'InstaPay'
                                    : p.method === 'vodafone_cash'
                                    ? 'Vodafone Cash'
                                    : 'كاش بالدرج'}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-pearl text-mocha-600">
                                  {p.payment_type === 'deposit' ? 'عربون' : 'سداد نهائي'}
                                </span>
                              </div>
                              <div className="text-[11px] text-mocha-400 font-mono">
                                {p.reference_number ? `مرجع: ${p.reference_number}` : ''}{' '}
                                {p.verified_by_staff_name ? `• معتمد من: ${p.verified_by_staff_name}` : ''}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-espresso">
                                {formatPrice(p.amount, lang)}
                              </span>
                              {p.proof_image_url && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(p.proof_image_url || null)}
                                  className="p-1 rounded bg-pearl hover:bg-rosegold-100 text-espresso transition"
                                  title="عرض الإيصال"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  p.status === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
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

                  {/* Cashier Final Settlement Button */}
                  {selectedBooking.status !== 'completed' && (
                    <div className="mt-5 pt-3 border-t border-pearl/80">
                      <button
                        type="button"
                        onClick={handleApproveFinalSettlement}
                        className="w-full py-3 px-4 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory font-semibold text-sm transition shadow-soft flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-rosegold-300" />
                        <span>
                          {lang === 'ar'
                            ? `اعتماد وإغلاق الفاتورة • تحصيل ${formatPrice(totals.remaining, 'ar')}`
                            : `Approve & Close Invoice • Collect ${formatPrice(totals.remaining, 'en')}`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-white border border-pearl/80 text-center text-mocha-400">
                <FileText className="w-10 h-10 mx-auto text-mocha-300 mb-2" />
                <p>{lang === 'ar' ? 'يرجى اختيار حجز من القائمة لإدارته' : 'Select a booking to view open tab'}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Add Extra Service */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-pearl w-full max-w-md p-5 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-pearl">
              <h3 className="font-bold text-espresso text-base">
                {lang === 'ar' ? 'إضافة خدمة إضافية للفاتورة' : 'Add In-Branch Extra Service'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddServiceModal(false)}
                className="p-1 rounded-lg hover:bg-pearl text-mocha-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto admin-scroll pe-1">
              {defaultServices.map((svc) => (
                <div
                  key={svc.id}
                  onClick={() => handleAddServiceAddon(svc)}
                  className="p-3 rounded-xl border border-pearl hover:border-rosegold-300 hover:bg-rosegold-50/30 cursor-pointer flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-semibold text-xs text-espresso">
                      {lang === 'ar' ? svc.name_ar : svc.name_en}
                    </div>
                    <div className="text-[11px] text-mocha-400">{svc.duration_minutes} دقيقة</div>
                  </div>
                  <div className="font-mono font-semibold text-xs text-rosegold-700">
                    {formatPrice(svc.price, lang)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Retail Product */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-pearl w-full max-w-md p-5 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-pearl">
              <h3 className="font-bold text-espresso text-base">
                {lang === 'ar' ? 'إضافة منتج عناية منزلية' : 'Add Retail Product'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-lg hover:bg-pearl text-mocha-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto admin-scroll pe-1">
              {defaultProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleAddProductAddon(prod)}
                  className="p-3 rounded-xl border border-pearl hover:border-rosegold-300 hover:bg-rosegold-50/30 cursor-pointer flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-semibold text-xs text-espresso">
                      {lang === 'ar' ? prod.name_ar : prod.name_en}
                    </div>
                    <div className="text-[11px] text-mocha-400">
                      {lang === 'ar' ? `المخزون: ${prod.stock_quantity} عبوة` : `Stock: ${prod.stock_quantity}`}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-xs text-rosegold-700">
                    {formatPrice(prod.price, lang)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dynamic QR Checkout */}
      {showQRModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-pearl w-full max-w-sm p-6 shadow-elevated text-center">
            <div className="flex items-center justify-between pb-3 border-b border-pearl mb-4">
              <h3 className="font-bold text-espresso text-sm">
                {lang === 'ar' ? 'امسحي الـ QR لسداد الفاتورة' : 'Scan to Checkout'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="p-1 rounded-lg hover:bg-pearl text-mocha-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <DynamicQRCode
              value={checkoutUrl}
              size={220}
              label={selectedBooking.customer_name}
              className="border-none shadow-none p-0"
            />

            <div className="mt-4 pt-3 border-t border-pearl">
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory text-xs font-semibold transition shadow-soft"
              >
                <span>{lang === 'ar' ? '📱 فتح الفاتورة مباشرة على هذا الجهاز (بدون كاميرا)' : 'Open Invoice on This Device'}</span>
              </a>
            </div>

            <p className="mt-3 text-[11px] text-mocha-500">
              {lang === 'ar'
                ? 'وجهي كاميرا الهاتف نحو الرمز لفتح الفاتورة أو اضغطي الزر أعلاه للفتح المباشر على هذا الجهاز'
                : 'Point camera at the code or click above to open directly on this screen'}
            </p>
          </div>
        </div>
      )}

      {/* Modal: Staff Attendance Clock In / Out */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 backdrop-blur-xs p-4">
          <div className="relative max-w-xl w-full bg-white rounded-3xl p-6 shadow-soft animate-fade-in border border-pearl/90 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-pearl/80">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 grid place-items-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-espresso">
                    {lang === 'ar' ? 'تسجيل حضور وانصراف الموظفات' : 'Staff Clock In / Out'}
                  </h3>
                  <p className="text-[11px] text-mocha-500">
                    {lang === 'ar' ? 'شاشة سريعة لتسجيل أخصائيات الصالون بـ PIN' : 'Fast staff check-in with PIN'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAttendanceModalOpen(false);
                  setAttError(null);
                }}
                className="p-1.5 rounded-full hover:bg-pearl/60 text-mocha-400 hover:text-espresso transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {attError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{attError}</span>
              </div>
            )}

            {/* Quick Clock In Form */}
            <form onSubmit={handleClockInSubmit} className="mt-4 p-4 rounded-2xl bg-ivory/60 border border-pearl/80 space-y-3">
              <div className="font-semibold text-xs text-espresso">
                {lang === 'ar' ? 'تسجيل حضور جديد:' : 'Clock In Staff:'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-mocha-500 block mb-1">
                    {lang === 'ar' ? 'الموظفة' : 'Staff'}
                  </label>
                  <select
                    required
                    value={attStaffId}
                    onChange={(e) => setAttStaffId(e.target.value)}
                    className="w-full rounded-xl border border-pearl bg-white px-3 py-2 text-xs text-espresso outline-none"
                  >
                    <option value="">{lang === 'ar' ? '-- اختاري الموظفة --' : '-- Select --'}</option>
                    {staffUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-mocha-500 block mb-1">
                    {lang === 'ar' ? 'الوردية' : 'Shift'}
                  </label>
                  <select
                    value={attShift}
                    onChange={(e) => setAttShift(e.target.value as ShiftType)}
                    className="w-full rounded-xl border border-pearl bg-white px-3 py-2 text-xs text-espresso outline-none"
                  >
                    <option value="morning">{lang === 'ar' ? 'صباحية (10ص - 4م)' : 'Morning'}</option>
                    <option value="evening">{lang === 'ar' ? 'مسائية (4م - 10م)' : 'Evening'}</option>
                    <option value="full_day">{lang === 'ar' ? 'يوم كامل' : 'Full Day'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-mocha-500 block mb-1">
                    {lang === 'ar' ? 'رمز الـ PIN' : 'Staff PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="1234"
                    value={attPin}
                    onChange={(e) => setAttPin(e.target.value)}
                    className="w-full rounded-xl border border-pearl bg-white px-3 py-2 text-xs text-espresso outline-none tracking-widest text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary text-xs py-2 mt-2"
              >
                {lang === 'ar' ? '✓ تسجيل الحضور الآن' : 'Clock In Now'}
              </button>
            </form>

            {/* Currently Active Staff List */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-espresso">
                  {lang === 'ar' ? 'الموظفات الحاضرات بالفرع حالياً:' : 'Active on Floor Now:'}
                </span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {activeStaffAttendance.length} {lang === 'ar' ? 'حاضرات' : 'Present'}
                </span>
              </div>

              {activeStaffAttendance.length === 0 ? (
                <div className="p-6 text-center text-xs text-mocha-400 bg-ivory/40 rounded-2xl border border-pearl/60">
                  {lang === 'ar' ? 'لا يوجد موظفات مسجلات حضور حالياً' : 'No staff currently clocked in'}
                </div>
              ) : (
                <div className="space-y-2">
                  {activeStaffAttendance.map((rec) => {
                    const inTime = new Date(rec.clock_in).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-pearl/80 bg-white hover:bg-ivory/30 transition shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <div>
                            <div className="font-semibold text-xs text-espresso">{rec.staff_name}</div>
                            <div className="text-[10px] text-mocha-500">
                              {rec.shift === 'morning' ? 'وردية صباحية' : rec.shift === 'evening' ? 'وردية مسائية' : 'يوم كامل'} • منذ {inTime}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleClockOutQuick(rec.staff_id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition"
                        >
                          {lang === 'ar' ? 'تسجيل انصراف' : 'Clock Out'}
                        </button>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full bg-white rounded-2xl p-4 shadow-elevated">
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 end-3 p-1.5 rounded-full bg-white/80 text-espresso hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs font-semibold text-espresso mb-2">
              {lang === 'ar' ? 'صورة إيصال التحويل' : 'Transfer Receipt'}
            </p>
            <img
              src={previewImageUrl}
              alt="Receipt Preview"
              className="rounded-xl max-h-[70vh] w-full object-contain mx-auto border border-pearl"
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-espresso text-ivory text-xs font-medium shadow-elevated flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rosegold-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
