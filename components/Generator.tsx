
import React, { useState, useMemo, useEffect } from 'react';
import { FirewallType, RuleAction, GeneratorConfig, RuleOutput, IPSet } from '../types.ts';
import CountrySelector from './CountrySelector.tsx';
import IPSetManager from './IPSetManager.tsx';
import WorldMap from './WorldMap.tsx';
import { generateFirewallRules } from '../services/geminiService.ts';
import { IPPrefixTrie } from '../utils/ipTrie.ts';
import { Terminal, Copy, Download, Loader2, ShieldCheck, ShieldAlert, Layers, FileCode, ExternalLink, Info, Search, ListFilter, Activity, ChevronRight, Play } from 'lucide-react';

const Generator: React.FC = () => {
  const [config, setConfig] = useState<GeneratorConfig>({
    countries: [],
    continents: [],
    firewallType: FirewallType.IPTABLES,
    action: RuleAction.BLOCK,
    includeIpSet: true,
    customIpSets: []
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'script'>('preview');
  const [output, setOutput] = useState<RuleOutput | null>(null);
  const [testIp, setTestIp] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  // Build the IP Trie whenever output changes
  const trie = useMemo(() => {
    if (!output) return null;
    const newTrie = new IPPrefixTrie();
    output.ruleset.forEach(rule => {
      rule.cidrs.forEach(cidr => {
        newTrie.insert(cidr, { region: rule.region, action: rule.action });
      });
    });
    return newTrie;
  }, [output]);

  const handleToggleCountry = (code: string) => {
    setConfig(prev => ({
      ...prev,
      countries: prev.countries.includes(code)
        ? prev.countries.filter(c => c !== code)
        : [...prev.countries, code]
    }));
  };

  const handleToggleContinent = (name: string) => {
    setConfig(prev => ({
      ...prev,
      continents: prev.continents.includes(name)
        ? prev.continents.filter(c => c !== name)
        : [...prev.continents, name]
    }));
  };

  const handleGenerate = async () => {
    if (config.countries.length === 0 && config.continents.length === 0 && config.customIpSets.length === 0) {
      alert("Please select at least one region or IP set.");
      return;
    }
    setLoading(true);
    setTestResult(null);
    try {
      const result = await generateFirewallRules(config);
      setOutput(result);
      setActiveTab('preview');
    } catch (err) {
      alert("Generation failed. Check API connectivity.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trie || !testIp) return;
    const match = trie.match(testIp);
    setTestResult(match || { action: 'DEFAULT_POLICY', region: 'Unmatched' });
  };

  return (
    <div className="space-y-8">
      <WorldMap selectedCountries={config.countries} onToggleCountry={handleToggleCountry} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-5 space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 self-start">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ListFilter className="text-blue-500" /> Policy Builder
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Engine</label>
              <select 
                value={config.firewallType}
                onChange={(e) => setConfig({...config, firewallType: e.target.value as FirewallType})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(FirewallType).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Action</label>
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setConfig({...config, action: RuleAction.BLOCK})}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${config.action === RuleAction.BLOCK ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                >BLOCK</button>
                <button 
                  onClick={() => setConfig({...config, action: RuleAction.ALLOW})}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${config.action === RuleAction.ALLOW ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                >ALLOW</button>
              </div>
            </div>
          </div>

          <IPSetManager ipSets={config.customIpSets} onChange={(s) => setConfig({...config, customIpSets: s})} />
          <CountrySelector 
            selectedCountries={config.countries} 
            selectedContinents={config.continents} 
            onToggleCountry={handleToggleCountry} 
            onToggleContinent={handleToggleContinent} 
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Activity size={18} />}
            Generate Verified Ruleset
          </button>
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[600px]">
          {/* Tabs */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10">
            <div className="flex bg-slate-800/50 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === 'preview' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Status Preview
              </button>
              <button 
                onClick={() => setActiveTab('script')}
                className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === 'script' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Source Code
              </button>
            </div>
            {output && (
              <button onClick={() => navigator.clipboard.writeText(output.script)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                <Copy size={18} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-6 bg-[#020617]">
            {!output && !loading && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-12">
                <ShieldCheck size={80} className="mb-6" />
                <h3 className="text-xl font-bold text-slate-400">Policy Ready for Deployment</h3>
                <p className="text-sm text-slate-500 mt-2 italic">Select regions and click generate to index CIDR data in a local Prefix Trie.</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <Loader2 size={48} className="animate-spin text-blue-500" />
                <div className="text-center">
                  <p className="text-slate-300 font-bold text-lg animate-pulse">Building Trie from Registry Data...</p>
                  <p className="text-slate-500 text-xs mt-2 font-mono uppercase tracking-widest">Google Search Grounding Active</p>
                </div>
              </div>
            )}

            {output && !loading && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {activeTab === 'preview' ? (
                  <div className="space-y-6">
                    {/* Trie-based IP Tester */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Terminal size={14} className="text-blue-500" /> Local Trie Matching Tester
                      </h4>
                      <form onSubmit={handleTestIp} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Verify an IP (e.g. 1.1.1.1)"
                          value={testIp}
                          onChange={(e) => setTestIp(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <button type="submit" className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 transition-all">
                          <Play size={12} /> Test
                        </button>
                      </form>
                      {testResult && (
                        <div className="mt-4 flex items-center gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 animate-in slide-in-from-top-2">
                           <div className={`p-2 rounded-lg ${testResult.action === RuleAction.BLOCK ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                             {testResult.action === RuleAction.BLOCK ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                           </div>
                           <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase">Verdict</p>
                             <p className="text-sm font-bold text-slate-200">
                               {testResult.action === 'DEFAULT_POLICY' ? 'Policy: ' + config.action : testResult.action}
                             </p>
                           </div>
                           <div className="ml-auto text-right">
                             <p className="text-[10px] font-bold text-slate-500 uppercase">Origin</p>
                             <p className="text-xs text-slate-400">{testResult.region}</p>
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
                      <p className="text-sm text-blue-200 leading-relaxed"><Info className="inline mr-2" size={16} />{output.explanation}</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-emerald-500" /> Formatted Firewall Rules
                      </h4>
                      <div className="grid gap-3">
                        {output.ruleset.map((rule, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="bg-slate-800/50 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                              <span className="text-xs font-bold text-slate-200">{rule.region}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${rule.action === RuleAction.BLOCK ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                {rule.action}
                              </span>
                            </div>
                            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                              {rule.cidrs.map((cidr, cIdx) => (
                                <div key={cIdx} className="font-mono text-[10px] bg-black/40 px-2 py-1 rounded text-emerald-400/80 border border-slate-800/50 group/item flex items-center justify-between">
                                  {cidr}
                                  <ChevronRight size={10} className="text-slate-700 group-hover/item:text-blue-500 transition-colors" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {output.groundingSources && (
                      <div className="pt-4 border-t border-slate-800">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Search size={14} /> Grounding Evidence
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {output.groundingSources.map((s, i) => (
                            <a key={i} href={s.uri} target="_blank" className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded border border-slate-700 text-[10px] text-blue-400 hover:border-blue-500 transition-all">
                              <ExternalLink size={10} /> {s.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                      <FileCode size={14} /> Deployment Script ({config.firewallType})
                    </h4>
                    <pre className="p-6 bg-black rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-500/90 leading-relaxed overflow-x-auto whitespace-pre-wrap shadow-inner">
                      {output.script}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generator;
