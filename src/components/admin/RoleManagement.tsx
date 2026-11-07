import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Lock,
  Search,
} from 'lucide-react';
import PageHeader from './PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import {
  getLocalStaffUsers,
  saveLocalStaffUser,
  resetLocalStaffPassword,
} from '../../lib/mockData';
import type { StaffUser, StaffRole } from '../../lib/types';

export default function RoleManagement() {
  const { lang } = useLanguage();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => getLocalStaffUsers());
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);

  // New staff form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('receptionist');
  const [initialPassword, setInitialPassword] = useState('');

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reload = () => {
    setStaffUsers([...getLocalStaffUsers()]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRoleChange = (userId: string, newRole: StaffRole) => {
    const user = staffUsers.find((u) => u.id === userId);
    if (!user) return;
    const updated = { ...user, role: newRole };
    saveLocalStaffUser(updated);
    reload();
    showToast(lang === 'ar' ? `تم تغيير دور ${user.name} بنجاح` : `Role updated for ${user.name}`);
  };

  const handleToggleActive = (user: StaffUser) => {
    const updated = { ...user, is_active: !user.is_active };
    saveLocalStaffUser(updated);
    reload();
    showToast(
      updated.is_active
        ? lang === 'ar'
          ? `تم تفعيل حساب ${user.name}`
          : `Account activated`
        : lang === 'ar'
        ? `تم تعليق حساب ${user.name}`
        : `Account suspended`,
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
      setPasswordError(lang === 'ar' ? 'كلمة المرور يجب ألا تقل عن ٦ أحرف' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    resetLocalStaffPassword(selectedUser.id, newPassword);
    setShowPasswordModal(false);
    showToast(lang === 'ar' ? `تم تغيير كلمة المرور لـ ${selectedUser.name} بنجاح` : 'Password reset successfully');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newUser: StaffUser = {
      id: 'staff-' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    saveLocalStaffUser(newUser);
    if (initialPassword) {
      resetLocalStaffPassword(newUser.id, initialPassword);
    }
    reload();
    setShowAddModal(false);
    showToast(lang === 'ar' ? 'تمت إضافة الموظفة بنجاح' : 'Staff added successfully');
  };

  const roleLabels: Record<StaffRole, { ar: string; en: string; badge: string }> = {
    admin: { ar: 'مدير عام', en: 'Admin', badge: 'bg-purple-100 text-purple-800' },
    manager: { ar: 'مديرة الفرع', en: 'Manager', badge: 'bg-blue-100 text-blue-800' },
    receptionist: { ar: 'موظفة استقبال وكاشير', en: 'Receptionist', badge: 'bg-amber-100 text-amber-800' },
    specialist: { ar: 'أخصائية تجميل', en: 'Specialist', badge: 'bg-emerald-100 text-emerald-800' },
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={lang === 'ar' ? 'المستخدمين والصلاحيات' : 'Role-Based Control'}
        title={lang === 'ar' ? 'إدارة أدوار وصلاحيات موظفي الصالون' : 'Staff Access & Roles'}
        subtitle={
          lang === 'ar'
            ? 'تحديد صلاحيات الوصول، تغيير الأدوار (مدير، مديرة فرع، كاشير، أخصائية)، وإعادة تعيين كلمات المرور.'
            : 'Configure role-based access tiers, update permissions, and reset staff passwords.'
        }
        actions={
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <UserPlus className="h-4 w-4" />
            <span>{lang === 'ar' ? 'إضافة موظفة جديدة' : 'Add Staff'}</span>
          </button>
        }
      />

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mocha-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث باسم الموظفة، الإيميل...' : 'Search staff…'}
            className="field-input mt-0 ps-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
            { id: 'admin', label: lang === 'ar' ? 'إدارة عامة' : 'Admin' },
            { id: 'manager', label: lang === 'ar' ? 'مديرة فرع' : 'Manager' },
            { id: 'receptionist', label: lang === 'ar' ? 'استقبال وكاشير' : 'Reception' },
            { id: 'specialist', label: lang === 'ar' ? 'أخصائيات' : 'Specialists' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                roleFilter === r.id
                  ? 'bg-espresso text-ivory'
                  : 'bg-white border border-pearl text-mocha-600 hover:border-mocha-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl border border-pearl/80 bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto admin-scroll">
          <table className="w-full text-start text-xs">
            <thead className="bg-ivory border-b border-pearl text-mocha-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{lang === 'ar' ? 'الموظفة' : 'Staff Member'}</th>
                <th className="py-3.5 px-4 text-start">{lang === 'ar' ? 'الدور والصلاحية' : 'Role'}</th>
                <th className="py-3.5 px-4 text-start">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                <th className="py-3.5 px-4 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="py-3.5 px-4 text-start">{lang === 'ar' ? 'تغيير الدور' : 'Change Role'}</th>
                <th className="py-3.5 px-4 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pearl/60">
              {filtered.map((user) => {
                const badgeInfo = roleLabels[user.role] || roleLabels.receptionist;
                return (
                  <tr key={user.id} className="hover:bg-pearl/20 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-espresso text-sm flex items-center gap-2">
                        <span>{user.name}</span>
                      </div>
                      <div className="text-[11px] text-mocha-400 font-mono flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-mocha-300" />
                        <span>{user.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeInfo.badge}`}>
                        {lang === 'ar' ? badgeInfo.ar : badgeInfo.en}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-mocha-500">
                      {user.phone || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{user.is_active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معلق' : 'Suspended')}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as StaffRole)}
                        className="px-2 py-1 rounded-lg border border-pearl bg-white text-xs font-medium text-espresso focus:border-rosegold-400 focus:outline-none"
                      >
                        <option value="admin">{lang === 'ar' ? 'مدير عام (Admin)' : 'Admin'}</option>
                        <option value="manager">{lang === 'ar' ? 'مديرة الفرع (Manager)' : 'Manager'}</option>
                        <option value="receptionist">{lang === 'ar' ? 'استقبال وكاشير (Receptionist)' : 'Receptionist'}</option>
                        <option value="specialist">{lang === 'ar' ? 'أخصائية تجميل (Specialist)' : 'Specialist'}</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-end">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPasswordModal(user)}
                          className="px-2.5 py-1.5 rounded-xl border border-pearl bg-ivory hover:bg-rosegold-50 hover:text-rosegold-700 text-xs font-medium text-espresso transition flex items-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'كلمة المرور' : 'Password'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          className={`p-1.5 rounded-xl border transition ${
                            user.is_active
                              ? 'border-pearl bg-ivory text-mocha-400 hover:text-rose-600'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAddStaff}
            className="bg-white rounded-2xl border border-pearl max-w-md w-full p-6 shadow-elevated text-start space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-pearl">
              <h3 className="font-bold text-base text-espresso">
                {lang === 'ar' ? 'إضافة موظفة جديدة' : 'Add New Staff Member'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-pearl text-mocha-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">
                {lang === 'ar' ? 'الاسم بالكامل:' : 'Full Name:'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: ياسمين عبد العزيز"
                className="w-full px-3 py-2 rounded-xl border border-pearl text-xs focus:border-rosegold-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">
                {lang === 'ar' ? 'البريد الإلكتروني المهني:' : 'Work Email:'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@maisonlumiere.beauty"
                className="w-full px-3 py-2 rounded-xl border border-pearl text-xs focus:border-rosegold-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'الدور الوظيفي:' : 'Assigned Role:'}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 rounded-xl border border-pearl text-xs focus:border-rosegold-400 focus:outline-none bg-white"
                >
                  <option value="admin">{lang === 'ar' ? 'مدير عام (Admin)' : 'Admin'}</option>
                  <option value="manager">{lang === 'ar' ? 'مديرة الفرع (Manager)' : 'Manager'}</option>
                  <option value="receptionist">{lang === 'ar' ? 'استقبال وكاشير (Receptionist)' : 'Receptionist'}</option>
                  <option value="specialist">{lang === 'ar' ? 'أخصائية تجميل (Specialist)' : 'Specialist'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-pearl text-xs font-mono focus:border-rosegold-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">
                {lang === 'ar' ? 'كلمة المرور المبدئية:' : 'Initial Password:'}
              </label>
              <input
                type="password"
                required
                value={initialPassword}
                onChange={(e) => setInitialPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-pearl text-xs focus:border-rosegold-400 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-pearl">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-pearl text-xs font-medium text-mocha-600 hover:bg-pearl/50"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory text-xs font-semibold shadow-soft"
              >
                {lang === 'ar' ? 'إنشاء حساب الموظفة' : 'Create Staff Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSavePassword}
            className="bg-white rounded-2xl border border-pearl max-w-sm w-full p-6 shadow-elevated text-start space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-pearl">
              <div>
                <h3 className="font-bold text-base text-espresso">
                  {lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                </h3>
                <p className="text-xs text-mocha-400 mt-0.5">{selectedUser.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg hover:bg-pearl text-mocha-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">
                {lang === 'ar' ? 'كلمة المرور الجديدة:' : 'New Password:'}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-pearl text-xs font-mono focus:border-rosegold-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">
                {lang === 'ar' ? 'تأكيد كلمة المرور:' : 'Confirm Password:'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-pearl text-xs font-mono focus:border-rosegold-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-pearl">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl border border-pearl text-xs font-medium text-mocha-600 hover:bg-pearl/50"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory text-xs font-semibold shadow-soft"
              >
                {lang === 'ar' ? 'حفظ كلمة المرور' : 'Save Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-espresso text-ivory text-xs font-medium shadow-elevated flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-rosegold-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

