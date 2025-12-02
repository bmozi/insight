/**
 * StorageInsight Tracking Database
 * Known tracker patterns and company domain mappings
 */
const StorageInsightTrackingDB = (function() {

  // Cookie categorization patterns
  const trackingPatterns = {
    analytics: ['google-analytics', 'hotjar', 'mixpanel', 'segment', 'amplitude', '_ga', '_gid', '_gat', '_hjid', 'mp_', 'ajs_', 'amp_', '_pk_'],
    advertising: ['doubleclick', 'googlesyndication', 'criteo', 'outbrain', 'taboola', '_fbp', 'ads', '_cc_', 'cto_', '__qca', 'IDE', 'DSID'],
    social: ['facebook', 'twitter', 'linkedin', 'pinterest', 'instagram', 'tiktok', '_fbc', 'fr', 'datr', '_twitter_sess', 'personalization_id', '_rdt_', '_scid'],
    fingerprinting: ['fingerprint', 'datadome', 'deviceatlas', 'threatmetrix', '_fpjs', '_px', 'datadome'],
    essential: ['session', 'csrf', 'xsrf', 'auth', 'login', '__cf', 'cf_', '__stripe', 'cloudflare'],
  };

  // Domain to company mapping
  const domainCompanyDatabase = {
    'google.com': 'Google', 'doubleclick.net': 'Google', 'googleapis.com': 'Google', 'googlesyndication.com': 'Google',
    'youtube.com': 'Google', 'gstatic.com': 'Google', 'googleadservices.com': 'Google', 'google-analytics.com': 'Google',
    'facebook.com': 'Meta', 'fb.com': 'Meta', 'fbcdn.net': 'Meta', 'instagram.com': 'Meta', 'whatsapp.com': 'Meta',
    'microsoft.com': 'Microsoft', 'bing.com': 'Microsoft', 'msn.com': 'Microsoft', 'live.com': 'Microsoft', 'office.com': 'Microsoft',
    'amazon.com': 'Amazon', 'amazonaws.com': 'Amazon', 'cloudfront.net': 'Amazon', 'amazon-adsystem.com': 'Amazon',
    'twitter.com': 'X (Twitter)', 'twimg.com': 'X (Twitter)', 'x.com': 'X (Twitter)',
    'linkedin.com': 'LinkedIn', 'licdn.com': 'LinkedIn',
    'adobe.com': 'Adobe', 'demdex.net': 'Adobe', 'omtrdc.net': 'Adobe', 'adobedtm.com': 'Adobe',
    'criteo.com': 'Criteo', 'criteo.net': 'Criteo',
    'hubspot.com': 'HubSpot', 'hs-analytics.net': 'HubSpot', 'hsforms.com': 'HubSpot',
    'tiktok.com': 'TikTok', 'tiktokcdn.com': 'TikTok',
    'pinterest.com': 'Pinterest', 'pinimg.com': 'Pinterest',
    'reddit.com': 'Reddit', 'redditmedia.com': 'Reddit', 'redditstatic.com': 'Reddit',
    'snapchat.com': 'Snapchat', 'sc-cdn.net': 'Snapchat',
    'yahoo.com': 'Yahoo', 'oath.com': 'Yahoo',
    'cloudflare.com': 'Cloudflare', 'cdnjs.cloudflare.com': 'Cloudflare',
  };

  // Public API
  return {
    /**
     * Get all tracking patterns
     * @returns {Object} Object containing all tracking pattern categories
     */
    getTrackingPatterns() {
      return trackingPatterns;
    },

    /**
     * Get patterns for a specific category
     * @param {string} category - Category name (analytics, advertising, social, fingerprinting, essential)
     * @returns {Array<string>} Array of pattern strings for the category
     */
    getPattern(category) {
      return trackingPatterns[category] || [];
    },

    /**
     * Get the complete domain to company mapping database
     * @returns {Object} Object mapping domains to company names
     */
    getDomainCompanyDatabase() {
      return domainCompanyDatabase;
    },

    /**
     * Get company name for a specific domain
     * @param {string} domain - Domain to look up
     * @returns {string|null} Company name or null if not found
     */
    getCompanyForDomain(domain) {
      return domainCompanyDatabase[domain] || null;
    }
  };
})();
