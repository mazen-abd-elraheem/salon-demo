import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  UserCheck,
  UserX,
  Search,
  Hash,
  Eye,
  EyeOff,
  Shuffle,
  Users,
  Lock,
} from 'lucide-react';
import PageHeader from './PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import {
  getLocalStaffUsers,
  saveLocalStaffUser,
  resetLocalStaffPassword,
  updateLocalStaffPin,
  normalizePinDigits,
} from '../../lib/mockData';
import { supabase } from '../../lib/supabase';
import { initialsFromName } from '../../lib/format';
import type { StaffUser, StaffRole } from '../../lib/types';

function generateSecurePin(length = 4): string {
  const arr = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 10);
  }
  const digits = Array.from(arr, (n) => String(n % 10)).join('');
  // Avoid trivial weak PINs like 1234 or 0000
  if (digits === '1234' || digits === '0000' || /^(\d)\1+$/.test(digits)) {
    return generateSecurePin(length);
  }
  return digits;
}

export default function RoleManagement() {
  const { lang } = useLanguage();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => getLocalStaffUsers());
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);

  // New staff form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('receptionist');
  const [initialPassword, setInitialPassword] = useState('');
  const [initialPin, setInitialPin] = useState(() => generateSecurePin(4));
  const [addError, setAddError] = useState<string | null>(null);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Attendance PIN change state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinValue, setShowPinValue] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ text: string; tone?: 'ok' | 'warn' } | null>(null);

  const reload = () => {
    setStaffUsers([...getLocalStaffUsers()]);
  };

  const showToast = (text: string, tone: 'ok' | 'warn' = 'ok') => {
    setToast({ text, tone });
    window.setTimeout(() => setToast(null), 3400);
  };

  const activeAdminCount = staffUsers.filter((u) => u.role === 'admin' && u.is_active).length;

  const handleRoleChange = async (userId: string, newRole: StaffRole) => {
    const user = staffUsers.find((u) => u.id === userId);
    if (!user) return;

    // Security audit guard: prevent demoting the last active Super Admin
    if (user.role === 'admin' && newRole !== 'admin' && activeAdminCount <= 1) {
      showToast(
        lang === 'ar'
          ? 'لا يمكن تخفيض صلاحية آخر حساب مدير عام نشط في النظام لمنع فقدان الوصول.'
          : 'Cannot demote the last active Super Admin account.',
        'warn',
      );
      return;
    }

    const updated = { ...user, role: newRole };
    saveLocalStaffUser(updated);
    try {
      await supabase.from('staff_users').update({ role: newRole }).eq('email', user.email);
    } catch {
      // local state already updated
    }
    reload();
    showToast(
      lang === 'ar'
        ? `تم تحديث صلاحية ${user.name} بنجاح`
        : `Role updated for ${user.name}`,
    );
  };

  const handleToggleActive = async (user: StaffUser) => {
    // Security audit guard: prevent suspending the last active Super Admin
    if (user.role === 'admin' && user.is_active && activeAdminCount <= 1) {
      showToast(
        lang === 'ar'
          ? 'لا يمكن تعليق آخر حساب مدير عام نشط لحماية استمرارية الإدارة.'
          : 'Cannot suspend the last active Super Admin account.',
        'warn',
      );
      return;
    }

    const updated = { ...user, is_active: !user.is_active };
    saveLocalStaffUser(updated);
    try {
      await supabase
        .from('staff_users')
        .update({ is_active: updated.is_active })
        .eq('email', user.email);
    } catch {
      // local state already updated
    }
    reload();
    showToast(
      updated.is_active
        ? lang === 'ar'
          ? `تم تفعيل حساب ${user.name}`
          : `Account activated for ${user.name}`
        : lang === 'ar'
        ? `تم تعليق حساب ${user.name} ومنع تسجيل حضوره`
        : `Account suspended for ${user.name}`,
    );
  };

  const handleOpenPasswordModal = (user: StaffUser) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowPasswordModal(true);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      setPasswordError(
        lang === 'ar'
          ? 'كلمة المرور يجب ألا تقل عن ٦ أحرف'
          : 'Password must be at least 6 characters',
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(
        lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match',
      );
      return;
    }
    resetLocalStaffPassword(selectedUser.id, newPassword);
    setShowPasswordModal(false);
    showToast(
      lang === 'ar'
        ? `تم تحديث كلمة مرور ${selectedUser.name} بنجاح`
        : `Password updated for ${selectedUser.name}`,
    );
  };

  const handleOpenPinModal = (user: StaffUser) => {
    setSelectedUser(user);
    setNewPin('');
    setConfirmPin('');
    setShowPinValue(false);
    setPinError(null);
    setShowPinModal(true);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const cleanPin = normalizePinDigits(newPin);
    const cleanConfirm = normalizePinDigits(confirmPin);

    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setPinError(
        lang === 'ar'
          ? 'رمز الحضور (PIN) يجب أن يتكون من ٤ إلى ٦ أرقام فقط'
          : 'Attendance PIN must be 4 to 6 digits only',
      );
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setPinError(
        lang === 'ar' ? 'رمزا الـ PIN غير متطابقين' : 'PIN confirmation does not match',
      );
      return;
    }

    if (cleanPin === '1234' || cleanPin === '0000' || /^(\d)\1+$/.test(cleanPin)) {
      setPinError(
        lang === 'ar'
          ? 'لأمان تسجيل الحضور، يرجى تجنب الرموز الضعيفة مثل 1234 أو الأرقام المتكررة'
          : 'For attendance security, please avoid weak PINs like 1234 or repeating digits',
      );
      return;
    }

    const res = updateLocalStaffPin(selectedUser.id, cleanPin);
    if (!res.ok) {
      setPinError(res.error || 'تعذر تحديث الرمز');
      return;
    }

    try {
      await supabase
        .from('staff_users')
        .update({ pin: cleanPin })
        .eq('email', selectedUser.email);
    } catch {
      // local update already persisted
    }

    reload();
    setShowPinModal(false);
    showToast(
      lang === 'ar'
        ? `تم تحديث رمز الحضور (PIN) لحساب ${selectedUser.name} وتفعيله فوراً في شاشة الاستقبال ✨`
        : `Attendance PIN updated for ${selectedUser.name} and synced to Reception POS ✨`,
    );
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!name.trim() || !email.trim()) return;

    const cleanPin = normalizePinDigits(initialPin);
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setAddError(
        lang === 'ar'
          ? 'رمز الحضور (PIN) يجب أن يتكون من ٤ إلى ٦ أرقام'
          : 'Attendance PIN must be 4 to 6 digits',
      );
      return;
    }

    if (staffUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setAddError(
        lang === 'ar'
          ? 'هذا البريد الإلكتروني مسجل بالفعل لحساب آخر'
          : 'This email is already registered to another staff account',
      );
      return;
    }

    const newUser: StaffUser = {
      id: 'staff-' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      pin: cleanPin,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    saveLocalStaffUser(newUser);
    if (initialPassword) {
      resetLocalStaffPassword(newUser.id, initialPassword);
    }

    try {
      await supabase.from('staff_users').insert({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || null,
        role: newUser.role,
        pin: cleanPin,
        is_active: true,
      });
    } catch {
      // local storage already saved
    }

    reload();
    setName('');
    setEmail('');
    setPhone('');
    setInitialPassword('');
    setInitialPin(generateSecurePin(4));
    setShowAddModal(false);
    showToast(
      lang === 'ar'
        ? `تم إنشاء حساب ${newUser.name} وتعيين رمز الحضور (PIN) بنجاح ✨`
        : `Staff account created for ${newUser.name} with personal PIN ✨`,
    );
  };

  const roleLabels: Record<StaffRole, { ar: string; en: string; badge: string }> = {
    admin: {
      ar: 'مدير عام',
      en: 'Admin',
      badge: 'bg-[#3a1d43] text-white',
    },
    manager: {
      ar: 'مديرة الفرع',
      en: 'Manager',
      badge: 'bg-[#cbb6ea]/55 text-[#3a1d43] border border-[#cbb6ea]',
    },
    receptionist: {
      ar: 'استقبال وكاشير',
      en: 'Receptionist',
      badge: 'bg-[#f3e6f0] text-[#73358c] border border-[#e8d7e4]',
    },
    specialist: {
      ar: 'أخصائية تجميل',
      en: 'Specialist',
      badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
  };

  const filtered = staffUsers.filter((u) => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q));

    if (!matchQuery) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return true;
  });

  const customPinCount = staffUsers.filter((u) => u.pin && u.pin !== '1234').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={lang === 'ar' ? 'الحسابات والصلاحيات (RBAC)' : 'Staff Accounts & Security'}
        title={
          lang === 'ar'
            ? 'إدارة حسابات الطاقم ورموز الحضور (PIN)'
            : 'Staff Accounts, Roles & Attendance PINs'
        }
        subtitle={
          lang === 'ar'
            ? 'تحديد صلاحيات الوصول، تغيير كلمات المرور، وتخصيص رمز الحضور (PIN) السري لكل موظفة لتسجيل الحضور والانصراف بدقة.'
            : 'Manage role-based access control, passwords, and personal attendance PINs synced directly with Reception POS.'
        }
        actions={
          <button
            type="button"
            onClick={() => {
              setAddError(null);
              setInitialPin(generateSecurePin(4));
              setShowAddModal(true);
            }}
            className="btn-primary !px-5 !py-2.5 !text-xs font-bold cursor-pointer border-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>{lang === 'ar' ? 'إضافة موظفة جديدة' : 'Add Staff Account'}</span>
          </button>
        }
      />

      {/* KPI Security Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-[#e8d7e4] bg-white/88 p-5 backdrop-blur-md shadow-softer">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#3a1d43]/55">
              {lang === 'ar' ? 'إجمالي الطاقم' : 'Total Staff'}
            </span>
            <Users className="h-4 w-4 text-[#73358c]" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold text-[#3a1d43]">
            {staffUsers.length}
          </div>
        </div>

        <div className="rounded-3xl border border-[#e8d7e4] bg-white/88 p-5 backdrop-blur-md shadow-softer">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#3a1d43]/55">
              {lang === 'ar' ? 'حسابات نشطة' : 'Active Accounts'}
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold text-emerald-700">
            {staffUsers.filter((u) => u.is_active).length}
          </div>
        </div>

        <div className="rounded-3xl border border-[#e8d7e4] bg-white/88 p-5 backdrop-blur-md shadow-softer">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#3a1d43]/55">
              {lang === 'ar' ? 'رموز PIN مخصصة وآمنة' : 'Custom Secure PINs'}
            </span>
            <Hash className="h-4 w-4 text-[#b14bd9]" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold text-[#73358c]">
            {customPinCount} <span className="text-xs text-[#3a1d43]/45">/ {staffUsers.length}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[#3a1d43] bg-[#3a1d43] p-5 text-white shadow-[0_14px_34px_-12px_rgba(58,29,67,0.35)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#cbb6ea]">
              {lang === 'ar' ? 'حماية التحقق' : 'PIN Protection'}
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xs font-bold text-white leading-snug">
            {lang === 'ar'
              ? 'تحقق صارم + قفل تلقائي بعد ٥ محاولات خاطئة'
              : 'Strict per-staff PIN + 5-attempt lockout'}
          </div>
        </div>
      </div>

      {/* Filter Pills + Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
            { id: 'admin', label: lang === 'ar' ? 'إدارة عامة' : 'Admin' },
            { id: 'manager', label: lang === 'ar' ? 'مديرة فرع' : 'Manager' },
            { id: 'receptionist', label: lang === 'ar' ? 'استقبال وكاشير' : 'Reception' },
            { id: 'specialist', label: lang === 'ar' ? 'أخصائيات' : 'Specialists' },
          ].map((r) => {
            const active = roleFilter === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoleFilter(r.id)}
                className="px-4 py-2 rounded-full text-xs font-bold border transition cursor-pointer"
                style={{
                  backgroundColor: active ? '#3a1d43' : 'rgba(255,255,255,0.85)',
                  borderColor: active ? '#3a1d43' : 'rgba(58,29,67,0.12)',
                  color: active ? '#ffffff' : '#3a1d43',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3a1d43]/45" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالاسم، الإيميل، أو الموبايل...' : 'Search name, email, phone…'}
            className="w-full rounded-full border border-[#e8d7e4] bg-white/90 py-2.5 ps-10 pe-4 text-xs sm:text-sm text-[#3a1d43] outline-none transition focus:border-[#b14bd9]"
          />
        </div>
      </div>

      {/* Staff Accounts Glass Table */}
      <div
        className="rounded-3xl border overflow-hidden backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(58, 29, 67, 0.09)',
          boxShadow: '0 16px 44px -18px rgba(58, 29, 67, 0.1)',
        }}
      >
        <div className="overflow-x-auto admin-scroll">
          <table className="w-full text-start text-xs">
            <thead>
              <tr
                className="border-b text-[11px] font-bold uppercase tracking-wider text-[#3a1d43]/55"
                style={{
                  backgroundColor: 'rgba(243, 230, 240, 0.65)',
                  borderColor: 'rgba(58, 29, 67, 0.08)',
                }}
              >
                <th className="py-4 px-5 text-start">{lang === 'ar' ? 'الموظفة والحساب' : 'Staff Account'}</th>
                <th className="py-4 px-4 text-start">{lang === 'ar' ? 'الدور والصلاحية' : 'Role'}</th>
                <th className="py-4 px-4 text-start">{lang === 'ar' ? 'رمز الحضور (PIN)' : 'Attendance PIN'}</th>
                <th className="py-4 px-4 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="py-4 px-4 text-start">{lang === 'ar' ? 'تعديل الدور' : 'Assign Role'}</th>
                <th className="py-4 px-5 text-end">{lang === 'ar' ? 'الأمان والإجراءات' : 'Security Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8d7e4]/80">
              {filtered.map((user) => {
                const badgeInfo = roleLabels[user.role] || roleLabels.receptionist;
                const hasCustomPin = Boolean(user.pin && user.pin !== '1234');
                return (
                  <tr key={user.id} className="hover:bg-[#f9f0f5]/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#cbb6ea]/55 border border-[#b14bd9]/20 text-xs font-bold text-[#3a1d43]">
                          {initialsFromName(user.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#3a1d43] text-sm truncate">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-[#3a1d43]/60 font-mono flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-[#b14bd9]" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="text-[10px] text-[#3a1d43]/50 font-mono mt-0.5" dir="ltr">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${badgeInfo.badge}`}>
                        {lang === 'ar' ? badgeInfo.ar : badgeInfo.en}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#3a1d43] tracking-widest">
                          <Lock className="w-3 h-3 text-[#73358c]" />
                          <span>{'•'.repeat((user.pin || '1234').length)}</span>
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            hasCustomPin
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-[#f3e6f0] text-[#73358c] border border-[#cbb6ea]'
                          }`}
                        >
                          {hasCustomPin
                            ? lang === 'ar'
                              ? 'PIN مخصص وآمن'
                              : 'Custom PIN'
                            : lang === 'ar'
                            ? 'افتراضي (يُنصح بتغييره)'
                            : 'Default (Change)'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>
                          {user.is_active
                            ? lang === 'ar'
                              ? 'نشط'
                              : 'Active'
                            : lang === 'ar'
                            ? 'معلق'
                            : 'Suspended'}
                        </span>
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as StaffRole)}
                        className="px-3 py-1.5 rounded-full border border-[#e8d7e4] bg-[#f9f0f5] text-xs font-bold text-[#3a1d43] focus:border-[#b14bd9] focus:outline-none cursor-pointer"
                      >
                        <option value="admin">{lang === 'ar' ? 'مدير عام (Admin)' : 'Admin'}</option>
                        <option value="manager">{lang === 'ar' ? 'مديرة الفرع (Manager)' : 'Manager'}</option>
                        <option value="receptionist">{lang === 'ar' ? 'استقبال وكاشير' : 'Receptionist'}</option>
                        <option value="specialist">{lang === 'ar' ? 'أخصائية تجميل' : 'Specialist'}</option>
                      </select>
                    </td>

                    <td className="py-4 px-5 text-end whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Change Attendance PIN Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenPinModal(user)}
                          className="px-3 py-1.5 rounded-full border border-[#cbb6ea] bg-[#f3e6f0] hover:bg-[#cbb6ea]/60 text-xs font-bold text-[#3a1d43] transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Hash className="w-3.5 h-3.5 text-[#73358c]" />
                          <span>{lang === 'ar' ? 'تغيير PIN' : 'Set PIN'}</span>
                        </button>

                        {/* Change Password Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenPasswordModal(user)}
                          className="px-3 py-1.5 rounded-full border border-[#e8d7e4] bg-white hover:bg-[#f9f0f5] text-xs font-bold text-[#3a1d43] transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#b14bd9]" />
                          <span>{lang === 'ar' ? 'كلمة المرور' : 'Password'}</span>
                        </button>

                        {/* Suspend / Activate */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          className={`p-2 rounded-full border transition cursor-pointer ${
                            user.is_active
                              ? 'border-[#e8d7e4] bg-white text-[#3a1d43]/60 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                          title={user.is_active ? 'تعليق الحساب' : 'تفعيل الحساب'}
                        >
                          {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#25142d]/45 backdrop-blur-xs p-4"
          onClick={() => setShowAddModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAddStaff}
            className="bg-white rounded-3xl border border-[#e8d7e4] max-w-md w-full p-6 shadow-2xl text-start space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e8d7e4]">
              <div>
                <h3 className="font-display font-bold text-lg text-[#3a1d43]">
                  {lang === 'ar' ? 'إضافة حساب موظفة جديدة' : 'Add New Staff Account'}
                </h3>
                <p className="text-[11px] text-[#3a1d43]/60">
                  {lang === 'ar' ? 'تعيين الصلاحية وكلمة المرور ورمز الـ PIN للحضور' : 'Assign role, password, and attendance PIN'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f3e6f0] text-[#3a1d43]/60 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#3a1d43] mb-1">
                {lang === 'ar' ? 'الاسم بالكامل:' : 'Full Name:'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: ياسمين عبد العزيز' : 'e.g. Yasmine Abdelaziz'}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/60 text-xs text-[#3a1d43] focus:border-[#b14bd9] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3a1d43] mb-1">
                {lang === 'ar' ? 'البريد الإلكتروني المهني:' : 'Work Email:'}
              </label>
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@guzelspa.beauty"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/60 text-xs font-mono text-[#3a1d43] focus:border-[#b14bd9] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3a1d43] mb-1">
                  {lang === 'ar' ? 'الدور الوظيفي:' : 'Assigned Role:'}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/60 text-xs font-bold text-[#3a1d43] focus:border-[#b14bd9] focus:outline-none"
                >
                  <option value="admin">{lang === 'ar' ? 'مدير عام' : 'Admin'}</option>
                  <option value="manager">{lang === 'ar' ? 'مديرة فرع' : 'Manager'}</option>
                  <option value="receptionist">{lang === 'ar' ? 'استقبال وكاشير' : 'Receptionist'}</option>
                  <option value="specialist">{lang === 'ar' ? 'أخصائية تجميل' : 'Specialist'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a1d43] mb-1">
                  {lang === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/60 text-xs font-mono text-[#3a1d43] focus:border-[#b14bd9] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3a1d43] mb-1">
                  {lang === 'ar' ? 'كلمة المرور:' : 'Initial Password:'}
                </label>
                <input
                  type="password"
                  required
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/60 text-xs font-mono text-[#3a1d43] focus:border-[#b14bd9] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#3a1d43]">
                    {lang === 'ar' ? 'رمز الحضور PIN:' : 'Attendance PIN:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setInitialPin(generateSecurePin(4))}
                    className="text-[10px] font-bold text-[#73358c] hover:underline inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'توليد' : 'Auto'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  dir="ltr"
                  value={initialPin}
                  onChange={(e) => setInitialPin(normalizePinDigits(e.target.value))}
                  placeholder="4-6 digits"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/60 text-center tracking-widest text-xs font-mono font-bold text-[#3a1d43] focus:border-[#b14bd9] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e8d7e4]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-full border border-[#e8d7e4] text-xs font-bold text-[#3a1d43]/70 hover:bg-[#f9f0f5] cursor-pointer bg-white"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#3a1d43] hover:opacity-90 text-white text-xs font-bold shadow-soft cursor-pointer border-0"
              >
                {lang === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Attendance PIN Change Modal */}
      {showPinModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#25142d]/45 backdrop-blur-xs p-4"
          onClick={() => setShowPinModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSavePin}
            className="bg-white rounded-3xl border border-[#e8d7e4] max-w-sm w-full p-6 shadow-2xl text-start space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e8d7e4]">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#f3e6f0] text-[#73358c]">
                  <Hash className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-base text-[#3a1d43]">
                    {lang === 'ar' ? 'تغيير رمز الحضور (PIN)' : 'Change Attendance PIN'}
                  </h3>
                  <p className="text-xs text-[#3a1d43]/60">{selectedUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f3e6f0] text-[#3a1d43]/60 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#f9f0f5] border border-[#e8d7e4] p-3 text-[11px] text-[#3a1d43]/75 leading-relaxed">
              {lang === 'ar'
                ? 'يُستخدم هذا الرمز الشخصي حصرياً لتسجيل حضور وانصراف الموظفة في شاشة الاستقبال (POS). بمجرد الحفظ يتعطل أي رمز قديم فوراً.'
                : 'This personal PIN is strictly required for staff clock-in and verified clock-out on Reception POS. Saving immediately revokes the previous PIN.'}
            </div>

            {pinError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{pinError}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#3a1d43]">
                  {lang === 'ar' ? 'رمز الـ PIN الجديد (٤ - ٦ أرقام):' : 'New PIN (4–6 digits):'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateSecurePin(4);
                    setNewPin(generated);
                    setConfirmPin(generated);
                    setShowPinValue(true);
                    setPinError(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f3e6f0] hover:bg-[#cbb6ea]/50 px-2.5 py-0.5 text-[10px] font-bold text-[#73358c] transition cursor-pointer border-0"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'توليد رمز آمن' : 'Generate PIN'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPinValue ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  required
                  dir="ltr"
                  value={newPin}
                  onChange={(e) => setNewPin(normalizePinDigits(e.target.value))}
                  placeholder="••••"
                  className="w-full px-10 py-3 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/70 text-center tracking-[0.4em] text-base font-mono font-bold text-[#3a1d43] focus:border-[#b14bd9] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPinValue((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-[#3a1d43]/50 hover:text-[#3a1d43] cursor-pointer bg-transparent border-0 p-1"
                  aria-label="Toggle PIN visibility"
                >
                  {showPinValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3a1d43] mb-1.5">
                {lang === 'ar' ? 'تأكيد رمز الـ PIN:' : 'Confirm New PIN:'}
              </label>
              <input
                type={showPinValue ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                required
                dir="ltr"
                value={confirmPin}
                onChange={(e) => setConfirmPin(normalizePinDigits(e.target.value))}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/70 text-center tracking-[0.4em] text-base font-mono font-bold text-[#3a1d43] focus:border-[#b14bd9] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e8d7e4]">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="px-4 py-2 rounded-full border border-[#e8d7e4] text-xs font-bold text-[#3a1d43]/70 hover:bg-[#f9f0f5] cursor-pointer bg-white"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#3a1d43] hover:opacity-90 text-white text-xs font-bold shadow-soft cursor-pointer border-0"
              >
                {lang === 'ar' ? 'حفظ وتفعيل الـ PIN' : 'Save & Activate PIN'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#25142d]/45 backdrop-blur-xs p-4"
          onClick={() => setShowPasswordModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSavePassword}
            className="bg-white rounded-3xl border border-[#e8d7e4] max-w-sm w-full p-6 shadow-2xl text-start space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e8d7e4]">
              <div>
                <h3 className="font-display font-bold text-base text-[#3a1d43]">
                  {lang === 'ar' ? 'تغيير كلمة مرور الدخول' : 'Change Login Password'}
                </h3>
                <p className="text-xs text-[#3a1d43]/60 mt-0.5">{selectedUser.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f3e6f0] text-[#3a1d43]/60 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#3a1d43] mb-1">
                {lang === 'ar' ? 'كلمة المرور الجديدة:' : 'New Password:'}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/60 text-xs font-mono text-[#3a1d43] focus:border-[#b14bd9] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3a1d43] mb-1">
                {lang === 'ar' ? 'تأكيد كلمة المرور:' : 'Confirm Password:'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e8d7e4] bg-[#f9f0f5]/60 text-xs font-mono text-[#3a1d43] focus:border-[#b14bd9] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e8d7e4]">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-full border border-[#e8d7e4] text-xs font-bold text-[#3a1d43]/70 hover:bg-[#f9f0f5] cursor-pointer bg-white"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#3a1d43] hover:opacity-90 text-white text-xs font-bold shadow-soft cursor-pointer border-0"
              >
                {lang === 'ar' ? 'حفظ كلمة المرور' : 'Save Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 start-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 ${
            toast.tone === 'warn'
              ? 'bg-rose-700 text-white'
              : 'bg-[#3a1d43] text-white'
          }`}
        >
          {toast.tone === 'warn' ? (
            <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#cbb6ea] shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
