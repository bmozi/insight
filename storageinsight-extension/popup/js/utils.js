/**
 * StorageInsight Utility Functions
 * Pure functions for data transformation and formatting
 */
const StorageInsightUtils = (function() {

  // ============================================================================
  // TRACKING PATTERNS DATABASE
  // ============================================================================

  const trackingPatterns = {
    analytics: ['google-analytics', 'hotjar', 'mixpanel', 'segment', 'amplitude', '_ga', '_gid', '_gat', '_hjid', 'mp_', 'ajs_', 'amp_', '_pk_'],
    advertising: ['doubleclick', 'googlesyndication', 'criteo', 'outbrain', 'taboola', '_fbp', 'ads', '_cc_', 'cto_', '__qca', 'IDE', 'DSID'],
    social: ['facebook', 'twitter', 'linkedin', 'pinterest', 'instagram', 'tiktok', '_fbc', 'fr', 'datr', '_twitter_sess', 'personalization_id', '_rdt_', '_scid'],
    fingerprinting: ['fingerprint', 'datadome', 'deviceatlas', 'threatmetrix', '_fpjs', '_px', 'datadome'],
    essential: ['session', 'csrf', 'xsrf', 'auth', 'login', '__cf', 'cf_', '__stripe', 'cloudflare'],
  };

  // ============================================================================
  // DOMAIN-COMPANY MAPPING DATABASE
  // ============================================================================

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

  // ============================================================================
  // BYTE FORMATTING
  // ============================================================================

  /**
   * Format bytes to human readable format (B, KB, MB, GB)
   * @param {number} bytes - The number of bytes
   * @returns {string} Formatted string like "1.5 MB"
   */
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Format size in bytes to human readable (domain-specific format)
   * @param {number} bytes - The number of bytes
   * @returns {string} Formatted string like "1.5KB"
   */
  function formatDomainSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }

  // ============================================================================
  // TIME FORMATTING
  // ============================================================================

  /**
   * Format timestamp to relative time ("5 minutes ago", "2 hours ago", etc.)
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Relative time string
   */
  function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    return 'just now';
  }

  /**
   * Format cookie expiration date
   * @param {Object} cookie - Cookie object with session and expirationDate properties
   * @returns {string} Formatted expiration string
   */
  function formatExpiration(cookie) {
    if (cookie.session) return 'Session';
    if (!cookie.expirationDate) return 'Session';

    const date = new Date(cookie.expirationDate * 1000);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;

    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''}`;
  }

  // ============================================================================
  // COOKIE UTILITIES
  // ============================================================================

  /**
   * Get unique cookie ID from cookie properties
   * @param {Object} cookie - Cookie object with name, domain, and path properties
   * @returns {string} Unique cookie identifier
   */
  function getCookieId(cookie) {
    return `${cookie.name}_${cookie.domain}_${cookie.path || '/'}`;
  }

  /**
   * Categorize a cookie based on its name and domain
   * @param {string} name - Cookie name
   * @param {string} domain - Cookie domain
   * @returns {string} Category: 'essential', 'fingerprinting', 'advertising', 'social', 'analytics', or 'unknown'
   */
  function categorizeCookie(name, domain) {
    const lowercaseName = name.toLowerCase();
    const lowercaseDomain = domain.toLowerCase();
    const combined = lowercaseName + ' ' + lowercaseDomain;

    if (trackingPatterns.essential.some(p => combined.includes(p))) return 'essential';
    if (trackingPatterns.fingerprinting.some(p => combined.includes(p))) return 'fingerprinting';
    if (trackingPatterns.advertising.some(p => combined.includes(p))) return 'advertising';
    if (trackingPatterns.social.some(p => combined.includes(p))) return 'social';
    if (trackingPatterns.analytics.some(p => combined.includes(p))) return 'analytics';

    return 'unknown';
  }

  // ============================================================================
  // STORAGE UTILITIES
  // ============================================================================

  /**
   * Check if a storage key is suspicious/tracking-related
   * @param {string} key - Storage key to check
   * @returns {boolean} True if key appears to be tracking-related
   */
  function isSuspiciousStorageKey(key) {
    const suspiciousPatterns = [
      'track', 'analytics', '_ga', '_fb', 'pixel', 'fingerprint',
      'uuid', 'session_id', 'visitor', 'advertising', 'ad_', '_ad',
      'targeting', 'remarketing', 'conversion'
    ];
    const lowerKey = key.toLowerCase();
    return suspiciousPatterns.some(pattern => lowerKey.includes(pattern));
  }

  // ============================================================================
  // DOMAIN UTILITIES
  // ============================================================================

  /**
   * Get company name from domain
   * @param {string} domain - Domain to look up
   * @returns {string|null} Company name or null if not found
   */
  function getCompanyFromDomain(domain) {
    const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;

    // Direct match
    if (domainCompanyDatabase[cleanDomain]) {
      return domainCompanyDatabase[cleanDomain];
    }

    // Check if domain ends with known company domain
    for (const [knownDomain, company] of Object.entries(domainCompanyDatabase)) {
      if (cleanDomain.endsWith('.' + knownDomain) || cleanDomain === knownDomain) {
        return company;
      }
    }

    return null;
  }

  /**
   * Determine risk level for a domain based on cookies and patterns
   * @param {string} domain - Domain to analyze
   * @param {Array} cookies - Array of cookie objects for this domain
   * @returns {string} Risk level: 'critical', 'high', 'medium', or 'low'
   */
  function getDomainRiskLevel(domain, cookies) {
    const cookieNames = cookies.map(c => c.name.toLowerCase()).join(' ');
    const domainLower = domain.toLowerCase();

    // Fingerprinting patterns = critical
    if (/fingerprint|_fpjs|_px|datadome/.test(cookieNames + domainLower)) {
      return 'critical';
    }

    // Advertising patterns = high
    if (/doubleclick|criteo|_fbp|ads|adservice|advertising/.test(cookieNames + domainLower)) {
      return 'high';
    }

    // Analytics patterns = medium
    if (/_ga|_gid|analytics|_pk|utm_|segment|amplitude|mixpanel/.test(cookieNames + domainLower)) {
      return 'medium';
    }

    // Social media = medium
    if (/facebook|twitter|linkedin|instagram|tiktok|pinterest/.test(domainLower)) {
      return 'medium';
    }

    return 'low';
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  return {
    // Byte formatting
    formatBytes,
    formatDomainSize,

    // Time formatting
    formatRelativeTime,
    formatExpiration,

    // Cookie utilities
    getCookieId,
    categorizeCookie,

    // Storage utilities
    isSuspiciousStorageKey,

    // Domain utilities
    getCompanyFromDomain,
    getDomainRiskLevel
  };
})();
