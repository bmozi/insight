/**
 * Privacy Analyzer for Web Dashboard
 * Web-compatible version of the privacy analysis module
 */

interface Cookie {
  name: string;
  domain: string;
  secure: boolean;
  session: boolean;
  expirationDate?: number;
}

interface ScanData {
  cookies?: {
    cookies: Cookie[];
    totalSize: number;
  };
  localStorage?: {
    totalSize: number;
    byDomain?: Record<string, any>;
  };
  sessionStorage?: {
    totalSize: number;
  };
  indexedDB?: {
    estimatedSize: number;
  };
  summary?: {
    cookieCount: number;
    totalSizeMB: string;
  };
}

interface PrivacyAnalysis {
  privacyScore: number;
  breakdown: {
    analytics: number;
    advertising: number;
    social: number;
    fingerprinting: number;
    essential: number;
    unknown: number;
  };
  recommendations: string[];
  highRiskItems: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    items?: any[];
  }>;
  deductions: Array<{
    type: string;
    count?: number;
    points: number;
    units?: number;
  }>;
}

// Simplified tracking database for web
const trackingPatterns = {
  analytics: ['google-analytics', 'hotjar', 'mixpanel', 'segment', 'amplitude', '_ga', '_gid', '_gat'],
  advertising: ['doubleclick', 'googlesyndication', 'criteo', 'outbrain', 'taboola', '_fbp', 'ads'],
  social: ['facebook', 'twitter', 'linkedin', 'pinterest', 'instagram', 'tiktok'],
  fingerprinting: ['fingerprint', 'datadome', 'deviceatlas', 'threatmetrix'],
};

function categorizeTracking(name: string, domain: string): string {
  const lowercaseName = name.toLowerCase();
  const lowercaseDomain = domain.toLowerCase();
  const combined = lowercaseName + ' ' + lowercaseDomain;

  if (trackingPatterns.analytics.some(p => combined.includes(p))) return 'analytics';
  if (trackingPatterns.advertising.some(p => combined.includes(p))) return 'advertising';
  if (trackingPatterns.social.some(p => combined.includes(p))) return 'social';
  if (trackingPatterns.fingerprinting.some(p => combined.includes(p))) return 'fingerprinting';

  return 'unknown';
}

/**
 * Analyze privacy using Prompt 3 algorithm
 */
export function analyzePrivacy(scanData: ScanData): PrivacyAnalysis {
  const cookies = scanData.cookies?.cookies || [];
  const localStorageSizeKB = (scanData.localStorage?.totalSize || 0) / 1024;

  // Categorize cookies
  const categorized = {
    analytics: [] as Cookie[],
    advertising: [] as Cookie[],
    social: [] as Cookie[],
    fingerprinting: [] as Cookie[],
    essential: [] as Cookie[],
    unknown: [] as Cookie[],
  };

  cookies.forEach(cookie => {
    const category = categorizeTracking(cookie.name, cookie.domain);
    if (category !== 'unknown') {
      categorized[category as keyof typeof categorized].push(cookie);
    } else {
      categorized.unknown.push(cookie);
    }
  });

  // Calculate privacy score using Prompt 3 algorithm
  let score = 100;
  const deductions = [];

  // Deduct -2 per tracking cookie (analytics + social + unknown tracking)
  const trackingCookies = categorized.analytics.length + categorized.social.length;
  if (trackingCookies > 0) {
    const deduction = trackingCookies * 2;
    score -= deduction;
    deductions.push({ type: 'tracking', count: trackingCookies, points: deduction });
  }

  // Deduct -3 per advertising cookie
  const advertisingCookies = categorized.advertising.length;
  if (advertisingCookies > 0) {
    const deduction = advertisingCookies * 3;
    score -= deduction;
    deductions.push({ type: 'advertising', count: advertisingCookies, points: deduction });
  }

  // Deduct -5 per fingerprinting cookie
  const fingerprintingCookies = categorized.fingerprinting.length;
  if (fingerprintingCookies > 0) {
    const deduction = fingerprintingCookies * 5;
    score -= deduction;
    deductions.push({ type: 'fingerprinting', count: fingerprintingCookies, points: deduction });
  }

  // Deduct -1 per long-lived cookie >1 year
  const oneYearFromNow = Date.now() + (365 * 24 * 60 * 60 * 1000);
  const longLivedCookies = cookies.filter(c =>
    !c.session &&
    c.expirationDate &&
    (c.expirationDate * 1000) > oneYearFromNow
  ).length;

  if (longLivedCookies > 0) {
    score -= longLivedCookies * 1;
    deductions.push({ type: 'long-lived', count: longLivedCookies, points: longLivedCookies });
  }

  // Deduct -2 per missing Secure flag on sensitive domains
  const sensitiveDomains = ['bank', 'paypal', 'stripe', 'auth', 'login', 'account', 'payment'];
  const insecureSensitiveCookies = cookies.filter(c => {
    const domain = c.domain.toLowerCase();
    const isSensitive = sensitiveDomains.some(keyword => domain.includes(keyword));
    return isSensitive && !c.secure;
  }).length;

  if (insecureSensitiveCookies > 0) {
    score -= insecureSensitiveCookies * 2;
    deductions.push({ type: 'insecure-sensitive', count: insecureSensitiveCookies, points: insecureSensitiveCookies * 2 });
  }

  // Deduct -1 per 100KB excessive localStorage
  const excessiveLocalStorageUnits = Math.floor(localStorageSizeKB / 100);
  if (excessiveLocalStorageUnits > 0) {
    score -= excessiveLocalStorageUnits * 1;
    deductions.push({ type: 'localStorage', units: excessiveLocalStorageUnits, points: excessiveLocalStorageUnits });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Generate recommendations
  const recommendations: string[] = [];

  if (advertisingCookies > 0) {
    const improvement = advertisingCookies * 3;
    recommendations.push(`Delete ${advertisingCookies} advertising cookies to improve score by ${improvement} points`);
  }

  if (fingerprintingCookies > 0) {
    const improvement = fingerprintingCookies * 5;
    recommendations.push(`Remove ${fingerprintingCookies} fingerprinting cookies to improve score by ${improvement} points`);
  }

  if (trackingCookies > 0) {
    const improvement = trackingCookies * 2;
    recommendations.push(`Clear ${trackingCookies} tracking cookies to improve score by ${improvement} points`);
  }

  if (longLivedCookies > 5) {
    recommendations.push(`Consider reducing cookie expiration for ${longLivedCookies} long-lived cookies`);
  }

  if (insecureSensitiveCookies > 0) {
    recommendations.push(`Enable secure flag on ${insecureSensitiveCookies} sensitive domain cookies`);
  }

  if (excessiveLocalStorageUnits > 5) {
    const sizeMB = (localStorageSizeKB / 1024).toFixed(1);
    recommendations.push(`Clear localStorage data (${sizeMB}MB) to free space and improve privacy`);
  }

  // Identify high-risk items
  const highRiskItems = [];

  if (fingerprintingCookies > 0) {
    highRiskItems.push({
      type: 'fingerprinting',
      severity: 'critical',
      title: 'Browser Fingerprinting Detected',
      description: `${fingerprintingCookies} fingerprinting cookies found that uniquely identify your browser`,
      items: categorized.fingerprinting.slice(0, 5).map(c => ({
        name: c.name,
        domain: c.domain,
      })),
    });
  }

  if (insecureSensitiveCookies > 0) {
    highRiskItems.push({
      type: 'insecure-sensitive',
      severity: 'high',
      title: 'Insecure Cookies on Sensitive Domains',
      description: `${insecureSensitiveCookies} cookies on sensitive domains without secure flag`,
    });
  }

  if (advertisingCookies > 20) {
    highRiskItems.push({
      type: 'excessive-advertising',
      severity: 'medium',
      title: 'Excessive Advertising Tracking',
      description: `${advertisingCookies} advertising cookies are tracking your browsing behavior`,
    });
  }

  if (localStorageSizeKB > 1024) { // > 1MB
    highRiskItems.push({
      type: 'large-storage',
      severity: 'medium',
      title: 'Large localStorage Usage',
      description: `${(localStorageSizeKB / 1024).toFixed(1)}MB of data stored in localStorage`,
    });
  }

  return {
    privacyScore: score,
    breakdown: {
      analytics: categorized.analytics.length,
      advertising: categorized.advertising.length,
      social: categorized.social.length,
      fingerprinting: categorized.fingerprinting.length,
      essential: categorized.essential.length,
      unknown: categorized.unknown.length,
    },
    recommendations,
    highRiskItems,
    deductions,
  };
}
