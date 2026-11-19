import { getLocalStaffUsers } from './mockData';
import type { StaffRole, StaffUser } from './types';

export interface VerifiedStaffSession {
  staffId: string;
  name: string;
  email: string;
  role: StaffRole;
  authenticatedAt: string;
}

const STAFF_SESSION_KEY = 'guzel_verified_staff_session_v1';

export function getVerifiedStaffSession(): VerifiedStaffSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STAFF_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VerifiedStaffSession;
    if (!parsed || !parsed.staffId || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setVerifiedStaffSession(staff: StaffUser): VerifiedStaffSession {
  // Clear any legacy insecure localStorage demo flag
  localStorage.removeItem('maison_demo_admin');
  const session: VerifiedStaffSession = {
    staffId: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    authenticatedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent('guzel:auth-updated'));
  return session;
}

export function clearVerifiedStaffSession(): void {
  localStorage.removeItem('maison_demo_admin');
  sessionStorage.removeItem(STAFF_SESSION_KEY);
  window.dispatchEvent(new CustomEvent('guzel:auth-updated'));
}

export function authenticateStaffCredentials(
  emailInput: string,
  passwordInput: string,
): { ok: true; session: VerifiedStaffSession } | { ok: false; error: string } {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanEmail || !cleanPass) {
    return { ok: false, error: 'Please enter valid staff credentials.' };
  }

  const staffList = getLocalStaffUsers();
  const matched = staffList.find(
    (s) =>
      s.is_active &&
      (s.email.toLowerCase() === cleanEmail ||
        (cleanEmail === 'admin' && s.role === 'admin')),
  );

  if (!matched) {
    return { ok: false, error: 'Unauthorized: Account is not registered as active staff.' };
  }

  const customPass = localStorage.getItem(`maison_pass_${matched.id}`);
  const expectedPass = customPass || 'admin123';

  if (cleanPass !== expectedPass) {
    return { ok: false, error: 'Invalid staff password.' };
  }

  const session = setVerifiedStaffSession(matched);
  return { ok: true, session };
}

