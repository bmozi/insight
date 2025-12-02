/**
 * StorageInsight Score Page Module
 * Handles privacy score display, breakdown, and history
 */
const ScorePage = (function() {
  // ============================================================================
  // PRIVATE STATE
  // ============================================================================

  let state = {
    scans: [],
    timeRange: '30days', // '7days', '30days', 'all'
    maxScans: 100 // Keep last 100 scans
  };

  // DOM elements (passed in via init)
  let elements = {};

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  // Map deduction types to user-friendly labels and improvement tips
  const deductionLabels = {
    'tracking': {
      label: 'Tracking Cookies',
      tip: 'Clear tracking cookies regularly or use privacy-focused browser settings',
      unit: 'cookies'
    },
    'advertising': {
      label: 'Advertising Cookies',
      tip: 'Consider using an ad blocker or clearing ad cookies',
      unit: 'cookies'
    },
    'fingerprinting': {
      label: 'Fingerprinting',
      tip: 'Use browser fingerprint protection or privacy extensions',
      unit: 'cookies'
    },
    'long-lived': {
      label: 'Long-lived Cookies',
      tip: 'Clear cookies periodically - some persist for years',
      unit: 'cookies'
    },
    'insecure-sensitive': {
      label: 'Insecure Cookies',
      tip: 'Be cautious on sites storing sensitive data without HTTPS',
      unit: 'cookies'
    },
    'localStorage': {
      label: 'Excessive Storage',
      tip: 'Clear site data for sites you no longer use',
      unit: 'units (100KB each)'
    }
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the score page module
   * @param {Object} domElements - DOM elements to use
   */
  function init(domElements) {
    elements = domElements;
    setupListeners();
  }

  /**
   * Setup event listeners (simplified - no time filters in new design)
   */
  function setupListeners() {
    // No listeners needed for simplified design
  }

  // ============================================================================
  // SCORE BREAKDOWN
  // ============================================================================

  /**
   * Populate the score page with breakdown data
   * @param {Object} data - Scan data with privacy analysis
   */
  function populate(data) {
    if (!elements.scorePageTotal || !elements.breakdownList) return;

    const privacyAnalysis = data._privacyAnalysis || data.privacyAnalysis;
    const privacyScore = data.privacyScore || privacyAnalysis?.privacyScore || { score: 0 };
    const scoreValue = typeof privacyScore === 'object' ? privacyScore.score : privacyScore;

    // Update score display
    elements.scorePageTotal.textContent = scoreValue;

    // Update score card color and label
    const scoreCard = document.getElementById('scoreDisplayCard');
    const scoreLabel = document.getElementById('scoreDisplayLabel');

    if (scoreCard) {
      scoreCard.classList.remove('score-good', 'score-fair', 'score-poor');
      if (scoreValue >= 70) {
        scoreCard.classList.add('score-good');
      } else if (scoreValue >= 40) {
        scoreCard.classList.add('score-fair');
      } else {
        scoreCard.classList.add('score-poor');
      }
    }

    if (scoreLabel) {
      if (scoreValue >= 70) {
        scoreLabel.textContent = 'Good privacy protection';
      } else if (scoreValue >= 40) {
        scoreLabel.textContent = 'Some privacy concerns detected';
      } else {
        scoreLabel.textContent = 'Significant privacy risks found';
      }
    }

    if (!privacyAnalysis || !privacyAnalysis.privacyScore) {
      elements.breakdownList.innerHTML = '<div class="no-data">No score breakdown available</div>';
      return;
    }

    const scoreData = privacyAnalysis.privacyScore;

    // Build deduction list from the deductions array returned by privacy analyzer
    const deductionItems = [];

    if (scoreData.deductions && Array.isArray(scoreData.deductions)) {
      scoreData.deductions.forEach(d => {
        if (d.points > 0) {
          const info = deductionLabels[d.type] || { label: d.type, tip: '' };
          deductionItems.push({
            label: info.label,
            tip: info.tip,
            value: -d.points,
            count: d.count || d.units || null,
            type: d.type
          });
        }
      });
    }

    // Also check for legacy field names (fallback)
    if (deductionItems.length === 0) {
      if (scoreData.trackingDeduction > 0) {
        deductionItems.push({ label: 'Tracking Cookies', value: -scoreData.trackingDeduction, count: scoreData.trackingCount || 0 });
      }
      if (scoreData.advertisingDeduction > 0) {
        deductionItems.push({ label: 'Advertising Cookies', value: -scoreData.advertisingDeduction, count: scoreData.advertisingCount || 0 });
      }
      if (scoreData.fingerprintingDeduction > 0) {
        deductionItems.push({ label: 'Fingerprinting', value: -scoreData.fingerprintingDeduction, count: scoreData.fingerprintingCount || 0 });
      }
      if (scoreData.longLivedDeduction > 0) {
        deductionItems.push({ label: 'Long-lived Cookies', value: -scoreData.longLivedDeduction, count: scoreData.longLivedCount || 0 });
      }
      if (scoreData.insecureDeduction > 0) {
        deductionItems.push({ label: 'Insecure Cookies', value: -scoreData.insecureDeduction, count: scoreData.insecureCount || 0 });
      }
      if (scoreData.storageDeduction > 0) {
        deductionItems.push({ label: 'Large Storage', value: -scoreData.storageDeduction, count: null });
      }
    }

    // If score isn't 100 but no deductions found, calculate implied deduction
    if (deductionItems.length === 0 && scoreValue < 100) {
      const totalDeduction = 100 - scoreValue;
      deductionItems.push({
        label: 'Privacy Issues Detected',
        tip: 'Run a fresh scan to see detailed breakdown',
        value: -totalDeduction,
        count: null
      });
    }

    if (deductionItems.length === 0) {
      elements.breakdownList.innerHTML = `
        <div class="breakdown-item positive">
          <div class="breakdown-item-info">
            <div class="breakdown-item-title">Perfect Score!</div>
            <div class="breakdown-item-detail">No privacy concerns detected</div>
          </div>
          <span class="breakdown-item-impact">+0</span>
        </div>
      `;
      return;
    }

    // Sort by severity (highest deduction first)
    deductionItems.sort((a, b) => a.value - b.value);

    elements.breakdownList.innerHTML = deductionItems
      .map(item => {
        const severity = item.value <= -10 ? 'negative' : 'warning';
        return `
          <div class="breakdown-item ${severity}">
            <div class="breakdown-item-info">
              <div class="breakdown-item-title">${item.label}</div>
              <div class="breakdown-item-detail">${item.count !== null ? `${item.count} detected` : (item.tip || '')}</div>
            </div>
            <span class="breakdown-item-impact">${item.value}</span>
          </div>
        `;
      })
      .join('');
  }

  // ============================================================================
  // SCORE HISTORY
  // ============================================================================

  /**
   * Load score history from storage
   */
  async function loadHistory() {
    try {
      const result = await chrome.storage.local.get(['scoreHistory']);
      if (result.scoreHistory && Array.isArray(result.scoreHistory)) {
        state.scans = result.scoreHistory;
        debug.log(`📜 Loaded ${state.scans.length} scans from history`);
        renderHistory();
      }
    } catch (error) {
      debug.error('Error loading score history:', error);
    }
  }

  /**
   * Save a new scan to history
   * @param {Object} data - Scan data to save
   */
  async function saveToHistory(data) {
    try {
      const privacyScore = data.privacyScore || data._privacyAnalysis?.privacyScore || { score: 0 };
      const scoreValue = typeof privacyScore === 'object' ? privacyScore.score : privacyScore;

      const scanRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        privacyScore: scoreValue,
        totalCookies: data.totalCookies || 0,
        trackingCookies: data.trackingCookies || 0,
        uniqueDomains: data.uniqueDomains || 0,
        totalStorageMB: data.totalStorageMB || 0
      };

      // Add to beginning of array
      state.scans.unshift(scanRecord);

      // Trim to max scans
      if (state.scans.length > state.maxScans) {
        state.scans = state.scans.slice(0, state.maxScans);
      }

      // Save to storage
      await chrome.storage.local.set({ scoreHistory: state.scans });
      debug.log(`💾 Saved scan to history. Total scans: ${state.scans.length}`);

      // Re-render history
      renderHistory();
    } catch (error) {
      debug.error('Error saving to score history:', error);
    }
  }

  /**
   * Calculate history statistics for current time range
   * @returns {Object} Statistics object with average, best, worst, etc.
   */
  function calculateHistoryStats() {
    const now = Date.now();
    const cutoffs = {
      '7days': 7 * 24 * 60 * 60 * 1000,
      '30days': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    const cutoff = cutoffs[state.timeRange];
    const filteredScans = state.scans.filter(scan =>
      now - scan.timestamp < cutoff
    );

    if (filteredScans.length === 0) {
      return {
        average: 0,
        best: 0,
        worst: 0,
        totalCookiesCleared: 0,
        trend: 'stable',
        scans: []
      };
    }

    const scores = filteredScans.map(s => s.privacyScore);
    const average = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    const best = Math.max(...scores);
    const worst = Math.min(...scores);

    // Calculate trend (compare first half to second half)
    let trend = 'stable';
    if (scores.length >= 2) {
      const midpoint = Math.floor(scores.length / 2);
      // Note: scans are sorted newest first, so we need to reverse for trend calculation
      const reversedScores = [...scores].reverse();
      const firstHalf = reversedScores.slice(0, midpoint || 1);
      const secondHalf = reversedScores.slice(midpoint || 1);
      const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
      const diff = secondAvg - firstAvg;

      if (diff > 5) trend = 'improving';
      else if (diff < -5) trend = 'declining';
    }

    // Approximate cookies cleared (difference between consecutive scans)
    let totalCookiesCleared = 0;
    const sortedScans = [...filteredScans].sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 1; i < sortedScans.length; i++) {
      const prev = sortedScans[i - 1];
      const curr = sortedScans[i];
      const cleared = Math.max(0, prev.totalCookies - curr.totalCookies);
      totalCookiesCleared += cleared;
    }

    return {
      average,
      best,
      worst,
      totalCookiesCleared,
      trend,
      scans: filteredScans
    };
  }

  /**
   * Get score color class based on score value
   * @param {number} score - Privacy score (0-100)
   * @returns {string} Color class name
   */
  function getScoreColorClass(score) {
    if (score >= 70) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Render score history UI (recent scans only - simplified)
   */
  function renderHistory() {
    const stats = calculateHistoryStats();

    // Render recent scans list with new design
    if (elements.recentScansList) {
      if (stats.scans.length === 0) {
        elements.recentScansList.innerHTML = '<div class="breakdown-empty"><p>No scan history yet</p></div>';
      } else {
        // Show most recent 5 scans
        const recentScans = stats.scans.slice(0, 5);
        elements.recentScansList.innerHTML = recentScans.map(scan => {
          const date = new Date(scan.timestamp);
          const dateStr = date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const colorClass = getScoreColorClass(scan.privacyScore);

          return `
            <div class="recent-scan-item">
              <div class="recent-scan-info">
                <div class="recent-scan-date">${dateStr}</div>
                <div class="recent-scan-stats">${scan.totalCookies} cookies · ${scan.uniqueDomains} domains</div>
              </div>
              <span class="recent-scan-score ${colorClass}">${scan.privacyScore}</span>
            </div>
          `;
        }).join('');
      }
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  return {
    /**
     * Initialize the score page module
     * @param {Object} domElements - DOM elements to use
     */
    init,

    /**
     * Populate score breakdown
     * @param {Object} data - Scan data with privacy analysis
     */
    populate,

    /**
     * Load score history from storage
     * @returns {Promise<void>}
     */
    loadHistory,

    /**
     * Save a new scan to history
     * @param {Object} data - Scan data to save
     * @returns {Promise<void>}
     */
    saveToHistory,

    /**
     * Render score history UI
     */
    renderHistory,

    /**
     * Get current state (returns copy to prevent mutation)
     * @returns {Object} State copy
     */
    getState: () => ({ ...state }),

    /**
     * Set time range filter and re-render
     * @param {string} range - Time range ('7days', '30days', 'all')
     */
    setTimeRange: (range) => {
      state.timeRange = range;
      renderHistory();
    },

    /**
     * Get score color class (useful for external components)
     * @param {number} score - Privacy score (0-100)
     * @returns {string} Color class name
     */
    getScoreColorClass
  };
})();
