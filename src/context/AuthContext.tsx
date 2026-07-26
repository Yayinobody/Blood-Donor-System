import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabaseClient";

export interface DBUser {
  id: string;
  role: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  blood_type: string | null;
  birthdate: string | null;
  gender: string | null;
  weight_kg: number | null;
  barangay: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  availability_status: string | null;
  last_donation_date: string | null;
  next_eligible_date: string | null;
  is_verified: boolean | null;
  verification_method: string | null;
  verified_at: string | null;
  display_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: DBUser | null;
  session: Session | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .or(`id.eq.${userId}${email ? `,email.eq.${email}` : ""}`)
        .maybeSingle();

      if (data && !error) {
        setProfile(data as DBUser);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
