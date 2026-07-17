export const RULE_WEIGHTS = {
  INSECURE_PROTOCOL: 20,
  UNSUPPORTED_PROTOCOL: 35,
  EXCESSIVE_SUBDOMAINS: 10,
  EXCESSIVE_HOSTNAME_LENGTH: 15,
  NUMERIC_DOMAIN: 30,
  HIGH_ENTROPY_DOMAIN: 20,
  EXCESSIVE_URL_LENGTH: 10,
  EXCESSIVE_PATH_NESTING: 10,
  EXCESSIVE_PARAMS: 10,
  DOUBLE_ENCODING: 15,
  REPEATED_SEPARATORS: 10,
  RAW_IP_URL: 30,
  PRIVATE_IP_URL: 25,
  SHORTENER_DETECTED: 15,
  SUSPICIOUS_KEYWORD_MATCH: 15, // Penalty weight per match, capped at 45
  SUSPICIOUS_FILE_DOWNLOAD: 30,
  PUNYCODE_DOMAIN: 20,
  HIGH_RISK_TLD: 15,
  
  // Redirect Rules Weights
  REDIRECT_COUNT_RISK: 20,
  SUSPICIOUS_REDIRECT_DEST: 25,
  BRAND_SIMILARITY_WARN: 30,
  DOMAIN_MISMATCH: 15,
  PROTOCOL_DOWNGRADE: 35,
  REDIRECT_LOOP: 50,
};

export const SUSPICIOUS_TLDS = [
  "xyz", "top", "click", "gq", "cf", "tk", "ml", "fit", "buzz",
  "space", "online", "site", "website", "download", "link"
];

export const URL_SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "shorturl.at", "cutt.ly",
  "is.gd", "rebrand.ly", "tiny.cc", "ow.ly", "buff.ly", "s.id", "t.ly"
];

export const SUSPICIOUS_KEYWORDS = [
  "login", "verify", "secure", "update", "account", "payment",
  "wallet", "reward", "prize", "free", "bonus", "crypto",
  "bank", "otp", "password", "support", "signin", "billing",
  "verification", "kyc", "card"
];

export const SUSPICIOUS_EXTENSIONS = [
  "exe", "apk", "bat", "cmd", "js", "zip", "rar", "scr", "msi", "iso", "vbs", "ps1"
];
