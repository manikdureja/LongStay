import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Building2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export default function Onboarding() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('renter');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), role })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Welcome to LongStay!' });

      // Redirect based on role
      if (role === 'host') {
        navigate('/host/dashboard');
      } else {
        navigate('/');
      }
    } catch (e) {
      toast({ title: 'Something went wrong', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to LongStay</h1>
          <p className="text-slate-500 text-sm mt-1">Tell us about yourself to get started</p>
        </div>

        {/* Name input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Your name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Full name"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            autoFocus
          />
        </div>

        {/* Role selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-3">I want to...</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRole('renter')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'renter'
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Search className={`w-6 h-6 ${role === 'renter' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="font-semibold text-sm text-slate-900">Find a rental</span>
              <span className="text-xs text-slate-500 text-center">Browse & book properties</span>
            </button>
            <button
              onClick={() => setRole('host')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'host'
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Building2 className={`w-6 h-6 ${role === 'host' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="font-semibold text-sm text-slate-900">List my property</span>
              <span className="text-xs text-slate-500 text-center">Earn from your space</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || !fullName.trim()}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {saving ? 'Saving...' : 'Get Started'}
        </button>
      </div>
    </div>
  );
}
