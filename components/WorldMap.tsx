
import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Props {
  selectedCountries: string[];
  onToggleCountry: (code: string) => void;
}

const isoNumericToAlpha2: { [key: string]: string } = {
  "004": "AF", "008": "AL", "012": "DZ", "024": "AO", "010": "AQ", "032": "AR", "051": "AM", "036": "AU", "040": "AT", "031": "AZ",
  "044": "BS", "048": "BH", "050": "BD", "052": "BB", "112": "BY", "056": "BE", "084": "BZ", "204": "BJ", "064": "BT", "068": "BO",
  "070": "BA", "072": "BW", "076": "BR", "096": "BN", "100": "BG", "854": "BF", "108": "BI", "116": "KH", "120": "CM", "124": "CA",
  "132": "CV", "140": "CF", "148": "TD", "152": "CL", "156": "CN", "170": "CO", "178": "CG", "180": "CD", "188": "CR", "384": "CI",
  "191": "HR", "192": "CU", "196": "CY", "203": "CZ", "208": "DK", "262": "DJ", "214": "DO", "218": "EC", "818": "EG", "222": "SV",
  "226": "GQ", "232": "ER", "233": "EE", "231": "ET", "242": "FJ", "246": "FI", "250": "FR", "266": "GA", "270": "GM", "268": "GE",
  "276": "DE", "288": "GH", "300": "GR", "320": "GT", "324": "GN", "624": "GW", "328": "GY", "332": "HT", "340": "HN", "348": "HU",
  "352": "IS", "356": "IN", "360": "ID", "364": "IR", "368": "IQ", "372": "IE", "376": "IL", "380": "IT", "388": "JM", "392": "JP",
  "400": "JO", "398": "KZ", "404": "KE", "408": "KP", "410": "KR", "414": "KW", "417": "KG", "418": "LA", "428": "LV", "422": "LB",
  "426": "LS", "430": "LR", "434": "LY", "440": "LT", "442": "LU", "450": "MG", "454": "MW", "458": "MY", "462": "MV", "466": "ML",
  "470": "MT", "478": "MR", "480": "MU", "484": "MX", "498": "MD", "496": "MN", "499": "ME", "504": "MA", "508": "MZ", "104": "MM",
  "516": "NA", "524": "NP", "528": "NL", "540": "NC", "554": "NZ", "558": "NI", "562": "NE", "566": "NG", "578": "NO", "512": "OM",
  "586": "PK", "591": "PA", "598": "PG", "600": "PY", "604": "PE", "608": "PH", "616": "PL", "620": "PT", "634": "QA", "642": "RO",
  "643": "RU", "646": "RW", "682": "SA", "686": "SN", "688": "RS", "694": "SL", "702": "SG", "703": "SK", "705": "SI", "090": "SB",
  "706": "SO", "710": "ZA", "728": "SS", "724": "ES", "144": "LK", "729": "SD", "740": "SR", "748": "SZ", "752": "SE", "756": "CH",
  "760": "SY", "762": "TJ", "764": "TH", "626": "TL", "768": "TG", "780": "TT", "788": "TN", "792": "TR", "795": "TM", "800": "UG",
  "804": "UA", "784": "AE", "826": "GB", "834": "TZ", "840": "US", "858": "UY", "860": "UZ", "548": "VU", "862": "VE", "704": "VN",
  "732": "EH", "887": "YE", "894": "ZM", "716": "ZW"
};

const WorldMap: React.FC<Props> = ({ selectedCountries, onToggleCountry }) => {
  const [hasError, setHasError] = useState(false);

  // Simple runtime check for compatibility
  useEffect(() => {
    try {
      if (typeof ComposableMap === 'undefined') {
        throw new Error('Map library not loaded');
      }
    } catch (e) {
      console.warn("Map library compatibility issue detected:", e);
      setHasError(true);
    }
  }, []);

  if (hasError) {
    return (
      <div className="relative w-full aspect-[21/9] bg-slate-950/50 rounded-3xl border border-slate-800 flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-slate-400 text-sm mb-2">Interactive topology map is unavailable in this environment.</p>
          <p className="text-slate-600 text-xs">Please use the configuration panel to select regions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[21/9] bg-slate-950/50 rounded-3xl border border-slate-800 overflow-hidden group shadow-2xl shadow-blue-900/10">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Live Security Topology</h3>
        <p className="text-[10px] text-slate-600 font-mono">
          {selectedCountries.length} NODES SELECTED
        </p>
      </div>

      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} />
      </div>

      <div className="w-full h-full flex items-center justify-center">
        <ComposableMap
          projectionConfig={{
            scale: 160,
            rotate: [-10, 0, 0],
          }}
          className="w-full h-full"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoId = String(geo.id).padStart(3, '0');
                const iso2 = isoNumericToAlpha2[geoId];
                const isSelected = iso2 && selectedCountries.includes(iso2);
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => iso2 && onToggleCountry(iso2)}
                    style={{
                      default: {
                        fill: isSelected ? "#3b82f6" : "#1e293b",
                        stroke: "#334155",
                        strokeWidth: 0.5,
                        outline: "none",
                        transition: "all 200ms ease"
                      },
                      hover: {
                        fill: isSelected ? "#60a5fa" : "#334155",
                        stroke: "#475569",
                        strokeWidth: 1,
                        outline: "none",
                        cursor: iso2 ? "pointer" : "default"
                      },
                      pressed: {
                        fill: "#2563eb",
                        outline: "none"
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Policy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Passive Mode</span>
          </div>
        </div>
        <div className="text-[9px] text-slate-500 font-medium italic">
          Select individual territories to include in the generated script
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
