import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabaseClient';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'donor' | 'seeker' | 'admin';
  blood_type: string | null;
  phone: string | null;
  display_id: string;
  availability_status: string;
  is_verified: boolean;
  verification_method: string | null;
  latitude: number | null;
  longitude: number | null;
  last_donation_date: string | null;
  next_eligible_date: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    bloodType: string,
    latitude: number | null,
    longitude: number | null
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(null);
      } else {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    bloodType: string,
    latitude: number | null,
    longitude: number | null
  ) => {
    // Default fallback coordinates if browser location permission was blocked/unavailable
    const finalLat = latitude ?? (9.3075 + (Math.random() - 0.5) * 0.02);
    const finalLng = longitude ?? (123.3050 + (Math.random() - 0.5) * 0.02);

    // Pass profile fields as raw_user_meta_data so the SECURITY DEFINER trigger
    // `handle_new_user` can create the public.users row server-side.
    // This avoids the RLS violation that occurs when no session exists yet
    // (e.g. when email confirmation is enabled and auth.uid() would be null).
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          blood_type: bloodType || null,
          latitude: finalLat,
          longitude: finalLng,
        },
      },
    });

    if (authError) throw authError;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
