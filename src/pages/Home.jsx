import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Search, Building2, Home as HomeIcon, Briefcase, MapPin, ArrowRight, Star, Shield, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PropertyCard from '@/components/property/PropertyCard';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { icon: HomeIcon, label: 'Apartments', type: 'apartment' },
  { icon: Building2, label: 'Houses', type: 'house' },
  { icon: Briefcase, label: 'Offices', type: 'office' },
  { icon: Building2, label: 'Villas', type: 'villa' },
  { icon: Building2, label: 'Studios', type: 'studio' },
  { icon: Building2, label: 'Condos', type: 'condo' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [props, saved] = await Promise.all([
        base44.entities.Property.filter({ status: 'active' }, '-created_date', 8),
        user ? base44.entities.SavedProperty.filter({ user_id: user.id }) : Promise.resolve([])
      ]);
      setFeatured(props);
      setSavedIds(new Set(saved.map(s => s.property_id)));
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleSave = async (propertyId) => {
    if (!user) return;
    if (savedIds.has(propertyId)) {
      const saved = await base44.entities.SavedProperty.filter({ user_id: user.id, property_id: propertyId });
      if (saved[0]) await base44.entities.SavedProperty.delete(saved[0].id);
      setSavedIds(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
    } else {
      await base44.entities.SavedProperty.create({ user_id: user.id, property_id: propertyId });
      setSavedIds(prev => new Set(prev).add(propertyId));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(search)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&h=900&fit=crop" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Long-term rentals worldwide
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6">
              Find your next
              <span className="text-amber-400"> long-term</span> home
            </h1>
            <p className="text-lg text-slate-300 mb-8 max-w-lg">
              Discover apartments, houses, and commercial spaces for monthly and yearly rentals across the globe.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by city, country, or property type..."
                  className="pl-12 h-14 bg-white text-slate-900 border-0 rounded-xl text-base placeholder:text-slate-400"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-xl text-base">
                Search
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.type}
              onClick={() => navigate(`/search?type=${cat.type}`)}
              className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-colors min-w-[100px]"
            >
              <cat.icon className="w-6 h-6 text-slate-600" />
              <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Featured Properties</h2>
            <p className="text-slate-500 mt-1">Hand-picked listings for you</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/search')} className="text-amber-600 hover:text-amber-700">
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">No properties listed yet</h3>
            <p className="text-slate-400 mt-1">Be the first to list a property!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map(p => (
              <PropertyCard key={p.id} property={p} isSaved={savedIds.has(p.id)} onToggleSave={toggleSave} />
            ))}
          </div>
        )}
      </section>

      {/* Trust Signals */}
      <section className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Shield, title: 'Verified Listings', desc: 'Every property is reviewed before going live on our platform.' },
              { icon: Clock, title: 'Flexible Leases', desc: 'Monthly to yearly leases tailored to your needs.' },
              { icon: Star, title: 'Trusted Reviews', desc: 'Real reviews from verified tenants after their lease.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-slate-900" />
              </div>
              <span className="font-heading font-bold text-lg">LongStay</span>
            </div>
            <p className="text-slate-400 text-sm">© 2024 LongStay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}