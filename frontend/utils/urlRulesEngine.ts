import { ParsedURLResult } from "./urlParser";
import { BrandMatchResult, detectBrandSimilarity } from "./brandSimilarity";
import { SecurityRule, ThreatLevel, AIAnalysisResult } from "@/types/intelligence";
import {
  RULE_WEIGHTS,
  SUSPICIOUS_TLDS,
  URL_SHORTENERS,
  SUSPICIOUS_KEYWORDS,
  SUSPICIOUS_EXTENSIONS
} from "./intelligenceConfig";

export interface RedirectStep {
  url: string;
  status_code: number;
  hostname: string;
  server: string;
  content_type: string;
}

export interface RedirectChain {
  original_url: string;
  final_url: string;
  total_redirects: number;
  redirect_chain: RedirectStep[];
  status_code: number;
  error?: string;
  https_enabled: boolean;
  port: string;
  server: string;
  content_type: string;
}

export interface URLIntelligenceAssessment {
  riskScore: number;
  threatLevel: ThreatLevel;
  totalRulesExecuted: number;
  passedChecks: SecurityRule[];
  failedChecks: SecurityRule[];
  warningChecks: SecurityRule[];
  triggeredRules: SecurityRule[];
  brandMatch?: BrandMatchResult;
  consistency?: {
    domainChanged: boolean;
    protocolChanged: boolean;
    tldChanged: boolean;
    protocolDowngraded: boolean;
    suspiciousRedirect: boolean;
  };
  analysisSummary: {
    passedCount: number;
    failedCount: number;
    warningCount: number;
    riskScore: number;
    threatLevel: ThreatLevel;
  };
}

/**
 * Assesses the security of a parsed URL and optional redirect chain data.
 */
export function assessUrlSecurity(
  parsed: ParsedURLResult,
  redirectData?: RedirectChain | null
): URLIntelligenceAssessment {
  const rules: SecurityRule[] = [];
  let riskScore = 0;

  const evaluationTarget = parsed;
  const originalHost = parsed.hostname;

  // 1. Protocol Analysis
  const proto = evaluationTarget.protocol.toLowerCase();
  if (proto === "http") {
    rules.push({
      name: "Insecure Protocol Check",
      status: "Fail",
      severity: "Medium",
      description: "Checks if the URL uses standard insecure HTTP protocol.",
      reason: "The URL uses HTTP which transmits credentials and data in cleartext.",
      suggestedAction: "Avoid entering any passwords, credit card numbers, or personal info.",
    });
    riskScore += RULE_WEIGHTS.INSECURE_PROTOCOL;
  } else if (proto !== "https") {
    rules.push({
      name: "Unsupported Protocol Check",
      status: "Fail",
      severity: "High",
      description: "Checks if the URL protocol is unsupported or unsafe.",
      reason: `The protocol '${proto}://' is not supported for standard secure web operations.`,
      suggestedAction: "Do not trust this URL. Close or navigate away.",
    });
    riskScore += RULE_WEIGHTS.UNSUPPORTED_PROTOCOL;
  } else {
    rules.push({
      name: "Protocol Security Check",
      status: "Pass",
      severity: "Low",
      description: "Checks if the URL uses secure TLS/SSL protocol.",
      reason: "Uses secure HTTPS protocol.",
      suggestedAction: "Data transmitted is encrypted under HTTPS.",
    });
  }

  // 2. Domain Structure Checks
  if (evaluationTarget.ipType === "Domain Name") {
    const subdomainCount = evaluationTarget.subdomain ? evaluationTarget.subdomain.split(".").filter(Boolean).length : 0;
    if (subdomainCount > 3) {
      rules.push({
        name: "Excessive Subdomains Check",
        status: "Warning",
        severity: "Medium",
        description: "Checks for unusually deep subdomain layouts.",
        reason: `Found ${subdomainCount} subdomains. Phishers frequently stack subdomains to mimic legitimate brand names.`,
        suggestedAction: "Carefully examine the root domain part of the link.",
      });
      riskScore += RULE_WEIGHTS.EXCESSIVE_SUBDOMAINS;
    } else {
      rules.push({
        name: "Subdomain Depth Check",
        status: "Pass",
        severity: "Low",
        description: "Checks subdomain count.",
        reason: "Subdomain structure is within standard boundaries.",
        suggestedAction: "None required.",
      });
    }

    if (evaluationTarget.hostname.length > 50) {
      rules.push({
        name: "Hostname Length Check",
        status: "Warning",
        severity: "Medium",
        description: "Checks if hostname is excessively long.",
        reason: `Hostname length is ${evaluationTarget.hostname.length} characters, which may obfuscate the actual domain.`,
        suggestedAction: "Verify the actual root domain matches your intended target.",
      });
      riskScore += RULE_WEIGHTS.EXCESSIVE_HOSTNAME_LENGTH;
    }

    if (evaluationTarget.hostname.startsWith("xn--")) {
      rules.push({
        name: "Punycode Domain Check",
        status: "Fail",
        severity: "High",
        description: "Detects internationalized Punycode homograph phishing domains.",
        reason: "Starts with 'xn--' prefix indicating internationalized Unicode characters.",
        suggestedAction: "This domain may be spoofing a well-known name using identical-looking Unicode characters.",
      });
      riskScore += RULE_WEIGHTS.PUNYCODE_DOMAIN;
    }

    const hostnameWithoutDots = evaluationTarget.hostname.replace(/\./g, "");
    if (/^\d+$/.test(hostnameWithoutDots)) {
      rules.push({
        name: "Numeric Hostname Check",
        status: "Fail",
        severity: "High",
        description: "Checks for hostnames consisting only of digits.",
        reason: "Hostname consists exclusively of numbers, mimicking an IP or obfuscating origin.",
        suggestedAction: "Do not interact with numeric hostname URLs.",
      });
      riskScore += RULE_WEIGHTS.NUMERIC_DOMAIN;
    }

    const hasConsonantSequences = /[^aeiou0-9.-]{6,}/i.test(evaluationTarget.hostname);
    if (hasConsonantSequences) {
      rules.push({
        name: "Domain Character Randomness Check",
        status: "Warning",
        severity: "Medium",
        description: "Checks for potential DGA (Domain Generation Algorithms) patterns.",
        reason: "Detected high-consonant density patterns suggesting random character generation.",
        suggestedAction: "Ensure the brand name in the domain is spelled correctly.",
      });
      riskScore += RULE_WEIGHTS.HIGH_ENTROPY_DOMAIN;
    }
  }

  // 3. TLD Analysis
  const currentTld = evaluationTarget.tld.toLowerCase();
  if (SUSPICIOUS_TLDS.includes(currentTld)) {
    rules.push({
      name: "Uncommon/High-Risk TLD Check",
      status: "Warning",
      severity: "Medium",
      description: "Audits top level domain against registry of high-abuse TLDs.",
      reason: `TLD '.${currentTld}' has a statistically high rate of spam and phishing registration.`,
      suggestedAction: "Double check the authenticity of the brand website.",
    });
    riskScore += RULE_WEIGHTS.HIGH_RISK_TLD;
  }

  // 4. IP Target Analysis
  if (evaluationTarget.ipType !== "Domain Name") {
    const isPrivate =
      evaluationTarget.hostname === "localhost" ||
      evaluationTarget.hostname === "127.0.0.1" ||
      evaluationTarget.hostname === "[::1]" ||
      evaluationTarget.hostname.startsWith("10.") ||
      evaluationTarget.hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(evaluationTarget.hostname);

    if (isPrivate) {
      rules.push({
        name: "Local/Private IP Destination Check",
        status: "Warning",
        severity: "Medium",
        description: "Checks if the URL points to a private intranet resource.",
        reason: "URL points to localhost or private network. Safe inside corporate networks but warning for general public.",
        suggestedAction: "Only proceed if you are connected to the target local environment.",
      });
      riskScore += RULE_WEIGHTS.PRIVATE_IP_URL;
    } else {
      rules.push({
        name: "Raw Public IP Destination Check",
        status: "Fail",
        severity: "High",
        description: "Detects raw public IP addresses used as URLs.",
        reason: `Uses raw IP address '${evaluationTarget.hostname}' instead of a DNS registered domain.`,
        suggestedAction: "Legitimate websites rarely use raw public IPs. Avoid inputting confidential details.",
      });
      riskScore += RULE_WEIGHTS.RAW_IP_URL;
    }
  }

  // 5. URL Shorteners
  const shortenerFound = URL_SHORTENERS.find(
    (s) => evaluationTarget.hostname === s || evaluationTarget.hostname.endsWith("." + s)
  );
  if (shortenerFound) {
    rules.push({
      name: "URL Shortener Redirect Check",
      status: "Warning",
      severity: "Medium",
      description: "Detects links that use redirect wrappers.",
      reason: `Uses shortener host '${shortenerFound}' which masks the final destination path.`,
      suggestedAction: "Use an unshortening tool to preview the actual destination URL before continuing.",
    });
    riskScore += RULE_WEIGHTS.SHORTENER_DETECTED;
  }

  // 6. Suspicious Keywords
  const matchedKeywords: string[] = [];
  const lowercaseOriginal = evaluationTarget.originalUrl.toLowerCase();
  
  SUSPICIOUS_KEYWORDS.forEach((kw) => {
    if (lowercaseOriginal.includes(kw)) {
      matchedKeywords.push(kw);
    }
  });

  if (matchedKeywords.length > 0) {
    const penalty = Math.min(matchedKeywords.length * RULE_WEIGHTS.SUSPICIOUS_KEYWORD_MATCH, 45);
    rules.push({
      name: "Suspicious Keywords Check",
      status: "Warning",
      severity: "High",
      description: "Scans URL strings for known social engineering keywords.",
      reason: `Found matching phishing terms: ${matchedKeywords.join(", ")}.`,
      suggestedAction: "Confirm the page domain belongs to the official brand and is not a spoof copy.",
    });
    riskScore += penalty;
  }

  // 7. Structural Obfuscation
  if (evaluationTarget.originalUrl.length > 120) {
    rules.push({
      name: "Excessive URL Length Check",
      status: "Warning",
      severity: "Low",
      description: "Checks if URL contains more than 120 characters.",
      reason: `URL contains ${evaluationTarget.originalUrl.length} characters, which could hide malicious queries.`,
      suggestedAction: "None.",
    });
    riskScore += RULE_WEIGHTS.EXCESSIVE_URL_LENGTH;
  }

  const pathDepth = evaluationTarget.path.split("/").filter(Boolean).length;
  if (pathDepth > 5) {
    rules.push({
      name: "Excessive Path Nesting Check",
      status: "Warning",
      severity: "Low",
      description: "Checks URL path nesting hierarchy.",
      reason: `Nesting depth is ${pathDepth} layers. Suspiciously complex directory structures are common in phishing paths.`,
      suggestedAction: "Verify the main domain portion is correct.",
    });
    riskScore += RULE_WEIGHTS.EXCESSIVE_PATH_NESTING;
  }

  const paramCount = Object.keys(evaluationTarget.queryParams).length;
  if (paramCount > 4) {
    rules.push({
      name: "Excessive Parameters Check",
      status: "Warning",
      severity: "Low",
      description: "Checks number of query arguments.",
      reason: `Found ${paramCount} query parameters. May hide tracking tokens or exploit payloads.`,
      suggestedAction: "Examine values of parameters.",
    });
    riskScore += RULE_WEIGHTS.EXCESSIVE_PARAMS;
  }

  if (/%25/i.test(evaluationTarget.originalUrl)) {
    rules.push({
      name: "Double Encoding Obfuscation Check",
      status: "Fail",
      severity: "High",
      description: "Scans for double percent-encoded characters.",
      reason: "URL contains '%25' sequence which escapes another percent sign. Used to evade security filter checks.",
      suggestedAction: "This page might contain evasion scripts. Exercise extreme caution.",
    });
    riskScore += RULE_WEIGHTS.DOUBLE_ENCODING;
  }

  if (/\/\//.test(evaluationTarget.path) || /\?\?/.test(evaluationTarget.originalUrl) || /&&/.test(evaluationTarget.originalUrl)) {
    rules.push({
      name: "Malformed Separation Separators Check",
      status: "Warning",
      severity: "Medium",
      description: "Scans for invalid consecutive separators.",
      reason: "Contains consecutive repeated separators (e.g. '//' in path or '&&' in query). Often indicates exploit attempts.",
      suggestedAction: "Ensure you typed the link correctly.",
    });
    riskScore += RULE_WEIGHTS.REPEATED_SEPARATORS;
  }

  // 8. File Download Check
  if (evaluationTarget.fileExtension) {
    const ext = evaluationTarget.fileExtension.toLowerCase();
    if (SUSPICIOUS_EXTENSIONS.includes(ext)) {
      rules.push({
        name: "Suspicious Executable/Archive Download Check",
        status: "Fail",
        severity: "High",
        description: "Scans file extension target in the URL path.",
        reason: `Points to a potentially dangerous downloadable file format: '.${ext}'.`,
        suggestedAction: "Do not open or execute files downloaded from unverified websites.",
      });
      riskScore += RULE_WEIGHTS.SUSPICIOUS_FILE_DOWNLOAD;
    }
  }

  // 9. Brand Similarity Check
  const brandMatch = detectBrandSimilarity(evaluationTarget.hostname);
  if (brandMatch.detected) {
    rules.push({
      name: "Brand Similarity Check",
      status: "Fail",
      severity: "High",
      description: "Audits for typosquatting and brand spoofing.",
      reason: brandMatch.description,
      suggestedAction: `Confirm if the link corresponds to the official '${brandMatch.brand}' platform before providing information.`,
    });
    riskScore += RULE_WEIGHTS.BRAND_SIMILARITY_WARN;
  }

  // 10. Redirect Intelligence Checks
  let consistency = undefined;
  if (redirectData) {
    const finalHost = redirectData.final_url ? new URL(redirectData.final_url).hostname : "";
    const isDomainChanged = finalHost.toLowerCase() !== originalHost.toLowerCase();
    const isProtocolChanged = redirectData.redirect_chain.some(
      (step, idx) => idx > 0 && step.url.split(":")[0].toLowerCase() !== redirectData.redirect_chain[idx - 1].url.split(":")[0].toLowerCase()
    );
    
    let isProtocolDowngraded = false;
    for (let i = 1; i < redirectData.redirect_chain.length; i++) {
      const prevProto = redirectData.redirect_chain[i - 1].url.split(":")[0].toLowerCase();
      const currProto = redirectData.redirect_chain[i].url.split(":")[0].toLowerCase();
      if (prevProto === "https" && currProto === "http") {
        isProtocolDowngraded = true;
      }
    }

    const isTldChanged = parsed.tld.toLowerCase() !== (finalHost.split(".").pop() || "").toLowerCase();
    const finalTld = (finalHost.split(".").pop() || "").toLowerCase();
    const isSuspiciousDest = SUSPICIOUS_TLDS.includes(finalTld) || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(finalHost);

    consistency = {
      domainChanged: isDomainChanged,
      protocolChanged: isProtocolChanged,
      tldChanged: isTldChanged,
      protocolDowngraded: isProtocolDowngraded,
      suspiciousRedirect: isSuspiciousDest,
    };

    if (redirectData.total_redirects > 3) {
      rules.push({
        name: "Excessive Redirect Steps Check",
        status: "Fail",
        severity: "High",
        description: "Checks if the URL resolves through too many hops.",
        reason: `The URL redirected ${redirectData.total_redirects} times, which exceeds the normal redirect count and hides the final destination.`,
        suggestedAction: "High-hop redirect patterns are standard in malware delivery campaigns.",
      });
      riskScore += RULE_WEIGHTS.REDIRECT_COUNT_RISK;
    } else if (redirectData.total_redirects > 1) {
      rules.push({
        name: "Multi-step Redirect Check",
        status: "Warning",
        severity: "Medium",
        description: "Checks if the URL uses middle redirects.",
        reason: `The URL redirected ${redirectData.total_redirects} times to reach the final page.`,
        suggestedAction: "Ensure the final destination page is the one you requested.",
      });
    }

    if (isProtocolDowngraded) {
      rules.push({
        name: "Protocol Downgrade Check",
        status: "Fail",
        severity: "High",
        description: "Detects HTTPS to HTTP downgrades during redirection.",
        reason: "The redirect chain downgraded encryption from HTTPS to HTTP, exposing data to interceptions.",
        suggestedAction: "Do not send any login credentials or personal info.",
      });
      riskScore += RULE_WEIGHTS.PROTOCOL_DOWNGRADE;
    }

    if (isDomainChanged) {
      rules.push({
        name: "Redirect Domain Mismatch Check",
        status: "Warning",
        severity: "Medium",
        description: "Checks if redirect changes target domains.",
        reason: `Domain changes from '${originalHost}' to '${finalHost}'.`,
        suggestedAction: "Confirm if the brand owns both domains or if it is routing to an external domain.",
      });
      riskScore += RULE_WEIGHTS.DOMAIN_MISMATCH;
    }

    if (isSuspiciousDest) {
      rules.push({
        name: "Suspicious Redirect Destination Check",
        status: "Fail",
        severity: "High",
        description: "Detects redirects targeting suspicious TLDs or raw IPs.",
        reason: `Resolves to a suspect destination: '${finalHost}'.`,
        suggestedAction: "Avoid submitting any inputs on this page.",
      });
      riskScore += RULE_WEIGHTS.SUSPICIOUS_REDIRECT_DEST;
    }

    if (redirectData.error && redirectData.error.includes("loop")) {
      rules.push({
        name: "Infinite Redirect Loop Check",
        status: "Fail",
        severity: "High",
        description: "Detects infinite circular redirects.",
        reason: "Redirect loops detected. Indicates attempt to crash scanners or hide infinite delivery pipelines.",
        suggestedAction: "Close the browser tab immediately.",
      });
      riskScore += RULE_WEIGHTS.REDIRECT_LOOP;
    }
  }

  const finalScore = Math.min(Math.max(riskScore, 0), 100);
  
  let threatLevel: ThreatLevel = "Safe";
  if (finalScore >= 90) {
    threatLevel = "Dangerous";
  } else if (finalScore >= 70) {
    threatLevel = "High Risk";
  } else if (finalScore >= 40) {
    threatLevel = "Medium Risk";
  } else if (finalScore >= 15) {
    threatLevel = "Low Risk";
  }

  const passedChecks = rules.filter((r) => r.status === "Pass");
  const failedChecks = rules.filter((r) => r.status === "Fail");
  const warningChecks = rules.filter((r) => r.status === "Warning");
  const triggeredRules = rules.filter((r) => r.status !== "Pass");

  return {
    riskScore: finalScore,
    threatLevel,
    totalRulesExecuted: rules.length,
    passedChecks,
    failedChecks,
    warningChecks,
    triggeredRules,
    brandMatch,
    consistency,
    analysisSummary: {
      passedCount: passedChecks.length,
      failedCount: failedChecks.length,
      warningCount: warningChecks.length,
      riskScore: finalScore,
      threatLevel,
    },
  };
}
