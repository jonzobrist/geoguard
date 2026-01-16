
/**
 * A Prefix Trie implementation for IPv4 CIDR ranges.
 * Used for high-performance matching of IP addresses against firewall rules.
 */
export class IPPrefixTrie {
  private root: TrieNode = { children: {} };

  /**
   * Inserts a CIDR range (e.g., "192.168.1.0/24") into the Trie.
   */
  insert(cidr: string, metadata: any) {
    const [ip, prefixStr] = cidr.split('/');
    const prefix = prefixStr ? parseInt(prefixStr, 10) : 32;
    const bits = this.ipToBinary(ip).substring(0, prefix);

    let current = this.root;
    for (const bit of bits) {
      if (!current.children[bit]) {
        current.children[bit] = { children: {} };
      }
      current = current.children[bit];
    }
    current.metadata = metadata;
    current.isEndOfRange = true;
  }

  /**
   * Searches for the longest prefix match for a single IP address.
   */
  match(ip: string): any | null {
    const bits = this.ipToBinary(ip);
    let current = this.root;
    let lastMatch = null;

    for (const bit of bits) {
      if (current.metadata) {
        lastMatch = current.metadata;
      }
      if (!current.children[bit]) break;
      current = current.children[bit];
    }

    if (current.metadata) {
      lastMatch = current.metadata;
    }

    return lastMatch;
  }

  private ipToBinary(ip: string): string {
    return ip.split('.')
      .map(octet => parseInt(octet, 10).toString(2).padStart(8, '0'))
      .join('');
  }
}

interface TrieNode {
  children: { [key: string]: TrieNode };
  metadata?: any;
  isEndOfRange?: boolean;
}
