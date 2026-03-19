import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Studio } from '@/types/database';

// ─────────────────────────────────────────────────────────────────────────────
// HARDCODED SUPER ADMIN — never stored in DB, never touches Supabase auth
// ─────────────────────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL    = 'superadmin@gmail.com';
const SUPER_ADMIN_PASSWORD = 'passwordAdmin@2025';
const SA_SESSION_KEY       = 'trivora_sa_session'; // sessionStorage key

/** Build a virtual Supabase-compatible User for the super admin. */
const makeSuperAdminUser = (): User =>
  ({
    id:               'super-admin-hardcoded',
    aud:              'authenticated',
    role:             'authenticated',
    email:            SUPER_ADMIN_EMAIL,
    email_confirmed_at: new Date().toISOString(),
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
    app_metadata:     {},
    user_metadata:    {},
    identities:       [],
  } as unknown as User);

// ─────────────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user:             User | null;
  session:          Session | null;
  loading:          boolean;
  role:             AppRole | null;
  isSuperAdmin:     boolean;
  isStudioAdmin:    boolean;
  studio:           Studio | null;
  signIn:           (email: string, password: string) => Promise<{ error: Error | null; redirectTo?: string }>;
  signUp:           (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut:          () => Promise<void>;
  refreshUserData:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role,    setRole]    = useState<AppRole | null>(null);
  const [studio,  setStudio]  = useState<Studio | null>(null);

  const isSuperAdmin  = role === 'super_admin';
  const isStudioAdmin = role === 'studio_admin';

  // ── Activate super admin locally (no Supabase involved) ────────────────
  const activateSuperAdmin = () => {
    sessionStorage.setItem(SA_SESSION_KEY, 'true');
    setUser(makeSuperAdminUser());
    setSession(null);
    setRole('super_admin');
    setStudio(null);
  };

  // ── Clear all auth state ────────────────────────────────────────────────
  const clearState = () => {
    setUser(null);
    setSession(null);
    setRole(null);
    setStudio(null);
  };

  // ── Fetch role + studio for a normal Supabase user ─────────────────────
  const fetchUserData = async (userId: string, email?: string) => {
    try {
      // Safety net: if somehow the super admin email arrives here, handle it
      if (email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        setRole('super_admin');
        setStudio(null);
        return;
      }

      // ── STEP 3: Fetch role from DB ──────────────────────────────────────
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const dbRole = roleData?.role as AppRole | undefined;

      // ── STEP 4: SECURITY PATCH — downgrade any DB super_admin claim ─────
      if (dbRole === 'super_admin') {
        setRole('studio_admin');
      } else {
        setRole(dbRole ?? 'studio_admin');
      }

      // ── Fetch owned studio ──────────────────────────────────────────────
      const { data: ownedStudio } = await supabase
        .from('studios')
        .select('*, saas_plans(*)')
        .eq('owner_id', userId)
        .maybeSingle();

      if (ownedStudio) {
        setStudio(ownedStudio as Studio);
        return;
      }

      // Fallback: studio membership
      const { data: memberData } = await supabase
        .from('studio_members')
        .select('studio_id, studios(*, saas_plans(*))')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      setStudio((memberData?.studios as unknown as Studio) ?? null);
    } catch (err) {
      console.error('fetchUserData error:', err);
    }
  };

  const refreshUserData = async () => {
    if (isSuperAdmin) return; // super admin has no DB data
    if (user) await fetchUserData(user.id, user.email);
  };

  // ── Mount: restore session ─────────────────────────────────────────────
  useEffect(() => {
    // ── 1) Restore super admin session from sessionStorage ────────────────
    if (sessionStorage.getItem(SA_SESSION_KEY) === 'true') {
      activateSuperAdmin();
      setLoading(false);
      return; // Skip Supabase — super admin never needs it
    }

    // ── 2) Normal Supabase auth listener ─────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer to avoid Supabase deadlock
          setTimeout(() => {
            fetchUserData(session.user.id, session.user.email);
          }, 0);
        } else {
          setRole(null);
          setStudio(null);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id, session.user.email);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // signIn
  // ─────────────────────────────────────────────────────────────────────────
  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: Error | null; redirectTo?: string }> => {

    console.log('LOGIN ATTEMPT', email);

    // ── STEP 1: Super admin check — NEVER touches Supabase ────────────────
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      if (password === SUPER_ADMIN_PASSWORD) {
        console.log('SUPER ADMIN MATCHED');
        activateSuperAdmin();
        console.log('REDIRECTING TO /admin');
        return { error: null, redirectTo: '/admin' };
      }
      // Wrong password for super admin email
      return { error: new Error('Invalid login credentials'), redirectTo: undefined };
    }

    // ── STEP 2: Supabase login for studio users ───────────────────────────
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error as Error, redirectTo: undefined };
    }

    // ── STEP 3: Fetch role from DB ────────────────────────────────────────
    await fetchUserData(data.user.id, data.user.email);

    // ── STEP 5: Return redirect ───────────────────────────────────────────
    console.log('REDIRECTING TO /dashboard');
    return { error: null, redirectTo: '/dashboard' };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // signUp
  // ─────────────────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string) => {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return { error: new Error('This email is reserved.') };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    return { error: error as Error | null };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // signOut
  // ─────────────────────────────────────────────────────────────────────────
  const signOut = async () => {
    if (sessionStorage.getItem(SA_SESSION_KEY) === 'true') {
      // Super admin logout — only clear local state, nothing to revoke in Supabase
      sessionStorage.removeItem(SA_SESSION_KEY);
      clearState();
    } else {
      await supabase.auth.signOut();
      clearState();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        isSuperAdmin,
        isStudioAdmin,
        studio,
        signIn,
        signUp,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
