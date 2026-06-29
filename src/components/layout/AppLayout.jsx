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
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); setLoaded(true); return; }
      setUser(session.user);
      const { data: profiles } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profiles) {
        setProfile(profiles);
        if (!profiles.full_name && location.pathname !== '/onboarding') navigate('/onboarding');
      } else if (location.pathname !== '/onboarding') {
        navigate('/onboarding');
      }
      setLoaded(true);
    };
    load();
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
