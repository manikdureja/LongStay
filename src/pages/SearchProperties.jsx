import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Map, List, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PropertyCard from '@/components/property/PropertyCard';
import { HARYANA_CITIES } from '@/lib/haryanaCities';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PROPERTY_TYPES = ['apartment','house','office','villa','studio','condo','loft'];
const AMENITIES_LIST = ['WiFi','AC','Washer','Dryer','Kitchen','Gym','Pool','Parking','Balcony','Elevator'];

export default function SearchProperties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [savedIds, setSavedIds] = useState([]);

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [propertyType, setPropertyType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minLease, setMinLease] = useState('');
  const [maxLease, setMaxLease] = useState('');
  const [amenities, setAmenities] = useState([]);
  const [furnished, setFurnished] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [sortBy, setSortBy] = useState('-created_date');

  useEffect(() => {
    const load = async () => {
      const [props, saved] = await Promise.all([
        base44.entities.Property.filter({ status: 'active' }),
        base44.entities.SavedProperty.filter(),
      ]);
      setProperties(props);
      setSavedIds(saved.map(s => s.property_id));
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    let result = [...properties];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.country?.toLowerCase().includes(q) ||
        p.property_type?.toLowerCase().includes(q)
      );
    }
    if (propertyType) result = result.filter(p => p.property_type === propertyType);
    if (minPrice) result = result.filter(p => p.monthly_rent >= Number(minPrice));
    if (maxPrice) result = result.filter(p => p.monthly_rent <= Number(maxPrice));
    if (minLease) result = result.filter(p => p.min_lease_months >= Number(minLease));
    if (maxLease) result = result.filter(p => p.max_lease_months <= Number(maxLease));
    if (furnished) result = result.filter(p => p.is_furnished);
    if (petsAllowed) result = result.filter(p => p.pets_allowed);
    if (amenities.length > 0) result = result.filter(p => amenities.every(a => p.amenities?.includes(a)));
    if (sortBy === 'price_asc') result.sort((a,b) => a.monthly_rent - b.monthly_rent);
    else if (sortBy === 'price_desc') result.sort((a,b) => b.monthly_rent - a.monthly_rent);
    else if (sortBy === 'rating') result.sort((a,b) => (b.avg_rating||0) - (a.avg_rating||0));
    setFiltered(result);
  }, [properties, search, propertyType, minPrice, maxPrice, minLease, maxLease, amenities, furnished, petsAllowed, sortBy]);

  const toggleAmenity = (a, checked) => setAmenities(prev => checked ? [...prev, a] : prev.filter(x => x !== a));

  const toggleSave = async (propertyId) => {
    if (savedIds.includes(propertyId)) {
      const saved = await base44.entities.SavedProperty.filter({ property_id: propertyId });
      if (saved[0]) await base44.entities.SavedProperty.delete(saved[0].id);
      setSavedIds(prev => prev.filter(id => id !== propertyId));
    } else {
      await base44.entities.SavedProperty.create({ property_id: propertyId });
      setSavedIds(prev => [...prev, propertyId]);
    }
  };

  const clearFilters = () => {
    setSearch(''); setPropertyType(''); setMinPrice(''); setMaxPrice('');
    setMinLease(''); setMaxLease(''); setAmenities([]); setFurnished(false); setPetsAllowed(false);
  };

  const activeCount = [propertyType, minPrice, maxPrice, minLease, maxLease, furnished, petsAllowed].filter(Boolean).length + amenities.length;
  const mapCenter = filtered.find(p => p.latitude) ? [filtered.find(p => p.latitude).latitude, filtered.find(p => p.latitude).longitude] : [40.7128, -74.006];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by city or property type in Haryana..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters {activeCount > 0 && <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeCount}</span>}
          </button>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('map')} className={`px-3 py-2 ${viewMode === 'map' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Map className="w-4 h-4" /></button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700">
                    <option value="">All types</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                  <div className="flex gap-1 col-span-2">
                    <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min $/mo" type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max $/mo" type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex gap-1 col-span-2">
                    <select value={minLease} onChange={e => setMinLease(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700">
                      <option value="">Min lease</option>
                      {[1,3,6,12,24].map(m => <option key={m} value={m}>{m}+ months</option>)}
                    </select>
                    <select value={maxLease} onChange={e => setMaxLease(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700">
                      <option value="">Max lease</option>
                      {[3,6,12,24,36].map(m => <option key={m} value={m}>Up to {m}mo</option>)}
                    </select>
                  </div>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700">
                    <option value="-created_date">Newest first</option>
                    <option value="price_asc">Price: Low → High</option>
                    <option value="price_desc">Price: High → Low</option>
                    <option value="rating">Top rated</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <input type="checkbox" checked={furnished} onChange={e => setFurnished(e.target.checked)} /> Furnished
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <input type="checkbox" checked={petsAllowed} onChange={e => setPetsAllowed(e.target.checked)} /> Pets allowed
                  </label>
                  <div className="w-px h-5 bg-slate-200" />
                  {AMENITIES_LIST.map(a => (
                    <label key={a} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${amenities.includes(a) ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      <input type="checkbox" className="hidden" checked={amenities.includes(a)} onChange={e => toggleAmenity(a, e.target.checked)} />{a}
                    </label>
                  ))}
                  {activeCount > 0 && (
                    <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-sm hover:bg-red-50">
                      <X className="w-3 h-3" /> Clear all
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-sm text-slate-500 mb-4">{filtered.length} {filtered.length === 1 ? 'property' : 'properties'} found</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-72 bg-slate-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : viewMode === 'list' ? (
          filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg mb-3">No properties found</p>
              <button onClick={clearFilters} className="text-amber-500 text-sm hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(p => (
                <PropertyCard key={p.id} property={p} isSaved={savedIds.includes(p.id)} onToggleSave={() => toggleSave(p.id)} />
              ))}
            </div>
          )
        ) : (
          <div className="h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
              {filtered.filter(p => p.latitude && p.longitude).map(p => (
                <Marker key={p.id} position={[p.latitude, p.longitude]}>
                  <Popup>
                    <div className="min-w-[160px]">
                      <img src={p.images?.[0]} className="w-full h-24 object-cover rounded-lg mb-2" />
                      <p className="font-semibold text-sm text-slate-900">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.city}, {p.country}</p>
                      <p className="text-amber-600 font-bold text-sm mt-1">${p.monthly_rent?.toLocaleString()}/mo</p>
                      <p className="text-xs text-slate-400">{p.min_lease_months}–{p.max_lease_months} months lease</p>
                      <button onClick={() => navigate(`/property/${p.id}`)} className="mt-2 w-full text-xs bg-amber-500 text-white py-1.5 px-3 rounded-lg hover:bg-amber-600">View property</button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}
