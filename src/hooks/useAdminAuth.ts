import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  authenticateStaffCredentials,
  clearVerifiedStaffSession,
  getVerifiedStaffSession,
} from '../lib/staffAuth';
import type { StaffRole } from '../lib/types';

export interface AdminAuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: StaffRole | null;
  isAdmin: boolean | null; // true only for admin/manager
  isStaff: boolean | null; // true for admin/manager/receptionist
  error: string | null;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    loading: true,
    session: null,
    user: null,
    role: null,
    isAdmin: null,
    isStaff: null,
    error: null,
  });

  const lastCheckedUserId = useRef<string | null>(null);

  const checkAdmin = useCallback(async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          isAdmin: prev.isAdmin ?? false,
          isStaff: prev.isStaff ?? false,
          error: error.message,
        }));
        return;
      }

      const isConfirmedAdmin = !!data;
      setState((prev) => ({
        ...prev,
        loading: false,
        role: isConfirmedAdmin ? 'admin' : null,
        isAdmin: isConfirmedAdmin,
        isStaff: isConfirmedAdmin,
        error: null,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        isAdmin: false,
        isStaff: false,
        error: err?.message ?? 'Unable to verify admin access.',
      }));
    }
  }, []);

  const resolve = useCallback(async () => {
    try {
      // Remove legacy insecure localStorage flag if present
      localStorage.removeItem('maison_demo_admin');

      const staffSess = getVerifiedStaffSession();
      if (staffSess) {
        const staffUser = {
          id: staffSess.staffId,
          email: staffSess.email,
          app_metadata: { role: staffSess.role },
          user_metadata: { name: staffSess.name, role: staffSess.role },
          aud: 'authenticated',
          created_at: staffSess.authenticatedAt,
        } as unknown as User;

        const isAdminRole = staffSess.role === 'admin' || staffSess.role === 'manager';
        const isStaffRole =
          isAdminRole || staffSess.role === 'receptionist';

        setState({
          loading: false,
          session: { user: staffUser } as unknown as Session,
          user: staffUser,
          role: staffSess.role,
          isAdmin: isAdminRole,
          isStaff: isStaffRole,
          error: null,
        });
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        lastCheckedUserId.current = null;
        setState({
          loading: false,
          session: null,
          user: null,
          role: null,
          isAdmin: null,
          isStaff: null,
          error: null,
        });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setState({
          loading: false,
          session,
          user: null,
          role: null,
          isAdmin: null,
          isStaff: null,
          error: null,
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        session,
        user,
      }));

      lastCheckedUserId.current = user.id;
      await checkAdmin(user);
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message ?? 'Unable to load session.',
      }));
    }
  }, [checkAdmin]);

  useEffect(() => {
    resolve();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (getVerifiedStaffSession()) return;
        lastCheckedUserId.current = null;
        setState({
          loading: false,
          session: null,
          user: null,
          role: null,
          isAdmin: null,
          isStaff: null,
          error: null,
        });
        return;
      }

      if (session) {
        setState((prev) => ({
          ...prev,
          session,
          user: session.user,
        }));
        if (session.user.id !== lastCheckedUserId.current) {
          lastCheckedUserId.current = session.user.id;
          checkAdmin(session.user);
        }
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [checkAdmin, resolve]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // 1. Check verified staff credentials
      const staffAuth = authenticateStaffCredentials(email, password);
      if (staffAuth.ok) {
        await resolve();
        return { ok: true as const };
      }

      // 2. Otherwise verify against Supabase Auth + admin_users table
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: staffAuth.error || error.message,
          }));
          return { ok: false as const, error: staffAuth.error || error.message };
        }
        await resolve();
        return { ok: true as const };
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err?.message ?? 'Network error connecting to auth server.',
        }));
        return { ok: false as const, error: err?.message ?? 'Unable to connect to auth server.' };
      }
    },
    [resolve],
  );

  const signOut = useCallback(async () => {
    clearVerifiedStaffSession();
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setState({
      loading: false,
      session: null,
      user: null,
      role: null,
      isAdmin: null,
      isStaff: null,
      error: null,
    });
  }, []);

  return { ...state, signIn, signOut, refresh: resolve };
}
