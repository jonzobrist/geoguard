
import React, { useState, useMemo, useEffect } from 'react';
import { FirewallType, RuleAction, GeneratorConfig, RuleOutput } from '../types.ts';
import CountrySelector from './CountrySelector.tsx';
import WorldMap from './WorldMap.tsx';
import { generateFirewallRules } from '../services/geminiService.ts';
import { COUNTRIES } from '../constants.ts';
import { Terminal, Copy, ShieldCheck, ListFilter, Zap, RotateCcw, Check, Info, Loader2, FileCode, Search, Cpu, Globe } from 'lucide-react';

// Simple cookie helpers
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string) => {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, '');
};

const Generator: React.FC = () => {
  // Initialize state from persistent storage
  const [config, setConfig] = useState<GeneratorConfig>(() => {
    const savedCountries = getCookie('geoguard_countries');
    const savedConfig = localStorage.getItem('geoguard_config');
    
    const baseConfig = savedConfig ? JSON.parse(savedConfig) : {
      firewallType: FirewallType.IPTABLES,
      action: RuleAction.BLOCK,
      includeIpSet: true,
      includeIpv6: false,
      continents: [],
    };

    return {
      ...baseConfig,
      countries: savedCountries ? JSON.parse(savedCountries) : [],
      customIpSets: []
    };
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RuleOutput | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'inspect'>('script');
  const [copied, setCopied] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  // Persist changes to cookies and localStorage
  useEffect(() => {
    setCookie('geoguard_countries', JSON.stringify(config.countries));
    const { countries, customIpSets, ...rest } = config;
    localStorage.setItem('geoguard_config', JSON.stringify(rest));
  }, [config]);

  const cliCommand = useMemo(() => {
    const host = window.location.host;
    const countries = config.countries.length > 0 ? config.countries : ["CN"];
    return `curl -X POST https://${host}/v1/generate \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ country: countries, type: config.firewallType, action: config.action, use_ipset: config.includeIpSet, use_ipv6: config.includeIpv6 })}'`;
  }, [config.countries, config.firewallType, config.action, config.includeIpSet, config.includeIpv6]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const output = await generateFirewallRules(config);
      setResult(output);
    } catch (err) {
      console.error(err);
      alert("Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all selections and configuration?")) {
      setConfig({
        countries: [],
        continents: [],
        firewallType: FirewallType.IPTABLES,
        action: RuleAction.BLOCK,
        includeIpSet: true,
        includeIpv6: false,
        customIpSets: []
      });
      setResult(null);
      setCookie('geoguard_countries', '', -1);
      localStorage.removeItem('geoguard_config');
    }
  };

  const handleToggleCountry = (code: string) => {
    setConfig(prev => {
      const isRemoving = prev.countries.includes(code);
      const nextCountries = isRemoving ? prev.countries.filter(c => c !== code) : [...prev.countries, code];
      return { ...prev, countries: nextCountries };
    });
  };

  const handleToggleContinent = (continent: string) => {
    setConfig(prev => {
      const continentCountries = COUNTRIES.filter(c => c.continent === continent).map(c => c.code);
      const isDeselecting = prev.continents.includes(continent);
      
      let nextCountries;
      if (isDeselecting) {
        nextCountries = prev.countries.filter(c => !continentCountries.includes(c));
      } else {
        nextCountries = Array.from(new Set([...prev.countries, ...continentCountries]));
      }

      const nextContinents = isDeselecting 
        ? prev.continents.filter(c => c !== continent) 
        : [...prev.continents, continent];

      return { ...prev, countries: nextCountries, continents: nextContinents };
    });
  };

  const copyText = (text: string, isCli = false) => {
    navigator.clipboard.writeText(text);
    if (isCli) {
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <WorldMap selectedCountries={config.countries} onToggleCountry={handleToggleCountry} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Column */}
        <div className="lg:col-span-5 space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 self-start shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <ListFilter className="text-blue-500" size={20} /> Configuration
            </h2>
            <button onClick={handleReset} title="Clear All" className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-colors">
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Engine</label>
              <select 
                value={config.firewallType}
                onChange={(e) => setConfig({...config, firewallType: e.target.value as FirewallType})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {Object.values(FirewallType).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</label>
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button onClick={() => setConfig({...config, action: RuleAction.BLOCK})} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${config.action === RuleAction.BLOCK ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>BLOCK</button>
                <button onClick={() => setConfig({...config, action: RuleAction.ALLOW})} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${config.action === RuleAction.ALLOW ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>ALLOW</button>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-3">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">Use ipset extension</span>
                </div>
                <button 
                  onClick={() => setConfig({...config, includeIpSet: !config.includeIpSet})}
                  className={`w-10 h-5 rounded-full transition-all relative ${config.includeIpSet ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.includeIpSet ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-purple-400" />
                  <span className="text-xs font-bold text-slate-200">Include IPv6 ranges</span>
                </div>
                <button 
                  onClick={() => setConfig({...config, includeIpv6: !config.includeIpv6})}
                  className={`w-10 h-5 rounded-full transition-all relative ${config.includeIpv6 ? 'bg-purple-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.includeIpv6 ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <CountrySelector 
            selectedCountries={config.countries} 
            selectedContinents={config.continents} 
            onToggleCountry={handleToggleCountry} 
            onToggleContinent={handleToggleContinent} 
          />

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
            {loading ? 'Consulting WHOIS Registries...' : 'Generate Policy for ' + (config.countries.length || 'Default') + ' regions'}
          </button>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* CLI Reference */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="text-blue-500" size={18} />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Dynamic API Command</h3>
              </div>
              <button onClick={() => copyText(cliCommand, true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] font-bold text-white transition-all">
                {copiedCli ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copiedCli ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4 bg-black/50 overflow-x-auto">
              <code className="text-[11px] text-blue-400 font-mono whitespace-nowrap">{cliCommand}</code>
            </div>
          </div>

          {/* Result Tabs */}
          {result ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px] animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex bg-slate-800/50 border-b border-slate-800 p-1">
                <button onClick={() => setActiveTab('script')} className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'script' ? 'bg-slate-900 text-white shadow-inner' : 'text-slate-400 hover:text-slate-200'}`}>
                  <FileCode size={14} /> Script
                </button>
                <button onClick={() => setActiveTab('inspect')} className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'inspect' ? 'bg-slate-900 text-white shadow-inner' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Search size={14} /> Inspect Data
                </button>
              </div>

              <div className="flex-1 overflow-auto bg-[#020617] p-6 custom-scrollbar relative">
                {activeTab === 'script' && (
                  <div className="space-y-4">
                    <div className="absolute top-4 right-4 z-10">
                      <button onClick={() => copyText(result.script)} className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-white transition-all">
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <pre className="text-[12px] font-mono text-emerald-400/90 leading-relaxed whitespace-pre-wrap">{result.script}</pre>
                  </div>
                )}
                {activeTab === 'inspect' && (
                  <div className="space-y-4">
                    {result.ruleset.map((rule, idx) => (
                      <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">{rule.region}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{rule.cidrs.length} prefixes</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rule.cidrs.map((cidr, cIdx) => (
                            <code key={cIdx} className={`text-[10px] px-1.5 py-0.5 rounded ${cidr.includes(':') ? 'text-purple-400 bg-purple-900/20' : 'text-slate-500 bg-black/30'}`}>{cidr}</code>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-800 opacity-50">
              <ShieldCheck size={48} className="text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-500">Awaiting Selection</h3>
              <p className="text-xs text-slate-600 max-w-xs mt-2 italic leading-relaxed">
                Choose regions from the map or selector to start generating high-performance firewall policies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generator;
