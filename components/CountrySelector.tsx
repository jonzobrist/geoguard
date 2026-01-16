
import React, { useState, useMemo } from 'react';
import { COUNTRIES, CONTINENTS } from '../constants.ts';

interface Props {
  selectedCountries: string[];
  selectedContinents: string[];
  onToggleCountry: (code: string) => void;
  onToggleContinent: (name: string) => void;
}

const CountrySelector: React.FC<Props> = ({ 
  selectedCountries, 
  selectedContinents, 
  onToggleCountry, 
  onToggleContinent 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Continents</h3>
        <div className="flex flex-wrap gap-2">
          {CONTINENTS.map(continent => (
            <button
              key={continent}
              onClick={() => onToggleContinent(continent)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedContinents.includes(continent)
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {continent}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Countries</h3>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {filteredCountries.map(country => (
            <button
              key={country.code}
              onClick={() => onToggleCountry(country.code)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                selectedCountries.includes(country.code)
                ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <span>{country.name}</span>
              <span className="opacity-50 text-[10px]">{country.code}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountrySelector;
