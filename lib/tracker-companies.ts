/**
 * Tracker Company Database
 * Maps tracking domains and cookies to their parent companies
 */

import { CookieCategory, RiskLevel, TrackerInfo, CompanyTrackerData } from './types';

interface CompanyInfo {
  name: string;
  description: string;
  category: CookieCategory;
  risk: RiskLevel;
  domains: string[];
  cookiePatterns: RegExp[];
}

export const companyDatabase: Record<string, CompanyInfo> = {
  google: {
    name: 'Google',
    description: 'Advertising, analytics, and web services',
    category: 'analytics',
    risk: 'medium',
    domains: [
      'google.com',
      'google-analytics.com',
      'googletagmanager.com',
      'googleadservices.com',
      'googlesyndication.com',
      'doubleclick.net',
      'gstatic.com',
      'googleapis.com',
      'youtube.com',
      'ytimg.com',
      'ggpht.com',
    ],
    cookiePatterns: [/_ga/, /_gid/, /_gat/, /__utm/, /_gcl_/, /^AMP_TOKEN$/, /^DSID$/, /^IDE$/],
  },
  meta: {
    name: 'Meta (Facebook)',
    description: 'Social media tracking and advertising',
    category: 'social',
    risk: 'high',
    domains: [
      'facebook.com',
      'facebook.net',
      'fbcdn.net',
      'fb.me',
      'fb.com',
      'instagram.com',
      'cdninstagram.com',
      'whatsapp.com',
      'messenger.com',
    ],
    cookiePatterns: [/_fbp/, /_fbc/, /^fr$/, /^datr$/, /^sb$/, /^c_user$/, /^xs$/],
  },
  microsoft: {
    name: 'Microsoft',
    description: 'Advertising and analytics',
    category: 'advertising',
    risk: 'medium',
    domains: [
      'microsoft.com',
      'bing.com',
      'msn.com',
      'live.com',
      'outlook.com',
      'linkedin.com',
      'licdn.com',
      'clarity.ms',
    ],
    cookiePatterns: [/^_uetsid/, /^_uetvid/, /^MUID/, /^_clck/, /^_clsk/],
  },
  amazon: {
    name: 'Amazon',
    description: 'E-commerce and advertising',
    category: 'advertising',
    risk: 'medium',
    domains: [
      'amazon.com',
      'amazon-adsystem.com',
      'amazonaws.com',
      'a9.com',
      'cloudfront.net',
    ],
    cookiePatterns: [/^ad-id/, /^ad-privacy/],
  },
  twitter: {
    name: 'Twitter/X',
    description: 'Social media tracking',
    category: 'social',
    risk: 'medium',
    domains: [
      'twitter.com',
      'x.com',
      't.co',
      'twimg.com',
      'ads-twitter.com',
    ],
    cookiePatterns: [/_twitter_sess/, /^personalization_id$/, /^guest_id$/],
  },
  adobe: {
    name: 'Adobe',
    description: 'Marketing and analytics',
    category: 'analytics',
    risk: 'medium',
    domains: [
      'adobe.com',
      'demdex.net',
      'omtrdc.net',
      'adobedtm.com',
      'typekit.net',
    ],
    cookiePatterns: [/^s_/, /^AMCV_/, /^dpm$/],
  },
  criteo: {
    name: 'Criteo',
    description: 'Retargeting and advertising',
    category: 'advertising',
    risk: 'high',
    domains: [
      'criteo.com',
      'criteo.net',
    ],
    cookiePatterns: [/^_cc_/, /^cto_/],
  },
  oracle: {
    name: 'Oracle',
    description: 'Data management and advertising',
    category: 'advertising',
    risk: 'high',
    domains: [
      'oracle.com',
      'bluekai.com',
      'addthis.com',
      'eloqua.com',
    ],
    cookiePatterns: [/^bku$/, /^__atuv/],
  },
  salesforce: {
    name: 'Salesforce',
    description: 'Marketing cloud and analytics',
    category: 'analytics',
    risk: 'medium',
    domains: [
      'salesforce.com',
      'krxd.net',
      'exacttarget.com',
    ],
    cookiePatterns: [/_kuid_/],
  },
  tiktok: {
    name: 'TikTok',
    description: 'Social media tracking',
    category: 'social',
    risk: 'high',
    domains: [
      'tiktok.com',
      'ttwstatic.com',
      'bytedance.com',
    ],
    cookiePatterns: [/^_ttp/, /^tt_/],
  },
  pinterest: {
    name: 'Pinterest',
    description: 'Social media tracking',
    category: 'social',
    risk: 'medium',
    domains: [
      'pinterest.com',
      'pinimg.com',
    ],
    cookiePatterns: [/^_pin_/, /^_pinterest_/],
  },
  hotjar: {
    name: 'Hotjar',
    description: 'Session recording and analytics',
    category: 'analytics',
    risk: 'medium',
    domains: [
      'hotjar.com',
      'hotjar.io',
    ],
    cookiePatterns: [/_hjid/, /_hjSessionUser/, /_hjFirstSeen/, /_hjAbsoluteSessionInProgress/],
  },
  mixpanel: {
    name: 'Mixpanel',
    description: 'Product analytics',
    category: 'analytics',
    risk: 'medium',
    domains: [
      'mixpanel.com',
      'mxpnl.com',
    ],
    cookiePatterns: [/^mp_/],
  },
  segment: {
    name: 'Segment',
    description: 'Customer data platform',
    category: 'analytics',
    risk: 'medium',
    domains: [
      'segment.com',
      'segment.io',
    ],
    cookiePatterns: [/^ajs_/],
  },
  amplitude: {
    name: 'Amplitude',
    description: 'Product analytics',
    category: 'analytics',
    risk: 'medium',
    domains: [
      'amplitude.com',
    ],
    cookiePatterns: [/^amp_/],
  },
  outbrain: {
    name: 'Outbrain',
    description: 'Content recommendation and advertising',
    category: 'advertising',
    risk: 'high',
    domains: [
      'outbrain.com',
      'outbrainimg.com',
    ],
    cookiePatterns: [],
  },
  taboola: {
    name: 'Taboola',
    description: 'Content recommendation and advertising',
    category: 'advertising',
    risk: 'high',
    domains: [
      'taboola.com',
      'taboolasyndication.com',
    ],
    cookiePatterns: [],
  },
  quantcast: {
    name: 'Quantcast',
    description: 'Audience measurement and advertising',
    category: 'advertising',
    risk: 'high',
    domains: [
      'quantcast.com',
      'quantserve.com',
    ],
    cookiePatterns: [/__qca/],
  },
  tradedoubler: {
    name: 'TradeDoubler',
    description: 'Affiliate marketing and tracking',
    category: 'advertising',
    risk: 'high',
    domains: [
      'tradedoubler.com',
    ],
    cookiePatterns: [/^TD_/, /^PI$/],
  },
  fingerprintjs: {
    name: 'FingerprintJS',
    description: 'Browser fingerprinting',
    category: 'fingerprinting',
    risk: 'critical',
    domains: [
      'fingerprintjs.com',
      'fpjs.io',
    ],
    cookiePatterns: [/^_fpjs/],
  },
  datadome: {
    name: 'DataDome',
    description: 'Bot detection and fingerprinting',
    category: 'fingerprinting',
    risk: 'critical',
    domains: [
      'datadome.co',
    ],
    cookiePatterns: [/^datadome/],
  },
  perimeterx: {
    name: 'PerimeterX',
    description: 'Bot detection and fingerprinting',
    category: 'fingerprinting',
    risk: 'critical',
    domains: [
      'perimeterx.net',
      'px-cloud.net',
      'px-cdn.net',
    ],
    cookiePatterns: [/^_px/],
  },
  cloudflare: {
    name: 'Cloudflare',
    description: 'CDN and security (bot detection)',
    category: 'essential',
    risk: 'low',
    domains: [
      'cloudflare.com',
      'cloudflareinsights.com',
    ],
    cookiePatterns: [/^__cf/, /^cf_/],
  },
  stripe: {
    name: 'Stripe',
    description: 'Payment processing',
    category: 'essential',
    risk: 'low',
    domains: [
      'stripe.com',
      'stripe.network',
      'stripecdn.com',
    ],
    cookiePatterns: [/^__stripe/],
  },
  paypal: {
    name: 'PayPal',
    description: 'Payment processing',
    category: 'essential',
    risk: 'low',
    domains: [
      'paypal.com',
      'paypalobjects.com',
    ],
    cookiePatterns: [],
  },
  reddit: {
    name: 'Reddit',
    description: 'Social media tracking',
    category: 'social',
    risk: 'medium',
    domains: [
      'reddit.com',
      'redd.it',
      'redditmedia.com',
      'redditstatic.com',
    ],
    cookiePatterns: [/^_rdt_/],
  },
  snapchat: {
    name: 'Snapchat',
    description: 'Social media tracking',
    category: 'social',
    risk: 'medium',
    domains: [
      'snapchat.com',
      'sc-static.net',
      'snap.com',
    ],
    cookiePatterns: [/^_scid/, /^sc_/],
  },
  optimizely: {
    name: 'Optimizely',
    description: 'A/B testing and experimentation',
    category: 'analytics',
    risk: 'medium',
    domains: [
      'optimizely.com',
    ],
    cookiePatterns: [/^optimizelyEndUserId/, /^optimizely/],
  },
  vwo: {
    name: 'VWO',
    description: 'A/B testing and analytics',
    category: 'analytics',
    risk: 'medium',
    domains: [
      'vwo.com',
      'visualwebsiteoptimizer.com',
    ],
    cookiePatterns: [/^_vwo_/, /^_vis_opt_/],
  },
  matomo: {
    name: 'Matomo',
    description: 'Open-source analytics',
    category: 'analytics',
    risk: 'low',
    domains: [
      'matomo.org',
      'piwik.org',
    ],
    cookiePatterns: [/_pk_/],
  },
};

/**
 * Get company name from domain
 */
export function getCompanyFromDomain(domain: string): string | null {
  const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;

  for (const [key, company] of Object.entries(companyDatabase)) {
    for (const companyDomain of company.domains) {
      if (cleanDomain === companyDomain || cleanDomain.endsWith('.' + companyDomain)) {
        return company.name;
      }
    }
  }

  return null;
}

/**
 * Get company name from cookie
 */
export function getCompanyFromCookie(cookieName: string, domain: string): string | null {
  // First try by domain
  const domainCompany = getCompanyFromDomain(domain);
  if (domainCompany) return domainCompany;

  // Then try by cookie pattern
  for (const [key, company] of Object.entries(companyDatabase)) {
    for (const pattern of company.cookiePatterns) {
      if (pattern.test(cookieName)) {
        return company.name;
      }
    }
  }

  return null;
}

/**
 * Get full company info
 */
export function getCompanyInfo(companyName: string): CompanyInfo | null {
  for (const [key, company] of Object.entries(companyDatabase)) {
    if (company.name === companyName) {
      return company;
    }
  }
  return null;
}

/**
 * Get tracker info for a domain
 */
export function getTrackerInfo(domain: string): TrackerInfo | null {
  const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;

  for (const [key, company] of Object.entries(companyDatabase)) {
    for (const companyDomain of company.domains) {
      if (cleanDomain === companyDomain || cleanDomain.endsWith('.' + companyDomain)) {
        return {
          name: companyDomain,
          company: company.name,
          category: company.category,
          risk: company.risk,
          domain: cleanDomain,
          description: company.description,
        };
      }
    }
  }

  return null;
}

/**
 * Get all companies
 */
export function getAllCompanies(): string[] {
  return Object.values(companyDatabase).map(c => c.name);
}

/**
 * Get companies by category
 */
export function getCompaniesByCategory(category: CookieCategory): string[] {
  return Object.values(companyDatabase)
    .filter(c => c.category === category)
    .map(c => c.name);
}

/**
 * Get companies by risk level
 */
export function getCompaniesByRisk(risk: RiskLevel): string[] {
  return Object.values(companyDatabase)
    .filter(c => c.risk === risk)
    .map(c => c.name);
}
