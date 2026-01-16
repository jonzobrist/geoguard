
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratorConfig, RuleOutput, RuleAction } from "../types.ts";

/**
 * Generates firewall rules and extracts actual IP data using Gemini AI with Google Search grounding.
 * The application ingests this data into a local Trie for high-performance matching.
 */
export const generateFirewallRules = async (config: GeneratorConfig): Promise<RuleOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const customSetsDesc = config.customIpSets.map(set => {
    if (set.mode === 'manual') {
      return `Set "${set.name}" (Manual): ${set.manualEntries.join(', ')}`;
    } else {
      return `Set "${set.name}" (Geo): Linked to selection.`;
    }
  }).join('\n');

  const prompt = `
    Act as a senior network security engineer. 
    Task: Generate a production-ready firewall configuration and extract real-time IP data.
    
    CRITICAL REQUIREMENT: 
    1. Use Google Search to find the ACTUAL CURRENT IPv4 CIDR IP blocks for:
       Countries: ${config.countries.join(', ')}
       Continents: ${config.continents.join(', ')}
    2. Provide a SIGNIFICANT number of CIDR blocks (up to 50 unique ranges per region) as these will be indexed into a local high-performance Prefix Trie (Radix Tree).
    3. DO NOT provide a script that uses 'curl' to download data. The data must be embedded in the response.
    4. EXTRACT the CIDR ranges into the 'ruleset' array in the JSON response.
    
    Configuration:
    - Target: ${config.firewallType}
    - Global Action: ${config.action}
    - Custom Sets: ${customSetsDesc || 'None'}

    Return a JSON object matching the requested schema. Ensure 'ruleset' contains active CIDRs found via search.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          script: { 
            type: Type.STRING,
            description: "Full shell script or configuration text."
          },
          explanation: { 
            type: Type.STRING, 
            description: "Architectural summary." 
          },
          ruleset: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                region: { type: Type.STRING },
                cidrs: { type: Type.ARRAY, items: { type: Type.STRING } },
                action: { type: Type.STRING, enum: [RuleAction.ALLOW, RuleAction.BLOCK] },
                priority: { type: Type.NUMBER }
              },
              required: ["region", "cidrs", "action"]
            }
          },
          dataSources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["label", "url"]
            }
          }
        },
        required: ["script", "explanation", "ruleset"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response body received from Gemini.");
  
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const groundingSources = groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'Registry Source',
    uri: chunk.web?.uri || ''
  })).filter((s: any) => s.uri) || [];

  try {
    const result = JSON.parse(text) as RuleOutput;
    return { ...result, groundingSources };
  } catch (e) {
    console.error("Parse error:", text);
    throw new Error("Failed to parse security data.");
  }
};

export const lookupIpLocation = async (ip: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Whois/Geo lookup for IP: ${ip}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          country: { type: Type.STRING },
          code: { type: Type.STRING },
          isp: { type: Type.STRING },
          continent: { type: Type.STRING },
          whois: { type: Type.STRING }
        },
        required: ["country", "code", "isp", "continent", "whois"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};
