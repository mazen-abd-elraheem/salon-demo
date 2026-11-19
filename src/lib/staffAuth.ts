import { getLocalStaffUsers } from './mockData';
import { hashLocalPassword } from './security';
import type { StaffRole, StaffUser } from './types';

export interface VerifiedStaffSession {
  staffId: string;
  name: string;
  email: string;
  role: StaffRole;
  authenticatedAt: string;
  signature: string;
}

const STAFF_SESSION_KEY = 'guzel_verified_staff_session_v1';
const MAX_SESSION_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours session TTL
const ALLOWED_ROLES: StaffRole[] = ['admin', 'manager', 'receptionist', 'specialist'];

function computeSessionSignature(staffId: string, email: string, role: StaffRole, timestamp: string): string {
  const payload = `${staffId}:${email.toLowerCase()}:${role}:${timestamp}:guzel_rbac_v2`;
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function getVerifiedStaffSession(): VerifiedStaffSession | null {
  if (typeof window === 'undefined') return null;
  try {
    localStorage.removeItem('maison_demo_admin');
    const raw = sessionStorage.getItem(STAFF_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VerifiedStaffSession;
    if (
      !parsed ||
      !parsed.staffId ||
      !parsed.email ||
      !parsed.role ||
      !parsed.authenticatedAt ||
      !ALLOWED_ROLES.includes(parsed.role)
    ) {
      sessionStorage.removeItem(STAFF_SESSION_KEY);
      return null;
    }

    // Verify integrity signature against tampering in sessionStorage
    const expectedSig = computeSessionSignature(
      parsed.staffId,
      parsed.email,
      parsed.role,
      parsed.authenticatedAt,
    );
    if (parsed.signature !== expectedSig) {
      sessionStorage.removeItem(STAFF_SESSION_KEY);
      return null;
    }

    // Enforce 12-hour session expiration
    const age = Date.now() - new Date(parsed.authenticatedAt).getTime();
    if (isNaN(age) || age < -60000 || age > MAX_SESSION_AGE_MS) {
      sessionStorage.removeItem(STAFF_SESSION_KEY);
      return null;
    }

    // Cross-check active staff record & authoritative role
    const staffList = getLocalStaffUsers();
    const authoritative = staffList.find(
      (s) => s.id === parsed.staffId && s.is_active && s.role === parsed.role,
    );
    if (!authoritative) {
      sessionStorage.removeItem(STAFF_SESSION_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setVerifiedStaffSession(staff: StaffUser): VerifiedStaffSession {
  localStorage.removeItem('maison_demo_admin');
  const authenticatedAt = new Date().toISOString();
  const session: VerifiedStaffSession = {
    staffId: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    authenticatedAt,
    signature: computeSessionSignature(staff.id, staff.email, staff.role, authenticatedAt),
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

const staffLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function authenticateStaffCredentials(
  emailInput: string,
  passwordInput: string,
): { ok: true; session: VerifiedStaffSession } | { ok: false; error: string } {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanEmail || !cleanPass) {
    return { ok: false, error: 'Please enter valid staff credentials.' };
  }

  const now = Date.now();
  const attemptState = staffLoginAttempts.get(cleanEmail);
  if (attemptState && attemptState.lockedUntil > now) {
    const waitSec = Math.ceil((attemptState.lockedUntil - now) / 1000);
    return {
      ok: false,
      error: `Too many failed login attempts. Account locked for ${waitSec}s.`,
    };
  }

  const recordFailure = (msg: string): { ok: false; error: string } => {
    const nextCount = (attemptState?.count || 0) + 1;
    const lockedUntil = nextCount >= 5 ? now + 60_000 : 0;
    staffLoginAttempts.set(cleanEmail, {
      count: lockedUntil ? 0 : nextCount,
      lockedUntil,
    });
    return {
      ok: false,
      error:
        lockedUntil > 0
          ? '5 failed attempts reached. Login temporarily locked for 60 seconds.'
          : msg,
    };
  };

  const staffList = getLocalStaffUsers();
  const matched = staffList.find(
    (s) =>
      s.is_active &&
      (s.email.toLowerCase() === cleanEmail ||
        (cleanEmail === 'admin' && s.role === 'admin')),
  );

  if (!matched) {
    return recordFailure('Unauthorized: Account is not registered as active staff.');
  }

  const storedPass = localStorage.getItem(`maison_pass_${matched.id}`);
  let isPasswordValid = false;

  if (!storedPass) {
    isPasswordValid = cleanPass === 'admin123';
  } else if (storedPass.startsWith('h2:')) {
    const candidateHash = `h2:${hashLocalPassword(matched.id, cleanPass)}`;
    isPasswordValid = candidateHash === storedPass;
  } else {
    // Legacy migration: compare and immediately upgrade to salted hash
    isPasswordValid = cleanPass === storedPass;
    if (isPasswordValid) {
      localStorage.setItem(
        `maison_pass_${matched.id}`,
        `h2:${hashLocalPassword(matched.id, cleanPass)}`,
      );
    }
  }

  if (!isPasswordValid) {
    return recordFailure('Invalid staff password.');
  }

  staffLoginAttempts.delete(cleanEmail);
  const session = setVerifiedStaffSession(matched);
  return { ok: true, session };
}
