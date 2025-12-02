/**
 * StorageInsight Domain Explorer Module
 * Groups cookies by company with web-app matching design
 *
 * Dependencies:
 * - StorageInsightUtils (for getCompanyFromDomain, getDomainRiskLevel, formatDomainSize)
 * - chrome.runtime API (for cookie deletion)
 */
const DomainExplorer = (function() {
  'use strict';

  // ============================================================================
  // COMPANY DATABASE - Comprehensive company info matching web app
  // ============================================================================
  const companyDatabase = {
    'Google': {
      category: 'analytics',
      description: 'Advertising, analytics, and web services',
      risk: 'medium',
      domains: ['google.com', 'google-analytics.com', 'googletagmanager.com', 'googleadservices.com',
                'googlesyndication.com', 'doubleclick.net', 'gstatic.com', 'googleapis.com', 'youtube.com', 'ytimg.com']
    },
    'Meta': {
      category: 'social',
      description: 'Social media tracking and advertising',
      risk: 'high',
      domains: ['facebook.com', 'facebook.net', 'fbcdn.net', 'fb.me', 'fb.com', 'instagram.com', 'whatsapp.com', 'messenger.com']
    },
    'Microsoft': {
      category: 'advertising',
      description: 'Advertising and analytics',
      risk: 'medium',
      domains: ['microsoft.com', 'bing.com', 'msn.com', 'live.com', 'outlook.com', 'linkedin.com', 'licdn.com', 'clarity.ms', 'office.com', 'xbox.com']
    },
    'Amazon': {
      category: 'advertising',
      description: 'E-commerce and advertising',
      risk: 'medium',
      domains: ['amazon.com', 'amazon-adsystem.com', 'amazonaws.com', 'a9.com', 'cloudfront.net']
    },
    'X (Twitter)': {
      category: 'social',
      description: 'Social media tracking',
      risk: 'medium',
      domains: ['twitter.com', 'x.com', 't.co', 'twimg.com', 'ads-twitter.com']
    },
    'Adobe': {
      category: 'analytics',
      description: 'Marketing and analytics',
      risk: 'medium',
      domains: ['adobe.com', 'demdex.net', 'omtrdc.net', 'adobedtm.com', 'typekit.net']
    },
    'Criteo': {
      category: 'advertising',
      description: 'Retargeting and advertising',
      risk: 'high',
      domains: ['criteo.com', 'criteo.net']
    },
    'Oracle': {
      category: 'advertising',
      description: 'Data management and advertising',
      risk: 'high',
      domains: ['oracle.com', 'bluekai.com', 'addthis.com', 'eloqua.com']
    },
    'TikTok': {
      category: 'social',
      description: 'Social media tracking',
      risk: 'high',
      domains: ['tiktok.com', 'ttwstatic.com', 'bytedance.com']
    },
    'Pinterest': {
      category: 'social',
      description: 'Social media tracking',
      risk: 'medium',
      domains: ['pinterest.com', 'pinimg.com']
    },
    'Hotjar': {
      category: 'analytics',
      description: 'Session recording and analytics',
      risk: 'medium',
      domains: ['hotjar.com', 'hotjar.io']
    },
    'Mixpanel': {
      category: 'analytics',
      description: 'Product analytics',
      risk: 'medium',
      domains: ['mixpanel.com', 'mxpnl.com']
    },
    'Segment': {
      category: 'analytics',
      description: 'Customer data platform',
      risk: 'medium',
      domains: ['segment.com', 'segment.io']
    },
    'Amplitude': {
      category: 'analytics',
      description: 'Product analytics',
      risk: 'medium',
      domains: ['amplitude.com']
    },
    'Outbrain': {
      category: 'advertising',
      description: 'Content recommendation and advertising',
      risk: 'high',
      domains: ['outbrain.com', 'outbrainimg.com']
    },
    'Taboola': {
      category: 'advertising',
      description: 'Content recommendation and advertising',
      risk: 'high',
      domains: ['taboola.com', 'taboolasyndication.com']
    },
    'Quantcast': {
      category: 'advertising',
      description: 'Audience measurement and advertising',
      risk: 'high',
      domains: ['quantcast.com', 'quantserve.com']
    },
    'FingerprintJS': {
      category: 'fingerprinting',
      description: 'Browser fingerprinting',
      risk: 'critical',
      domains: ['fingerprintjs.com', 'fpjs.io']
    },
    'DataDome': {
      category: 'fingerprinting',
      description: 'Bot detection and fingerprinting',
      risk: 'critical',
      domains: ['datadome.co']
    },
    'PerimeterX': {
      category: 'fingerprinting',
      description: 'Bot detection and fingerprinting',
      risk: 'critical',
      domains: ['perimeterx.net', 'px-cloud.net', 'px-cdn.net']
    },
    'Cloudflare': {
      category: 'essential',
      description: 'CDN and security',
      risk: 'low',
      domains: ['cloudflare.com', 'cloudflareinsights.com']
    },
    'Stripe': {
      category: 'essential',
      description: 'Payment processing',
      risk: 'low',
      domains: ['stripe.com', 'stripe.network', 'stripecdn.com']
    },
    'PayPal': {
      category: 'essential',
      description: 'Payment processing',
      risk: 'low',
      domains: ['paypal.com', 'paypalobjects.com']
    },
    'Reddit': {
      category: 'social',
      description: 'Social media tracking',
      risk: 'medium',
      domains: ['reddit.com', 'redd.it', 'redditmedia.com', 'redditstatic.com']
    },
    'Snapchat': {
      category: 'social',
      description: 'Social media tracking',
      risk: 'medium',
      domains: ['snapchat.com', 'sc-static.net', 'snap.com']
    },
    'LinkedIn': {
      category: 'social',
      description: 'Professional social tracking',
      risk: 'medium',
      domains: ['linkedin.com', 'licdn.com']
    },
    'HubSpot': {
      category: 'analytics',
      description: 'Marketing automation',
      risk: 'medium',
      domains: ['hubspot.com', 'hs-analytics.net', 'hsforms.com']
    },
    'Yahoo': {
      category: 'advertising',
      description: 'Advertising and analytics',
      risk: 'medium',
      domains: ['yahoo.com', 'oath.com']
    },
    'Optimizely': {
      category: 'analytics',
      description: 'A/B testing and experimentation',
      risk: 'medium',
      domains: ['optimizely.com']
    },
    'VWO': {
      category: 'analytics',
      description: 'A/B testing and analytics',
      risk: 'medium',
      domains: ['vwo.com', 'visualwebsiteoptimizer.com']
    },
    'Salesforce': {
      category: 'analytics',
      description: 'Marketing cloud and analytics',
      risk: 'medium',
      domains: ['salesforce.com', 'krxd.net', 'exacttarget.com']
    }
  };

  // Category colors matching web app
  const CATEGORY_COLORS = {
    analytics: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: '#3b82f6' },
    advertising: { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', border: '#8b5cf6' },
    social: { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', border: '#ec4899' },
    fingerprinting: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: '#ef4444' },
    essential: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', border: '#22c55e' },
    unknown: { bg: 'rgba(107, 114, 128, 0.1)', text: '#4b5563', border: '#6b7280' }
  };

  // Company initial colors (matching web app)
  const COMPANY_COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#6366f1', '#06b6d4', '#84cc16', '#ef4444', '#eab308'
  ];

  // Private state
  let state = {
    allCompanies: [],
    filteredCompanies: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchTerm: '',
    riskFilter: 'all',
    expandedCompanies: new Set(),
    totalDomains: 0
  };

  // DOM element references
  let elements = {
    domainsPageTotal: null,
    domainsCompanies: null,
    domainsHighRisk: null,
    domainsFiltered: null,
    domainsTotalCount: null,
    domainsPageList: null,
    domainSearchInput: null,
    domainRiskFilter: null,
    domainPagination: null,
    domainPrevPage: null,
    domainNextPage: null,
    domainCurrentPage: null,
    domainTotalPages: null
  };

  let showStatusFn = null;

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get company info from domain
   */
  function getCompanyFromDomain(domain) {
    const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;

    for (const [companyName, info] of Object.entries(companyDatabase)) {
      for (const companyDomain of info.domains) {
        if (cleanDomain === companyDomain || cleanDomain.endsWith('.' + companyDomain)) {
          return { name: companyName, ...info };
        }
      }
    }
    return null;
  }

  /**
   * Determine category from cookie patterns
   */
  function getCategoryFromCookie(cookieName, domain) {
    const combined = (cookieName + ' ' + domain).toLowerCase();

    if (/fingerprint|_fpjs|_px|datadome/.test(combined)) return 'fingerprinting';
    if (/doubleclick|criteo|_fbp|ads|adservice|advertising|__qca|IDE|DSID/.test(combined)) return 'advertising';
    if (/facebook|twitter|linkedin|pinterest|instagram|tiktok|_fbc|_rdt_|_scid/.test(combined)) return 'social';
    if (/_ga|_gid|_gat|analytics|_pk|utm_|segment|amplitude|mixpanel|_hjid|mp_|ajs_/.test(combined)) return 'analytics';
    if (/session|csrf|xsrf|auth|login|__cf|cf_|__stripe|cloudflare/.test(combined)) return 'essential';

    return 'unknown';
  }

  /**
   * Get company color by index
   */
  function getCompanyColor(index) {
    return COMPANY_COLORS[index % COMPANY_COLORS.length];
  }

  /**
   * Format date for cookie expiration
   */
  function formatExpirationDate(cookie) {
    if (cookie.session || !cookie.expirationDate) return 'Session';
    const date = new Date(cookie.expirationDate * 1000);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function init(domElements, showStatus) {
    elements = { ...elements, ...domElements };
    showStatusFn = showStatus;
    setupListeners();
  }

  // ============================================================================
  // DATA POPULATION
  // ============================================================================

  function populate(data) {
    if (!elements.domainsPageList) return;

    const cookiesArray = Array.isArray(data?.cookies)
      ? data.cookies
      : data?.cookies?.cookies;

    if (!cookiesArray || cookiesArray.length === 0) {
      elements.domainsPageList.innerHTML = '<p class="no-data">No cookies found</p>';
      updateStats(0, 0, 0);
      if (elements.domainPagination) elements.domainPagination.style.display = 'none';
      return;
    }

    // Group cookies by company
    const companyMap = new Map();
    const allDomains = new Set();

    cookiesArray.forEach(cookie => {
      const domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
      allDomains.add(domain);

      // Try to find company
      const companyInfo = getCompanyFromDomain(domain);
      let companyName, category, description, risk;

      if (companyInfo) {
        companyName = companyInfo.name;
        category = companyInfo.category;
        description = companyInfo.description;
        risk = companyInfo.risk;
      } else {
        // Fallback to domain-based grouping for unknown domains
        companyName = domain;
        category = getCategoryFromCookie(cookie.name, domain);
        description = 'Unknown tracker';
        risk = category === 'fingerprinting' ? 'critical' :
               category === 'advertising' ? 'high' :
               category === 'analytics' || category === 'social' ? 'medium' : 'low';
      }

      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, {
          name: companyName,
          category,
          description,
          risk,
          domains: new Set(),
          cookies: [],
          cookieCount: 0,
          isKnownCompany: !!companyInfo
        });
      }

      const company = companyMap.get(companyName);
      company.domains.add(domain);
      company.cookies.push(cookie);
      company.cookieCount++;
    });

    // Convert to array and sort
    state.allCompanies = Array.from(companyMap.values()).map(c => ({
      ...c,
      domains: Array.from(c.domains),
      domainCount: c.domains.size
    }));

    // Sort: known companies first, then by cookie count
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    state.allCompanies.sort((a, b) => {
      // Known companies first
      if (a.isKnownCompany !== b.isKnownCompany) return b.isKnownCompany ? 1 : -1;
      // Then by risk
      const riskDiff = riskOrder[a.risk] - riskOrder[b.risk];
      if (riskDiff !== 0) return riskDiff;
      // Then by cookie count
      return b.cookieCount - a.cookieCount;
    });

    // Calculate stats
    state.totalDomains = allDomains.size;
    const highRiskCount = state.allCompanies.filter(c => c.risk === 'high' || c.risk === 'critical').length;

    updateStats(allDomains.size, state.allCompanies.length, highRiskCount);

    // Reset state
    state.currentPage = 1;
    state.searchTerm = '';
    state.riskFilter = 'all';
    state.expandedCompanies = new Set();

    if (elements.domainSearchInput) elements.domainSearchInput.value = '';
    if (elements.domainRiskFilter) elements.domainRiskFilter.value = 'all';

    filterAndRender();
  }

  function updateStats(domains, companies, highRisk) {
    if (elements.domainsPageTotal) elements.domainsPageTotal.textContent = domains;
    if (elements.domainsCompanies) elements.domainsCompanies.textContent = companies;
    if (elements.domainsHighRisk) elements.domainsHighRisk.textContent = highRisk;
  }

  // ============================================================================
  // FILTERING AND RENDERING
  // ============================================================================

  function filterAndRender() {
    let filtered = state.allCompanies;

    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.domains.some(d => d.toLowerCase().includes(term))
      );
    }

    if (state.riskFilter !== 'all') {
      filtered = filtered.filter(c => c.risk === state.riskFilter);
    }

    state.filteredCompanies = filtered;

    // Update counts
    if (elements.domainsFiltered) elements.domainsFiltered.textContent = filtered.length;
    if (elements.domainsTotalCount) elements.domainsTotalCount.textContent = state.allCompanies.length;

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.itemsPerPage));
    if (state.currentPage > totalPages) state.currentPage = totalPages;

    if (elements.domainPagination) {
      elements.domainPagination.style.display = totalPages > 1 ? 'flex' : 'none';
    }
    if (elements.domainCurrentPage) elements.domainCurrentPage.textContent = state.currentPage;
    if (elements.domainTotalPages) elements.domainTotalPages.textContent = totalPages;
    if (elements.domainPrevPage) elements.domainPrevPage.disabled = state.currentPage <= 1;
    if (elements.domainNextPage) elements.domainNextPage.disabled = state.currentPage >= totalPages;

    const startIdx = (state.currentPage - 1) * state.itemsPerPage;
    const pageItems = filtered.slice(startIdx, startIdx + state.itemsPerPage);

    renderCompanyList(pageItems);
  }

  // ============================================================================
  // RENDER COMPANY CARDS (Web App Style)
  // ============================================================================

  function renderCompanyList(companies) {
    if (!elements.domainsPageList) return;

    if (companies.length === 0) {
      elements.domainsPageList.innerHTML = '<p class="no-data">No companies match your filters</p>';
      return;
    }

    elements.domainsPageList.innerHTML = companies.map((company, index) => {
      const isExpanded = state.expandedCompanies.has(company.name);
      const categoryColor = CATEGORY_COLORS[company.category] || CATEGORY_COLORS.unknown;
      const companyColor = getCompanyColor(index);
      const initial = company.name.charAt(0).toUpperCase();

      // Group cookies by domain for expanded view
      const cookiesByDomain = {};
      company.cookies.forEach(cookie => {
        const domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
        if (!cookiesByDomain[domain]) cookiesByDomain[domain] = [];
        cookiesByDomain[domain].push(cookie);
      });

      return `
        <div class="company-card ${isExpanded ? 'expanded' : ''}"
             data-risk="${company.risk}"
             data-company="${company.name}"
             data-category="${company.category}">
          <div class="company-card-header">
            <!-- Company Initial -->
            <div class="company-initial" style="background: ${companyColor}">
              ${initial}
            </div>

            <!-- Company Info -->
            <div class="company-info">
              <div class="company-name-row">
                <span class="company-name">${company.name}</span>
                <span class="category-badge" style="background: ${categoryColor.bg}; color: ${categoryColor.text}">
                  ${company.category}
                </span>
                <span class="risk-indicator ${company.risk}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  ${company.risk.toUpperCase()}
                </span>
              </div>
              <div class="company-description">${company.description}</div>
              <div class="company-stats-row">
                <span class="company-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                    <path d="M8.5 8.5v.01"></path>
                    <path d="M16 15.5v.01"></path>
                    <path d="M12 12v.01"></path>
                  </svg>
                  <strong>${company.cookieCount}</strong> cookies
                </span>
                <span class="company-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <strong>${company.domainCount}</strong> domains
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="company-actions">
              <button class="company-delete-btn" data-company="${company.name}" title="Delete all cookies from ${company.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <button class="company-expand-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <!-- Expanded Content -->
          <div class="company-card-details">
            <!-- Domains as chips -->
            <div class="domains-section">
              <div class="section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                Domains (${company.domainCount})
              </div>
              <div class="domain-chips">
                ${company.domains.map(d => `<span class="domain-chip">${d}</span>`).join('')}
              </div>
            </div>

            <!-- Cookies by Domain -->
            <div class="cookies-section">
              <div class="section-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                  <path d="M8.5 8.5v.01"></path>
                  <path d="M16 15.5v.01"></path>
                  <path d="M12 12v.01"></path>
                </svg>
                Cookies by Domain
              </div>
              <div class="cookies-by-domain">
                ${Object.entries(cookiesByDomain).map(([domain, cookies]) => `
                  <div class="domain-cookies-group">
                    <div class="domain-cookies-header">
                      <span class="domain-cookies-name">${domain}</span>
                      <span class="domain-cookies-count">${cookies.length} cookies</span>
                    </div>
                    <div class="domain-cookies-list">
                      ${cookies.slice(0, 8).map(c => `
                        <div class="cookie-detail-row">
                          <span class="cookie-detail-name" title="${c.name}">${c.name}</span>
                          <div class="cookie-detail-flags">
                            ${c.secure ? '<span class="cookie-flag secure">Secure</span>' : ''}
                            ${c.httpOnly ? '<span class="cookie-flag httponly">HttpOnly</span>' : ''}
                            <span class="cookie-expiry">${formatExpirationDate(c)}</span>
                          </div>
                        </div>
                      `).join('')}
                      ${cookies.length > 8 ? `<div class="cookies-more">+${cookies.length - 8} more cookies</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  function setupListeners() {
    if (elements.domainSearchInput) {
      elements.domainSearchInput.removeEventListener('input', handleSearch);
      elements.domainSearchInput.addEventListener('input', handleSearch);
    }

    if (elements.domainRiskFilter) {
      elements.domainRiskFilter.removeEventListener('change', handleRiskFilterChange);
      elements.domainRiskFilter.addEventListener('change', handleRiskFilterChange);
    }

    if (elements.domainPrevPage) {
      elements.domainPrevPage.removeEventListener('click', handlePrevPage);
      elements.domainPrevPage.addEventListener('click', handlePrevPage);
    }

    if (elements.domainNextPage) {
      elements.domainNextPage.removeEventListener('click', handleNextPage);
      elements.domainNextPage.addEventListener('click', handleNextPage);
    }

    if (elements.domainsPageList) {
      elements.domainsPageList.removeEventListener('click', handleListClick);
      elements.domainsPageList.addEventListener('click', handleListClick);
    }
  }

  function handleSearch(e) {
    state.searchTerm = e.target.value;
    state.currentPage = 1;
    filterAndRender();
  }

  function handleRiskFilterChange(e) {
    state.riskFilter = e.target.value;
    state.currentPage = 1;
    filterAndRender();
  }

  function handlePrevPage() {
    if (state.currentPage > 1) {
      state.currentPage--;
      filterAndRender();
    }
  }

  function handleNextPage() {
    const totalPages = Math.ceil(state.filteredCompanies.length / state.itemsPerPage);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      filterAndRender();
    }
  }

  function handleListClick(e) {
    // Handle delete button
    if (e.target.closest('.company-delete-btn')) {
      const btn = e.target.closest('.company-delete-btn');
      const companyName = btn.dataset.company;
      deleteCompanyCookies(companyName);
      return;
    }

    // Handle expand/collapse
    const card = e.target.closest('.company-card');
    if (card && !e.target.closest('.company-delete-btn')) {
      const companyName = card.dataset.company;
      if (state.expandedCompanies.has(companyName)) {
        state.expandedCompanies.delete(companyName);
      } else {
        state.expandedCompanies.add(companyName);
      }
      card.classList.toggle('expanded');
    }
  }

  async function deleteCompanyCookies(companyName) {
    const company = state.allCompanies.find(c => c.name === companyName);
    if (!company) return;

    try {
      // Delete cookies for all domains
      for (const domain of company.domains) {
        await chrome.runtime.sendMessage({
          action: 'delete-domain',
          data: { domain }
        });
      }

      if (showStatusFn) {
        showStatusFn(`Deleted ${company.cookieCount} cookies from ${companyName}`, 'success');
      }

      // Remove from state and re-render
      state.allCompanies = state.allCompanies.filter(c => c.name !== companyName);
      state.expandedCompanies.delete(companyName);

      const highRiskCount = state.allCompanies.filter(c => c.risk === 'high' || c.risk === 'critical').length;
      updateStats(state.totalDomains, state.allCompanies.length, highRiskCount);

      filterAndRender();
    } catch (error) {
      debug.error('Error deleting company cookies:', error);
      if (showStatusFn) {
        showStatusFn('Error deleting cookies', 'error');
      }
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  return {
    init,
    populate,
    getState: () => ({ ...state }),
    search: (term) => {
      state.searchTerm = term;
      state.currentPage = 1;
      filterAndRender();
    },
    filterByRisk: (risk) => {
      state.riskFilter = risk;
      state.currentPage = 1;
      filterAndRender();
    },
    nextPage: handleNextPage,
    prevPage: handlePrevPage
  };
})();
