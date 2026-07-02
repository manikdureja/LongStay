import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { supabase } from '@/lib/supabase';

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadProfile = async (sessionUser) => {
      setUser(sessionUser);
      const { data: profiles } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
      if (profiles) {
        setProfile(profiles);
        // Admins skip onboarding — they can set profile later
        const needsOnboarding = !profiles.full_name && profiles.role !== 'admin';
        if (needsOnboarding && location.pathname !== '/onboarding') {
          navigate('/onboarding');
        }
      } else if (location.pathname !== '/onboarding') {
        navigate('/onboarding');
      }
    };

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        setLoaded(true);
        return;
      }
      await loadProfile(session.user);
      setLoaded(true);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        navigate('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!loaded) return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} profile={profile} />
      <main>
        <Outlet context={{ user, profile, setProfile }} />
      </main>
    </div>
  );
}
