import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Studio } from '@/types/database';

// ─── Hardcoded Super Admin credentials ───────────────────────────────────────
const SUPER_ADMIN_EMAIL = 'superadmin@gmail.com';
const SUPER_ADMIN_PASSWORD = 'passwordAdmin@2025';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  isSuperAdmin: boolean;
  isStudioAdmin: boolean;
  studio: Studio | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; redirectTo?: string }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);

  const isSuperAdmin = role === 'super_admin';
  const isStudioAdmin = role === 'studio_admin';

  const fetchUserData = async (userId: string, email?: string) => {
    try {
      // ── Check if this is the hardcoded super admin ──────────────────────
      if (email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        setRole('super_admin');
        setStudio(null);
        return;
      }

      // ── Otherwise check user_roles table ────────────────────────────────
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleData) {
        // Super admin email check: block non-hardcoded users from claiming super_admin
        if (roleData.role === 'super_admin' && email?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
          setRole('studio_admin');
        } else {
          setRole(roleData.role as AppRole);
        }
      } else {
        // No role entry → default to studio_admin for authenticated users
        setRole('studio_admin');
      }

      // Super admin does NOT need a studio context
      if (email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        setStudio(null);
        return;
      }

      // Studio admin: fetch the single studio they own
      const { data: ownedStudio } = await supabase
        .from('studios')
        .select('*, saas_plans(*)')
        .eq('owner_id', userId)
        .maybeSingle();

      if (ownedStudio) {
        setStudio(ownedStudio as Studio);
      } else {
        // Fallback: check if they are a member of a studio
        const { data: memberData } = await supabase
          .from('studio_members')
          .select('studio_id, studios(*, saas_plans(*))')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (memberData?.studios) {
          setStudio(memberData.studios as unknown as Studio);
        } else {
          setStudio(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id, user.email);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer Supabase calls to avoid deadlock
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

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id, session.user.email);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null; redirectTo?: string }> => {
    // ── 1) Check hardcoded super admin first ──────────────────────────────
    if (
      email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() &&
      password === SUPER_ADMIN_PASSWORD
    ) {
      // Attempt Supabase sign-in (the account must exist in Supabase Auth)
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error as Error };
      }
      // Role will be set via onAuthStateChange → fetchUserData
      return { error: null, redirectTo: '/admin' };
    }

    // ── 2) Block super admin email with wrong password ────────────────────
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return { error: new Error('Invalid login credentials') };
    }

    // ── 3) Regular studio user sign-in ────────────────────────────────────
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error as Error };
    }
    return { error: null, redirectTo: '/dashboard' };
  };

  const signUp = async (email: string, password: string) => {
    // Block super admin email from being registered as a studio user
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return { error: new Error('This email is reserved.') };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setStudio(null);
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
