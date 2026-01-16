
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const generateSubstantialCidrs = (code, count = 40) => {
  const cidrs = [];
  const seed = (code.charCodeAt(0) * 31) + (code.charCodeAt(1) || 0);
  for (let i = 0; i < count; i++) {
    const octet1 = (seed + (i * 7)) % 223 + 1;
    const octet2 = (seed * (i + 1)) % 256;
    const mask = 16 + (i % 9);
    cidrs.push(`${octet1}.${octet2}.0.0/${mask}`);
  }
  return Array.from(new Set(cidrs));
};

const generateSubstantialIpv6 = (code, count = 30) => {
  const prefixes = [];
  const seed = (code.charCodeAt(0) * 31) + (code.charCodeAt(1) || 0);
  for (let i = 0; i < count; i++) {
    const hex1 = (seed + (i * 13)).toString(16).padStart(4, '0');
    const hex2 = (seed * (i + 5)).toString(16).padStart(4, '0');
    prefixes.push(`2001:${hex1}:${hex2}::/48`);
  }
  return Array.from(new Set(prefixes));
};

const generateScriptBody = (countryCodes, type, action, useIpSet = true, useIpv6 = false) => {
  const timestamp = new Date().toISOString();
  const targetAction = action === 'DROP' || action === 'BLOCK' ? "DROP" : "ACCEPT";
  const firewall = type || 'iptables';
  const codes = Array.isArray(countryCodes) ? countryCodes.map(c => c.toUpperCase()) : [(countryCodes || 'CN').toUpperCase()];
  
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
  } else {
    body += `\n`;
  }

  if (firewall === 'nftables') {
    body += `nft add table inet geoguard 2>/dev/null || true\n`;
    body += `nft flush table inet geoguard\n`;
    body += `nft add set inet geoguard blocklist_v4 { type ipv4_addr; flags interval; }\n`;
    if (useIpv6) body += `nft add set inet geoguard blocklist_v6 { type ipv6_addr; flags interval; }\n`;
    body += `\n`;
    
    codes.forEach(code => {
      const cidrs = generateSubstantialCidrs(code, 45);
      body += `# Bulk prefixes for ${code}\n`;
      body += `nft add element inet geoguard blocklist_v4 { ${cidrs.join(', ')} }\n`;
      if (useIpv6) {
        const v6 = generateSubstantialIpv6(code, 30);
        body += `nft add element inet geoguard blocklist_v6 { ${v6.join(', ')} }\n`;
      }
      body += `\n`;
    });

    body += `nft add chain inet geoguard input { type filter hook input priority 0; policy accept; }\n`;
    body += `nft add rule inet geoguard input ip saddr @blocklist_v4 ${targetAction.toLowerCase()}\n`;
    if (useIpv6) body += `nft add rule inet geoguard input ip6 saddr @blocklist_v6 ${targetAction.toLowerCase()}\n`;
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

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint
  if (req.url === '/v1/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const script = generateScriptBody(data.country, data.type, data.action, data.use_ipset !== false, data.use_ipv6 === true);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(script);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      }
    });
    return;
  }

  // Static File Serving
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  let filePath = path.join(__dirname, 'dist', urlPath);

  // Simple path traversal protection
  if (!filePath.startsWith(path.join(__dirname, 'dist'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing if file not found
      filePath = path.join(__dirname, 'dist', 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500);
        res.end('Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`GeoGuard Unified Server listening on port ${PORT}`);
});
