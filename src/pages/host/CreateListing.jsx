import React, { useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Upload, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { PROPERTY_TYPES, AMENITIES } from '@/lib/constants';
import { HARYANA_CITIES } from '@/lib/haryanaCities';
import { motion } from 'framer-motion';

export default function CreateListing() {
  const { user, profile } = useOutletContext();
  const navigate = useNavigate();
  const submittingRef = useRef(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', property_type: 'apartment', category: 'residential',
    images: [], monthly_rent: '', yearly_rent: '', currency: 'INR', security_deposit: '',
    bedrooms: '', bathrooms: '', area_sqft: '', amenities: [],
    address: '', city: '', country: 'India', zip_code: '',
    min_lease_months: 1, max_lease_months: 24, is_furnished: false, pets_allowed: false,
    available_from: '',
  });

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const compressImage = (file) => new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const maxSize = 1200;
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = (h / w) * maxSize; w = maxSize; }
        else { w = (w / h) * maxSize; h = maxSize; }
      }
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(file);
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const compressed = await compressImage(file);
        const fileName = `properties/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { error } = await supabase.storage
          .from('property-images')
          .upload(fileName, compressed, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });
        if (error) { showToast(`Upload failed: ${error.message}`, 'error'); continue; }
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(fileName);
        urls.push(publicUrl);
      }
      if (urls.length > 0) {
        update('images', [...form.images, ...urls]);
        showToast(`${urls.length} photo(s) uploaded`);
      }
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, 'error');
    }
    setUploading(false);
  };

  const removeImage = (idx) => update('images', form.images.filter((_, i) => i !== idx));
  const toggleAmenity = (a) => update('amenities', form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a]);

  const validateStep1 = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Property title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.images.length === 0) e.images = 'Please upload at least 1 photo';
    if (uploading) e.images = 'Please wait for photos to finish uploading';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.city) e.city = 'City is required';
    if (!form.address.trim()) e.address = 'Street address is required';
    if (!form.bedrooms) e.bedrooms = 'Required';
    if (!form.bathrooms) e.bathrooms = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!form.monthly_rent) e.monthly_rent = 'Monthly rent is required';
    if (!form.available_from) e.available_from = 'Available from date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    try {
      const { error } = await supabase.from('properties').insert({
        title: form.title,
        description: form.description,
        property_type: form.property_type,
        category: form.category,
        images: form.images,
        monthly_rent: Number(form.monthly_rent),
        yearly_rent: form.yearly_rent ? Number(form.yearly_rent) : Number(form.monthly_rent) * 12,
        currency: 'INR',
        security_deposit: Number(form.security_deposit) || 0,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        area_sqft: Number(form.area_sqft) || 0,
        amenities: form.amenities,
        address: form.address,
        city: form.city,
        country: 'India',
        zip_code: form.zip_code,
        min_lease_months: Number(form.min_lease_months),
        max_lease_months: Number(form.max_lease_months),
        is_furnished: form.is_furnished,
        pets_allowed: form.pets_allowed,
        available_from: form.available_from || null,
        host_id: user.id,
        host_name: profile?.full_name || user.email,
        host_photo: profile?.photo || '',
        status: profile?.role === 'admin' ? 'active' : 'pending',
        avg_rating: 0, review_count: 0, views: 0,
      });
      if (error) throw error;
      navigate('/host/dashboard');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
    setSaving(false);
    submittingRef.current = false;
  };

  const Field = ({ label, error, required, children }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Custom toast - replaces shadcn toaster */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.type !== 'error' && <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">List Your Property</h1>
      <p className="text-slate-500 mb-8">Step {step} of 3</p>

      <div className="flex gap-2 mb-8">
        {[1,2,3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-amber-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm">

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <Field label="Property Title" required error={errors.title}>
              <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Modern 2BHK in Hansi" className={`h-11 ${errors.title ? 'border-red-400' : ''}`} />
            </Field>
            <Field label="Description" required error={errors.description}>
              <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe your property in detail..." rows={4} className={errors.description ? 'border-red-400' : ''} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category" required>
                <Select value={form.category} onValueChange={v => update('category', v)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Property Type" required>
                <Select value={form.property_type} onValueChange={v => update('property_type', v)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Photos" required error={errors.images}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-1">
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${uploading ? 'border-amber-300 bg-amber-50' : errors.images ? 'border-red-300' : 'border-slate-300 hover:border-amber-400'}`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                      <span className="text-xs text-amber-600 font-medium">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-400">Add photos</span>
                    </>
                  )}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
              {form.images.length > 0 && !uploading && (
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {form.images.length} photo(s) ready
                </p>
              )}
              {uploading && (
                <p className="text-xs text-amber-600 mt-2">⏳ Please wait for upload to complete before continuing...</p>
              )}
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold mb-4">Location & Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" required error={errors.city}>
                <Select value={form.city} onValueChange={v => update('city', v)}>
                  <SelectTrigger className={`h-11 ${errors.city ? 'border-red-400' : ''}`}><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>{HARYANA_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="State">
                <Input value="Haryana" disabled className="h-11 bg-slate-50" />
              </Field>
            </div>
            <Field label="Street Address" required error={errors.address}>
              <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="House No, Street, Near Landmark" className={`h-11 ${errors.address ? 'border-red-400' : ''}`} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Bedrooms" required error={errors.bedrooms}>
                <Input type="number" min="0" value={form.bedrooms} onChange={e => update('bedrooms', e.target.value)} className={`h-11 ${errors.bedrooms ? 'border-red-400' : ''}`} />
              </Field>
              <Field label="Bathrooms" required error={errors.bathrooms}>
                <Input type="number" min="0" value={form.bathrooms} onChange={e => update('bathrooms', e.target.value)} className={`h-11 ${errors.bathrooms ? 'border-red-400' : ''}`} />
              </Field>
              <Field label="Area (sqft)">
                <Input type="number" value={form.area_sqft} onChange={e => update('area_sqft', e.target.value)} className="h-11" />
              </Field>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={form.is_furnished} onCheckedChange={v => update('is_furnished', v)} /> Furnished
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={form.pets_allowed} onCheckedChange={v => update('pets_allowed', v)} /> Pets Allowed
              </label>
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
            <Field label="Monthly Rent (₹)" required error={errors.monthly_rent}>
              <Input type="number" value={form.monthly_rent} onChange={e => update('monthly_rent', e.target.value)} placeholder="15000" className={`h-11 ${errors.monthly_rent ? 'border-red-400' : ''}`} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Yearly Rent (₹) — optional">
                <Input type="number" value={form.yearly_rent} onChange={e => update('yearly_rent', e.target.value)} placeholder="Auto-calculated if blank" className="h-11" />
              </Field>
              <Field label="Security Deposit (₹)">
                <Input type="number" value={form.security_deposit} onChange={e => update('security_deposit', e.target.value)} className="h-11" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Min Lease (months)">
                <Input type="number" min="1" value={form.min_lease_months} onChange={e => update('min_lease_months', e.target.value)} className="h-11" />
              </Field>
              <Field label="Max Lease (months)">
                <Input type="number" min="1" value={form.max_lease_months} onChange={e => update('max_lease_months', e.target.value)} className="h-11" />
              </Field>
            </div>
            <Field label="Available From" required error={errors.available_from}>
              <Input type="date" value={form.available_from} onChange={e => update('available_from', e.target.value)} className={`h-11 ${errors.available_from ? 'border-red-400' : ''}`} min={new Date().toISOString().split('T')[0]} />
            </Field>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl">Previous</Button>
          ) : <div />}
          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={uploading}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl px-8"
            >
              {uploading ? 'Uploading photos...' : 'Next'}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-xl px-8"
            >
              {saving ? 'Publishing...' : 'Publish Listing'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
