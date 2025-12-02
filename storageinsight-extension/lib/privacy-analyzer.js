/**
 * PrivacyAnalyzer Library
 * Analyzes browser storage and calculates privacy scores with exact Prompt 3 algorithm
 */

import { scanAllStorage } from './storage-scanner.js';
import { TrackingDatabase } from './tracking-database.js';
import debug from './debug.js';

export class PrivacyAnalyzer {
  constructor() {
    this.trackingDb = new TrackingDatabase();
  }

  /**
   * Perform comprehensive privacy analysis with exact Prompt 3 scoring
   */
  async analyze() {
    debug.log('🛡️ Starting privacy analysis...');

    try {
      // Scan all storage using v2.0.0 API
      const storageData = await scanAllStorage();

      // Get all cookies for analysis
      const cookies = storageData.cookies?.cookies || [];

      // Categorize all cookies
      const categorizedCookies = this.categorizeCookies(cookies);

      // Calculate privacy score with exact Prompt 3 algorithm
      const privacyScore = this.calculatePrivacyScore(cookies, categorizedCookies, storageData);

      // Generate categorized breakdown
      const breakdown = this.generateBreakdown(cookies, categorizedCookies, storageData);

      // Generate recommendations
      const recommendations = this.generateRecommendations(categorizedCookies, storageData, privacyScore);

      // Identify high-risk items
      const highRiskItems = this.identifyHighRiskItems(cookies, storageData);

      // Compute tracker companies
      const trackerCompanies = this.computeTrackerCompanies(cookies);

      const analysis = {
        privacyScore,
        scoreRating: this.getScoreRating(privacyScore),
        scoreColor: this.getScoreColor(privacyScore),
        breakdown,
        recommendations,
        highRiskItems,
        trackerCompanies,
        timestamp: Date.now(),
        metadata: {
          totalCookies: cookies.length,
          totalStorageMB: parseFloat(storageData.summary?.totalSizeMB || '0'),
          uniqueDomains: storageData.summary?.uniqueDomains || 0,
          scanTime: storageData.metadata?.scanTime,
        },
      };

      debug.log('✅ Privacy analysis complete:', analysis);
      return analysis;
    } catch (error) {
      debug.error('❌ Error during privacy analysis:', error);
      throw error;
    }
  }

  /**
   * Categorize all cookies by tracking type
   */
  categorizeCookies(cookies) {
    const categorized = {
      analytics: [],
      advertising: [],
      social: [],
      fingerprinting: [],
      essential: [],
      functional: [],
      unknown: [],
    };

    cookies.forEach((cookie) => {
      const info = this.trackingDb.categorizeCookie(cookie);
      const enrichedCookie = { ...cookie, ...info };

      switch (info.category) {
        case 'ANALYTICS':
          categorized.analytics.push(enrichedCookie);
          break;
        case 'ADVERTISING':
          categorized.advertising.push(enrichedCookie);
          break;
        case 'SOCIAL':
          categorized.social.push(enrichedCookie);
          break;
        case 'FINGERPRINTING':
          categorized.fingerprinting.push(enrichedCookie);
          break;
        case 'ESSENTIAL':
          categorized.essential.push(enrichedCookie);
          break;
        case 'UNKNOWN':
          if (info.isTracking) {
            categorized.unknown.push(enrichedCookie);
          } else {
            categorized.functional.push(enrichedCookie);
          }
          break;
        default:
          categorized.functional.push(enrichedCookie);
      }
    });

    return categorized;
  }

  /**
   * Compute tracker companies from cookies - matches web app's tracker-companies.ts
   */
  computeTrackerCompanies(cookies) {
    const companyMap = new Map();

    // Comprehensive company database matching web app's tracker-companies.ts
    const companyDatabase = {
      google: {
        name: 'Google',
        description: 'Advertising, analytics, and web services',
        category: 'analytics',
        risk: 'medium',
        domains: ['google.com', 'google-analytics.com', 'googletagmanager.com', 'googleadservices.com',
                  'googlesyndication.com', 'doubleclick.net', 'gstatic.com', 'googleapis.com',
                  'youtube.com', 'ytimg.com', 'ggpht.com'],
        cookiePatterns: [/_ga/, /_gid/, /_gat/, /__utm/, /_gcl_/, /^AMP_TOKEN$/, /^DSID$/, /^IDE$/]
      },
      meta: {
        name: 'Meta (Facebook)',
        description: 'Social media tracking and advertising',
        category: 'social',
        risk: 'high',
        domains: ['facebook.com', 'facebook.net', 'fbcdn.net', 'fb.me', 'fb.com',
                  'instagram.com', 'cdninstagram.com', 'whatsapp.com', 'messenger.com'],
        cookiePatterns: [/_fbp/, /_fbc/, /^fr$/, /^datr$/, /^sb$/, /^c_user$/, /^xs$/]
      },
      microsoft: {
        name: 'Microsoft',
        description: 'Advertising and analytics',
        category: 'advertising',
        risk: 'medium',
        domains: ['microsoft.com', 'bing.com', 'msn.com', 'live.com', 'outlook.com',
                  'linkedin.com', 'licdn.com', 'clarity.ms'],
        cookiePatterns: [/^_uetsid/, /^_uetvid/, /^MUID/, /^_clck/, /^_clsk/]
      },
      amazon: {
        name: 'Amazon',
        description: 'E-commerce and advertising',
        category: 'advertising',
        risk: 'medium',
        domains: ['amazon.com', 'amazon-adsystem.com', 'amazonaws.com', 'a9.com', 'cloudfront.net'],
        cookiePatterns: [/^ad-id/, /^ad-privacy/]
      },
      twitter: {
        name: 'Twitter/X',
        description: 'Social media tracking',
        category: 'social',
        risk: 'medium',
        domains: ['twitter.com', 'x.com', 't.co', 'twimg.com', 'ads-twitter.com'],
        cookiePatterns: [/_twitter_sess/, /^personalization_id$/, /^guest_id$/]
      },
      adobe: {
        name: 'Adobe',
        description: 'Marketing and analytics',
        category: 'analytics',
        risk: 'medium',
        domains: ['adobe.com', 'demdex.net', 'omtrdc.net', 'adobedtm.com', 'typekit.net'],
        cookiePatterns: [/^s_/, /^AMCV_/, /^dpm$/]
      },
      criteo: {
        name: 'Criteo',
        description: 'Retargeting and advertising',
        category: 'advertising',
        risk: 'high',
        domains: ['criteo.com', 'criteo.net'],
        cookiePatterns: [/^_cc_/, /^cto_/]
      },
      oracle: {
        name: 'Oracle',
        description: 'Data management and advertising',
        category: 'advertising',
        risk: 'high',
        domains: ['oracle.com', 'bluekai.com', 'addthis.com', 'eloqua.com'],
        cookiePatterns: [/^bku$/, /^__atuv/]
      },
      salesforce: {
        name: 'Salesforce',
        description: 'Marketing cloud and analytics',
        category: 'analytics',
        risk: 'medium',
        domains: ['salesforce.com', 'krxd.net', 'exacttarget.com'],
        cookiePatterns: [/_kuid_/]
      },
      tiktok: {
        name: 'TikTok',
        description: 'Social media tracking',
        category: 'social',
        risk: 'high',
        domains: ['tiktok.com', 'ttwstatic.com', 'bytedance.com'],
        cookiePatterns: [/^_ttp/, /^tt_/]
      },
      pinterest: {
        name: 'Pinterest',
        description: 'Social media tracking',
        category: 'social',
        risk: 'medium',
        domains: ['pinterest.com', 'pinimg.com'],
        cookiePatterns: [/^_pin_/, /^_pinterest_/]
      },
      hotjar: {
        name: 'Hotjar',
        description: 'Session recording and analytics',
        category: 'analytics',
        risk: 'medium',
        domains: ['hotjar.com', 'hotjar.io'],
        cookiePatterns: [/_hjid/, /_hjSessionUser/, /_hjFirstSeen/, /_hjAbsoluteSessionInProgress/]
      },
      mixpanel: {
        name: 'Mixpanel',
        description: 'Product analytics',
        category: 'analytics',
        risk: 'medium',
        domains: ['mixpanel.com', 'mxpnl.com'],
        cookiePatterns: [/^mp_/]
      },
      segment: {
        name: 'Segment',
        description: 'Customer data platform',
        category: 'analytics',
        risk: 'medium',
        domains: ['segment.com', 'segment.io'],
        cookiePatterns: [/^ajs_/]
      },
      amplitude: {
        name: 'Amplitude',
        description: 'Product analytics',
        category: 'analytics',
        risk: 'medium',
        domains: ['amplitude.com'],
        cookiePatterns: [/^amp_/]
      },
      outbrain: {
        name: 'Outbrain',
        description: 'Content recommendation and advertising',
        category: 'advertising',
        risk: 'high',
        domains: ['outbrain.com', 'outbrainimg.com'],
        cookiePatterns: []
      },
      taboola: {
        name: 'Taboola',
        description: 'Content recommendation and advertising',
        category: 'advertising',
        risk: 'high',
        domains: ['taboola.com', 'taboolasyndication.com'],
        cookiePatterns: []
      },
      quantcast: {
        name: 'Quantcast',
        description: 'Audience measurement and advertising',
        category: 'advertising',
        risk: 'high',
        domains: ['quantcast.com', 'quantserve.com'],
        cookiePatterns: [/__qca/]
      },
      reddit: {
        name: 'Reddit',
        description: 'Social media tracking',
        category: 'social',
        risk: 'medium',
        domains: ['reddit.com', 'redd.it', 'redditmedia.com', 'redditstatic.com'],
        cookiePatterns: [/^_rdt_/]
      },
      snapchat: {
        name: 'Snapchat',
        description: 'Social media tracking',
        category: 'social',
        risk: 'medium',
        domains: ['snapchat.com', 'sc-static.net', 'snap.com'],
        cookiePatterns: [/^_scid/, /^sc_/]
      },
      vwo: {
        name: 'VWO',
        description: 'A/B testing and analytics',
        category: 'analytics',
        risk: 'medium',
        domains: ['vwo.com', 'visualwebsiteoptimizer.com'],
        cookiePatterns: [/^_vwo_/, /^_vis_opt_/]
      },
      optimizely: {
        name: 'Optimizely',
        description: 'A/B testing and experimentation',
        category: 'analytics',
        risk: 'medium',
        domains: ['optimizely.com'],
        cookiePatterns: [/^optimizelyEndUserId/, /^optimizely/]
      },
      fingerprintjs: {
        name: 'FingerprintJS',
        description: 'Browser fingerprinting',
        category: 'fingerprinting',
        risk: 'critical',
        domains: ['fingerprintjs.com', 'fpjs.io'],
        cookiePatterns: [/^_fpjs/]
      },
      datadome: {
        name: 'DataDome',
        description: 'Bot detection and fingerprinting',
        category: 'fingerprinting',
        risk: 'critical',
        domains: ['datadome.co'],
        cookiePatterns: [/^datadome/]
      },
      perimeterx: {
        name: 'PerimeterX',
        description: 'Bot detection and fingerprinting',
        category: 'fingerprinting',
        risk: 'critical',
        domains: ['perimeterx.net', 'px-cloud.net', 'px-cdn.net'],
        cookiePatterns: [/^_px/]
      },
      hubspot: {
        name: 'HubSpot',
        description: 'Marketing automation and analytics',
        category: 'analytics',
        risk: 'medium',
        domains: ['hubspot.com', 'hs-analytics.net', 'hsforms.com'],
        cookiePatterns: [/^__hs/, /^hubspot/, /^__hstc/, /^__hssc/]
      }
    };

    // Function to get company from domain
    const getCompanyFromDomain = (domain) => {
      const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;
      for (const [key, company] of Object.entries(companyDatabase)) {
        for (const companyDomain of company.domains) {
          if (cleanDomain === companyDomain || cleanDomain.endsWith('.' + companyDomain)) {
            return company;
          }
        }
      }
      return null;
    };

    // Function to get company from cookie name
    const getCompanyFromCookieName = (cookieName) => {
      for (const [key, company] of Object.entries(companyDatabase)) {
        for (const pattern of company.cookiePatterns) {
          if (pattern.test(cookieName)) {
            return company;
          }
        }
      }
      return null;
    };

    // Only include tracking categories (not essential)
    const trackingCategories = ['analytics', 'advertising', 'social', 'fingerprinting'];

    cookies.forEach(cookie => {
      const domain = (cookie.domain || '').toLowerCase().replace(/^\./, '');
      const cookieName = cookie.name || '';

      // Try to match by cookie name first (like _ga can identify Google anywhere)
      let companyInfo = getCompanyFromCookieName(cookieName);

      // Fall back to domain matching
      if (!companyInfo) {
        companyInfo = getCompanyFromDomain(domain);
      }

      // Only include if it's a tracking company
      if (companyInfo && trackingCategories.includes(companyInfo.category)) {
        if (!companyMap.has(companyInfo.name)) {
          companyMap.set(companyInfo.name, {
            name: companyInfo.name,
            description: companyInfo.description,
            domains: [],
            cookieCount: 0,
            category: companyInfo.category,
            risk: companyInfo.risk
          });
        }

        const company = companyMap.get(companyInfo.name);
        if (!company.domains.includes(domain)) {
          company.domains.push(domain);
        }
        company.cookieCount++;
      }
    });

    return Array.from(companyMap.values());
  }

  /**
   * Calculate privacy score (0-100) using improved percentage-based algorithm
   * More reasonable scoring that doesn't instantly zero out with large cookie counts
   *
   * Scoring approach:
   * - Base score starts at 100
   * - Calculate tracking ratio (tracking cookies / total cookies)
   * - Apply severity-weighted deductions based on cookie categories
   * - Use diminishing returns to avoid excessive penalties
   */
  calculatePrivacyScore(cookies, categorized, storageData) {
    let score = 100;
    const deductions = [];
    const totalCookies = cookies.length;

    // Count tracking cookies (analytics + social + unknown tracking)
    const trackingCookies = categorized.analytics.length +
                           categorized.social.length +
                           categorized.unknown.filter(c => c.isTracking).length;

    const advertisingCookies = categorized.advertising.length;
    const fingerprintingCookies = categorized.fingerprinting.length;

    // Calculate tracking ratio (0-1)
    const trackingRatio = totalCookies > 0 ? trackingCookies / totalCookies : 0;

    // Deduct based on tracking ratio with diminishing returns
    // Uses logarithmic scaling to avoid zero scores with high cookie counts
    if (trackingCookies > 0) {
      // Base deduction: 0-30 points based on ratio
      // Additional deduction: scaled by log of count (diminishing returns)
      const ratioDeduction = trackingRatio * 30;
      const volumeDeduction = Math.min(10, Math.log10(trackingCookies + 1) * 3);
      const deduction = Math.round(ratioDeduction + volumeDeduction);
      score -= deduction;
      deductions.push({ type: 'tracking', count: trackingCookies, points: deduction, ratio: trackingRatio.toFixed(3) });
    }

    // Advertising cookies: higher severity
    if (advertisingCookies > 0) {
      const adRatio = totalCookies > 0 ? advertisingCookies / totalCookies : 0;
      const ratioDeduction = adRatio * 25;
      const volumeDeduction = Math.min(10, Math.log10(advertisingCookies + 1) * 4);
      const deduction = Math.round(ratioDeduction + volumeDeduction);
      score -= deduction;
      deductions.push({ type: 'advertising', count: advertisingCookies, points: deduction });
    }

    // Fingerprinting: critical severity
    if (fingerprintingCookies > 0) {
      const fpRatio = totalCookies > 0 ? fingerprintingCookies / totalCookies : 0;
      const ratioDeduction = fpRatio * 20;
      const volumeDeduction = Math.min(15, fingerprintingCookies * 2);
      const deduction = Math.round(ratioDeduction + volumeDeduction);
      score -= deduction;
      deductions.push({ type: 'fingerprinting', count: fingerprintingCookies, points: deduction });
    }

    // Long-lived cookies: capped deduction
    const oneYearFromNow = Date.now() + (365 * 24 * 60 * 60 * 1000);
    const longLivedCookies = cookies.filter(c =>
      !c.session &&
      c.expirationDate &&
      (c.expirationDate * 1000) > oneYearFromNow
    ).length;

    if (longLivedCookies > 0) {
      // Cap at 10 points for long-lived cookies
      const deduction = Math.min(10, Math.round(Math.log10(longLivedCookies + 1) * 4));
      score -= deduction;
      deductions.push({ type: 'long-lived', count: longLivedCookies, points: deduction });
    }

    // Missing Secure flag on sensitive domains: critical issue
    const sensitiveDomains = ['bank', 'paypal', 'stripe', 'auth', 'login', 'account', 'payment'];
    const insecureSensitiveCookies = cookies.filter(c => {
      const domain = c.domain.toLowerCase();
      const isSensitive = sensitiveDomains.some(keyword => domain.includes(keyword));
      return isSensitive && !c.secure;
    }).length;

    if (insecureSensitiveCookies > 0) {
      // Each insecure sensitive cookie is serious
      const deduction = Math.min(15, insecureSensitiveCookies * 3);
      score -= deduction;
      deductions.push({ type: 'insecure-sensitive', count: insecureSensitiveCookies, points: deduction });
    }

    // Excessive localStorage: capped deduction
    const localStorageSizeKB = (storageData.localStorage?.totalSize || 0) / 1024;
    const excessiveLocalStorageUnits = Math.floor(localStorageSizeKB / 100);

    if (excessiveLocalStorageUnits > 0) {
      // Cap at 5 points for storage
      const deduction = Math.min(5, excessiveLocalStorageUnits);
      score -= deduction;
      deductions.push({ type: 'localStorage', units: excessiveLocalStorageUnits, points: deduction });
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    debug.log('📊 Privacy Score Calculation:', {
      totalCookies,
      trackingCookies,
      advertisingCookies,
      fingerprintingCookies,
      trackingRatio: (trackingRatio * 100).toFixed(1) + '%',
      finalScore: score,
      totalDeductions: deductions.reduce((sum, d) => sum + d.points, 0)
    });

    return {
      score,
      deductions,
      breakdown: {
        tracking: trackingCookies,
        advertising: advertisingCookies,
        fingerprinting: fingerprintingCookies,
        longLived: longLivedCookies,
        insecureSensitive: insecureSensitiveCookies,
        excessiveStorage: excessiveLocalStorageUnits,
      },
    };
  }

  /**
   * Generate categorized breakdown as specified in Prompt 3
   * - Count by category (Analytics, Advertising, Functional, Social, Unknown)
   * - First-party vs Third-party ratio
   * - Average cookie age
   * - Total tracking surface area
   */
  generateBreakdown(cookies, categorized, storageData) {
    // Count by category
    const byCategory = {
      Analytics: categorized.analytics.length,
      Advertising: categorized.advertising.length,
      Social: categorized.social.length,
      Fingerprinting: categorized.fingerprinting.length,
      Functional: categorized.functional.length + categorized.essential.length,
      Unknown: categorized.unknown.length,
    };

    // First-party vs Third-party
    let firstParty = 0;
    let thirdParty = 0;

    cookies.forEach(cookie => {
      if (this.trackingDb.isTracker(cookie.domain)) {
        thirdParty++;
      } else {
        firstParty++;
      }
    });

    // Calculate average cookie age (in days)
    let totalAge = 0;
    let persistentCookies = 0;

    cookies.forEach(cookie => {
      if (!cookie.session && cookie.expirationDate) {
        const ageMs = (cookie.expirationDate * 1000) - Date.now();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays > 0) {
          totalAge += ageDays;
          persistentCookies++;
        }
      }
    });

    const averageCookieAge = persistentCookies > 0
      ? Math.round(totalAge / persistentCookies)
      : 0;

    // Total tracking surface area (number of tracking domains)
    const trackingDomains = new Set();
    cookies.forEach(cookie => {
      if (this.trackingDb.isTracker(cookie.domain)) {
        const cleanDomain = cookie.domain.startsWith('.')
          ? cookie.domain.substring(1)
          : cookie.domain;
        trackingDomains.add(cleanDomain);
      }
    });

    return {
      byCategory,
      partyRatio: {
        firstParty,
        thirdParty,
        ratio: firstParty > 0 ? (thirdParty / firstParty).toFixed(2) : '0',
      },
      averageCookieAge,
      trackingSurfaceArea: trackingDomains.size,
      totalStorage: {
        cookies: storageData.cookies?.totalSize || 0,
        localStorage: storageData.localStorage?.totalSize || 0,
        sessionStorage: storageData.sessionStorage?.totalSize || 0,
        indexedDB: storageData.indexedDB?.estimatedSize || 0,
      },
    };
  }

  /**
   * Generate recommendations as specified in Prompt 3
   * Format: "Delete 47 advertising cookies to improve score by 15 points"
   */
  generateRecommendations(categorized, storageData, privacyScore) {
    const recommendations = [];

    // Advertising cookies recommendation
    if (categorized.advertising.length > 0) {
      const pointImprovement = categorized.advertising.length * 3;
      recommendations.push({
        severity: 'high',
        icon: '🎯',
        title: `Delete ${categorized.advertising.length} advertising cookies`,
        description: `Remove advertising cookies to improve your privacy score by ${pointImprovement} points`,
        action: 'clear_advertising',
        impact: pointImprovement,
        count: categorized.advertising.length,
      });
    }

    // Fingerprinting recommendation
    if (categorized.fingerprinting.length > 0) {
      const pointImprovement = categorized.fingerprinting.length * 5;
      recommendations.push({
        severity: 'critical',
        icon: '🔒',
        title: `Block ${categorized.fingerprinting.length} fingerprinting trackers`,
        description: `High-risk fingerprinting detected! Removing these would improve score by ${pointImprovement} points`,
        action: 'block_fingerprinting',
        impact: pointImprovement,
        count: categorized.fingerprinting.length,
      });
    }

    // Facebook tracking recommendation
    const facebookCookies = categorized.social.filter(c =>
      c.domain.includes('facebook') || c.domain.includes('fb')
    );

    if (facebookCookies.length > 0) {
      recommendations.push({
        severity: 'high',
        icon: '📘',
        title: `Remove Facebook tracking pixel (${facebookCookies.length} cookies)`,
        description: 'Facebook is tracking your activity across websites',
        action: 'remove_facebook_tracking',
        impact: facebookCookies.length * 2,
        count: facebookCookies.length,
      });
    }

    // Analytics recommendation
    if (categorized.analytics.length > 10) {
      const pointImprovement = categorized.analytics.length * 2;
      recommendations.push({
        severity: 'medium',
        icon: '📊',
        title: `Reduce analytics tracking (${categorized.analytics.length} cookies)`,
        description: `Consider clearing analytics cookies to improve score by ${pointImprovement} points`,
        action: 'clear_analytics',
        impact: pointImprovement,
        count: categorized.analytics.length,
      });
    }

    // Long-lived cookies recommendation
    const oneYearFromNow = Date.now() + (365 * 24 * 60 * 60 * 1000);
    const longLivedCount = categorized.advertising.concat(categorized.analytics).filter(c =>
      !c.session &&
      c.expirationDate &&
      (c.expirationDate * 1000) > oneYearFromNow
    ).length;

    if (longLivedCount > 10) {
      recommendations.push({
        severity: 'medium',
        icon: '⏰',
        title: `${longLivedCount} long-lived tracking cookies detected`,
        description: `These cookies persist for over a year and continuously track you`,
        action: 'clear_long_lived',
        impact: longLivedCount,
        count: longLivedCount,
      });
    }

    // Excessive localStorage recommendation
    const localStorageSizeKB = (storageData.localStorage?.totalSize || 0) / 1024;
    if (localStorageSizeKB > 1000) {
      const pointImprovement = Math.floor(localStorageSizeKB / 100);
      recommendations.push({
        severity: 'low',
        icon: '💾',
        title: `Clear ${(localStorageSizeKB / 1024).toFixed(1)}MB of localStorage`,
        description: `Excessive localStorage usage could affect privacy score by ${pointImprovement} points`,
        action: 'clear_localstorage',
        impact: pointImprovement,
        size: localStorageSizeKB,
      });
    }

    // Positive feedback
    if (recommendations.length === 0 || privacyScore.score >= 90) {
      recommendations.unshift({
        severity: 'info',
        icon: '✅',
        title: 'Excellent privacy posture!',
        description: 'Your browser has minimal tracking. Keep it up!',
        action: null,
        impact: 0,
      });
    }

    // Sort by severity and impact
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    recommendations.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return (b.impact || 0) - (a.impact || 0);
    });

    return recommendations;
  }

  /**
   * Identify high-risk items as specified in Prompt 3
   * - Cookies from known fingerprinting services
   * - Unusually large localStorage entries
   * - Cross-site tracking indicators
   */
  identifyHighRiskItems(cookies, storageData) {
    const highRiskItems = [];

    // 1. Fingerprinting cookies
    const fingerprintingCookies = cookies.filter(c => {
      const category = this.trackingDb.categorize(c.domain);
      return category === 'FINGERPRINTING';
    });

    if (fingerprintingCookies.length > 0) {
      highRiskItems.push({
        type: 'fingerprinting',
        severity: 'critical',
        title: 'Browser Fingerprinting Detected',
        description: `${fingerprintingCookies.length} fingerprinting cookies found that uniquely identify your browser`,
        items: fingerprintingCookies.map(c => ({
          name: c.name,
          domain: c.domain,
          tracker: this.trackingDb.getTrackerInfo(c.domain)?.name || 'Unknown',
        })),
        risk: 'high',
      });
    }

    // 2. Unusually large localStorage entries (>1MB)
    const largeStorageItems = [];
    const localStorageByDomain = storageData.localStorage?.byDomain || {};

    for (const [domain, data] of Object.entries(localStorageByDomain)) {
      if (data.totalSize > 1024 * 1024) { // 1MB
        for (const [key, item] of Object.entries(data.items || {})) {
          if (item.sizeBytes > 100 * 1024) { // 100KB
            largeStorageItems.push({
              domain,
              key,
              size: item.sizeBytes,
              sizeKB: (item.sizeBytes / 1024).toFixed(0),
            });
          }
        }
      }
    }

    if (largeStorageItems.length > 0) {
      highRiskItems.push({
        type: 'large_storage',
        severity: 'high',
        title: 'Unusually Large Storage Entries',
        description: `${largeStorageItems.length} localStorage entries exceed 100KB, which may contain tracking data`,
        items: largeStorageItems,
        risk: 'medium',
      });
    }

    // 3. Cross-site tracking indicators
    const crossSiteTrackers = [];
    const domainCookies = {};

    // Group cookies by domain
    cookies.forEach(c => {
      const cleanDomain = c.domain.startsWith('.') ? c.domain.substring(1) : c.domain;
      if (!domainCookies[cleanDomain]) {
        domainCookies[cleanDomain] = [];
      }
      domainCookies[cleanDomain].push(c);
    });

    // Find domains with many third-party cookies
    for (const [domain, domainCookieList] of Object.entries(domainCookies)) {
      if (this.trackingDb.isTracker(domain) && domainCookieList.length >= 3) {
        const trackerInfo = this.trackingDb.getTrackerInfo(domain);
        if (trackerInfo && trackerInfo.risk === 'high') {
          // Get a display-friendly name - use tracker name if different from domain, otherwise capitalize domain
          const displayName = (trackerInfo.name && trackerInfo.name !== domain)
            ? trackerInfo.name
            : this.extractCompanyName(domain);
          crossSiteTrackers.push({
            name: displayName,
            domain,
            tracker: trackerInfo.name,
            category: trackerInfo.category,
            cookieCount: domainCookieList.length,
            risk: trackerInfo.risk,
          });
        }
      }
    }

    if (crossSiteTrackers.length > 0) {
      highRiskItems.push({
        type: 'cross_site_tracking',
        severity: 'high',
        title: 'Cross-Site Tracking Detected',
        description: `${crossSiteTrackers.length} tracking services are following you across multiple websites`,
        items: crossSiteTrackers,
        risk: 'high',
      });
    }

    // 4. Insecure cookies on sensitive domains
    const sensitiveDomains = ['bank', 'paypal', 'stripe', 'auth', 'login', 'account', 'payment'];
    const insecureSensitive = cookies.filter(c => {
      const domain = c.domain.toLowerCase();
      const isSensitive = sensitiveDomains.some(keyword => domain.includes(keyword));
      return isSensitive && !c.secure;
    });

    if (insecureSensitive.length > 0) {
      highRiskItems.push({
        type: 'insecure_sensitive',
        severity: 'critical',
        title: 'Insecure Cookies on Sensitive Domains',
        description: `${insecureSensitive.length} cookies on sensitive domains are not marked as secure`,
        items: insecureSensitive.map(c => ({
          name: c.name,
          domain: c.domain,
          secure: c.secure,
          httpOnly: c.httpOnly,
        })),
        risk: 'high',
      });
    }

    return highRiskItems;
  }

  /**
   * Get privacy score color
   */
  getScoreColor(scoreData) {
    const score = scoreData.score || scoreData;
    if (score >= 70) return 'green';
    if (score >= 40) return 'yellow';
    return 'red';
  }

  /**
   * Get privacy score rating
   */
  getScoreRating(scoreData) {
    const score = scoreData.score || scoreData;
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 30) return 'Poor';
    return 'Critical';
  }

  /**
   * Extract a display-friendly company name from a domain
   * e.g., "facebook.com" → "Facebook", "doubleclick.net" → "DoubleClick"
   */
  extractCompanyName(domain) {
    // Remove common TLDs and subdomains
    const cleanDomain = domain
      .replace(/^(www\.|m\.|mobile\.|api\.|cdn\.|static\.)/i, '')
      .split('.')[0];

    // Capitalize first letter of each word
    return cleanDomain
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

// Export convenience function
export const privacyAnalyzer = new PrivacyAnalyzer();

export async function analyzePrivacy() {
  return await privacyAnalyzer.analyze();
}

/**
 * Analyze privacy from pre-scanned storage data (synchronous)
 * Use this when you already have scan results and don't want to rescan
 * @param {Object} storageData - Pre-scanned storage data from scanAllStorage()
 * @returns {Object} Privacy analysis results
 */
export function analyzePrivacyFromData(storageData) {
  debug.log('🛡️ Starting privacy analysis from pre-scanned data...');

  try {
    // Get all cookies for analysis
    const cookies = storageData.cookies?.cookies || [];

    // Categorize all cookies
    const categorizedCookies = privacyAnalyzer.categorizeCookies(cookies);

    // Calculate privacy score with exact Prompt 3 algorithm
    const privacyScore = privacyAnalyzer.calculatePrivacyScore(cookies, categorizedCookies, storageData);

    // Generate categorized breakdown
    const breakdown = privacyAnalyzer.generateBreakdown(cookies, categorizedCookies, storageData);

    // Generate recommendations
    const recommendations = privacyAnalyzer.generateRecommendations(categorizedCookies, storageData, privacyScore);

    // Identify high-risk items
    const highRiskItems = privacyAnalyzer.identifyHighRiskItems(cookies, storageData);

    // Compute tracker companies
    const trackerCompanies = privacyAnalyzer.computeTrackerCompanies(cookies);

    const analysis = {
      privacyScore,
      scoreRating: privacyAnalyzer.getScoreRating(privacyScore),
      scoreColor: privacyAnalyzer.getScoreColor(privacyScore),
      breakdown,
      recommendations,
      highRiskItems,
      trackerCompanies,
      timestamp: Date.now(),
      metadata: {
        totalCookies: cookies.length,
        totalStorageMB: parseFloat(storageData.summary?.totalSizeMB || '0'),
        uniqueDomains: storageData.summary?.uniqueDomains || 0,
        scanTime: storageData.metadata?.scanTime,
      },
    };

    debug.log('✅ Privacy analysis complete:', analysis);
    return analysis;
  } catch (error) {
    debug.error('❌ Error during privacy analysis:', error);
    throw error;
  }
}
