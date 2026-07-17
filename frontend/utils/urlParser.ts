export type URLCategory = "Website" | "IP Address URL" | "File Download" | "API Endpoint" | "Localhost" | "Unknown";
export type IPTargetType = "IPv4" | "IPv6" | "Domain Name";

export interface ParsedURLResult {
  originalUrl: string;
  normalizedUrl: string;
  protocol: string;
  hostname: string;
  rootDomain: string;
  subdomain: string;
  tld: string;
  port: string;
  path: string;
  queryParams: Record<string, string>;
  fragment: string;
  username?: string;
  password?: string;
  fileExtension?: string;
  category: URLCategory;
  ipType: IPTargetType;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a URL input for correctness and basic format rules.
 */
export function validateUrl(rawUrl: string): ValidationResult {
  const url = (rawUrl || "").trim();
  
  if (!url) {
    return { isValid: false, error: "URL input field cannot be empty." };
  }
  
  if (url.length > 2048) {
    return { isValid: false, error: "URL exceeds maximum supported length of 2048 characters." };
  }

  // Check for spaces or invalid control characters
  if (/[\s\x00-\x1F\x7F]/.test(url)) {
    return { isValid: false, error: "URL contains illegal characters (spaces or control characters)." };
  }

  // Ensure scheme is present
  const protocolMatch = url.match(/^([a-zA-Z0-9+.-]+):\/\//);
  if (!protocolMatch) {
    return { isValid: false, error: "URL must contain a scheme/protocol (e.g., http:// or https://)." };
  }

  const protocol = protocolMatch[1].toLowerCase();
  if (protocol !== "http" && protocol !== "https") {
    return { isValid: false, error: `Protocol '${protocol}://' is unsupported. Only http:// and https:// links are supported.` };
  }

  try {
    new URL(url);
  } catch {
    return { isValid: false, error: "Malformed URL. Please check the spelling and format." };
  }

  return { isValid: true };
}

/**
 * Normalizes a URL by trimming, lowercasing hostname, and removing default ports/trailing slashes.
 */
export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    
    // Lowercase hostname
    const hostname = parsed.hostname.toLowerCase();
    
    // Remove default ports
    let port = parsed.port;
    if (
      (parsed.protocol === "http:" && port === "80") ||
      (parsed.protocol === "https:" && port === "443")
    ) {
      port = "";
    }
    
    // Remove trailing slash for root paths
    let pathname = parsed.pathname;
    if (pathname === "/") {
      pathname = "";
    } else if (pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    
    const hostWithPort = port ? `${hostname}:${port}` : hostname;
    const search = parsed.search;
    const hash = parsed.hash;
    const auth = parsed.username ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ""}@` : "";
    
    return `${parsed.protocol}//${auth}${hostWithPort}${pathname}${search}${hash}`;
  } catch {
    return trimmed;
  }
}

/**
 * Parses a normalized URL into structured components and structural classification.
 */
export function parseUrl(rawUrl: string): ParsedURLResult {
  const normalized = normalizeUrl(rawUrl);
  const parsed = new URL(normalized);
  
  const protocol = parsed.protocol.replace(":", "");
  const hostname = parsed.hostname;
  const port = parsed.port;
  const path = parsed.pathname;
  const fragment = parsed.hash.replace("#", "");
  
  // Extract Query Parameters
  const queryParams: Record<string, string> = {};
  parsed.searchParams.forEach((val, key) => {
    queryParams[key] = val;
  });

  // Extract auth info
  const username = parsed.username || undefined;
  const password = parsed.password || undefined;

  // Check if IP address
  const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
  const isIpv6 = (hostname.startsWith("[") && hostname.endsWith("]")) || (hostname.includes(":") && !hostname.includes("."));
  
  let ipType: IPTargetType = "Domain Name";
  if (isIpv4) {
    ipType = "IPv4";
  } else if (isIpv6) {
    ipType = "IPv6";
  }

  // Root Domain, Subdomain, and TLD extraction
  let subdomain = "";
  let rootDomain = hostname;
  let tld = "";

  if (ipType === "Domain Name") {
    const hostParts = hostname.split(".");
    if (hostParts.length > 1) {
      tld = hostParts[hostParts.length - 1];
      const secondLast = hostParts[hostParts.length - 2];
      const multiPartTlds = ["co", "com", "net", "org", "gov", "edu", "ac"];
      
      if (hostParts.length > 2 && multiPartTlds.includes(secondLast) && tld.length <= 3) {
        rootDomain = `${hostParts[hostParts.length - 3]}.${secondLast}.${tld}`;
        tld = `${secondLast}.${tld}`;
        subdomain = hostParts.slice(0, hostParts.length - 3).join(".");
      } else {
        rootDomain = `${secondLast}.${tld}`;
        subdomain = hostParts.slice(0, hostParts.length - 2).join(".");
      }
    }
  }

  // File extension extraction
  let fileExtension: string | undefined = undefined;
  const pathParts = path.split("/");
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart && lastPart.includes(".")) {
    const extMatch = lastPart.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
    if (extMatch) {
      fileExtension = extMatch[1];
    }
  }

  // Basic structural classification
  let category: URLCategory = "Website";
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
    category = "Localhost";
  } else if (isIpv4 || isIpv6) {
    category = "IP Address URL";
  } else if (
    fileExtension &&
    ["zip", "rar", "pdf", "exe", "dmg", "tar", "gz", "7z", "iso", "apk", "docx", "xlsx", "csv"].includes(fileExtension.toLowerCase())
  ) {
    category = "File Download";
  } else if (
    path.includes("/api/") ||
    path.includes("/v1/") ||
    path.includes("/v2/") ||
    fileExtension === "json" ||
    fileExtension === "xml"
  ) {
    category = "API Endpoint";
  } else if (!hostname) {
    category = "Unknown";
  }

  return {
    originalUrl: rawUrl,
    normalizedUrl: normalized,
    protocol,
    hostname,
    rootDomain: ipType !== "Domain Name" ? "" : rootDomain,
    subdomain: ipType !== "Domain Name" ? "" : subdomain,
    tld: ipType !== "Domain Name" ? "" : tld,
    port,
    path,
    queryParams,
    fragment,
    username,
    password,
    fileExtension,
    category,
    ipType,
  };
}
