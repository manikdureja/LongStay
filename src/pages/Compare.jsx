import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompare } from '@/context/CompareContext';
import { Check, X, Star, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/constants';

const Row = ({ label, values, format }) => (
  <tr className="border-b border-slate-100">
    <td className="py-3 px-4 text-sm text-slate-500 font-medium w-36">{label}</td>
    {values.map((v, i) => (
      <td key={i} className="py-3 px-4 text-sm text-slate-900 text-center">
        {format ? format(v) : (v ?? '—')}
      </td>
    ))}
    {[...Array(3 - values.length)].map((_, i) => (
      <td key={i} className="py-3 px-4 text-sm text-slate-300 text-center">—</td>
    ))}
  </tr>
);

export default function Compare() {
  const { compareList, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareList.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 text-lg">Add at least 2 properties to compare</p>
        <button onClick={() => navigate('/search')} className="mt-4 text-amber-500 hover:underline">Browse properties</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Compare Properties</h1>
        <button onClick={clearCompare} className="ml-auto text-sm text-red-400 hover:text-red-600">Clear all</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Property headers */}
        <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: `144px repeat(${compareList.length}, 1fr)` }}>
          <div className="p-4 bg-slate-50" />
          {compareList.map(p => (
            <div key={p.id} className="p-4 border-l border-slate-100">
              <img src={p.images?.[0]} className="w-full h-40 object-cover rounded-xl mb-3" />
              <p className="font-semibold text-slate-900 text-sm leading-tight mb-1">{p.title}</p>
              <p className="text-xs text-slate-500">{p.city}, {p.country}</p>
              <p className="text-amber-600 font-bold mt-2">{formatCurrency(p.monthly_rent, p.currency)}/mo</p>
              <button onClick={() => navigate(`/property/${p.id}`)} className="mt-2 w-full text-xs bg-amber-500 text-white py-1.5 rounded-lg hover:bg-amber-600">
                View property
              </button>
            </div>
          ))}
        </div>

        {/* Comparison rows */}
        <table className="w-full">
          <tbody>
            <Row label="Monthly rent" values={compareList.map(p => p.monthly_rent)} format={v => `$${v?.toLocaleString()}`} />
            <Row label="Security deposit" values={compareList.map(p => p.security_deposit)} format={v => `$${v?.toLocaleString()}`} />
            <Row label="Bedrooms" values={compareList.map(p => p.bedrooms)} format={v => `${v} bed`} />
            <Row label="Bathrooms" values={compareList.map(p => p.bathrooms)} format={v => `${v} bath`} />
            <Row label="Area" values={compareList.map(p => p.area_sqft)} format={v => `${v} sqft`} />
            <Row label="Property type" values={compareList.map(p => p.property_type)} />
            <Row label="Min lease" values={compareList.map(p => p.min_lease_months)} format={v => `${v} months`} />
            <Row label="Max lease" values={compareList.map(p => p.max_lease_months)} format={v => `${v} months`} />
            <Row label="Rating" values={compareList.map(p => p.avg_rating)} format={v => v ? `⭐ ${v}` : '—'} />
            <Row label="Furnished" values={compareList.map(p => p.is_furnished)} format={v => v ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />} />
            <Row label="Pets allowed" values={compareList.map(p => p.pets_allowed)} format={v => v ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />} />
            <tr className="border-b border-slate-100">
              <td className="py-3 px-4 text-sm text-slate-500 font-medium">Amenities</td>
              {compareList.map(p => (
                <td key={p.id} className="py-3 px-4 border-l border-slate-50">
                  <div className="flex flex-wrap gap-1">
                    {p.amenities?.map(a => (
                      <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
