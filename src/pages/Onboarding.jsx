import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Building2, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase'; // Make sure this path points to your Supabase client setup
import { motion } from 'framer-motion';

export default function Onboarding() {
  const { user, setProfile } = useOutletContext();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [name, setName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!role || !name.trim()) return;
    setSaving(true);
    
    try {
      const { data: profile, error } = await supabase
        .from('UserProfile') // Adjust if your Supabase table is named differently (e.g., 'profiles')
        .insert({
          user_id: user.id,
          role,
          full_name: name.trim(),
          email: user.email,
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(profile);
      navigate('/');
    } catch (error) {
      console.error('Error saving profile:', error);
      // Optional: Add toast notification or error state here if needed
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">Welcome to LongStay</h1>
          <p className="text-slate-500">Tell us about yourself to get started</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Your name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-12" />
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-3">I want to...</label>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              onClick={() => setRole('renter')}
              className={`p-5 rounded-xl border-2 transition-all text-center ${
                role === 'renter' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Search className={`w-7 h-7 mx-auto mb-2 ${role === 'renter' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className="font-semibold text-sm text-slate-900">Find a rental</span>
              <p className="text-xs text-slate-500 mt-1">Browse & book properties</p>
            </button>
            <button
              onClick={() => setRole('host')}
              className={`p-5 rounded-xl border-2 transition-all text-center ${
                role === 'host' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Building2 className={`w-7 h-7 mx-auto mb-2 ${role === 'host' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className="font-semibold text-sm text-slate-900">List my property</span>
              <p className="text-xs text-slate-500 mt-1">Earn from your space</p>
            </button>
          </div>

          <Button onClick={handleSubmit} disabled={!role || !name.trim() || saving} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl">
            {saving ? 'Setting up...' : 'Get Started'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}