
import React, { useState, useEffect } from 'react';
import Generator from './components/Generator.tsx';
import { Shield, LayoutDashboard, Terminal, Github, Globe, Search, MapPin, Activity, CheckCircle2, XCircle, Beaker, ChevronDown, ChevronUp } from 'lucide-react';
import { lookupIpLocation, runSystemDiagnostics } from './services/geminiService.ts';

const App: React.FC = () => {
  const [ipInput, setIpInput] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showLabs, setShowLabs] = useState(false);
  const [diagResults, setDiagResults] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [selectedDiag, setSelectedDiag] = useState<string | null>(null);

  const handleIpLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const result = await lookupIpLocation(ipInput);
      setLookupResult(result);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lookup failed.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setDiagLoading(true);
    setDiagResults(null);
    const results = await runSystemDiagnostics();
    setDiagResults(results);
    setDiagLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a]">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                GeoGuard
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Firewall Generator</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setShowLabs(false)} className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${!showLabs ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button onClick={() => setShowLabs(true)} className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${showLabs ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
              <Beaker size={16} /> Labs & Diagnostics
            </button>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {!showLabs ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl relative overflow-hidden shadow-2xl shadow-blue-500/20">
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-2">Network Security Governance</h2>
                  <p className="text-blue-100/80 text-sm max-w-md leading-relaxed">
                    Automate your network perimeter security using AI-driven Geo-IP analysis. Select regions, generate scripts, and deploy in seconds via UI or CLI.
                  </p>
                </div>
                <Globe size={180} className="absolute -right-12 -bottom-12 text-white/10" />
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Public Geo-IP Lookup</h3>
                <form onSubmit={handleIpLookup} className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Enter IP (e.g. 8.8.8.8)"
                    value={ipInput}
                    onChange={(e) => setIpInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors">
                    <Search size={18} />
                  </button>
                </form>

                <div className="min-h-[60px]">
                  {lookupLoading && <div className="text-xs text-blue-400 animate-pulse flex items-center gap-2 font-mono">Querying public registries...</div>}
                  {lookupResult && (
                    <div className="space-y-1.5 animate-in fade-in duration-300">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Location:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <MapPin size={10} /> {lookupResult.city}, {lookupResult.country} ({lookupResult.code})
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Sub-Region:</span>
                        <span className="text-slate-300">{lookupResult.region}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Provider:</span>
                        <span className="text-slate-300 truncate ml-4 text-right max-w-[120px]">{lookupResult.isp}</span>
                      </div>
                    </div>
                  )}
                  {!lookupResult && !lookupLoading && (
                    <p className="text-[11px] text-slate-600 italic">Global registry lookup. Results may vary by provider.</p>
                  )}
                </div>
              </div>
            </section>
            <Generator />
          </>
        ) : (
          <section className="animate-in slide-in-from-right-4 duration-500 space-y-8">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">System Diagnostics</h2>
                  <p className="text-slate-400 text-sm">Real-time verification of logic synchronization and service health.</p>
                </div>
                <button 
                  onClick={handleRunDiagnostics}
                  disabled={diagLoading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                >
                  <Activity size={16} className={diagLoading ? "animate-spin" : ""} />
                  {diagLoading ? 'Running Tests...' : 'Execute Diagnostics'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DiagCard 
                  title="IP Lookup Service" 
                  description="Verifies HTTPS Geo-IP connectivity."
                  result={diagResults?.ipLookup}
                  isSelected={selectedDiag === 'ipLookup'}
                  onClick={() => setSelectedDiag(selectedDiag === 'ipLookup' ? null : 'ipLookup')}
                />
                <DiagCard 
                  title="UI Generation Engine" 
                  description="Checks local script generation integrity."
                  result={diagResults?.uiGen} 
                  isSelected={selectedDiag === 'uiGen'}
                  onClick={() => setSelectedDiag(selectedDiag === 'uiGen' ? null : 'uiGen')}
                />
                <DiagCard 
                  title="API Parity Check" 
                  description="Functional 1:1 match with API endpoint."
                  result={diagResults?.apiParity} 
                  isSelected={selectedDiag === 'apiParity'}
                  onClick={() => setSelectedDiag(selectedDiag === 'apiParity' ? null : 'apiParity')}
                />
              </div>

              {diagResults && (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                    <Terminal size={14} /> System Console Output
                  </div>
                  <div className="bg-black/80 rounded-2xl border border-slate-800 overflow-hidden font-mono text-[11px] leading-relaxed shadow-2xl">
                    <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Diagnostic Logs</span>
                      <span className="text-[9px] text-slate-600 uppercase tracking-tighter">Process: diagnostic_run_v2</span>
                    </div>
                    <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar space-y-2">
                      {diagResults.ipLookup.logs.map((log: string, i: number) => <div key={`ip-${i}`} className="text-slate-500"><span className="text-blue-500/50 mr-2">[IP-LOOKUP]</span> {log}</div>)}
                      <div className="h-px bg-slate-800 my-2" />
                      {diagResults.uiGen.logs.map((log: string, i: number) => <div key={`ui-${i}`} className="text-slate-500"><span className="text-emerald-500/50 mr-2">[UI-ENGINE]</span> {log}</div>)}
                      <div className="h-px bg-slate-800 my-2" />
                      {diagResults.apiParity.logs.map((log: string, i: number) => (
                        <div key={`api-${i}`} className={log.includes('CRITICAL') ? 'text-red-400 font-bold' : 'text-slate-500'}>
                          <span className="text-purple-500/50 mr-2">[API-PARITY]</span> {log}
                        </div>
                      ))}
                      {!diagResults.apiParity.success && (
                        <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-red-500/80">
                          Logic synchronization failure. Check the comparison diff in the console above.
                        </div>
                      )}
                      {diagResults.apiParity.success && (
                        <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg text-emerald-500/80">
                          System healthy. Local and Remote engines are perfectly synchronized.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-800 py-8 bg-slate-950/80 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-[11px]">
            © 2024 GeoGuard Security. High-Performance Network Perimeter Solutions.
          </p>
        </div>
      </footer>
    </div>
  );
};

const DiagCard = ({ title, description, result, isSelected, onClick }: { title: string, description: string, result?: any, isSelected: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-slate-950 border transition-all cursor-pointer p-6 rounded-xl space-y-4 ${
      isSelected ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'
    }`}
  >
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {result?.success === true && <CheckCircle2 className="text-emerald-500" size={20} />}
      {result?.success === false && <XCircle className="text-red-500" size={20} />}
      {result === undefined && <Activity className="text-slate-700" size={20} />}
    </div>
    <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-600">
      <span>{isSelected ? 'Collapse Details' : 'Expand Details'}</span>
      {isSelected ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
    </div>
  </div>
);

export default App;
