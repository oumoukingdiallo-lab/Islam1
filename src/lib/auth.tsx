import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile, type Store } from './supabase';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  store: Store | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: { email: string; password: string; fullName: string; phone: string; city?: string; province?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshStore: () => Promise<void>;
  updateStore: (patch: Partial<Store>) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user: User) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) { console.error('loadProfile', error); return; }
    if (data) {
      setProfile(data as Profile);
    } else {
      const meta = user.user_metadata as Record<string, string> | null;
      const newProfile = {
        id: user.id,
        full_name: meta?.full_name ?? user.email ?? 'Entrepreneur',
        phone: meta?.phone ?? null,
        email: user.email ?? null,
        city: meta?.city ?? null,
        province: meta?.province ?? null,
        currency: 'AOA',
      };
      const { data: created } = await supabase.from('profiles').insert(newProfile).select().maybeSingle();
      if (created) setProfile(created as Profile);
    }
  }, []);

  const loadStore = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('stores').select('*').eq('user_id', userId).maybeSingle();
    if (error) { console.error('loadStore', error); return; }
    setStore(data as Store | null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user);
  }, [session, loadProfile]);

  const refreshStore = useCallback(async () => {
    if (session?.user) await loadStore(session.user.id);
  }, [session, loadStore]);

  const updateStore = useCallback(async (patch: Partial<Store>) => {
    if (!store) return;
    const { data, error } = await supabase.from('stores').update(patch).eq('id', store.id).select().maybeSingle();
    if (error) throw error;
    if (data) setStore(data as Store);
  }, [store]);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!profile) return;
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', profile.id).select().maybeSingle();
    if (error) throw error;
    if (data) setProfile(data as Profile);
  }, [profile]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        Promise.all([loadProfile(data.session.user), loadStore(data.session.user.id)]).finally(() => mounted && setLoading(false));
      } else { setLoading(false); }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        (async () => {
          await loadProfile(newSession.user);
          await loadStore(newSession.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null); setStore(null); setLoading(false);
      }
    });

    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [loadProfile, loadStore]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signUp = useCallback(async (data: { email: string; password: string; fullName: string; phone: string; city?: string; province?: string }) => {
    const { data: res, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.fullName, phone: data.phone, city: data.city, province: data.province } },
    });
    if (error) return { error: translateError(error.message) };
    if (res.user) {
      const slugBase = data.fullName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ma-boutique';
      const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
      await supabase.from('profiles').upsert({
        id: res.user.id,
        full_name: data.fullName,
        phone: data.phone,
        email: data.email,
        city: data.city ?? null,
        province: data.province ?? null,
        currency: 'AOA',
      });
      await supabase.from('stores').insert({
        user_id: res.user.id,
        name: `Boutique de ${data.fullName}`,
        slug,
        accent_color: '#059669',
        default_shipping_fee: 2500,
      });
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null); setStore(null); setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, store, loading, signIn, signUp, signOut, refreshProfile, refreshStore, updateStore, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (msg.includes('User already registered')) return 'Un compte existe déjà avec cet e-mail.';
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (msg.includes('Email rate limit')) return 'Trop de tentatives. Réessayez dans quelques instants.';
  return 'Une erreur est survenue. Réessayez.';
}
