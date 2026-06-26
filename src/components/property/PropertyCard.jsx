import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, BedDouble, Bath, Maximize, Star, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';
import { motion } from 'framer-motion';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
];

export default function PropertyCard({ property, isSaved, onToggleSave }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = property.images?.length > 0 ? property.images : [PLACEHOLDER_IMAGES[Math.floor(Math.random() * 3)]];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link to={`/property/${property.id}`}>
          <img
            src={images[imgIdx]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
            property.category === 'commercial' ? 'bg-blue-500/90 text-white' : 'bg-white/90 text-slate-800'
          }`}>
            {property.property_type?.charAt(0).toUpperCase() + property.property_type?.slice(1)}
          </span>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onToggleSave?.(property.id); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
        >
          <Heart className={`w-4.5 h-4.5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.slice(0, 5).map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>
      <Link to={`/property/${property.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-900 line-clamp-1 text-[15px]">{property.title}</h3>
          {property.avg_rating > 0 && (
            <span className="flex items-center gap-1 text-sm font-medium shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {property.avg_rating?.toFixed(1)}
            </span>
          )}
        </div>
        <p className="flex items-center gap-1 text-sm text-slate-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          {property.city}, {property.country}
        </p>
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{property.bedrooms} bed</span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} bath</span>
          )}
          {property.area_sqft > 0 && (
            <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" />{property.area_sqft} sqft</span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-slate-900">{formatCurrency(property.monthly_rent, property.currency)}</span>
          <span className="text-sm text-slate-400">/ month</span>
        </div>
      </Link>
    </motion.div>
  );
}