/**
 * StorageInsight Cookie Browser Module
 * Handles cookie viewing, filtering, searching, and deletion
 */
const CookieBrowser = (function() {
  // Private state
  let state = {
    allCookies: [],
    filteredCookies: [],
    selectedCookies: new Set(),
    currentPage: 1,
    itemsPerPage: 20,
    searchTerm: '',
    categoryFilter: 'all'
  };

  // DOM element references (will be set on init)
  let elements = {};

  // Callback for showing status messages
  let showStatusCallback = null;

  // Tracking patterns for cookie categorization
  const trackingPatterns = {
    analytics: ['google-analytics', 'hotjar', 'mixpanel', 'segment', 'amplitude', '_ga', '_gid', '_gat', '_hjid', 'mp_', 'ajs_', 'amp_', '_pk_'],
    advertising: ['doubleclick', 'googlesyndication', 'criteo', 'outbrain', 'taboola', '_fbp', 'ads', '_cc_', 'cto_', '__qca', 'IDE', 'DSID'],
    social: ['facebook', 'twitter', 'linkedin', 'pinterest', 'instagram', 'tiktok', '_fbc', 'fr', 'datr', '_twitter_sess', 'personalization_id', '_rdt_', '_scid'],
    fingerprinting: ['fingerprint', 'datadome', 'deviceatlas', 'threatmetrix', '_fpjs', '_px', 'datadome'],
    essential: ['session', 'csrf', 'xsrf', 'auth', 'login', '__cf', 'cf_', '__stripe', 'cloudflare'],
  };

  /**
   * Categorize a cookie based on name and domain patterns
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

  /**
   * Format cookie expiration date
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

  /**
   * Get unique cookie ID
   */
  function getCookieId(cookie) {
    return `${cookie.name}_${cookie.domain}_${cookie.path || '/'}`;
  }

  /**
   * Initialize cookie browser with DOM elements and callbacks
   */
  function init(domElements, callbacks = {}) {
    elements = domElements;
    showStatusCallback = callbacks.showStatus || null;
    setupListeners();
  }

  /**
   * Initialize cookie browser with data
   */
  function populate(data) {
    if (!elements.cookiesPageTotal || !elements.cookiesPageList) return;

    const totalCookies = data.totalCookies || 0;
    if (elements.cookiesPageTotal) elements.cookiesPageTotal.textContent = totalCookies;

    // Get cookies array - handle both data structures
    const cookiesArray = Array.isArray(data?.cookies)
      ? data.cookies
      : data?.cookies?.cookies;

    if (!cookiesArray || cookiesArray.length === 0) {
      elements.cookiesPageList.innerHTML = '<p class="no-data">No cookies found</p>';
      if (elements.cookiesPageFiltered) elements.cookiesPageFiltered.textContent = '0';
      if (elements.cookiePagination) elements.cookiePagination.style.display = 'none';
      return;
    }

    // Enhance cookies with categorization
    state.allCookies = cookiesArray.map(cookie => ({
      ...cookie,
      category: categorizeCookie(cookie.name, cookie.domain),
      id: getCookieId(cookie)
    }));

    // Reset state
    state.selectedCookies = new Set();
    state.currentPage = 1;
    state.searchTerm = '';
    state.categoryFilter = 'all';

    // Reset inputs
    if (elements.cookieSearchInput) elements.cookieSearchInput.value = '';
    if (elements.cookieCategoryFilter) elements.cookieCategoryFilter.value = 'all';

    // Apply filters and render
    filterAndRender();
  }

  /**
   * Filter cookies and render the list
   */
  function filterAndRender() {
    const { allCookies, searchTerm, categoryFilter, currentPage, itemsPerPage } = state;

    // Filter cookies
    let filtered = allCookies;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.domain.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    // Sort by domain then name
    filtered.sort((a, b) => {
      const domainCompare = a.domain.localeCompare(b.domain);
      if (domainCompare !== 0) return domainCompare;
      return a.name.localeCompare(b.name);
    });

    state.filteredCookies = filtered;

    // Update counts
    if (elements.cookiesPageFiltered) elements.cookiesPageFiltered.textContent = filtered.length;

    // Update selection count
    updateSelectionUI();

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    if (currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    // Update pagination UI
    if (elements.cookiePagination) {
      elements.cookiePagination.style.display = totalPages > 1 ? 'flex' : 'none';
    }
    if (elements.cookieCurrentPage) elements.cookieCurrentPage.textContent = state.currentPage;
    if (elements.cookieTotalPages) elements.cookieTotalPages.textContent = totalPages;
    if (elements.cookiePrevPage) elements.cookiePrevPage.disabled = state.currentPage <= 1;
    if (elements.cookieNextPage) elements.cookieNextPage.disabled = state.currentPage >= totalPages;

    // Get current page items
    const startIdx = (state.currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(startIdx, startIdx + itemsPerPage);

    // Render cookie list
    renderList(pageItems);

    // Update select-all checkbox state
    updateSelectAllState();
  }

  /**
   * Render the cookie list
   */
  function renderList(cookies) {
    if (!elements.cookiesPageList) return;

    if (cookies.length === 0) {
      elements.cookiesPageList.innerHTML = '<p class="no-data">No cookies match your filters</p>';
      return;
    }

    elements.cookiesPageList.innerHTML = cookies.map(cookie => {
      const isSelected = state.selectedCookies.has(cookie.id);
      const categoryClass = cookie.category;
      const expiration = formatExpiration(cookie);

      return `
      <div class="cookie-row ${isSelected ? 'selected' : ''}" data-category="${categoryClass}" data-cookie-id="${cookie.id}">
        <div class="cookie-row-main">
          <div class="cookie-col cookie-col-check">
            <input type="checkbox" class="cookie-checkbox" ${isSelected ? 'checked' : ''} data-cookie-id="${cookie.id}" />
          </div>
          <div class="cookie-col cookie-col-name" data-cookie-id="${cookie.id}">
            <span class="cookie-name-text" title="${cookie.name}">${cookie.name}</span>
          </div>
          <div class="cookie-col cookie-col-domain">
            <span class="cookie-domain-text" title="${cookie.domain}">${cookie.domain}</span>
          </div>
          <div class="cookie-col cookie-col-category">
            <span class="cookie-category-badge ${categoryClass}">${categoryClass}</span>
          </div>
          <div class="cookie-col cookie-col-expires">${expiration}</div>
          <div class="cookie-col cookie-col-secure">
            ${cookie.secure
              ? '<svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
              : '<svg class="icon-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
            }
          </div>
          <div class="cookie-col cookie-col-httponly">
            ${cookie.httpOnly
              ? '<svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
              : '<svg class="icon-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
            }
          </div>
          <div class="cookie-col cookie-col-actions">
            <button class="cookie-delete-btn" data-cookie-name="${cookie.name}" data-cookie-domain="${cookie.domain}" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="cookie-row-details">
          <div class="cookie-details-grid">
            <div class="cookie-detail-item">
              <span class="cookie-detail-label">Path</span>
              <span class="cookie-detail-value">${cookie.path || '/'}</span>
            </div>
            <div class="cookie-detail-item">
              <span class="cookie-detail-label">SameSite</span>
              <span class="cookie-detail-value">${cookie.sameSite || 'unspecified'}</span>
            </div>
            <div class="cookie-detail-item">
              <span class="cookie-detail-label">Host Only</span>
              <span class="cookie-detail-value">${cookie.hostOnly ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div class="cookie-value-section">
            <div class="cookie-value-header">
              <span class="cookie-detail-label">Value</span>
              <button class="cookie-value-toggle">
                <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Show</span>
              </button>
            </div>
            <div class="cookie-value-content">
              <code class="cookie-value-text" data-hidden="true">••••••••••••</code>
            </div>
          </div>
        </div>
      </div>
    `;
    }).join('');

    // Store cookie values for reveal functionality
    elements.cookiesPageList.querySelectorAll('.cookie-row').forEach((item, index) => {
      const cookie = cookies[index];
      item.dataset.cookieValue = cookie.value || '';
    });
  }

  /**
   * Update selection UI
   */
  function updateSelectionUI() {
    const count = state.selectedCookies.size;

    if (elements.cookiesSelectedCount) {
      elements.cookiesSelectedCount.textContent = `${count} selected`;
      elements.cookiesSelectedCount.style.display = count > 0 ? 'inline' : 'none';
    }

    if (elements.cookieBulkActions) {
      elements.cookieBulkActions.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  /**
   * Setup cookie browser event listeners
   */
  function setupListeners() {
    // Search input
    if (elements.cookieSearchInput) {
      elements.cookieSearchInput.removeEventListener('input', handleSearch);
      elements.cookieSearchInput.addEventListener('input', handleSearch);
    }

    // Category filter
    if (elements.cookieCategoryFilter) {
      elements.cookieCategoryFilter.removeEventListener('change', handleCategoryFilterChange);
      elements.cookieCategoryFilter.addEventListener('change', handleCategoryFilterChange);
    }

    // Pagination
    if (elements.cookiePrevPage) {
      elements.cookiePrevPage.removeEventListener('click', handlePrevPage);
      elements.cookiePrevPage.addEventListener('click', handlePrevPage);
    }
    if (elements.cookieNextPage) {
      elements.cookieNextPage.removeEventListener('click', handleNextPage);
      elements.cookieNextPage.addEventListener('click', handleNextPage);
    }

    // Bulk delete
    if (elements.bulkDeleteCookiesBtn) {
      elements.bulkDeleteCookiesBtn.removeEventListener('click', handleBulkDelete);
      elements.bulkDeleteCookiesBtn.addEventListener('click', handleBulkDelete);
    }

    // Select all checkbox
    if (elements.cookieSelectAll) {
      elements.cookieSelectAll.removeEventListener('change', handleSelectAll);
      elements.cookieSelectAll.addEventListener('change', handleSelectAll);
    }

    // Cookie list interactions (using delegation)
    if (elements.cookiesPageList) {
      elements.cookiesPageList.removeEventListener('click', handleListClick);
      elements.cookiesPageList.addEventListener('click', handleListClick);
      elements.cookiesPageList.removeEventListener('change', handleCheckboxChange);
      elements.cookiesPageList.addEventListener('change', handleCheckboxChange);
    }
  }

  function handleSearch(e) {
    state.searchTerm = e.target.value;
    state.currentPage = 1;
    filterAndRender();
  }

  function handleCategoryFilterChange(e) {
    state.categoryFilter = e.target.value;
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
    const totalPages = Math.ceil(state.filteredCookies.length / state.itemsPerPage);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      filterAndRender();
    }
  }

  function handleCheckboxChange(e) {
    if (!e.target.classList.contains('cookie-checkbox')) return;

    const cookieId = e.target.dataset.cookieId;
    if (e.target.checked) {
      state.selectedCookies.add(cookieId);
    } else {
      state.selectedCookies.delete(cookieId);
    }

    // Update item selection state
    const item = e.target.closest('.cookie-row');
    if (item) {
      item.classList.toggle('selected', e.target.checked);
    }

    updateSelectionUI();
    updateSelectAllState();
  }

  function handleSelectAll(e) {
    const isChecked = e.target.checked;
    const { filteredCookies, currentPage, itemsPerPage } = state;

    // Get current page items
    const startIdx = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredCookies.slice(startIdx, startIdx + itemsPerPage);

    pageItems.forEach(cookie => {
      if (isChecked) {
        state.selectedCookies.add(cookie.id);
      } else {
        state.selectedCookies.delete(cookie.id);
      }
    });

    // Update UI
    if (elements.cookiesPageList) {
      elements.cookiesPageList.querySelectorAll('.cookie-row').forEach(row => {
        const checkbox = row.querySelector('.cookie-checkbox');
        if (checkbox) {
          checkbox.checked = isChecked;
          row.classList.toggle('selected', isChecked);
        }
      });
    }

    updateSelectionUI();
  }

  function updateSelectAllState() {
    if (!elements.cookieSelectAll) return;

    const { filteredCookies, currentPage, itemsPerPage, selectedCookies } = state;
    const startIdx = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredCookies.slice(startIdx, startIdx + itemsPerPage);

    const allSelected = pageItems.length > 0 &&
      pageItems.every(cookie => selectedCookies.has(cookie.id));
    const someSelected = pageItems.some(cookie => selectedCookies.has(cookie.id));

    elements.cookieSelectAll.checked = allSelected;
    elements.cookieSelectAll.indeterminate = someSelected && !allSelected;
  }

  function handleListClick(e) {
    // Handle delete button
    if (e.target.closest('.cookie-delete-btn')) {
      const btn = e.target.closest('.cookie-delete-btn');
      const name = btn.dataset.cookieName;
      const domain = btn.dataset.cookieDomain;
      deleteSingle(name, domain);
      return;
    }

    // Handle value reveal toggle
    const toggleBtn = e.target.closest('.cookie-value-toggle');
    if (toggleBtn) {
      const item = e.target.closest('.cookie-row');
      const valueSection = toggleBtn.closest('.cookie-value-section');
      const valueText = valueSection.querySelector('.cookie-value-text');
      const toggleSpan = toggleBtn.querySelector('span');
      const isHidden = valueText.dataset.hidden === 'true';

      if (isHidden) {
        valueText.textContent = item.dataset.cookieValue || '(empty)';
        valueText.dataset.hidden = 'false';
        if (toggleSpan) toggleSpan.textContent = 'Hide';
      } else {
        valueText.textContent = '••••••••••••';
        valueText.dataset.hidden = 'true';
        if (toggleSpan) toggleSpan.textContent = 'Show';
      }
      return;
    }

    // Handle row click to expand (click on name column)
    const nameCol = e.target.closest('.cookie-col-name');
    if (nameCol) {
      const item = e.target.closest('.cookie-row');
      item.classList.toggle('expanded');
      return;
    }
  }

  async function deleteSingle(name, domain) {
    try {
      // Send message to service worker to delete cookie
      const response = await chrome.runtime.sendMessage({
        action: 'deleteCookies',
        cookies: [{ name, domain }]
      });

      if (response?.success) {
        if (showStatusCallback) {
          showStatusCallback(`Deleted cookie: ${name}`, 'success');
        }
        // Remove from state and re-render
        const cookieId = `${name}_${domain}_/`;
        state.allCookies = state.allCookies.filter(c =>
          !(c.name === name && c.domain === domain)
        );
        state.selectedCookies.delete(cookieId);
        filterAndRender();

        // Update total count
        if (elements.cookiesPageTotal) {
          elements.cookiesPageTotal.textContent = state.allCookies.length;
        }
      } else {
        if (showStatusCallback) {
          showStatusCallback('Failed to delete cookie', 'error');
        }
      }
    } catch (error) {
      debug.error('Error deleting cookie:', error);
      if (showStatusCallback) {
        showStatusCallback('Error deleting cookie', 'error');
      }
    }
  }

  async function handleBulkDelete() {
    const selectedIds = Array.from(state.selectedCookies);
    if (selectedIds.length === 0) return;

    const cookiesToDelete = state.allCookies
      .filter(c => selectedIds.includes(c.id))
      .map(c => ({ name: c.name, domain: c.domain }));

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'deleteCookies',
        cookies: cookiesToDelete
      });

      if (response?.success) {
        if (showStatusCallback) {
          showStatusCallback(`Deleted ${cookiesToDelete.length} cookies`, 'success');
        }
        // Remove from state
        state.allCookies = state.allCookies.filter(c =>
          !selectedIds.includes(c.id)
        );
        state.selectedCookies.clear();
        filterAndRender();

        // Update total count
        if (elements.cookiesPageTotal) {
          elements.cookiesPageTotal.textContent = state.allCookies.length;
        }
      } else {
        if (showStatusCallback) {
          showStatusCallback('Failed to delete some cookies', 'error');
        }
      }
    } catch (error) {
      debug.error('Error deleting cookies:', error);
      if (showStatusCallback) {
        showStatusCallback('Error deleting cookies', 'error');
      }
    }
  }

  // Public API
  return {
    init,
    populate,
    getState: () => ({ ...state }),
    search: (term) => {
      state.searchTerm = term;
      state.currentPage = 1;
      filterAndRender();
    },
    filter: (category) => {
      state.categoryFilter = category;
      state.currentPage = 1;
      filterAndRender();
    },
    nextPage: handleNextPage,
    prevPage: handlePrevPage,
    deleteSelected: handleBulkDelete
  };
})();
