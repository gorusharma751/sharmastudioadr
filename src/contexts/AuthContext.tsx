import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Studio, StudioMember } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  isSuperAdmin: boolean;
  isStudioAdmin: boolean;
  studios: Studio[];
  currentStudio: Studio | null;
  setCurrentStudio: (studio: Studio | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
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
  const [studios, setStudios] = useState<Studio[]>([]);
  const [currentStudio, setCurrentStudio] = useState<Studio | null>(null);

  const isSuperAdmin = role === 'super_admin';
  const isStudioAdmin = role === 'studio_admin';

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        setRole(roleData.role as AppRole);
      }

      // Fetch studios the user has access to
      if (roleData?.role === 'super_admin') {
        // Super admin can see all studios
        const { data: studiosData } = await supabase
          .from('studios')
          .select('*, saas_plans(*)')
          .order('created_at', { ascending: false });

        if (studiosData) {
          setStudios(studiosData as Studio[]);
        }
      } else {
        // Studio admin - fetch owned studios and member studios
        const { data: ownedStudios } = await supabase
          .from('studios')
          .select('*, saas_plans(*)')
          .eq('owner_id', userId);

        const { data: memberStudios } = await supabase
          .from('studio_members')
          .select('studio_id, studios(*, saas_plans(*))')
          .eq('user_id', userId);

        const allStudios: Studio[] = [];
        
        if (ownedStudios) {
          allStudios.push(...(ownedStudios as Studio[]));
        }
        
        if (memberStudios) {
          memberStudios.forEach((m: any) => {
            if (m.studios && !allStudios.find(s => s.id === m.studios.id)) {
              allStudios.push(m.studios as Studio);
            }
          });
        }

        setStudios(allStudios);
        
        // Auto-select first studio
        if (allStudios.length > 0 && !currentStudio) {
          setCurrentStudio(allStudios[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
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
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setStudios([]);
          setCurrentStudio(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
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
    setStudios([]);
    setCurrentStudio(null);
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
        studios,
        currentStudio,
        setCurrentStudio,
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
