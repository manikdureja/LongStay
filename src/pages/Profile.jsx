import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Camera, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { HARYANA_CITIES } from '@/lib/haryanaCities';
import { useToast } from '@/components/ui/use-toast';

export default function Profile() {
  const { user, profile, setProfile } = useOutletContext();
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: '', phone: '', bio: '', photo: '', city: '', country: 'India', preferred_currency: 'INR', role: 'renter',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        photo: profile.photo || '',
        city: profile.city || '',
        country: profile.country || '',
        preferred_currency: profile.preferred_currency || 'USD',
        role: profile.role || 'renter',
      });
    }
  }, [profile]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update('photo', file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (profile) {
      const updated = await base44.entities.UserProfile.update(profile.id, form);
      setProfile(updated);
    } else {
      const created = await base44.entities.UserProfile.create({ ...form, user_id: user.id, email: user.email });
      setProfile(created);
    }
    setSaving(false);
    toast({ title: 'Profile saved!' });
  };

  const initials = form.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-8">Profile Settings</h1>
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={form.photo} />
              <AvatarFallback className="bg-slate-900 text-white text-xl">{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-600">
              {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
          <div>
            <p className="font-medium text-slate-900">{form.full_name || 'Your name'}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {profile?.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 mt-1">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <Input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="h-11" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
            <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 234 567 890" className="h-11" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
          <Textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="Tell others about yourself..." rows={3} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <Select value={form.role} onValueChange={(v) => update('role', v)}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="renter">Renter</SelectItem>
                <SelectItem value="host">Host</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
            <Input value="India" disabled className="h-11 bg-slate-50" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
          <Select value={form.city} onValueChange={(v) => update('city', v)}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Select city in Haryana" /></SelectTrigger>
            <SelectContent>
              {HARYANA_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Profile'}
        </Button>
        
      </div>
    </div>
  );
}