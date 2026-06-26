import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { PROPERTY_TYPES, AMENITIES, CURRENCIES, COUNTRIES } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

export default function CreateListing() {
  const { user, profile } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', property_type: 'apartment', category: 'residential',
    images: [], monthly_rent: '', yearly_rent: '', currency: 'USD', security_deposit: '',
    bedrooms: '', bathrooms: '', area_sqft: '', amenities: [],
    address: '', city: '', country: '', zip_code: '',
    min_lease_months: 1, max_lease_months: 24, is_furnished: false, pets_allowed: false,
    available_from: '',
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    update('images', [...form.images, ...urls]);
    setUploading(false);
  };

  const removeImage = (idx) => update('images', form.images.filter((_, i) => i !== idx));

  const toggleAmenity = (amenity) => {
    update('amenities', form.amenities.includes(amenity) ? form.amenities.filter(a => a !== amenity) : [...form.amenities, amenity]);
  };

  const handleSubmit = async () => {
    setSaving(true);
    await base44.entities.Property.create({
      ...form,
      monthly_rent: Number(form.monthly_rent),
      yearly_rent: form.yearly_rent ? Number(form.yearly_rent) : Number(form.monthly_rent) * 12,
      security_deposit: Number(form.security_deposit) || 0,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      area_sqft: Number(form.area_sqft) || 0,
      min_lease_months: Number(form.min_lease_months),
      max_lease_months: Number(form.max_lease_months),
      host_id: user.id,
      host_name: profile?.full_name || user.full_name,
      host_photo: profile?.photo || '',
      status: 'pending',
    });
    setSaving(false);
    toast({ title: 'Listing created!', description: 'Your property is pending review.' });
    navigate('/host/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">List Your Property</h1>
      <p className="text-slate-500 mb-8">Step {step} of 3</p>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-amber-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Property Title</label>
              <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Modern 2BR apartment in downtown" className="h-11" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe your property..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <Select value={form.category} onValueChange={(v) => update('category', v)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Property Type</label>
                <Select value={form.property_type} onValueChange={(v) => update('property_type', v)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Photos</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-colors">
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-amber-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-400">Upload</span>
                    </>
                  )}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold mb-4">Location & Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
                <Select value={form.country} onValueChange={(v) => update('country', v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                <Input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="New York" className="h-11" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Street Address</label>
              <Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="123 Main St" className="h-11" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bedrooms</label>
                <Input type="number" value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bathrooms</label>
                <Input type="number" value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Area (sqft)</label>
                <Input type="number" value={form.area_sqft} onChange={(e) => update('area_sqft', e.target.value)} className="h-11" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.is_furnished} onCheckedChange={(v) => update('is_furnished', v)} /> Furnished</label>
              <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.pets_allowed} onCheckedChange={(v) => update('pets_allowed', v)} /> Pets Allowed</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITIES.map(a => (
                  <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />
                    {a}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold mb-4">Pricing & Availability</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                <Select value={form.currency} onValueChange={(v) => update('currency', v)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Monthly Rent</label>
                <Input type="number" value={form.monthly_rent} onChange={(e) => update('monthly_rent', e.target.value)} placeholder="1500" className="h-11" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Yearly Rent (optional)</label>
                <Input type="number" value={form.yearly_rent} onChange={(e) => update('yearly_rent', e.target.value)} placeholder="Auto-calculated if blank" className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Security Deposit</label>
                <Input type="number" value={form.security_deposit} onChange={(e) => update('security_deposit', e.target.value)} className="h-11" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Min Lease (months)</label>
                <Input type="number" value={form.min_lease_months} onChange={(e) => update('min_lease_months', e.target.value)} className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Lease (months)</label>
                <Input type="number" value={form.max_lease_months} onChange={(e) => update('max_lease_months', e.target.value)} className="h-11" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Available From</label>
              <Input type="date" value={form.available_from} onChange={(e) => update('available_from', e.target.value)} className="h-11" />
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl">Previous</Button>}
          <div className="ml-auto">
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} className="bg-slate-900 hover:bg-slate-800 rounded-xl px-8">Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving || !form.title || !form.monthly_rent || !form.city || !form.country} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-xl px-8">
                {saving ? 'Publishing...' : 'Publish Listing'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}