import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Heart } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function SavedProperties() {
  const { user } = useOutletContext();
  const [properties, setProperties] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const saved = await base44.entities.SavedProperty.filter({ user_id: user.id });
      const ids = saved.map(s => s.property_id);
      setSavedIds(new Set(ids));
      if (ids.length > 0) {
        const props = await Promise.all(ids.map(id => base44.entities.Property.get(id).catch(() => null)));
        setProperties(props.filter(Boolean));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleSave = async (propertyId) => {
    const saved = await base44.entities.SavedProperty.filter({ user_id: user.id, property_id: propertyId });
    if (saved[0]) await base44.entities.SavedProperty.delete(saved[0].id);
    setSavedIds(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
    setProperties(prev => prev.filter(p => p.id !== propertyId));
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <div key={i} className="h-72 bg-slate-200 rounded-2xl animate-pulse" />)}</div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">Saved Properties</h1>
      {properties.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-600">No saved properties</h3>
          <p className="text-slate-400 mt-1">Heart properties you like to save them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => (
            <PropertyCard key={p.id} property={p} isSaved={true} onToggleSave={toggleSave} />
          ))}
        </div>
      )}
    </div>
  );
}