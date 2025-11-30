/**
 * TrackingDatabase Library
 * Comprehensive database of 200+ known tracking domains and cookie patterns
 * Organized by category with risk level assessment
 */

export class TrackingDatabase {
  constructor() {
    // Comprehensive tracking domains organized by category
    this.trackingDomains = {
      ANALYTICS: [
        'google-analytics.com',
        'analytics.google.com',
        'googletagmanager.com',
        'hotjar.com',
        'crazyegg.com',
        'mixpanel.com',
        'segment.com',
        'amplitude.com',
        'heap.io',
        'fullstory.com',
        'mouseflow.com',
        'luckyorange.com',
        'inspectlet.com',
        'chartbeat.com',
        'scorecardresearch.com',
        'quantcast.com',
        'quantserve.com',
        'optimizely.com',
        'vwo.com',
        'ab tasty.com',
        'gtm.js',
        'analytics.js',
        'piwik.org',
        'matomo.org',
        'newrelic.com',
        'bugsnag.com',
        'sentry.io',
        'loggly.com',
        'sumologic.com',
        'splunk.com',
        'mixpanel.com',
        'mxpnl.com',
        'amplitude.com',
        'kissmetrics.com',
        'woopra.com',
        'clicky.com',
        'statcounter.com',
        'counter.dev',
        'goatcounter.com',
        'plausible.io',
        'usefathom.com',
        'simpleanalytics.com',
      ],

      ADVERTISING: [
        'doubleclick.net',
        'googlesyndication.com',
        'googleadservices.com',
        'google-analytics.com',
        'adnxs.com',
        'adsrvr.org',
        'advertising.com',
        'adtech.de',
        'turn.com',
        'contextweb.com',
        'pubmatic.com',
        'rubiconproject.com',
        'openx.net',
        'criteo.com',
        'criteo.net',
        'outbrain.com',
        'taboola.com',
        'amazon-adsystem.com',
        'a9.com',
        'adsafeprotected.com',
        'moatads.com',
        'bing.com',
        'ads.twitter.com',
        'ads-twitter.com',
        'ads.linkedin.com',
        'ads.pinterest.com',
        'ads.tiktok.com',
        'ads.reddit.com',
        'ads.yahoo.com',
        'adform.net',
        'smartadserver.com',
        'appnexus.com',
        'adroll.com',
        'perfectaudience.com',
        'retargeter.com',
        'revcontent.com',
        'mgid.com',
        'medianet.com',
        'media.net',
        'casalemedia.com',
        'indexww.com',
        'improvedigital.com',
        'sovrn.com',
        'rhythmone.com',
        'undertone.com',
        'yieldmo.com',
        'sharethrough.com',
        'teads.tv',
        'spotx.tv',
        'advertising.amazon.com',
        'bidswitch.net',
        'adotmob.com',
        'admixer.net',
        'exponential.com',
        'tribalfusion.com',
        'conversantmedia.com',
        'gwallet.com',
        'gumgum.com',
        'lijit.com',
        'nativo.com',
        'sharethrough.com',
        'smaato.net',
        'oath.com',
        'advertising.yahoo.com',
      ],

      SOCIAL: [
        'facebook.com',
        'facebook.net',
        'fbcdn.net',
        'connect.facebook.net',
        'fb.me',
        'twitter.com',
        't.co',
        'twimg.com',
        'linkedin.com',
        'licdn.com',
        'pinterest.com',
        'pinimg.com',
        'reddit.com',
        'redd.it',
        'redditmedia.com',
        'instagram.com',
        'cdninstagram.com',
        'tiktok.com',
        'ttwstatic.com',
        'snapchat.com',
        'sc-static.net',
        'youtube.com',
        'ytimg.com',
        'tumblr.com',
        'tmblr.co',
        'vimeo.com',
        'vimeocdn.com',
        'whatsapp.com',
        'telegram.org',
        'discord.com',
        'discordapp.com',
        'medium.com',
        'substack.com',
        'addthis.com',
        'sharethis.com',
        'addtoany.com',
      ],

      FINGERPRINTING: [
        'fingerprintjs.com',
        'datadome.co',
        'deviceatlas.com',
        'maxmind.com',
        'botd.js',
        '51degrees.com',
        'bluecava.com',
        'iovation.com',
        'threatmetrix.com',
        'fraudlogix.com',
        'whiteops.com',
        'perimeterx.com',
        'shape security.com',
        'distilnetworks.com',
        'cloudflare.com',
        'cf-ns.com',
        'akamai.net',
        'akstat.io',
        'incapsula.com',
        'imperva.com',
        'px-cloud.net',
        'px-cdn.net',
        'evidon.com',
        'ghostery.com',
      ],

      ESSENTIAL: [
        'cloudflare.com',
        'akamai.net',
        'fastly.net',
        'cloudfront.net',
        'stripe.com',
        'paypal.com',
        'paypalobjects.com',
        'braintreegateway.com',
        'braintree-api.com',
        'square.com',
        'squareup.com',
        'shopify.com',
        'shopifycdn.com',
        'gstatic.com',
        'googleapis.com',
        'recaptcha.net',
        'google.com',
        'amazon.com',
        'amazonaws.com',
        'cloudflare.net',
        'jsdelivr.net',
        'unpkg.com',
        'cdnjs.com',
        'cdnjs.cloudflare.com',
        'bootstrapcdn.com',
        'fontawesome.com',
        'fonts.gstatic.com',
        'fonts.googleapis.com',
        'typekit.net',
        'fonts.net',
      ],
    };

    // Known tracking cookie name patterns
    this.trackingCookiePatterns = [
      // Google Analytics
      /_ga/, /_gid/, /_gat/, /__utm/, /_gcl_/, /^AMP_TOKEN$/,

      // Facebook
      /_fbp/, /_fbc/, /^fr$/, /^datr$/, /^sb$/, /^c_user$/, /^xs$/,

      // Twitter
      /_twitter_sess/, /^personalization_id$/, /^guest_id$/,

      // LinkedIn
      /^lidc$/, /^bcookie$/, /^bscookie$/, /^lang$/,

      // Generic tracking patterns
      /^id$/, /^uid$/, /^uuid$/, /^user_id$/, /^userid$/, /_user$/,
      /^session_id$/, /^sess$/, /^track/, /^visitor/,

      // Specific trackers
      /_pk_/, // Piwik/Matomo
      /__qca/, // Quantcast
      /__atuv/, // AddThis
      /^dpm$/, // Adobe Audience Manager
      /^DSID$/, // DoubleClick
      /^IDE$/, // DoubleClick
      /test_cookie/, // Google test
      /_hjid/, // Hotjar
      /^ajs_/, // Segment
      /^mp_/, // Mixpanel
      /_kuid_/, // Krux
      /^c$/, // Criteo
      /^bku$/, // BlueKai
      /^TapAd_/, // Tapad
      /_trackers?_/,
      /analytics?_/,
      /tracking_/,
      /^_cc_/, // Criteo
      /^_ttp/, // TikTok Pixel
      /^_pin_/, // Pinterest
      /^__stripe/, // Stripe
      /^optimizelyEndUserId/,
      /^_vwo_/, // VWO
      /^_hjSessionUser/, // Hotjar
      /^_hjFirstSeen/, // Hotjar
      /^_clck/, // Clarity
      /^_clsk/, // Clarity
      /^_uetsid/, // Bing Ads
      /^_uetvid/, // Bing Ads
    ];

    // Domain information with risk levels
    this.domainInfo = {
      // High Risk - Aggressive Tracking/Fingerprinting
      'fingerprintjs.com': { category: 'FINGERPRINTING', risk: 'high', name: 'FingerprintJS' },
      'datadome.co': { category: 'FINGERPRINTING', risk: 'high', name: 'DataDome' },
      'threatmetrix.com': { category: 'FINGERPRINTING', risk: 'high', name: 'ThreatMetrix' },
      'doubleclick.net': { category: 'ADVERTISING', risk: 'high', name: 'Google DoubleClick' },
      'criteo.com': { category: 'ADVERTISING', risk: 'high', name: 'Criteo' },
      'outbrain.com': { category: 'ADVERTISING', risk: 'high', name: 'Outbrain' },
      'taboola.com': { category: 'ADVERTISING', risk: 'high', name: 'Taboola' },
      'facebook.com': { category: 'SOCIAL', risk: 'high', name: 'Facebook' },
      'facebook.net': { category: 'SOCIAL', risk: 'high', name: 'Facebook Pixel' },

      // Medium Risk - Analytics/Advertising
      'google-analytics.com': { category: 'ANALYTICS', risk: 'medium', name: 'Google Analytics' },
      'googletagmanager.com': { category: 'ANALYTICS', risk: 'medium', name: 'Google Tag Manager' },
      'hotjar.com': { category: 'ANALYTICS', risk: 'medium', name: 'Hotjar' },
      'mixpanel.com': { category: 'ANALYTICS', risk: 'medium', name: 'Mixpanel' },
      'segment.com': { category: 'ANALYTICS', risk: 'medium', name: 'Segment' },
      'amplitude.com': { category: 'ANALYTICS', risk: 'medium', name: 'Amplitude' },
      'quantcast.com': { category: 'ADVERTISING', risk: 'medium', name: 'Quantcast' },
      'amazon-adsystem.com': { category: 'ADVERTISING', risk: 'medium', name: 'Amazon Ads' },
      'twitter.com': { category: 'SOCIAL', risk: 'medium', name: 'Twitter' },
      'linkedin.com': { category: 'SOCIAL', risk: 'medium', name: 'LinkedIn' },
      'pinterest.com': { category: 'SOCIAL', risk: 'medium', name: 'Pinterest' },

      // Low Risk - Essential Services
      'stripe.com': { category: 'ESSENTIAL', risk: 'low', name: 'Stripe Payment' },
      'paypal.com': { category: 'ESSENTIAL', risk: 'low', name: 'PayPal' },
      'recaptcha.net': { category: 'ESSENTIAL', risk: 'low', name: 'reCAPTCHA' },
      'cloudflare.com': { category: 'ESSENTIAL', risk: 'low', name: 'Cloudflare CDN' },
      'gstatic.com': { category: 'ESSENTIAL', risk: 'low', name: 'Google Static' },
      'googleapis.com': { category: 'ESSENTIAL', risk: 'low', name: 'Google APIs' },
    };
  }

  /**
   * Get all tracking domains as a flat array
   */
  getAllTrackingDomains() {
    return Object.values(this.trackingDomains).flat();
  }

  /**
   * Get domains by category
   */
  getDomainsByCategory(category) {
    return this.trackingDomains[category] || [];
  }

  /**
   * Categorize a domain - returns category name
   */
  categorize(domain) {
    const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;

    // Check each category
    for (const [category, domains] of Object.entries(this.trackingDomains)) {
      for (const trackerDomain of domains) {
        if (cleanDomain === trackerDomain || cleanDomain.endsWith('.' + trackerDomain)) {
          return category;
        }
      }
    }

    return 'UNKNOWN';
  }

  /**
   * Check if a domain is a known tracker - returns boolean
   */
  isTracker(domain) {
    const category = this.categorize(domain);
    // Essential services are not considered trackers for the purpose of blocking
    return category !== 'UNKNOWN' && category !== 'ESSENTIAL';
  }

  /**
   * Get risk level for a domain - returns 'low' | 'medium' | 'high'
   */
  getRiskLevel(domain) {
    const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;

    // Check if we have specific info about this domain
    for (const [infoDomain, info] of Object.entries(this.domainInfo)) {
      if (cleanDomain === infoDomain || cleanDomain.endsWith('.' + infoDomain)) {
        return info.risk;
      }
    }

    // Otherwise, determine by category
    const category = this.categorize(domain);

    switch (category) {
      case 'FINGERPRINTING':
        return 'high';
      case 'ADVERTISING':
        return 'high';
      case 'ANALYTICS':
        return 'medium';
      case 'SOCIAL':
        return 'medium';
      case 'ESSENTIAL':
        return 'low';
      default:
        return 'low'; // Unknown domains default to low risk
    }
  }

  /**
   * Check if a cookie is likely a tracking cookie
   */
  isTrackingCookie(cookie) {
    // Check cookie name against patterns
    const nameMatch = this.trackingCookiePatterns.some((pattern) =>
      pattern.test(cookie.name)
    );

    // Check if domain is a known tracker
    const domainMatch = this.isTracker(cookie.domain);

    // Check cookie characteristics
    const hasLongExpiration = !cookie.session &&
      cookie.expirationDate &&
      (cookie.expirationDate * 1000 - Date.now()) > (365 * 24 * 60 * 60 * 1000);

    // Cookie is tracking if it matches patterns OR is from a tracking domain
    return nameMatch || (domainMatch && hasLongExpiration);
  }

  /**
   * Get detailed tracker information for a domain
   */
  getTrackerInfo(domain) {
    const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;

    // Check if we have specific info
    for (const [infoDomain, info] of Object.entries(this.domainInfo)) {
      if (cleanDomain === infoDomain || cleanDomain.endsWith('.' + infoDomain)) {
        return {
          name: info.name,
          category: info.category,
          risk: info.risk,
          domain: infoDomain,
          description: this.getCategoryDescription(info.category),
        };
      }
    }

    // Generic info based on category
    const category = this.categorize(domain);
    if (category !== 'UNKNOWN') {
      return {
        name: cleanDomain,
        category,
        risk: this.getRiskLevel(domain),
        domain: cleanDomain,
        description: this.getCategoryDescription(category),
      };
    }

    return null;
  }

  /**
   * Get description for a category
   */
  getCategoryDescription(category) {
    const descriptions = {
      ANALYTICS: 'Collects data about your browsing behavior and website usage',
      ADVERTISING: 'Tracks you across websites to serve targeted advertisements',
      SOCIAL: 'Social media tracking and sharing functionality',
      FINGERPRINTING: 'Creates a unique identifier for your browser to track you',
      ESSENTIAL: 'Required for core website functionality',
      UNKNOWN: 'Unknown tracking behavior',
    };

    return descriptions[category] || descriptions.UNKNOWN;
  }

  /**
   * Categorize a cookie with full details
   */
  categorizeCookie(cookie) {
    const category = this.categorize(cookie.domain);
    const trackerInfo = this.getTrackerInfo(cookie.domain);
    const risk = this.getRiskLevel(cookie.domain);
    const isTracking = this.isTrackingCookie(cookie);

    return {
      category,
      risk,
      isTracking,
      trackerInfo,
      type: isTracking ? 'tracking' : 'functional',
    };
  }

  /**
   * Get all cookies grouped by category
   */
  async categorizeAllCookies() {
    const cookies = await chrome.cookies.getAll({});
    const categorized = {
      ANALYTICS: [],
      ADVERTISING: [],
      SOCIAL: [],
      FINGERPRINTING: [],
      ESSENTIAL: [],
      FUNCTIONAL: [],
      UNKNOWN: [],
    };

    cookies.forEach((cookie) => {
      const info = this.categorizeCookie(cookie);
      const enrichedCookie = { ...cookie, ...info };

      if (info.category !== 'UNKNOWN' && categorized[info.category]) {
        categorized[info.category].push(enrichedCookie);
      } else if (info.isTracking) {
        categorized.UNKNOWN.push(enrichedCookie);
      } else {
        categorized.FUNCTIONAL.push(enrichedCookie);
      }
    });

    return categorized;
  }

  /**
   * Get statistics about tracked domains
   */
  getStatistics() {
    const stats = {
      totalDomains: this.getAllTrackingDomains().length,
      byCategory: {},
      byRisk: { low: 0, medium: 0, high: 0 },
    };

    // Count by category
    for (const [category, domains] of Object.entries(this.trackingDomains)) {
      stats.byCategory[category] = domains.length;
    }

    // Count by risk
    for (const info of Object.values(this.domainInfo)) {
      stats.byRisk[info.risk]++;
    }

    return stats;
  }
}

// Export convenience functions
export const trackingDb = new TrackingDatabase();

export function categorize(domain) {
  return trackingDb.categorize(domain);
}

export function isTracker(domain) {
  return trackingDb.isTracker(domain);
}

export function getRiskLevel(domain) {
  return trackingDb.getRiskLevel(domain);
}
