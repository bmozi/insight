/**
 * StorageInsight Main Orchestrator
 * Wires together all modules and handles core functionality
 */
(function() {
  'use strict';

  // ============================================================================
  // STATE
  // ============================================================================

  let currentScanData = null;

  // ============================================================================
  // DOM ELEMENTS
  // ============================================================================

  const elements = {
    // Header
    header: document.querySelector('.header'),

    // Scan controls
    scanBtn: document.getElementById('scanBtn'),
    scanLoader: document.getElementById('scanLoader'),
    statusMessage: document.getElementById('statusMessage'),
    settingsBtn: document.getElementById('settingsBtn'),
    clearTrackingBtn: document.getElementById('clearTrackingBtn'),
    exportBtn: document.getElementById('exportBtn'),

    // Metric elements (main page)
    totalDomainsEl: document.getElementById('totalDomains'),
    totalCookiesEl: document.getElementById('totalCookies'),
    totalStorageEl: document.getElementById('totalStorage'),
    privacyScoreEl: document.getElementById('privacyScore'),
    trackingCookiesEl: document.getElementById('trackingCookies'),

    // Navigation elements
    infoBtn: document.getElementById('infoBtn'),
    logoHome: document.getElementById('logoHome'),
    clearAllTrackingBtn: document.getElementById('clearAllTrackingBtn'),

    // Analysis elements
    analysisSectionEl: document.getElementById('analysisSection'),
    recommendationsEl: document.getElementById('recommendations'),
    highRiskItemsEl: document.getElementById('highRiskItems'),

    // Collapsible section elements
    recommendationsHeader: document.getElementById('recommendationsHeader'),
    recommendationsCard: document.getElementById('recommendationsCard'),
    recommendationsCount: document.getElementById('recommendationsCount'),
    highRiskHeader: document.getElementById('highRiskHeader'),
    highRiskCard: document.getElementById('highRiskCard'),
    highRiskCount: document.getElementById('highRiskCount'),

    // Cookie Browser elements
    cookiesPageTotal: document.getElementById('cookiesPageTotal'),
    cookiesPageFiltered: document.getElementById('cookiesPageFiltered'),
    cookiesPageList: document.getElementById('cookiesPageList'),
    cookieSearchInput: document.getElementById('cookieSearchInput'),
    cookieCategoryFilter: document.getElementById('cookieCategoryFilter'),
    cookiesSelectedCount: document.getElementById('cookiesSelectedCount'),
    cookieBulkActions: document.getElementById('cookieBulkActions'),
    bulkDeleteCookiesBtn: document.getElementById('bulkDeleteCookiesBtn'),
    cookiePagination: document.getElementById('cookiePagination'),
    cookiePrevPage: document.getElementById('cookiePrevPage'),
    cookieNextPage: document.getElementById('cookieNextPage'),
    cookieCurrentPage: document.getElementById('cookieCurrentPage'),
    cookieTotalPages: document.getElementById('cookieTotalPages'),
    cookieSelectAll: document.getElementById('cookieSelectAll'),

    // Domain Explorer elements
    domainsPageTotal: document.getElementById('domainsPageTotal'),
    domainsHighRisk: document.getElementById('domainsHighRisk'),
    domainsCompanies: document.getElementById('domainsCompanies'),
    domainsFiltered: document.getElementById('domainsFiltered'),
    domainsTotalCount: document.getElementById('domainsTotalCount'),
    domainsPageList: document.getElementById('domainsPageList'),
    domainSearchInput: document.getElementById('domainSearchInput'),
    domainRiskFilter: document.getElementById('domainRiskFilter'),
    domainPagination: document.getElementById('domainPagination'),
    domainPrevPage: document.getElementById('domainPrevPage'),
    domainNextPage: document.getElementById('domainNextPage'),
    domainCurrentPage: document.getElementById('domainCurrentPage'),
    domainTotalPages: document.getElementById('domainTotalPages'),

    // Storage Browser elements
    storagePageList: document.getElementById('storagePageList'),
    storageUsedEl: document.getElementById('storageUsed'),
    storageQuotaEl: document.getElementById('storageQuota'),
    quotaProgressFill: document.getElementById('quotaProgressFill'),
    quotaPercentEl: document.getElementById('quotaPercent'),
    localStorageCountEl: document.getElementById('localStorageCount'),
    sessionStorageCountEl: document.getElementById('sessionStorageCount'),
    indexedDBCountEl: document.getElementById('indexedDBCount'),
    storageSearchInput: document.getElementById('storageSearchInput'),
    storageSearchClear: document.getElementById('storageSearchClear'),
    storageSortSelect: document.getElementById('storageSortSelect'),
    storageDomainsCountEl: document.getElementById('storageDomainsCount'),
    storageKeysCountEl: document.getElementById('storageKeysCount'),
    storageTotalSizeEl: document.getElementById('storageTotalSize'),

    // Score Page elements
    scorePageTotal: document.getElementById('scorePageTotal'),
    breakdownList: document.getElementById('breakdownList'),
    recentScansList: document.getElementById('recentScansList'),

    // IDB Browser elements
    idbBrowser: document.getElementById('idbBrowser'),
    idbBackBtn: document.getElementById('idbBackBtn'),
    idbBreadcrumbs: document.getElementById('idbBreadcrumbs'),
    idbContent: document.getElementById('idbContent'),
    idbPagination: document.getElementById('idbPagination'),
    idbPrevPage: document.getElementById('idbPrevPage'),
    idbNextPage: document.getElementById('idbNextPage'),
    idbCurrentPage: document.getElementById('idbCurrentPage'),

    // Tracking Page elements
    trackingPageTotal: document.getElementById('trackingPageTotal'),
    trackingPageList: document.getElementById('trackingPageList'),
    trackingCompaniesTotal: document.getElementById('trackingCompaniesTotal'),

    // Settings Page elements
    settingsAutoScan: document.getElementById('settingsAutoScan'),
    settingsScanFrequency: document.getElementById('settingsScanFrequency'),
    settingsNotifications: document.getElementById('settingsNotifications'),
    settingsPrivacyThreshold: document.getElementById('settingsPrivacyThreshold'),
    settingsDebugMode: document.getElementById('settingsDebugMode'),
    settingsSaveBtn: document.getElementById('settingsSaveBtn'),
    settingsResetBtn: document.getElementById('settingsResetBtn')
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize popup
   */
  async function init() {
    debug.log('🚀 Popup initializing...');

    // Initialize modules with their DOM elements
    initModules();

    // Setup core event listeners
    setupCoreListeners();

    // Setup navigation
    setupNavigation();

    // Setup collapsible sections
    setupCollapsibles();

    // Load score history
    await ScorePage.loadHistory();

    // Load cached data
    await loadCachedData();
  }

  /**
   * Initialize all modules
   */
  function initModules() {
    // Cookie Browser
    CookieBrowser.init({
      cookiesPageTotal: elements.cookiesPageTotal,
      cookiesPageFiltered: elements.cookiesPageFiltered,
      cookiesPageList: elements.cookiesPageList,
      cookieSearchInput: elements.cookieSearchInput,
      cookieCategoryFilter: elements.cookieCategoryFilter,
      cookiesSelectedCount: elements.cookiesSelectedCount,
      cookieBulkActions: elements.cookieBulkActions,
      bulkDeleteCookiesBtn: elements.bulkDeleteCookiesBtn,
      cookiePagination: elements.cookiePagination,
      cookiePrevPage: elements.cookiePrevPage,
      cookieNextPage: elements.cookieNextPage,
      cookieCurrentPage: elements.cookieCurrentPage,
      cookieTotalPages: elements.cookieTotalPages,
      cookieSelectAll: elements.cookieSelectAll
    }, {
      showStatus
    });

    // Domain Explorer
    DomainExplorer.init({
      domainsPageTotal: elements.domainsPageTotal,
      domainsHighRisk: elements.domainsHighRisk,
      domainsCompanies: elements.domainsCompanies,
      domainsFiltered: elements.domainsFiltered,
      domainsTotalCount: elements.domainsTotalCount,
      domainsPageList: elements.domainsPageList,
      domainSearchInput: elements.domainSearchInput,
      domainRiskFilter: elements.domainRiskFilter,
      domainPagination: elements.domainPagination,
      domainPrevPage: elements.domainPrevPage,
      domainNextPage: elements.domainNextPage,
      domainCurrentPage: elements.domainCurrentPage,
      domainTotalPages: elements.domainTotalPages
    }, showStatus);

    // Storage Browser
    StorageBrowser.init({
      storagePageList: elements.storagePageList,
      storageUsedEl: elements.storageUsedEl,
      storageQuotaEl: elements.storageQuotaEl,
      quotaProgressFill: elements.quotaProgressFill,
      quotaPercentEl: elements.quotaPercentEl,
      localStorageCountEl: elements.localStorageCountEl,
      sessionStorageCountEl: elements.sessionStorageCountEl,
      indexedDBCountEl: elements.indexedDBCountEl,
      storageSearchInput: elements.storageSearchInput,
      storageSearchClear: elements.storageSearchClear,
      storageSortSelect: elements.storageSortSelect,
      storageDomainsCountEl: elements.storageDomainsCountEl,
      storageKeysCountEl: elements.storageKeysCountEl,
      storageTotalSizeEl: elements.storageTotalSizeEl,
      idbBrowser: elements.idbBrowser
    }, {
      showStatus,
      onTabChange: handleStorageTabChange
    });

    // Score Page
    ScorePage.init({
      scorePageTotal: elements.scorePageTotal,
      breakdownList: elements.breakdownList,
      recentScansList: elements.recentScansList
    });

    // IDB Browser
    IDBBrowser.init({
      idbBrowser: elements.idbBrowser,
      idbBackBtn: elements.idbBackBtn,
      idbBreadcrumbs: elements.idbBreadcrumbs,
      idbContent: elements.idbContent,
      idbPagination: elements.idbPagination,
      idbPrevPage: elements.idbPrevPage,
      idbNextPage: elements.idbNextPage,
      idbCurrentPage: elements.idbCurrentPage
    }, {
      showStatus,
      getStoragePageState: () => StorageBrowser.getState()
    });
  }

  /**
   * Setup core event listeners
   */
  function setupCoreListeners() {
    if (elements.scanBtn) {
      elements.scanBtn.addEventListener('click', handleScan);
    }
    if (elements.settingsBtn) {
      elements.settingsBtn.addEventListener('click', openSettings);
    }
    if (elements.clearTrackingBtn) {
      elements.clearTrackingBtn.addEventListener('click', handleClearTracking);
    }
    if (elements.exportBtn) {
      elements.exportBtn.addEventListener('click', handleExport);
    }

    // Settings button listeners
    if (elements.settingsSaveBtn) {
      elements.settingsSaveBtn.addEventListener('click', saveSettings);
    }
    if (elements.settingsResetBtn) {
      elements.settingsResetBtn.addEventListener('click', resetSettings);
    }
  }

  /**
   * Setup collapsible sections
   */
  function setupCollapsibles() {
    if (elements.recommendationsHeader && elements.recommendationsCard) {
      setupCollapsible(elements.recommendationsHeader, elements.recommendationsCard);
    }
    if (elements.highRiskHeader && elements.highRiskCard) {
      setupCollapsible(elements.highRiskHeader, elements.highRiskCard);
    }
  }

  /**
   * Setup collapsible section
   */
  function setupCollapsible(header, card) {
    const toggleSection = () => {
      const isExpanded = card.classList.contains('expanded');
      card.classList.toggle('expanded');
      header.setAttribute('aria-expanded', !isExpanded);
    };

    header.addEventListener('click', toggleSection);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSection();
      }
    });
  }

  /**
   * Setup navigation system
   */
  function setupNavigation() {
    // Add click listeners to all elements with data-navigate attribute
    const navigableElements = document.querySelectorAll('[data-navigate]');
    navigableElements.forEach(element => {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = element.dataset.navigate;
        navigateTo(targetPage);
      });

      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const targetPage = element.dataset.navigate;
          navigateTo(targetPage);
        }
      });
    });

    // Info button navigates to learn page
    if (elements.infoBtn) {
      elements.infoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('learn');
      });
    }

    // Logo navigates to main page
    if (elements.logoHome) {
      elements.logoHome.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('main');
      });

      elements.logoHome.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateTo('main');
        }
      });
    }

    // Wire up clear all tracking button on tracking page
    if (elements.clearAllTrackingBtn) {
      elements.clearAllTrackingBtn.addEventListener('click', handleClearTracking);
    }
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Navigate to a specific page
   */
  function navigateTo(pageName) {
    debug.log('🧭 Navigating to:', pageName);

    // Hide/show header - only show on main page
    if (elements.header) {
      elements.header.style.display = pageName === 'main' ? 'flex' : 'none';
    }

    // Hide all pages
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
      page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.querySelector(`.page[data-page="${pageName}"]`);
    if (targetPage) {
      targetPage.classList.add('active');

      // Populate page data when navigating (if we have scan data)
      if (currentScanData) {
        switch (pageName) {
          case 'cookies':
            CookieBrowser.populate(currentScanData);
            break;
          case 'tracking':
            populateTrackingPage(currentScanData);
            break;
          case 'domains':
            DomainExplorer.populate(currentScanData);
            break;
          case 'storage':
            StorageBrowser.populate(currentScanData);
            break;
          case 'score':
            ScorePage.populate(currentScanData);
            break;
        }
      }
    } else {
      debug.warn('⚠️ Page not found:', pageName);
    }
  }

  // ============================================================================
  // SCAN FUNCTIONALITY
  // ============================================================================

  /**
   * Handle scan button click
   */
  async function handleScan() {
    debug.log('🔍 Starting scan...');

    // Show loading state
    elements.scanBtn.style.display = 'none';
    elements.scanLoader.classList.add('active');

    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Scan timed out after 15 seconds')), 15000)
      );

      const scanPromise = chrome.runtime.sendMessage({
        type: 'SCAN_STORAGE'
      });

      // Race between scan and timeout
      const response = await Promise.race([scanPromise, timeoutPromise]);

      if (response.success) {
        debug.log('✅ Scan complete:', response.data);
        currentScanData = response.data;

        // Cache the results
        await chrome.storage.local.set({
          lastScanData: response.data,
          lastScanTime: Date.now()
        });

        // Display results
        displayResults(response.data);

        // Save to score history
        await ScorePage.saveToHistory(response.data);

        // Show success message
        showStatus('Scan complete!', 'success');
      } else {
        throw new Error(response.error || 'Scan failed');
      }
    } catch (error) {
      debug.error('❌ Scan error:', error);
      showStatus('Scan failed: ' + error.message, 'error');
    } finally {
      // Hide loading state
      elements.scanLoader.classList.remove('active');
      elements.scanBtn.style.display = 'flex';
    }
  }

  /**
   * Display scan results on main page and update all modules
   */
  function displayResults(data) {
    // Use pre-computed privacy analysis from service worker
    const privacyAnalysis = data._privacyAnalysis || null;
    debug.log('📊 Privacy Analysis:', privacyAnalysis);

    // Update basic metrics
    elements.totalDomainsEl.textContent = data.uniqueDomains || 0;
    elements.totalCookiesEl.textContent = data.totalCookies || 0;
    elements.trackingCookiesEl.textContent = data.trackingCookies || 0;
    elements.totalStorageEl.textContent = `${data.totalStorageMB || 0} MB`;

    // Display privacy score
    const privacyScore = data.privacyScore || privacyAnalysis?.privacyScore || { score: 0 };
    const scoreValue = typeof privacyScore === 'object' ? privacyScore.score : privacyScore;
    elements.privacyScoreEl.textContent = `${scoreValue}/100`;

    // Update privacy card color based on score
    const privacyCard = document.querySelector('.privacy-card');
    if (privacyCard) {
      privacyCard.classList.remove('score-good', 'score-fair', 'score-poor');

      if (scoreValue >= 70) {
        privacyCard.classList.add('score-good');
      } else if (scoreValue >= 40) {
        privacyCard.classList.add('score-fair');
      } else {
        privacyCard.classList.add('score-poor');
      }
    }

    // Show analysis section if we have privacy analysis
    if (privacyAnalysis && elements.analysisSectionEl) {
      elements.analysisSectionEl.style.display = 'block';

      // Populate recommendations
      populateRecommendations(privacyAnalysis);

      // Populate high-risk items
      populateHighRiskItems(privacyAnalysis);
    }

    // Update module data (only populate when user navigates to those pages)
    // Store current scan data for later use
  }

  /**
   * Populate recommendations section
   */
  function populateRecommendations(privacyAnalysis) {
    const recommendations = privacyAnalysis.recommendations || [];

    if (elements.recommendationsCount) {
      elements.recommendationsCount.textContent = recommendations.length;
    }

    if (elements.recommendationsEl && recommendations.length > 0) {
      elements.recommendationsEl.innerHTML = recommendations
        .slice(0, 5) // Show top 5 recommendations
        .map((rec, index) => {
          const title = typeof rec === 'object' ? rec.title : rec;
          const description = typeof rec === 'object' ? rec.description : '';
          const icon = typeof rec === 'object' ? (rec.icon || '💡') : '💡';
          const severity = typeof rec === 'object' ? (rec.severity || 'medium') : 'medium';
          const action = typeof rec === 'object' ? rec.action : null;
          const items = typeof rec === 'object' ? rec.items : null;

          // Generate expandable details if items exist
          const detailsHtml = items && items.length > 0 ? `
            <details class="rec-details-accordion">
              <summary class="rec-details-summary">View ${items.length} item${items.length !== 1 ? 's' : ''}</summary>
              <div class="rec-details-body">
                ${items.slice(0, 8).map(item => {
                  const name = item.name || item.domain || item.key || 'Unknown';
                  const domain = item.domain || '';
                  return `<div class="rec-detail-row">
                    <span class="detail-name" title="${name}">${name}</span>
                    ${domain && domain !== name ? `<span class="detail-domain">${domain}</span>` : ''}
                  </div>`;
                }).join('')}
                ${items.length > 8 ? `<div class="rec-detail-more">...and ${items.length - 8} more</div>` : ''}
              </div>
            </details>
          ` : '';

          return `
            <div class="recommendation-item ${severity}">
              <div class="recommendation-badge">${index + 1}</div>
              <div class="recommendation-content">
                <div class="recommendation-header">
                  <span class="recommendation-title">${title}</span>
                  ${action ? `<button class="recommendation-action-btn" data-action="${action}">Fix</button>` : ''}
                </div>
                ${description ? `<p class="recommendation-desc">${description}</p>` : ''}
                ${detailsHtml}
              </div>
            </div>
          `;
        })
        .join('');

      // Attach event listeners to action buttons
      elements.recommendationsEl.querySelectorAll('.recommendation-action-btn').forEach(btn => {
        btn.addEventListener('click', handleRecommendationAction);
      });

      // Auto-expand if there are recommendations
      if (elements.recommendationsCard) {
        elements.recommendationsCard.classList.add('expanded');
      }
      if (elements.recommendationsHeader) {
        elements.recommendationsHeader.setAttribute('aria-expanded', 'true');
      }
    } else if (elements.recommendationsEl) {
      elements.recommendationsEl.innerHTML = '<p class="no-data">No recommendations - your privacy looks good! 🎉</p>';
      if (elements.recommendationsCard) {
        elements.recommendationsCard.classList.remove('expanded');
      }
      if (elements.recommendationsHeader) {
        elements.recommendationsHeader.setAttribute('aria-expanded', 'false');
      }
    }
  }

  /**
   * Populate high-risk items section
   */
  function populateHighRiskItems(privacyAnalysis) {
    const highRiskItems = privacyAnalysis.highRiskItems || [];

    if (elements.highRiskCount) {
      elements.highRiskCount.textContent = highRiskItems.length;
    }

    if (elements.highRiskItemsEl && highRiskItems.length > 0) {
      elements.highRiskItemsEl.innerHTML = highRiskItems
        .map(item => {
          const severityClass = item.severity || 'medium';
          const severityIcon = item.severity === 'critical' ? '🔴' : '⚠️';

          // Map item types to actions
          const actionMap = {
            'fingerprinting': 'CLEAR_FINGERPRINTING',
            'cross_site_tracking': 'CLEAR_TRACKING',
            'large_storage': 'CLEAR_LOCALSTORAGE',
            'insecure_sensitive': 'CLEAR_INSECURE'
          };

          const action = item.type ? actionMap[item.type] : null;
          const actionLabel = action === 'CLEAR_LOCALSTORAGE' ? 'Clear' :
            action === 'CLEAR_FINGERPRINTING' ? 'Remove' :
              action === 'CLEAR_TRACKING' ? 'Clear' :
                action === 'CLEAR_INSECURE' ? 'Clear' : 'Fix';

          // Format individual items for expandable details
          const detailsHtml = item.items && item.items.length > 0 ? `
            <details class="risk-details-accordion">
              <summary class="risk-details-summary">View ${item.items.length} detected item${item.items.length !== 1 ? 's' : ''}</summary>
              <div class="risk-details-body">
                ${item.items.slice(0, 10).map(detail => {
                  const name = detail.name || detail.domain || detail.key || 'Unknown';
                  const domain = detail.domain || '';
                  const size = detail.size ? StorageInsightUtils.formatBytes(detail.size) : '';
                  return `<div class="risk-detail-row">
                    <span class="detail-name" title="${name}">${name}</span>
                    ${domain && domain !== name ? `<span class="detail-domain">${domain}</span>` : ''}
                    ${size ? `<span class="detail-size">${size}</span>` : ''}
                  </div>`;
                }).join('')}
                ${item.items.length > 10 ? `<div class="risk-detail-more">...and ${item.items.length - 10} more</div>` : ''}
              </div>
            </details>
          ` : '';

          return `
            <div class="high-risk-item ${severityClass}">
              <div class="risk-header">
                <span class="risk-icon">${severityIcon}</span>
                <strong>${item.title}</strong>
                ${action ? `<button class="high-risk-action-btn" data-action="${action}">${actionLabel}</button>` : ''}
              </div>
              <p class="risk-description">${item.description}</p>
              ${detailsHtml}
            </div>
          `;
        })
        .join('');

      // Attach event listeners to high-risk action buttons
      elements.highRiskItemsEl.querySelectorAll('.high-risk-action-btn').forEach(btn => {
        btn.addEventListener('click', handleHighRiskAction);
      });

      // Auto-expand if there are high-risk items
      if (elements.highRiskCard) {
        elements.highRiskCard.classList.add('expanded');
      }
      if (elements.highRiskHeader) {
        elements.highRiskHeader.setAttribute('aria-expanded', 'true');
      }
    } else if (elements.highRiskItemsEl) {
      elements.highRiskItemsEl.innerHTML = '<p class="no-data">No high-risk items detected ✅</p>';
      if (elements.highRiskCard) {
        elements.highRiskCard.classList.remove('expanded');
      }
      if (elements.highRiskHeader) {
        elements.highRiskHeader.setAttribute('aria-expanded', 'false');
      }
    }
  }

  /**
   * Handle recommendation action button click
   */
  async function handleRecommendationAction(event) {
    const action = event.target.dataset.action;
    debug.log('🎯 Executing recommendation action:', action);

    if (!action) return;

    // Map actions to message types
    const actionMap = {
      'clear_advertising': { type: 'CLEAR_ADVERTISING', confirmMsg: 'Clear all advertising cookies?' },
      'block_fingerprinting': { type: 'CLEAR_FINGERPRINTING', confirmMsg: 'Clear all fingerprinting trackers?' },
      'remove_facebook_tracking': { type: 'CLEAR_FACEBOOK', confirmMsg: 'Remove Facebook tracking cookies?' },
      'clear_analytics': { type: 'CLEAR_ANALYTICS', confirmMsg: 'Clear all analytics cookies?' },
      'clear_long_lived': { type: 'CLEAR_LONG_LIVED', confirmMsg: 'Clear long-lived tracking cookies?' },
      'clear_insecure': { type: 'CLEAR_INSECURE', confirmMsg: 'Clear insecure cookies?' }
    };

    const actionData = actionMap[action];
    if (!actionData) {
      debug.warn('Unknown action:', action);
      return;
    }

    if (!confirm(actionData.confirmMsg)) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({ type: actionData.type });

      if (response.success) {
        const count = response.data?.removedCount || 0;
        showStatus(`Removed ${count} item${count !== 1 ? 's' : ''}`, 'success');

        // Refresh data after a short delay
        setTimeout(handleScan, 500);
      } else {
        throw new Error(response.error || 'Action failed');
      }
    } catch (error) {
      debug.error('❌ Action error:', error);
      showStatus('Action failed: ' + error.message, 'error');
    }
  }

  /**
   * Handle high-risk action button click
   */
  async function handleHighRiskAction(event) {
    const action = event.target.dataset.action;
    debug.log('🎯 Executing high-risk action:', action);

    if (!action) return;

    // Map actions to confirmation messages
    const confirmMap = {
      'CLEAR_FINGERPRINTING': 'Remove all fingerprinting trackers? This cannot be undone.',
      'CLEAR_TRACKING': 'Clear all cross-site tracking cookies? This cannot be undone.',
      'CLEAR_LOCALSTORAGE': 'Clear excessive localStorage data? This cannot be undone.',
      'CLEAR_INSECURE': 'Clear insecure cookies on sensitive domains? This cannot be undone.'
    };

    const confirmMsg = confirmMap[action];
    if (!confirmMsg) {
      debug.warn('⚠️ Unknown action:', action);
      return;
    }

    // Confirm action
    if (!confirm(confirmMsg)) {
      return;
    }

    // Disable button and show loading
    event.target.disabled = true;
    const originalText = event.target.textContent;
    event.target.textContent = 'Processing...';

    try {
      const response = await chrome.runtime.sendMessage({
        type: action
      });

      if (response.success) {
        const count = response.data?.removedCount || 0;
        debug.log(`✅ Action complete: ${count} items removed`);
        showStatus(`Success! Removed ${count} item${count !== 1 ? 's' : ''}`, 'success');

        // Refresh data after a short delay
        setTimeout(handleScan, 500);
      } else {
        throw new Error(response.error || 'Action failed');
      }
    } catch (error) {
      debug.error('❌ Action error:', error);
      showStatus('Action failed: ' + error.message, 'error');

      // Re-enable button
      event.target.disabled = false;
      event.target.textContent = originalText;
    }
  }

  // ============================================================================
  // TRACKING PAGE
  // ============================================================================

  /**
   * Populate tracking page with tracking companies
   */
  function populateTrackingPage(data) {
    if (!elements.trackingPageList) return;

    const trackingCount = data.trackingCookies || 0;
    if (elements.trackingPageTotal) {
      elements.trackingPageTotal.textContent = trackingCount;
    }

    // Get tracking companies from privacy analysis or compute them
    const privacyAnalysis = data._privacyAnalysis || data.privacyAnalysis;
    const companies = privacyAnalysis?.trackerCompanies || computeTrackerCompanies(data);

    // Update companies count
    if (elements.trackingCompaniesTotal) {
      elements.trackingCompaniesTotal.textContent = companies.length;
    }

    if (companies.length === 0) {
      elements.trackingPageList.innerHTML = '<div class="no-data">No tracking companies detected</div>';
      return;
    }

    // Render tracking companies
    elements.trackingPageList.innerHTML = companies
      .sort((a, b) => b.cookieCount - a.cookieCount)
      .map(company => {
        const riskClass = company.risk === 'critical' ? 'critical' :
          company.risk === 'high' ? 'high' : 'medium';
        const categoryLabel = company.category || 'Tracking';
        const categoryClass = categoryLabel.toLowerCase().replace(/\s+/g, '-');

        return `
          <div class="tracker-company ${riskClass}" data-category="${categoryLabel.toLowerCase()}">
            <div class="tracker-header">
              <div class="tracker-info">
                <span class="tracker-initial">${company.name.charAt(0).toUpperCase()}</span>
                <div class="tracker-details">
                  <strong class="tracker-name">${company.name}</strong>
                  <span class="tracker-category ${categoryClass}">${categoryLabel}</span>
                </div>
              </div>
              <div class="tracker-stats">
                <span class="tracker-count">${company.cookieCount} cookie${company.cookieCount !== 1 ? 's' : ''}</span>
                <button class="tracker-delete-btn" data-company="${company.name}" data-domains="${company.domains.join(',')}" title="Delete all cookies from ${company.name}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="tracker-domains">
              ${company.domains.slice(0, 3).map(d => `<span class="tracker-domain">${d}</span>`).join('')}
              ${company.domains.length > 3 ? `<span class="tracker-domain-more">+${company.domains.length - 3} more</span>` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    // Attach delete button listeners
    elements.trackingPageList.querySelectorAll('.tracker-delete-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteCompanyTrackers);
    });
  }

  /**
   * Compute tracker companies from scan data
   */
  function computeTrackerCompanies(scanData) {
    if (!scanData?.cookies?.cookies) return [];

    const companyMap = new Map();
    const cookies = scanData.cookies.cookies;

    // Known company patterns
    const companyPatterns = {
      'Google': [/google/, /doubleclick/, /googlesyndication/, /googleadservices/, /gstatic/, /youtube/],
      'Meta': [/facebook/, /fb\./, /fbcdn/, /instagram/],
      'Microsoft': [/microsoft/, /bing/, /msn/, /live\.com/, /outlook/],
      'Amazon': [/amazon/, /amazonaws/],
      'X (Twitter)': [/twitter/, /twimg/, /x\.com/],
      'Adobe': [/adobe/, /omtrdc/, /demdex/],
      'Oracle': [/bluekai/, /addthis/],
      'Criteo': [/criteo/],
      'LinkedIn': [/linkedin/],
      'TikTok': [/tiktok/, /bytedance/],
      'Pinterest': [/pinterest/],
      'Snapchat': [/snapchat/, /snap\./, /sc-static/],
      'Yahoo': [/yahoo/],
      'Quantcast': [/quantcast/, /quantserve/],
      'Hotjar': [/hotjar/],
      'Mixpanel': [/mixpanel/, /mxpnl/],
      'Segment': [/segment/],
      'HubSpot': [/hubspot/, /hs-analytics/],
      'Salesforce': [/salesforce/, /pardot/, /exacttarget/],
    };

    cookies.forEach(cookie => {
      const domain = cookie.domain.toLowerCase();

      for (const [company, patterns] of Object.entries(companyPatterns)) {
        if (patterns.some(p => p.test(domain))) {
          if (!companyMap.has(company)) {
            companyMap.set(company, {
              name: company,
              domains: [],
              cookieCount: 0,
              category: getCompanyCategory(company),
              risk: getCompanyRisk(company)
            });
          }
          const companyData = companyMap.get(company);
          if (!companyData.domains.includes(cookie.domain)) {
            companyData.domains.push(cookie.domain);
          }
          companyData.cookieCount++;
          break; // Only count once per cookie
        }
      }
    });

    return Array.from(companyMap.values());
  }

  /**
   * Get company category
   */
  function getCompanyCategory(company) {
    const categories = {
      'Google': 'Analytics',
      'Meta': 'Social',
      'Microsoft': 'Advertising',
      'Amazon': 'Advertising',
      'X (Twitter)': 'Social',
      'Adobe': 'Analytics',
      'Oracle': 'Advertising',
      'Criteo': 'Advertising',
      'LinkedIn': 'Social',
      'TikTok': 'Social',
      'Pinterest': 'Social',
      'Snapchat': 'Social',
      'Yahoo': 'Advertising',
      'Quantcast': 'Analytics',
      'Hotjar': 'Analytics',
      'Mixpanel': 'Analytics',
      'Segment': 'Analytics',
      'HubSpot': 'Analytics',
      'Salesforce': 'Advertising',
    };
    return categories[company] || 'Tracking';
  }

  /**
   * Get company risk level
   */
  function getCompanyRisk(company) {
    const highRisk = ['Criteo', 'Oracle', 'Quantcast'];
    const criticalRisk = [];
    if (criticalRisk.includes(company)) return 'critical';
    if (highRisk.includes(company)) return 'high';
    return 'medium';
  }

  /**
   * Handle delete company trackers button click
   */
  async function handleDeleteCompanyTrackers(event) {
    const btn = event.currentTarget;
    const company = btn.dataset.company;
    const domains = btn.dataset.domains.split(',').filter(d => d);

    if (!company || domains.length === 0) return;

    if (!confirm(`Delete all cookies from ${company}? This will remove cookies from ${domains.length} domain${domains.length !== 1 ? 's' : ''}.`)) {
      return;
    }

    // Disable button and show loading
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-small"></span>';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CLEAR_COMPANY_COOKIES',
        data: { company, domains }
      });

      if (response.success) {
        const count = response.data?.removedCount || 0;
        showStatus(`Removed ${count} cookie${count !== 1 ? 's' : ''} from ${company}`, 'success');

        // Refresh data after a short delay
        setTimeout(handleScan, 500);
      } else {
        throw new Error(response.error || 'Failed to delete cookies');
      }
    } catch (error) {
      debug.error('❌ Delete company cookies error:', error);
      showStatus('Failed to delete cookies: ' + error.message, 'error');

      // Re-enable button
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>`;
    }
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Handle clear tracking button click
   */
  async function handleClearTracking() {
    if (!confirm('Are you sure you want to clear all tracking cookies? This cannot be undone.')) {
      return;
    }

    debug.log('🗑️ Clearing tracking cookies...');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CLEAR_TRACKING'
      });

      if (response.success) {
        const count = response.data.removedCount;
        debug.log(`✅ Removed ${count} tracking cookies`);
        showStatus(`Removed ${count} tracking cookie${count !== 1 ? 's' : ''}`, 'success');

        // Refresh data after a short delay
        setTimeout(handleScan, 500);
      } else {
        throw new Error(response.error || 'Failed to clear tracking cookies');
      }
    } catch (error) {
      debug.error('❌ Clear tracking error:', error);
      showStatus('Failed to clear tracking cookies', 'error');
    }
  }

  /**
   * Handle export button click
   */
  async function handleExport() {
    debug.log('📤 Exporting data...');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXPORT_DATA'
      });

      if (response.success) {
        // Create downloadable JSON file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        // Create temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `storageinsight-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Clean up
        URL.revokeObjectURL(url);

        showStatus('Data exported successfully', 'success');
      } else {
        throw new Error(response.error || 'Export failed');
      }
    } catch (error) {
      debug.error('❌ Export error:', error);
      showStatus('Export failed: ' + error.message, 'error');
    }
  }

  /**
   * Open settings page
   */
  function openSettings() {
    loadSettings();
    navigateTo('settings');
  }

  // Default settings (matches options.js)
  const defaultSettings = {
    scanFrequency: 'manual',
    autoScanEnabled: false,
    notifications: true,
    privacyThreshold: 70
  };

  /**
   * Load settings from storage
   */
  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get('settings');
      const settings = { ...defaultSettings, ...(result.settings || {}) };

      debug.log('Settings loaded:', settings);

      if (elements.settingsAutoScan) {
        elements.settingsAutoScan.checked = settings.autoScanEnabled;
      }
      if (elements.settingsScanFrequency) {
        // Ensure value exists in dropdown, fallback to 'manual'
        const validValues = ['manual', 'daily', 'weekly'];
        const freq = validValues.includes(settings.scanFrequency) ? settings.scanFrequency : 'manual';
        elements.settingsScanFrequency.value = freq;
      }
      if (elements.settingsNotifications) {
        elements.settingsNotifications.checked = settings.notifications;
      }
      if (elements.settingsPrivacyThreshold) {
        elements.settingsPrivacyThreshold.value = settings.privacyThreshold.toString();
      }
      if (elements.settingsDebugMode) {
        elements.settingsDebugMode.checked = settings.debugMode || false;
      }
    } catch (error) {
      debug.error('Error loading settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  async function saveSettings() {
    try {
      const settings = {
        autoScanEnabled: elements.settingsAutoScan?.checked ?? false,
        scanFrequency: elements.settingsScanFrequency?.value ?? 'manual',
        notifications: elements.settingsNotifications?.checked ?? true,
        privacyThreshold: parseInt(elements.settingsPrivacyThreshold?.value ?? '70', 10),
        debugMode: elements.settingsDebugMode?.checked ?? false
      };

      // Also save debugMode separately for the debug utility
      await chrome.storage.local.set({ debugMode: settings.debugMode });

      // Save to storage
      await chrome.storage.local.set({ settings });

      // Send message to background script to update
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        data: settings
      });

      debug.log('Settings saved:', settings);
      showStatus('Settings saved', 'success');
      navigateTo('main');
    } catch (error) {
      debug.error('Error saving settings:', error);
      showStatus('Failed to save settings', 'error');
    }
  }

  /**
   * Reset settings to defaults
   */
  async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    try {
      await chrome.storage.local.set({ settings: defaultSettings });

      // Reload the form with defaults
      if (elements.settingsAutoScan) elements.settingsAutoScan.checked = defaultSettings.autoScanEnabled;
      if (elements.settingsScanFrequency) elements.settingsScanFrequency.value = defaultSettings.scanFrequency;
      if (elements.settingsNotifications) elements.settingsNotifications.checked = defaultSettings.notifications;
      if (elements.settingsPrivacyThreshold) elements.settingsPrivacyThreshold.value = defaultSettings.privacyThreshold.toString();
      if (elements.settingsDebugMode) elements.settingsDebugMode.checked = false;

      // Also reset debugMode separately
      await chrome.storage.local.set({ debugMode: false });

      debug.log('Settings reset to defaults');
      showStatus('Settings reset to defaults', 'success');
    } catch (error) {
      debug.error('Error resetting settings:', error);
      showStatus('Failed to reset settings', 'error');
    }
  }

  /**
   * Show status message
   */
  function showStatus(message, type = 'info') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message show ${type}`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
      elements.statusMessage.classList.remove('show');
    }, 3000);
  }

  // ============================================================================
  // STORAGE TAB CHANGE HANDLER
  // ============================================================================

  /**
   * Handle storage tab change (for IDB browser integration)
   */
  function handleStorageTabChange(tab) {
    if (tab === 'indexedDB') {
      // When switching to IndexedDB tab, load databases in IDB browser
      IDBBrowser.loadDatabases();
    }
  }

  // ============================================================================
  // CACHED DATA
  // ============================================================================

  /**
   * Load cached scan data if available
   */
  async function loadCachedData() {
    try {
      const result = await chrome.storage.local.get(['lastScanData', 'lastScanTime']);

      if (result.lastScanData && result.lastScanTime) {
        // Always show cached data immediately
        debug.log('📦 Loading cached scan data from:', new Date(result.lastScanTime).toLocaleString());
        currentScanData = result.lastScanData;
        displayResults(result.lastScanData);

        // Show how old the data is
        const timeDiff = Date.now() - result.lastScanTime;
        const minutes = Math.floor(timeDiff / 60000);
        if (minutes > 0) {
          showStatus(`Data from ${minutes} min${minutes !== 1 ? 's' : ''} ago`, 'info');
        }
      }
    } catch (error) {
      debug.error('Error loading cached data:', error);
    }
  }

  // ============================================================================
  // START
  // ============================================================================

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
