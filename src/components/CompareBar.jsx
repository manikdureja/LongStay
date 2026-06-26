import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, GitCompare } from 'lucide-react';
import { useCompare } from '@/context/CompareContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareList.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 px-4 py-3"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <GitCompare className="w-4 h-4 text-amber-400" />
          <span className="text-white text-sm font-medium">Compare ({compareList.length}/3)</span>
          <div className="flex gap-2 ml-3">
            {compareList.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
                <img src={p.images?.[0]} className="w-8 h-8 rounded object-cover" />
                <span className="text-white text-xs max-w-[100px] truncate">{p.title}</span>
                <button onClick={() => removeFromCompare(p.id)} className="text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {[...Array(3 - compareList.length)].map((_, i) => (
              <div key={i} className="w-28 h-9 border border-dashed border-slate-600 rounded-lg flex items-center justify-center">
                <span className="text-slate-600 text-xs">+ Add property</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={clearCompare} className="text-slate-400 text-sm hover:text-white">Clear</button>
        <button
          onClick={() => navigate('/compare')}
          disabled={compareList.length < 2}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Compare now
        </button>
      </div>
    </motion.div>
  );
}
