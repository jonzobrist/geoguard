
export enum FirewallType {
  IPTABLES = 'iptables',
  EBPF = 'ebpf',
  EBTABLES = 'ebtables',
  NFTABLES = 'nftables',
  IPFW = 'ipfw'
}

export enum RuleAction {
  ALLOW = 'ACCEPT',
  BLOCK = 'DROP'
}

export interface Country {
  name: string;
  code: string;
  continent: string;
}

export interface IPSet {
  id: string;
  name: string;
  mode: 'manual' | 'geo';
  manualEntries: string[];
}

export interface GeneratorConfig {
  countries: string[];
  continents: string[];
  firewallType: FirewallType;
  action: RuleAction;
  includeIpSet: boolean;
  includeIpv6: boolean;
  customIpSets: IPSet[];
}

export interface RuleSource {
  label: string;
  url: string;
  provider?: string;
  type: 'local' | 'cdn' | 'ai';
}

export interface FirewallRule {
  region: string;
  cidrs: string[];
  action: RuleAction;
  priority: number;
  sourceType: 'local' | 'cdn' | 'ai';
}

export interface RuleOutput {
  script: string;
  ruleset: FirewallRule[];
  ipSetCommands?: string[];
  dataSources?: RuleSource[];
  groundingSources?: { title: string; uri: string }[];
}
