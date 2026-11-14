import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from '../services/supabase';
import { getPreferences, updatePreferences, ApiError } from '../services/api';
import { UserProfile, UpdatePreferencesRequest } from '../types';
import { Session, User } from '@supabase/supabase-js';

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  savePreferences: (data: UpdatePreferencesRequest) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getPreferences();
      setProfile(data);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'PROFILE_NOT_FOUND') {
        setProfile(null);
      } else {
        console.warn('Error fetching profile:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (USE_MOCKS) {
      // Mock session for offline development
      const mockUser: any = {
        id: '00000000-0000-4000-8000-000000000001',
        email: 'test@moodify.local',
      };
      const mockSession: any = {
        access_token: 'mock-token',
        user: mockUser,
      };
      setUser(mockUser);
      setSession(mockSession);
      fetchProfile().finally(() => setLoading(false));
      return;
    }

    // Supabase auth subscription
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        fetchProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
          await fetchProfile();
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    if (USE_MOCKS) {
      await fetchProfile();
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    await fetchProfile();
  };

  const signUp = async (email: string, password: string) => {
    if (USE_MOCKS) {
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (USE_MOCKS) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const savePreferences = async (data: UpdatePreferencesRequest) => {
    const saved = await updatePreferences(data);
    setProfile(saved);
    return saved;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        savePreferences,
        refreshProfile: fetchProfile,
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

