
import React, { useState } from 'react';
import Generator from './components/Generator.tsx';
import { Shield, LayoutDashboard, Terminal, FileCode, Github, Globe, Search } from 'lucide-react';
import { lookupIpLocation } from './services/geminiService.ts';

// Moving the command to a constant to avoid JSX parser confusion with nested curly braces
const CLI_COMMAND = 'curl -X POST https://api.geoguard.io/v1/generate -d \'{"country": "CN", "type": "nftables"}\'';

const App: React.FC = () => {
  const [ipInput, setIpInput] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleIpLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput) return;
    setLookupLoading(true);
    try {
      const result = await lookupIpLocation(ipInput);
      setLookupResult(result);
    } catch (err) {
      console.error(err);
      alert("IP Lookup failed. Check console for details.");
    } finally {
      setLookupLoading(false);
    }
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
            <div className="text-sm font-medium text-blue-400 cursor-default flex items-center gap-1.5">
              <LayoutDashboard size={16} /> Dashboard
            </div>
            <div className="text-sm font-medium text-slate-400 cursor-default flex items-center gap-1.5">
              <Terminal size={16} /> CLI API
            </div>
            <div className="text-sm font-medium text-slate-400 cursor-default flex items-center gap-1.5">
              <FileCode size={16} /> Examples
            </div>
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
        {/* Header Stats / Quick Search */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl relative overflow-hidden shadow-2xl shadow-blue-500/20">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2">Intelligent IP Governance</h2>
              <p className="text-blue-100/80 text-sm max-w-md leading-relaxed">
                Automate your network perimeter security using AI-driven Geo-IP analysis. Select regions, generate scripts, and deploy in seconds.
              </p>
            </div>
            <Globe size={180} className="absolute -right-12 -bottom-12 text-white/10" />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick WHOIS / Geo Lookup</h3>
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
              {lookupLoading && <div className="text-xs text-blue-400 animate-pulse flex items-center gap-2 font-mono">Querying registry...</div>}
              {lookupResult && !lookupLoading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Country:</span>
                    <span className="text-emerald-400 font-bold">{lookupResult.country} ({lookupResult.code})</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Continent:</span>
                    <span className="text-slate-300">{lookupResult.continent}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Provider:</span>
                    <span className="text-slate-300 truncate ml-4 text-right max-w-[120px]">{lookupResult.isp}</span>
                  </div>
                </div>
              )}
              {!lookupResult && !lookupLoading && (
                <p className="text-[11px] text-slate-600 italic">Enter an IP address to see geographic data.</p>
              )}
            </div>
          </div>
        </section>

        {/* Generator Engine */}
        <section>
          <Generator />
        </section>

        {/* CLI Integration Help */}
        <section className="bg-slate-900/30 border border-dashed border-slate-800 p-8 rounded-2xl text-center">
          <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center justify-center gap-2">
            <Terminal size={20} className="text-slate-500" />
            Command Line Interface
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-2xl mx-auto">
            Integrate GeoGuard into your automated CI/CD pipelines. Our stateless API provides pure script outputs for various architectures.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <div className="bg-slate-950 px-6 py-3 rounded-lg text-blue-400 text-xs font-mono border border-slate-800 max-w-full overflow-x-auto whitespace-nowrap">
              {CLI_COMMAND}
            </div>
            <button className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-lg transition-colors border border-slate-700">
              Read API Documentation
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 bg-slate-950/80 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-[11px]">
            © 2024 GeoGuard Security. All data is cached for performance. Always verify rules in a staging environment.
          </p>
          <div className="flex gap-6 text-[11px] text-slate-400">
            <div className="cursor-default hover:text-white transition-colors">Privacy Policy</div>
            <div className="cursor-default hover:text-white transition-colors">Terms of Service</div>
            <div className="cursor-default hover:text-white transition-colors">Security</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
