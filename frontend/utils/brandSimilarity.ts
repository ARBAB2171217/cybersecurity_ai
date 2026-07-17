const KNOWN_BRANDS = [
  "paytm", "phonepe", "gpay", "amazon", "flipkart",
  "sbi", "hdfc", "icici", "axis", "paypal", "microsoft", "google"
];

export interface BrandMatchResult {
  detected: boolean;
  brand: string;
  matchType: "exact" | "lookalike" | "prefix_suffix" | "typosquatting" | "none";
  description: string;
}

/**
 * Computes the Levenshtein distance between two strings.
 */
function levenshtein(s1: string, s2: string): number {
  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j - 1][i] + 1, // deletion
        track[j][i - 1] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return track[s2.length][s1.length];
}

/**
 * Checks a domain hostname for spelling, lookalike substitutions, hyphenation, or
 * prefix/suffix variations matching well-known fintech or tech brands.
 */
export function detectBrandSimilarity(domain: string): BrandMatchResult {
  const parts = domain.toLowerCase().split(".");
  // Filter out common TLDs to focus on domain names
  const domainParts = parts.filter(p => p !== "com" && p !== "co" && p !== "in" && p !== "net" && p !== "org" && p !== "gov");

  for (const part of domainParts) {
    // 1. Exact match
    if (KNOWN_BRANDS.includes(part)) {
      return {
        detected: true,
        brand: part,
        matchType: "exact",
        description: `Exact match for known brand '${part}' found.`
      };
    }

    // 2. Hyphenated variations
    const cleanPart = part.replace(/-/g, "");
    for (const brand of KNOWN_BRANDS) {
      if (cleanPart === brand && part !== brand) {
        return {
          detected: true,
          brand,
          matchType: "typosquatting",
          description: `Hyphenated variant of known brand '${brand}' detected.`
        };
      }
    }

    // 3. Lookalike character replacements
    const normalized = part
      .replace(/0/g, "o")
      .replace(/1/g, "l")
      .replace(/3/g, "e")
      .replace(/4/g, "a")
      .replace(/5/g, "s")
      .replace(/8/g, "b")
      .replace(/vv/g, "w");
      
    if (normalized !== part && KNOWN_BRANDS.includes(normalized)) {
      return {
        detected: true,
        brand: normalized,
        matchType: "lookalike",
        description: `Lookalike character substitution for brand '${normalized}' detected.`
      };
    }

    // 4. Prefix / Suffix inclusion
    for (const brand of KNOWN_BRANDS) {
      if (part.includes(brand) && part !== brand) {
        return {
          detected: true,
          brand,
          matchType: "prefix_suffix",
          description: `Brand name '${brand}' embedded with prefix/suffix in domain.`
        };
      }
    }

    // 5. Typosquatting / Levenshtein Distance check
    for (const brand of KNOWN_BRANDS) {
      if (Math.abs(part.length - brand.length) <= 2) {
        const dist = levenshtein(part, brand);
        if (dist > 0 && dist <= 2) {
          return {
            detected: true,
            brand,
            matchType: "typosquatting",
            description: `Potential typosquatting of brand '${brand}' (edit distance of ${dist}).`
          };
        }
      }
    }
  }

  return {
    detected: false,
    brand: "",
    matchType: "none",
    description: ""
  };
}
