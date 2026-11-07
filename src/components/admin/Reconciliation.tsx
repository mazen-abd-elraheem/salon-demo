import React, { useState, useMemo } from 'react';
import {
  Banknote,
  CreditCard,
  Smartphone,
  TrendingUp,
  Calendar,
  Clock,
  Printer,
  Download,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Building,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatPrice } from '../../lib/format';
import { getLocalBookings, defaultShifts, defaultRooms } from '../../lib/mockData';
import type { Payment, Booking } from '../../lib/types';

export default function Reconciliation() {
  const { lang } = useLanguage();
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedShift, setSelectedShift] = useState<string>('all');

  // Load all bookings
  const bookings = useMemo(() => getLocalBookings(), []);

  // Filter payments for the selected date & shift
  const payments = useMemo(() => {
    const list: Array<Payment & { booking: Booking }> = [];

    bookings.forEach((b) => {
      // Check if booking was for today or had payments today
      (b.payments || []).forEach((p) => {
        if (p.status !== 'verified') return;
        const pDate = (p.verified_at || p.created_at).split('T')[0];
        if (pDate !== selectedDate) return;

        if (selectedShift !== 'all') {
          if (selectedShift === 'morning' && p.shift_name !== 'وردية صباحية' && p.shift_id !== 'shift-1')
            return;
          if (selectedShift === 'evening' && p.shift_name !== 'وردية مسائية' && p.shift_id !== 'shift-2')
            return;
        }

        list.push({ ...p, booking: b });
      });
    });

    return list;
  }, [bookings, selectedDate, selectedShift]);

  // Aggregate totals
  const totals = useMemo(() => {
    let cash = 0;
    let vodafone = 0;
    let instapay = 0;
    let deposits = 0;
    let settlements = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (p.method === 'cash') cash += amt;
      else if (p.method === 'vodafone_cash') vodafone += amt;
      else if (p.method === 'instapay') instapay += amt;

      if (p.payment_type === 'deposit') deposits += amt;
      else if (p.payment_type === 'settlement') settlements += amt;
    });

    const grandTotal = cash + vodafone + instapay;
    return { cash, vodafone, instapay, deposits, settlements, grandTotal };
  }, [payments]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = ['التاريخ', 'رقم الحجز', 'اسم العميلة', 'وسيلة الدفع', 'النوع', 'المبلغ (ج.م)', 'الموظفة المسؤولة', 'الوردية'];
    const rows = payments.map((p) => [
      (p.verified_at || p.created_at).slice(0, 16).replace('T', ' '),
      p.booking.booking_number,
      p.booking.customer_name,
      p.method === 'cash' ? 'كاش بالدرج' : p.method === 'vodafone_cash' ? 'فودافون كاش' : 'انستا باي',
      p.payment_type === 'deposit' ? 'عربون 50%' : 'سداد نهائي بالفرع',
      p.amount,
      p.verified_by_staff_name || 'رنا نبيل',
      p.shift_name || 'عام',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reconciliation_${selectedDate}_${selectedShift}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-pearl/80">
        <div>
          <h1 className="text-xl font-bold font-display text-espresso">
            {lang === 'ar' ? 'التقفيل المالي والورديات اليومية' : 'Daily Shift Reconciliation'}
          </h1>
          <p className="text-xs text-mocha-500 mt-1">
            {lang === 'ar'
              ? 'تقرير محاسبي مفصل بحصيلة الدرج والكاش والتحويلات الرقمية لكل وردية'
              : 'Detailed end-of-day accounting across cash drawer, InstaPay and Vodafone Cash'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pearl bg-white text-xs">
            <Calendar className="w-3.5 h-3.5 text-mocha-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="focus:outline-none font-mono text-espresso text-xs"
            />
          </div>

          {/* Shift Selector */}
          <div className="flex items-center rounded-xl border border-pearl bg-white p-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedShift('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedShift === 'all'
                  ? 'bg-espresso text-ivory font-semibold'
                  : 'text-mocha-500 hover:text-espresso'
              }`}
            >
              {lang === 'ar' ? 'اليوم بالكامل' : 'Full Day'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedShift('morning')}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedShift === 'morning'
                  ? 'bg-espresso text-ivory font-semibold'
                  : 'text-mocha-500 hover:text-espresso'
              }`}
            >
              {lang === 'ar' ? 'الصباحية (10-16)' : 'Morning'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedShift('evening')}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedShift === 'evening'
                  ? 'bg-espresso text-ivory font-semibold'
                  : 'text-mocha-500 hover:text-espresso'
              }`}
            >
              {lang === 'ar' ? 'المسائية (16-23)' : 'Evening'}
            </button>
          </div>

          {/* Action buttons */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-mocha-400/20 bg-pearl/40 hover:bg-pearl/80 text-xs font-semibold text-espresso transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصدير كشف Excel' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'طباعة التقفيل' : 'Print Sheet'}</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash in Drawer */}
        <div className="p-5 rounded-2xl bg-white border border-pearl/80 shadow-soft">
          <div className="flex items-center justify-between text-xs text-mocha-500 mb-2">
            <span>{lang === 'ar' ? 'إجمالي الكاش بالدرج' : 'Cash in Drawer'}</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-espresso">
            {formatPrice(totals.cash, lang)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-700">
            {lang === 'ar' ? 'نقدية فعلية بالخزينة' : 'Physical Cash in Register'}
          </div>
        </div>

        {/* Vodafone Cash */}
        <div className="p-5 rounded-2xl bg-white border border-pearl/80 shadow-soft">
          <div className="flex items-center justify-between text-xs text-mocha-500 mb-2">
            <span>{lang === 'ar' ? 'إجمالي فودافون كاش' : 'Vodafone Cash'}</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-espresso">
            {formatPrice(totals.vodafone, lang)}
          </div>
          <div className="mt-2 text-[11px] text-rose-700">
            {lang === 'ar' ? 'محفظة الصالون: 01012345678' : 'Salon Wallet'}
          </div>
        </div>

        {/* InstaPay */}
        <div className="p-5 rounded-2xl bg-white border border-pearl/80 shadow-soft">
          <div className="flex items-center justify-between text-xs text-mocha-500 mb-2">
            <span>{lang === 'ar' ? 'إجمالي انستا باي' : 'InstaPay'}</span>
            <span className="p-2 rounded-xl bg-rosegold-100 text-rosegold-700">
              <Smartphone className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-espresso">
            {formatPrice(totals.instapay, lang)}
          </div>
          <div className="mt-2 text-[11px] text-rosegold-700">
            {lang === 'ar' ? 'حساب بنكي فوري' : 'Direct Bank Transfers'}
          </div>
        </div>

        {/* Grand Total Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-espresso to-mocha-900 text-ivory shadow-soft">
          <div className="flex items-center justify-between text-xs text-pearl/70 mb-2">
            <span>{lang === 'ar' ? 'إجمالي الإيراد المحصل' : 'Total Revenue Collected'}</span>
            <span className="p-2 rounded-xl bg-white/10 text-rosegold-300">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-ivory">
            {formatPrice(totals.grandTotal, lang)}
          </div>
          <div className="mt-2 text-[11px] text-pearl/80 flex items-center justify-between">
            <span>{lang === 'ar' ? 'عربين: ' : 'Deposits: '} {formatPrice(totals.deposits, lang)}</span>
            <span>•</span>
            <span>{lang === 'ar' ? 'سداد نهائي: ' : 'Finals: '} {formatPrice(totals.settlements, lang)}</span>
          </div>
        </div>
      </div>

      {/* Room & Stations Utilization */}
      <div className="p-5 rounded-2xl bg-white border border-pearl/80 shadow-soft">
        <h3 className="text-sm font-bold text-espresso mb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-rosegold-500" />
          <span>{lang === 'ar' ? 'إشغال الغرف ومحطات العناية بالفرع' : 'Room & Station Capacity'}</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {defaultRooms.map((room) => (
            <div key={room.id} className="p-3 rounded-xl bg-ivory border border-pearl/70 text-center">
              <p className="font-semibold text-espresso">{lang === 'ar' ? room.name_ar : room.name_en}</p>
              <p className="text-[11px] text-mocha-400 mt-0.5">
                {lang === 'ar' ? `السعة: ${room.capacity} عميلة` : `Capacity: ${room.capacity}`}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{lang === 'ar' ? 'مجهزة ونشطة' : 'Active'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Ledger Audit Table */}
      <div className="rounded-2xl bg-white border border-pearl/80 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-pearl flex items-center justify-between">
          <h3 className="text-sm font-bold text-espresso">
            {lang === 'ar' ? 'سجل العمليات والتحصيلات المعتمدة' : 'Verified Transactions Ledger'}
          </h3>
          <span className="text-xs text-mocha-400">
            {payments.length} {lang === 'ar' ? 'عملية مسجلة' : 'transactions'}
          </span>
        </div>

        <div className="overflow-x-auto admin-scroll">
          <table className="w-full text-start text-xs">
            <thead className="bg-ivory border-b border-pearl text-mocha-500 font-semibold">
              <tr>
                <th className="py-3 px-4 text-start">{lang === 'ar' ? 'الوقت' : 'Time'}</th>
                <th className="py-3 px-4 text-start">{lang === 'ar' ? 'رقم الحجز' : 'Booking #'}</th>
                <th className="py-3 px-4 text-start">{lang === 'ar' ? 'اسم العميلة' : 'Customer'}</th>
                <th className="py-3 px-4 text-start">{lang === 'ar' ? 'القناة' : 'Method'}</th>
                <th className="py-3 px-4 text-start">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                <th className="py-3 px-4 text-start">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th className="py-3 px-4 text-start">{lang === 'ar' ? 'الموظفة المعتمدة' : 'Staff Audit'}</th>
                <th className="py-3 px-4 text-start">{lang === 'ar' ? 'الوردية' : 'Shift'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pearl/60">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-mocha-400">
                    {lang === 'ar'
                      ? 'لا توجد مدفوعات معتمدة في هذا التاريخ أو الوردية'
                      : 'No payments found for this date/shift'}
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-pearl/20 transition">
                    <td className="py-3 px-4 font-mono text-mocha-500">
                      {(p.verified_at || p.created_at).slice(11, 16)}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-espresso">
                      {p.booking.booking_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-espresso">
                      {p.booking.customer_name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.method === 'cash'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.method === 'vodafone_cash'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-rosegold-50 text-rosegold-800 border border-rosegold-200'
                        }`}
                      >
                        {p.method === 'cash'
                          ? 'كاش بالدرج'
                          : p.method === 'vodafone_cash'
                          ? 'فودافون كاش'
                          : 'InstaPay'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-mocha-500">
                      {p.payment_type === 'deposit' ? 'عربون ٥٠٪' : 'سداد نهائي بالفرع'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-espresso">
                      {formatPrice(p.amount, lang)}
                    </td>
                    <td className="py-3 px-4 text-mocha-600 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-rosegold-500" />
                      <span>{p.verified_by_staff_name || 'رنا نبيل'}</span>
                    </td>
                    <td className="py-3 px-4 text-mocha-400">
                      {p.shift_name || 'مسائية'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

