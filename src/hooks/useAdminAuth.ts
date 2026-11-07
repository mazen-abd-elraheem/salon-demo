import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AdminAuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean | null; // null while unknown, true/false once resolved
  error: string | null;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    loading: true,
    session: null,
    user: null,
    isAdmin: null,
    error: null,
  });

  // Tracks the latest checked user id to avoid stale set-state races.
  const lastCheckedUserId = useRef<string | null>(null);

  const checkAdmin = useCallback(async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // Transient error — do not sign the admin out automatically.
        setState((prev) => ({
          ...prev,
          loading: false,
          isAdmin: prev.isAdmin, // keep prior value if known
          error: error.message,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        isAdmin: !!data,
        error: null,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message ?? 'Unable to verify admin access.',
      }));
    }
  }, []);

  const resolve = useCallback(async () => {
    try {
      if (import.meta.env.DEV && localStorage.getItem('maison_demo_admin') === 'true') {
        const demoUser = {
          id: 'demo-admin-id',
          email: 'admin@maisonlumiere.beauty',
          app_metadata: {},
          user_metadata: { role: 'admin' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as unknown as User;

        setState({
          loading: false,
          session: { user: demoUser } as unknown as Session,
          user: demoUser,
          isAdmin: true,
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
          isAdmin: null,
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
          isAdmin: null,
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
      if (localStorage.getItem('maison_demo_admin') === 'true') {
        return;
      }
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
      // Always reflect the latest session, but never sign the admin out due to a query error.
      if (event === 'SIGNED_OUT') {
        lastCheckedUserId.current = null;
        setState({
          loading: false,
          session: null,
          user: null,
          isAdmin: null,
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

      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      // Support local demo admin credentials (development only — disabled in production builds)
      if (
        import.meta.env.DEV &&
        (cleanEmail === 'admin@maisonlumiere.beauty' || cleanEmail === 'admin') &&
        (cleanPass === 'admin123' || cleanPass === 'admin')
      ) {
        localStorage.setItem('maison_demo_admin', 'true');
        await resolve();
        return { ok: true as const };
      }

      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
          return { ok: false as const, error: error.message };
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
    localStorage.removeItem('maison_demo_admin');
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setState({
      loading: false,
      session: null,
      user: null,
      isAdmin: null,
      error: null,
    });
  }, []);

  return { ...state, signIn, signOut, refresh: resolve };
}
