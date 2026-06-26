import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize2, Star, Heart, Share2, ChevronLeft, ChevronRight, X, GitCompare, Calculator, Calendar, MapPinned, Wifi, Car, Dumbbell, Waves, Wind, Coffee } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { useCompare } from '@/context/CompareContext';
import { motion, AnimatePresence } from 'framer-motion';

const AMENITY_ICONS = { WiFi: Wifi, Parking: Car, Gym: Dumbbell, Pool: Waves, AC: Wind, Kitchen: Coffee };

const NEIGHBORHOOD_DATA = {
  'san francisco': { walk: 98, transit: 89, bike: 72, noise: 'Moderate', safety: 'Good', restaurants: 142, parks: 12 },
  'new york': { walk: 99, transit: 100, bike: 69, noise: 'Loud', safety: 'Good', restaurants: 890, parks: 8 },
  'miami': { walk: 78, transit: 57, bike: 65, noise: 'Moderate', safety: 'Fair', restaurants: 210, parks: 15 },
  'london': { walk: 91, transit: 100, bike: 61, noise: 'Moderate', safety: 'Good', restaurants: 380, parks: 22 },
  'barcelona': { walk: 96, transit: 88, bike: 83, noise: 'Loud', safety: 'Good', restaurants: 290, parks: 18 },
  'tokyo': { walk: 93, transit: 100, bike: 55, noise: 'Quiet', safety: 'Excellent', restaurants: 510, parks: 31 },
};

const getNeighborhood = (city) => {
  const key = city?.toLowerCase();
  return NEIGHBORHOOD_DATA[key] || { walk: 72, transit: 65, bike: 55, noise: 'Moderate', safety: 'Good', restaurants: 85, parks: 6 };
};

const ScoreBar = ({ score, label }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-slate-500 w-14">{label}</span>
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${score}%` }} />
    </div>
    <span className="text-xs font-medium text-slate-700 w-6">{score}</span>
  </div>
);

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useOutletContext();
  const { toast } = useToast();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();

  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);

  // Gallery
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // Booking form
  const [startDate, setStartDate] = useState('');
  const [leaseMonths, setLeaseMonths] = useState(3);
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState(false);

  // Calculator
  const [calcMonths, setCalcMonths] = useState(6);

  // Calendar
  const [bookedRanges, setBookedRanges] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      const [prop, revs, saved, bookings] = await Promise.all([
        base44.entities.Property.get(id),
        base44.entities.Review.filter({ property_id: id }),
        base44.entities.SavedProperty.filter({ property_id: id }),
        base44.entities.Booking.filter({ property_id: id }),
      ]);
      setProperty(prop);
      setReviews(revs);
      if (saved.length > 0) { setIsSaved(true); setSavedId(saved[0].id); }
      setBookedRanges(bookings.filter(b => b.status === 'active' || b.status === 'approved').map(b => ({ start: new Date(b.start_date), end: new Date(b.end_date) })));
      if (prop?.min_lease_months) setLeaseMonths(prop.min_lease_months);
      setCalcMonths(prop?.min_lease_months || 3);
      setLoading(false);
    };
    load();
  }, [id]);

  const toggleSave = async () => {
    if (isSaved && savedId) {
      await base44.entities.SavedProperty.delete(savedId);
      setIsSaved(false); setSavedId(null);
      toast({ title: 'Removed from saved' });
    } else {
      const s = await base44.entities.SavedProperty.create({ property_id: id });
      setIsSaved(true); setSavedId(s.id);
      toast({ title: 'Saved!' });
    }
  };

  const handleBook = async () => {
    if (!startDate) { toast({ title: 'Select a start date', variant: 'destructive' }); return; }
    if (!user) { navigate('/login'); return; }
    setBooking(true);
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + leaseMonths);
      await base44.entities.Booking.create({
        property_id: id,
        renter_id: user.id,
        renter_name: profile?.full_name || user.email,
        host_id: property.host_id,
        host_name: property.host_name,
        property_title: property.title,
        property_image: property.images?.[0],
        lease_months: leaseMonths,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        total_amount: property.monthly_rent * leaseMonths,
        currency: property.currency,
        status: 'pending',
        message,
      });
      toast({ title: '🎉 Booking request sent!', description: 'The host will review your request.' });
      setStartDate(''); setMessage('');
    } catch (e) {
      toast({ title: 'Booking failed', variant: 'destructive' });
    }
    setBooking(false);
  };

  const handleCompare = () => {
    if (isInCompare(id)) {
      removeFromCompare(id);
      toast({ title: 'Removed from compare' });
    } else {
      const added = addToCompare(property);
      if (added) toast({ title: 'Added to compare' });
      else toast({ title: 'Compare list is full (max 3)', variant: 'destructive' });
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, year, month };
  };

  const isBooked = (day) => {
    const { year, month } = getDaysInMonth(calendarMonth);
    const date = new Date(year, month, day);
    return bookedRanges.some(r => date >= r.start && date <= r.end);
  };

  const isPast = (day) => {
    const { year, month } = getDaysInMonth(calendarMonth);
    return new Date(year, month, day) < new Date();
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-96 bg-slate-200 rounded-2xl" />
        <div className="h-8 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-200 rounded w-1/3" />
      </div>
    </div>
  );

  if (!property) return (
    <div className="text-center py-20">
      <p className="text-slate-400">Property not found</p>
      <button onClick={() => navigate('/search')} className="mt-3 text-amber-500 hover:underline text-sm">Browse properties</button>
    </div>
  );

  const images = property.images || [];
  const neighborhood = getNeighborhood(property.city);
  const totalCost = property.monthly_rent * calcMonths + property.security_deposit;
  const { firstDay, daysInMonth, year, month } = getDaysInMonth(calendarMonth);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Fullscreen Gallery */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 z-10">
              <X className="w-5 h-5" />
            </button>
            <button onClick={() => setGalleryIndex(i => (i - 1 + images.length) % images.length)}
              className="absolute left-4 text-white bg-white/20 rounded-full p-3 hover:bg-white/30 z-10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <img src={images[galleryIndex]} className="max-h-screen max-w-full object-contain" />
            <button onClick={() => setGalleryIndex(i => (i + 1) % images.length)}
              className="absolute right-4 text-white bg-white/20 rounded-full p-3 hover:bg-white/30 z-10">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 flex gap-2">
              {images.map((_, i) => (
                <button key={i} onClick={() => setGalleryIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === galleryIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
            <p className="absolute bottom-4 right-4 text-white/60 text-sm">{galleryIndex + 1} / {images.length}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to search
        </button>

        {/* Image Gallery */}
        <div className="relative mb-6">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden cursor-pointer" onClick={() => setFullscreen(true)}>
            <div className="col-span-2 row-span-2 relative">
              <img src={images[0]} className="w-full h-full object-cover" />
            </div>
            {images.slice(1, 5).map((img, i) => (
              <div key={i} className="relative">
                <img src={img} className="w-full h-full object-cover" />
                {i === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">+{images.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setFullscreen(true)} className="absolute bottom-3 right-3 bg-white text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow flex items-center gap-1 hover:bg-slate-50">
            <Maximize2 className="w-3 h-3" /> Show all photos
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{property.category}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{property.property_type}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{property.title}</h1>
                  <div className="flex items-center gap-1 text-slate-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{property.address}, {property.city}, {property.country}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={toggleSave} className={`p-2 rounded-lg border transition-colors ${isSaved ? 'bg-red-50 border-red-200 text-red-500' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                  <button onClick={handleCompare} className={`p-2 rounded-lg border transition-colors ${isInCompare(id) ? 'bg-amber-50 border-amber-300 text-amber-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                    <GitCompare className="w-4 h-4" />
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: 'Link copied!' }); }}
                    className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-4 py-4 border-y border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Bed className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{property.bedrooms} {property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Bath className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{property.bathrooms} {property.bathrooms === 1 ? 'bathroom' : 'bathrooms'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Maximize2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{property.area_sqft} sqft</span>
                </div>
                {property.avg_rating && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{property.avg_rating}</span>
                    <span className="text-sm text-slate-400">({property.review_count} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">About this property</h2>
              <p className="text-slate-600 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map(a => {
                    const Icon = AMENITY_ICONS[a];
                    return (
                      <div key={a} className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-100">
                        {Icon ? <Icon className="w-4 h-4 text-amber-500" /> : <div className="w-4 h-4 rounded-full bg-amber-100" />}
                        <span className="text-sm text-slate-700">{a}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rental Calculator */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Calculator className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-900">Rental calculator</h2>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Lease duration</span>
                  <span className="font-semibold text-slate-900">{calcMonths} months</span>
                </div>
                <input type="range" min={property.min_lease_months || 1} max={property.max_lease_months || 24}
                  value={calcMonths} onChange={e => setCalcMonths(Number(e.target.value))}
                  className="w-full accent-amber-500" />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{property.min_lease_months || 1} month</span>
                  <span>{property.max_lease_months || 24} months</span>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Monthly rent × {calcMonths}</span>
                  <span className="text-slate-900">{formatCurrency(property.monthly_rent * calcMonths, property.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Security deposit</span>
                  <span className="text-slate-900">{formatCurrency(property.security_deposit, property.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-slate-100">
                  <span className="text-slate-900">Total upfront cost</span>
                  <span className="text-amber-600">{formatCurrency(totalCost, property.currency)}</span>
                </div>
              </div>
            </div>

            {/* Availability Calendar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
              </div>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <span className="font-medium text-slate-900 text-sm">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>
                ))}
                {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const booked = isBooked(day);
                  const past = isPast(day);
                  return (
                    <div key={day} className={`py-1.5 text-xs rounded-lg font-medium transition-colors ${booked ? 'bg-red-100 text-red-400 line-through' : past ? 'text-slate-300' : 'text-slate-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer'}`}>
                      {day}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-100 border border-red-200" /><span className="text-xs text-slate-500">Booked</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100" /><span className="text-xs text-slate-500">Available</span></div>
              </div>
            </div>

            {/* Neighborhood */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <MapPinned className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-900">Neighborhood: {property.city}</h2>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-5">
                <div>
                  <ScoreBar score={neighborhood.walk} label="Walk" />
                  <div className="mt-2"><ScoreBar score={neighborhood.transit} label="Transit" /></div>
                  <div className="mt-2"><ScoreBar score={neighborhood.bike} label="Bike" /></div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Noise level</span>
                    <span className={`font-medium ${neighborhood.noise === 'Quiet' ? 'text-emerald-600' : neighborhood.noise === 'Loud' ? 'text-red-500' : 'text-amber-600'}`}>{neighborhood.noise}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Safety</span>
                    <span className={`font-medium ${neighborhood.safety === 'Excellent' ? 'text-emerald-600' : neighborhood.safety === 'Good' ? 'text-blue-600' : 'text-amber-600'}`}>{neighborhood.safety}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Restaurants nearby</span>
                    <span className="font-medium text-slate-700">{neighborhood.restaurants}+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Parks nearby</span>
                    <span className="font-medium text-slate-700">{neighborhood.parks}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Reviews ({reviews.length})</h2>
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-white rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-semibold">
                          {r.reviewer_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{r.reviewer_name || 'Anonymous'}</p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — Booking */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-20">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-slate-900">{formatCurrency(property.monthly_rent, property.currency)}</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              {property.yearly_rent && (
                <p className="text-sm text-emerald-600 font-medium mb-1">{formatCurrency(property.yearly_rent, property.currency)}/year</p>
              )}
              <p className="text-xs text-slate-400 mb-5">Security deposit: {formatCurrency(property.security_deposit, property.currency)}</p>
              <p className="text-xs text-slate-500 mb-5">Lease: {property.min_lease_months}–{property.max_lease_months} months · {property.is_furnished ? 'Furnished' : 'Unfurnished'} · {property.pets_allowed ? '🐾 Pets OK' : 'No pets'}</p>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Move-in date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">Lease duration</label>
                    <span className="text-xs text-amber-600 font-medium">{leaseMonths} months</span>
                  </div>
                  <input type="range" min={property.min_lease_months || 1} max={property.max_lease_months || 24}
                    value={leaseMonths} onChange={e => setLeaseMonths(Number(e.target.value))}
                    className="w-full accent-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Message to host (optional)</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                    placeholder="Tell the host a bit about yourself..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 mb-4 text-sm">
                <div className="flex justify-between text-slate-500 mb-1">
                  <span>{formatCurrency(property.monthly_rent, property.currency)} × {leaseMonths} mo</span>
                  <span>{formatCurrency(property.monthly_rent * leaseMonths, property.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-500 mb-2">
                  <span>Security deposit</span>
                  <span>{formatCurrency(property.security_deposit, property.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-amber-600">{formatCurrency(property.monthly_rent * leaseMonths + property.security_deposit, property.currency)}</span>
                </div>
              </div>

              <button onClick={handleBook} disabled={booking}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                {booking ? 'Sending request...' : 'Request to book'}
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">You won't be charged yet</p>

              {/* Host */}
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-100">
                <img src={property.host_photo || 'https://i.pravatar.cc/40'} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-xs text-slate-400">Hosted by</p>
                  <p className="text-sm font-medium text-slate-900">{property.host_name}</p>
                </div>
                <button onClick={() => navigate('/messages')} className="ml-auto text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg">Message</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
