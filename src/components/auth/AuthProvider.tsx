'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/app.types';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  isLoading: boolean;
  isAdvertiser: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchProfileAndRoles = useCallback(async (authUser: User) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (profileData) {
        const typedProfile = profileData as Profile;
        setProfile(typedProfile);

        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('profile_id', typedProfile.id);

        if (rolesData) {
          const typedRoles = rolesData as { role: string }[];
          setRoles(typedRoles.map((r) => r.role));
        }
      }
    } catch (err) {
      console.error('Error fetching profile and roles:', err);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfileAndRoles(user);
    }
  }, [user, fetchProfileAndRoles]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await fetchProfileAndRoles(initialSession.user);
          }
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            await fetchProfileAndRoles(newSession.user);
          } else {
            setProfile(null);
            setRoles([]);
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfileAndRoles]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  }, [supabase]);

  const isAdvertiser = roles.includes('advertiser') || profile?.account_type === 'advertiser';
  const isAdmin = roles.includes('admin') || roles.includes('super_admin') || profile?.account_type === 'admin' || profile?.account_type === 'super_admin';
  const isModerator = isAdmin || roles.includes('moderator') || profile?.account_type === 'moderator';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isAdvertiser,
        isAdmin,
        isModerator,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
