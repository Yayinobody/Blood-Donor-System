import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabaseClient';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'donor' | 'seeker' | 'admin';
  blood_type: string | null;
  display_id: string;
  availability_status: string;
  is_verified: boolean;
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
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;

    const userId = authData.user?.id;
    if (!userId) throw new Error('User ID not returned after sign up.');

    // 2. Generate unique display_id
    const displayId = `Donor #${Math.floor(100000 + Math.random() * 900000)}`;

    // Default fallback coordinates if browser location permission was blocked/unavailable
    const finalLat = latitude ?? (9.3075 + (Math.random() - 0.5) * 0.02);
    const finalLng = longitude ?? (123.3050 + (Math.random() - 0.5) * 0.02);

    // 3. Upsert profile in public.users with role=donor and location
    const { error: profileError } = await supabase.from('users').upsert({
      id: userId,
      email,
      full_name: fullName,
      role: 'donor',
      blood_type: bloodType || null,
      display_id: displayId,
      availability_status: 'available',
      is_verified: false,
      latitude: finalLat,
      longitude: finalLng,
    }, { onConflict: 'id' });

    if (profileError) {
      // If display_id collision, try once more with new ID
      if (profileError.code === '23505') {
        const retryId = `Donor #${Math.floor(100000 + Math.random() * 900000)}`;
        const { error: retryError } = await supabase.from('users').upsert({
          id: userId,
          email,
          full_name: fullName,
          role: 'donor',
          blood_type: bloodType || null,
          display_id: retryId,
          availability_status: 'available',
          is_verified: false,
          latitude: finalLat,
          longitude: finalLng,
        }, { onConflict: 'id' });
        if (retryError) throw retryError;
      } else {
        throw profileError;
      }
    }
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
