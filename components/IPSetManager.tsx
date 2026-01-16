
import React, { useState } from 'react';
import { IPSet } from '../types.ts';
import { Plus, Trash2, Globe, List, Hash } from 'lucide-react';

interface Props {
  ipSets: IPSet[];
  onChange: (ipSets: IPSet[]) => void;
}

const IPSetManager: React.FC<Props> = ({ ipSets, onChange }) => {
  const addSet = () => {
    const newSet: IPSet = {
      id: Math.random().toString(36).substr(2, 9),
      name: `set_${ipSets.length + 1}`,
      mode: 'geo',
      manualEntries: []
    };
    onChange([...ipSets, newSet]);
  };

  const removeSet = (id: string) => {
    onChange(ipSets.filter(s => s.id !== id));
  };

  const updateSet = (id: string, updates: Partial<IPSet>) => {
    onChange(ipSets.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">IP Sets</h3>
        <button 
          onClick={addSet}
          className="p-1 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-colors"
          title="Add IP Set"
        >
          <Plus size={18} />
        </button>
      </div>

      {ipSets.length === 0 && (
        <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl">
          <p className="text-[10px] text-slate-500">No custom IP sets defined</p>
        </div>
      )}

      <div className="space-y-3">
        {ipSets.map((set) => (
          <div key={set.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Hash size={14} className="text-slate-500" />
                <input
                  type="text"
                  value={set.name}
                  onChange={(e) => updateSet(set.id, { name: e.target.value })}
                  placeholder="Set Name"
                  className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-1 w-full"
                />
              </div>
              <button 
                onClick={() => removeSet(set.id)}
                className="text-slate-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 bg-slate-900/50 p-1 rounded-lg">
              <button
                onClick={() => updateSet(set.id, { mode: 'geo' })}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                  set.mode === 'geo' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Globe size={12} /> Geo-Sync
              </button>
              <button
                onClick={() => updateSet(set.id, { mode: 'manual' })}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                  set.mode === 'manual' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <List size={12} /> Manual
              </button>
            </div>

            {set.mode === 'manual' ? (
              <textarea
                placeholder="192.168.1.0/24&#10;10.0.0.1"
                className="w-full h-20 bg-slate-950 border border-slate-700/50 rounded-lg p-2 text-[10px] font-mono text-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                value={set.manualEntries.join('\n')}
                onChange={(e) => updateSet(set.id, { manualEntries: e.target.value.split('\n').filter(Boolean) })}
              />
            ) : (
              <div className="p-2 border border-blue-500/10 bg-blue-500/5 rounded-lg">
                <p className="text-[10px] text-blue-300/60 text-center italic leading-tight">
                  Automatically populated based on selected global regions.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IPSetManager;
