
import { GeneratorConfig, RuleOutput, RuleAction, FirewallType } from "../types.ts";
import { COUNTRIES } from "../constants.ts";

/**
 * Generates a realistic but simulated high-volume list of CIDRs for a country code.
 */
const generateSubstantialCidrs = (code: string, count: number = 40): string[] => {
  const cidrs: string[] = [];
  const seed = (code.charCodeAt(0) * 31) + (code.charCodeAt(1) || 0);
  
  for (let i = 0; i < count; i++) {
    const octet1 = (seed + (i * 7)) % 223 + 1;
    const octet2 = (seed * (i + 1)) % 256;
    const mask = 16 + (i % 9);
    cidrs.push(`${octet1}.${octet2}.0.0/${mask}`);
  }
  
  return Array.from(new Set(cidrs));
};

/**
 * Generates a realistic but simulated high-volume list of IPv6 prefixes.
 */
const generateSubstantialIpv6 = (code: string, count: number = 30): string[] => {
  const prefixes: string[] = [];
  const seed = (code.charCodeAt(0) * 31) + (code.charCodeAt(1) || 0);
  
  for (let i = 0; i < count; i++) {
    const hex1 = (seed + (i * 13)).toString(16).padStart(4, '0');
    const hex2 = (seed * (i + 5)).toString(16).padStart(4, '0');
    prefixes.push(`2001:${hex1}:${hex2}::/48`);
  }
  
  return Array.from(new Set(prefixes));
};

/**
 * Shared script generation logic used by UI and backend for parity.
 */
export const buildRawScript = (countryCodes: string[], type: string, action: string, useIpSet: boolean = true, useIpv6: boolean = false): string => {
  const timestamp = new Date().toISOString();
  const targetAction = (action === RuleAction.BLOCK || action === 'BLOCK' || action === 'DROP') ? "DROP" : "ACCEPT";
  const firewall = type || 'iptables';
  const codes = countryCodes.length > 0 ? countryCodes.map(c => c.toUpperCase()) : ['CN'];
  
  let body = `#!/bin/bash\n`;
  body += `# GeoGuard Automated Security Policy\n`;
  body += `# Targets: ${codes.join(', ')} | Engine: ${firewall}\n`;
  body += `# Protocols: IPv4${useIpv6 ? ', IPv6' : ''} | Total Regions: ${codes.length}\n`;
  body += `# Generated: ${timestamp}\n\n`;

  const cmd = firewall === 'nftables' ? 'nft' : 'iptables';
  body += `if ! command -v ${cmd} &> /dev/null; then echo "Error: ${cmd} not found."; exit 1; fi\n`;
  
  if (firewall === 'iptables') {
    if (useIpv6) {
      body += `if ! command -v ip6tables &> /dev/null; then echo "Warning: ip6tables not found. IPv6 rules will be skipped."; fi\n`;
    }
    if (useIpSet) {
      body += `if ! command -v ipset &> /dev/null; then echo "Error: ipset utility not found. Required for optimized sets."; exit 1; fi\n\n`;
    }
  }

  if (firewall === 'nftables') {
    body += `nft add table inet geoguard 2>/dev/null || true\n`;
    body += `nft flush table inet geoguard\n`;
    body += `nft add set inet geoguard blocklist_v4 { type ipv4_addr; flags interval; }\n`;
    if (useIpv6) {
      body += `nft add set inet geoguard blocklist_v6 { type ipv6_addr; flags interval; }\n`;
    }
    body += `\n`;
    
    codes.forEach(code => {
      body += `# Bulk prefixes for ${code}\n`;
      const cidrs = generateSubstantialCidrs(code, 45);
      body += `nft add element inet geoguard blocklist_v4 { ${cidrs.join(', ')} }\n`;
      if (useIpv6) {
        const v6 = generateSubstantialIpv6(code, 30);
        body += `nft add element inet geoguard blocklist_v6 { ${v6.join(', ')} }\n`;
      }
      body += `\n`;
    });

    body += `nft add chain inet geoguard input { type filter hook input priority 0; policy accept; }\n`;
    body += `nft add rule inet geoguard input ip saddr @blocklist_v4 ${targetAction.toLowerCase()}\n`;
    if (useIpv6) {
      body += `nft add rule inet geoguard input ip6 saddr @blocklist_v6 ${targetAction.toLowerCase()}\n`;
    }
  } else if (firewall === 'iptables') {
    if (useIpSet) {
      body += `# Create and populate optimized ipsets\n`;
      body += `ipset create geoguard_v4 hash:net family inet -! \n`;
      body += `ipset flush geoguard_v4\n`;
      if (useIpv6) {
        body += `ipset create geoguard_v6 hash:net family inet6 -! \n`;
        body += `ipset flush geoguard_v6\n`;
      }
      body += `\n`;
      
      codes.forEach(code => {
        body += `# Region: ${code}\n`;
        const cidrs = generateSubstantialCidrs(code, 45);
        cidrs.forEach(cidr => body += `ipset add geoguard_v4 ${cidr}\n`);
        if (useIpv6) {
          const v6 = generateSubstantialIpv6(code, 30);
          v6.forEach(cidr => body += `ipset add geoguard_v6 ${cidr}\n`);
        }
        body += `\n`;
      });
      
      body += `# Apply iptables rules referencing the sets\n`;
      body += `iptables -N GEOGUARD 2>/dev/null || true\n`;
      body += `iptables -F GEOGUARD\n`;
      body += `iptables -A GEOGUARD -m set --match-set geoguard_v4 src -j ${targetAction}\n`;
      
      if (useIpv6) {
        body += `ip6tables -N GEOGUARD 2>/dev/null || true\n`;
        body += `ip6tables -F GEOGUARD\n`;
        body += `ip6tables -A GEOGUARD -m set --match-set geoguard_v6 src -j ${targetAction}\n`;
      }
    } else {
      body += `iptables -N GEOGUARD 2>/dev/null || true\n`;
      body += `iptables -F GEOGUARD\n`;
      if (useIpv6) {
        body += `ip6tables -N GEOGUARD 2>/dev/null || true\n`;
        body += `ip6tables -F GEOGUARD\n`;
      }
      codes.forEach(code => {
        body += `# Rules for ${code}\n`;
        const cidrs = generateSubstantialCidrs(code, 20);
        cidrs.forEach(cidr => body += `iptables -A GEOGUARD -s ${cidr} -j ${targetAction}\n`);
        if (useIpv6) {
          const v6 = generateSubstantialIpv6(code, 15);
          v6.forEach(cidr => body += `ip6tables -A GEOGUARD -s ${cidr} -j ${targetAction}\n`);
        }
      });
    }
    body += `\n# Insert into INPUT chain if not present\n`;
    body += `iptables -C INPUT -j GEOGUARD 2>/dev/null || iptables -I INPUT 1 -j GEOGUARD\n`;
    if (useIpv6) {
      body += `ip6tables -C INPUT -j GEOGUARD 2>/dev/null || ip6tables -I INPUT 1 -j GEOGUARD\n`;
    }
  }
  
  body += `\necho "[GeoGuard] Policy for ${codes.length} regions applied successfully using ${firewall}${firewall === 'iptables' && useIpSet ? ' + ipset' : ''}${useIpv6 ? ' (Dual-Stack)' : ''}."\n`;
  return body;
};

export const generateFirewallRules = async (config: GeneratorConfig): Promise<RuleOutput> => {
  const script = buildRawScript(config.countries, config.firewallType, config.action, config.includeIpSet, config.includeIpv6);

  return {
    script,
    ruleset: config.countries.map(code => ({
      region: code,
      cidrs: [...generateSubstantialCidrs(code, 45), ...(config.includeIpv6 ? generateSubstantialIpv6(code, 30) : [])],
      action: config.action,
      priority: 1,
      sourceType: 'local'
    })),
    dataSources: [{ label: "GeoGuard CIDR Database (Simulated)", url: "/v1/lookup", type: "local" }]
  };
};

export const lookupIpLocation = async (ip: string) => {
  if (!ip) throw new Error("IP address is required.");
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) throw new Error(`Registry error: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.reason || "IP not found.");
    return {
      city: data.city || "Unknown",
      country: data.country_name || "Unknown",
      code: data.country_code || "??",
      region: data.region || "Unknown",
      isp: data.org || "Unknown"
    };
  } catch (e: any) {
    throw new Error(e.message || "Geo-IP lookup failed.");
  }
};

export const runSystemDiagnostics = async () => {
  const results: any = {
    ipLookup: { success: false, logs: [] },
    uiGen: { success: false, logs: [] },
    apiParity: { success: false, logs: [] },
  };

  // 1. IP Lookup
  try {
    results.ipLookup.logs.push("Querying 8.8.8.8...");
    const res = await lookupIpLocation("8.8.8.8");
    results.ipLookup.logs.push(`Response: ${res.city}, ${res.country} (${res.code})`);
    results.ipLookup.success = res.code === "US";
  } catch (e: any) {
    results.ipLookup.logs.push(`Error: ${e.message}`);
  }

  // 2. UI Generation
  try {
    results.uiGen.logs.push("Generating internal script for [US, CN] with IPv6 enabled...");
    const script = buildRawScript(["US", "CN"], "iptables", "BLOCK", true, true);
    const lineCount = script.split('\n').length;
    results.uiGen.logs.push(`Generated ${lineCount} lines.`);
    results.uiGen.success = script.includes("geoguard_v6") && lineCount > 50;
  } catch (e: any) {
    results.uiGen.logs.push(`Error: ${e.message}`);
  }

  // 3. API Parity
  try {
    results.apiParity.logs.push("Comparing Local Engine vs Remote API...");
    
    const normalize = (s: string) => s
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('echo'))
      .join('\n');
    
    const uiScriptRaw = buildRawScript(["US"], "iptables", "BLOCK", true, true);
    const uiScript = normalize(uiScriptRaw);

    const apiRes = await fetch('/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: ["US"], type: "iptables", action: "BLOCK", use_ipset: true, use_ipv6: true })
    });
    
    if (apiRes.ok) {
      const apiScriptRaw = await apiRes.text();
      const apiScript = normalize(apiScriptRaw);
      results.apiParity.success = uiScript === apiScript;
      
      if (!results.apiParity.success) {
        results.apiParity.logs.push("CRITICAL: Functional Logic Mismatch!");
      } else {
        results.apiParity.logs.push("Functional parity verified.");
      }
    } else {
      results.apiParity.logs.push(`API Failure: HTTP ${apiRes.status}`);
    }
  } catch (e: any) {
    results.apiParity.logs.push(`Error: ${e.message}`);
  }

  return results;
};
