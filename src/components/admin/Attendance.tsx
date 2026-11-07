import { useState, useMemo } from 'react';
import {
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Filter,
  CheckCircle2,
  Download,
  Search,
} from 'lucide-react';
import type { AttendanceRecord, ShiftType } from '../../lib/types';
import {
  getLocalAttendanceRecords,
  saveLocalAttendanceRecord,
  deleteLocalAttendanceRecord,
  getLocalStaffUsers,
  clockOutStaff,
} from '../../lib/mockData';
import { useLanguage } from '../../context/LanguageContext';

export default function Attendance() {
  const { lang } = useLanguage();
  const [records, setRecords] = useState<AttendanceRecord[]>(getLocalAttendanceRecords());
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Add Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [shift, setShift] = useState<ShiftType>('morning');
  const [manualInTime, setManualInTime] = useState('10:00');
  const [manualOutTime, setManualOutTime] = useState('');
  const [notes, setNotes] = useState('');

  const staffUsers = getLocalStaffUsers();

  const reloadRecords = () => {
    setRecords(getLocalAttendanceRecords());
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchDate = selectedDate ? r.date === selectedDate : true;
      const matchRole = roleFilter === 'all' ? true : r.role === roleFilter;
      const matchSearch = searchQuery
        ? r.staff_name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchDate && matchRole && matchSearch;
    });
  }, [records, selectedDate, roleFilter, searchQuery]);

  // Daily Statistics
  const stats = useMemo(() => {
    const todayRecords = records.filter((r) => r.date === selectedDate);
    const presentNow = todayRecords.filter((r) => !r.clock_out).length;
    const completed = todayRecords.filter((r) => !!r.clock_out).length;
    const late = todayRecords.filter((r) => r.status === 'late').length;
    const totalHours = todayRecords.reduce((acc, curr) => acc + (curr.total_hours || 0), 0);

    return {
      presentNow,
      completed,
      late,
      totalHours: Math.round(totalHours * 10) / 10,
    };
  }, [records, selectedDate]);

  const handleManualClockOut = (staffId: string) => {
    clockOutStaff(staffId, 'تسجيل انصراف يدوي من لوحة الإدارة');
    reloadRecords();
  };

  const handleDelete = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنتِ متأكدة من حذف هذا السجل؟' : 'Delete this attendance record?')) {
      deleteLocalAttendanceRecord(id);
      reloadRecords();
    }
  };

  const handleSaveManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    const staff = staffUsers.find((s) => s.id === selectedStaffId);
    if (!staff) return;

    const clockInIso = new Date(`${selectedDate}T${manualInTime}:00`).toISOString();
    const clockOutIso = manualOutTime
      ? new Date(`${selectedDate}T${manualOutTime}:00`).toISOString()
      : null;

    let diffHours: number | undefined = undefined;
    if (clockOutIso) {
      const start = new Date(clockInIso).getTime();
      const end = new Date(clockOutIso).getTime();
      diffHours = Math.max(0.1, Math.round(((end - start) / 3600000) * 10) / 10);
    }

    const newRecord: AttendanceRecord = {
      id: 'att-man-' + Date.now(),
      staff_id: staff.id,
      staff_name: staff.name,
      role: staff.role,
      date: selectedDate,
      clock_in: clockInIso,
      clock_out: clockOutIso,
      shift,
      status: clockOutIso ? 'completed' : 'present',
      total_hours: diffHours,
      notes: notes || 'تسجيل يدوي بواسطة الإدارة',
    };

    saveLocalAttendanceRecord(newRecord);
    reloadRecords();
    setModalOpen(false);
    setSelectedStaffId('');
    setNotes('');
  };

  const handleExportCSV = () => {
    const headers = ['الموظفة', 'الدور', 'التاريخ', 'الوردية', 'وقت الحضور', 'وقت الانصراف', 'إجمالي الساعات', 'الحالة', 'ملاحظات'];
    const rows = filteredRecords.map((r) => [
      r.staff_name,
      r.role,
      r.date,
      r.shift === 'morning' ? 'صباحية' : r.shift === 'evening' ? 'مسائية' : 'يوم كامل',
      new Date(r.clock_in).toLocaleTimeString('ar-EG'),
      r.clock_out ? new Date(r.clock_out).toLocaleTimeString('ar-EG') : 'حاضرة الآن',
      r.total_hours || '—',
      r.status,
      r.notes || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-espresso">
            {lang === 'ar' ? 'سجل حضور وانصراف الموظفات' : 'Staff Attendance & Shifts'}
          </h1>
          <p className="text-xs text-mocha-500 mt-1">
            {lang === 'ar'
              ? 'متابعة مباشرة لتواجد الأخصائيات وموظفات الاستقبال، الورديات، وساعات العمل اليومية'
              : 'Live tracking of salon specialists, shifts, clock-ins, and working hours'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-pearl/90 bg-white px-3.5 py-2 text-xs font-semibold text-mocha-700 shadow-clean hover:bg-ivory transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'تصدير كشف Excel' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{lang === 'ar' ? 'تسجيل حضور يدوي' : 'Manual Entry'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-clean">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              {lang === 'ar' ? 'حاضرات بالفرع الآن' : 'Clocked In Now'}
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="font-display text-2xl font-bold text-emerald-900 mt-2">
            {stats.presentNow}
          </div>
          <span className="text-[10px] text-emerald-700">
            {lang === 'ar' ? 'أخصائيات وموظفات نشطات' : 'Active on the floor'}
          </span>
        </div>

        <div className="rounded-2xl border border-pearl/90 bg-white p-4 shadow-clean">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-espresso">
              {lang === 'ar' ? 'انتهت ورديتهن' : 'Shifts Ended'}
            </span>
            <CheckCircle2 className="h-4 w-4 text-mocha-400" />
          </div>
          <div className="font-display text-2xl font-bold text-espresso mt-2">
            {stats.completed}
          </div>
          <span className="text-[10px] text-mocha-400">
            {lang === 'ar' ? 'تم تسجيل انصرافهن' : 'Clocked out today'}
          </span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-clean">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">
              {lang === 'ar' ? 'حالات تأخير' : 'Late Arrivals'}
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="font-display text-2xl font-bold text-amber-900 mt-2">
            {stats.late}
          </div>
          <span className="text-[10px] text-amber-700">
            {lang === 'ar' ? 'حضور بعد موعد الوردية' : 'Beyond grace period'}
          </span>
        </div>

        <div className="rounded-2xl border border-pearl/90 bg-white p-4 shadow-clean">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-espresso">
              {lang === 'ar' ? 'إجمالي الساعات المسجلة' : 'Hours Tracked'}
            </span>
            <Clock className="h-4 w-4 text-rosegold-500" />
          </div>
          <div className="font-display text-2xl font-bold text-espresso mt-2">
            {stats.totalHours} <span className="text-sm font-normal text-mocha-400">ساعة</span>
          </div>
          <span className="text-[10px] text-mocha-400">
            {lang === 'ar' ? 'إنتاجية اليوم' : 'Total productive time'}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-pearl/80 bg-white p-4 shadow-clean">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker */}
            <div className="flex items-center gap-2 rounded-xl border border-pearl/90 bg-ivory/60 px-3 py-1.5 text-xs text-espresso">
              <Calendar className="h-3.5 w-3.5 text-mocha-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-medium outline-none text-espresso"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2 rounded-xl border border-pearl/90 bg-ivory/60 px-3 py-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-mocha-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent font-medium outline-none text-espresso"
              >
                <option value="all">{lang === 'ar' ? 'كافة الوظائف' : 'All Roles'}</option>
                <option value="specialist">{lang === 'ar' ? 'أخصائيات تجميل' : 'Specialists'}</option>
                <option value="receptionist">{lang === 'ar' ? 'استقبال وكاشير' : 'Receptionists'}</option>
                <option value="manager">{lang === 'ar' ? 'إدارة الفرع' : 'Managers'}</option>
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px]">
            <Search className="absolute start-3 top-2.5 h-3.5 w-3.5 text-mocha-400" />
            <input
              type="text"
              placeholder={lang === 'ar' ? 'بحث باسم الموظفة...' : 'Search staff...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-pearl/90 bg-ivory/60 ps-8 pe-3 py-1.5 text-xs text-espresso placeholder:text-mocha-400 outline-none focus:border-rosegold-300"
            />
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="overflow-hidden rounded-2xl border border-pearl/80 bg-white shadow-clean">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-pearl/80 bg-ivory/80 text-[11px] font-semibold text-mocha-600">
              <tr>
                <th className="px-4 py-3 text-start">{lang === 'ar' ? 'الموظفة' : 'Staff'}</th>
                <th className="px-4 py-3 text-start">{lang === 'ar' ? 'الوظيفة' : 'Role'}</th>
                <th className="px-4 py-3 text-start">{lang === 'ar' ? 'الوردية' : 'Shift'}</th>
                <th className="px-4 py-3 text-start">{lang === 'ar' ? 'وقت الحضور' : 'Clock In'}</th>
                <th className="px-4 py-3 text-start">{lang === 'ar' ? 'وقت الانصراف' : 'Clock Out'}</th>
                <th className="px-4 py-3 text-start">{lang === 'ar' ? 'ساعات العمل' : 'Duration'}</th>
                <th className="px-4 py-3 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-3 text-start">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                <th className="px-4 py-3 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pearl/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-mocha-400">
                    {lang === 'ar' ? 'لا توجد تسجيلات حضور مطابقة لهذا اليوم' : 'No records found for this date'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const inTime = new Date(r.clock_in).toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const outTime = r.clock_out
                    ? new Date(r.clock_out).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : null;

                  return (
                    <tr key={r.id} className="hover:bg-ivory/50 transition">
                      <td className="px-4 py-3 font-semibold text-espresso">
                        {r.staff_name}
                      </td>
                      <td className="px-4 py-3 text-mocha-600">
                        {r.role === 'specialist'
                          ? 'أخصائية تجميل'
                          : r.role === 'receptionist'
                          ? 'استقبال وكاشير'
                          : r.role === 'manager'
                          ? 'مديرة فرع'
                          : 'إدارة'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md bg-pearl/60 px-2 py-0.5 text-[11px] text-mocha-700">
                          {r.shift === 'morning'
                            ? 'الصباحية'
                            : r.shift === 'evening'
                            ? 'المسائية'
                            : 'يوم كامل'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-espresso" dir="ltr">
                        {inTime}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-espresso" dir="ltr">
                        {outTime || (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            {lang === 'ar' ? 'حاضرة الآن' : 'Active'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-mocha-700">
                        {r.total_hours ? `${r.total_hours} س` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'late' ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            {lang === 'ar' ? 'متأخرة' : 'Late'}
                          </span>
                        ) : r.clock_out ? (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                            {lang === 'ar' ? 'انصرفت' : 'Completed'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            {lang === 'ar' ? 'منتظمة' : 'Present'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-mocha-500 max-w-[150px] truncate" title={r.notes}>
                        {r.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-end space-x-1">
                        {!r.clock_out && (
                          <button
                            onClick={() => handleManualClockOut(r.staff_id)}
                            className="rounded-lg bg-pearl/80 px-2.5 py-1 text-[11px] font-medium text-espresso hover:bg-rosegold-100 transition"
                            title={lang === 'ar' ? 'تسجيل انصراف الآن' : 'Clock out staff'}
                          >
                            {lang === 'ar' ? 'تسجيل انصراف' : 'Clock Out'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="rounded-lg p-1.5 text-mocha-400 hover:bg-red-50 hover:text-red-600 transition"
                          title={lang === 'ar' ? 'حذف السجل' : 'Delete'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft animate-fade-in border border-pearl/90">
            <h2 className="font-display text-lg font-bold text-espresso">
              {lang === 'ar' ? 'تسجيل حضور / انصراف يدوي' : 'Manual Attendance Entry'}
            </h2>
            <p className="text-xs text-mocha-500 mt-1">
              {lang === 'ar' ? 'إضافة أو تعديل ساعات حضور لأي من أخصائيات الصالون' : 'Add manual hours for staff'}
            </p>

            <form onSubmit={handleSaveManualRecord} className="mt-4 space-y-4">
              <div>
                <label className="field-label">{lang === 'ar' ? 'اختيار الموظفة' : 'Staff Member'}</label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="field-input text-xs"
                >
                  <option value="">{lang === 'ar' ? '-- اختاري الموظفة --' : '-- Select Staff --'}</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">{lang === 'ar' ? 'الوردية' : 'Shift'}</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShift('morning');
                      setManualInTime('10:00');
                    }}
                    className={[
                      'rounded-xl border py-2 text-xs font-semibold transition',
                      shift === 'morning'
                        ? 'border-espresso bg-espresso text-ivory'
                        : 'border-pearl/90 bg-ivory/60 text-mocha-600',
                    ].join(' ')}
                  >
                    {lang === 'ar' ? 'صباحية' : 'Morning'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShift('evening');
                      setManualInTime('16:00');
                    }}
                    className={[
                      'rounded-xl border py-2 text-xs font-semibold transition',
                      shift === 'evening'
                        ? 'border-espresso bg-espresso text-ivory'
                        : 'border-pearl/90 bg-ivory/60 text-mocha-600',
                    ].join(' ')}
                  >
                    {lang === 'ar' ? 'مسائية' : 'Evening'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShift('full_day');
                      setManualInTime('10:00');
                    }}
                    className={[
                      'rounded-xl border py-2 text-xs font-semibold transition',
                      shift === 'full_day'
                        ? 'border-espresso bg-espresso text-ivory'
                        : 'border-pearl/90 bg-ivory/60 text-mocha-600',
                    ].join(' ')}
                  >
                    {lang === 'ar' ? 'يوم كامل' : 'Full Day'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">{lang === 'ar' ? 'وقت الحضور' : 'Clock In'}</label>
                  <input
                    type="time"
                    required
                    value={manualInTime}
                    onChange={(e) => setManualInTime(e.target.value)}
                    className="field-input text-xs"
                  />
                </div>
                <div>
                  <label className="field-label">{lang === 'ar' ? 'وقت الانصراف (اختياري)' : 'Clock Out'}</label>
                  <input
                    type="time"
                    value={manualOutTime}
                    onChange={(e) => setManualOutTime(e.target.value)}
                    className="field-input text-xs"
                    placeholder="--:--"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">{lang === 'ar' ? 'ملاحظات / سبب التسجيل اليدوي' : 'Notes'}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: إذن رسمي، تعويض ساعات...' : 'e.g. Approved permission'}
                  className="field-input text-xs"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-4">
                  {lang === 'ar' ? 'حفظ السجل' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}