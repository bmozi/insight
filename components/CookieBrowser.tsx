'use client';

import { useState, useMemo } from 'react';
import {
  Cookie,
  Search,
  Filter,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Cookie as CookieType, CookieCategory, RiskLevel } from '@/lib/types';
import { getCompanyFromCookie } from '@/lib/tracker-companies';

interface CookieBrowserProps {
  data: any;
  onDeleteCookies: (cookies: Array<{ name: string; domain: string }>) => void;
}

// Enhanced cookie type with categorization
interface EnhancedCookie extends CookieType {
  category: CookieCategory;
  risk: RiskLevel;
  company?: string;
  size: number;
}

// Tracking patterns for categorization
const trackingPatterns = {
  analytics: ['google-analytics', 'hotjar', 'mixpanel', 'segment', 'amplitude', '_ga', '_gid', '_gat', '_hjid', 'mp_', 'ajs_', 'amp_', '_pk_'],
  advertising: ['doubleclick', 'googlesyndication', 'criteo', 'outbrain', 'taboola', '_fbp', 'ads', '_cc_', 'cto_', '__qca', 'IDE', 'DSID'],
  social: ['facebook', 'twitter', 'linkedin', 'pinterest', 'instagram', 'tiktok', '_fbc', 'fr', 'datr', '_twitter_sess', 'personalization_id', '_rdt_', '_scid'],
  fingerprinting: ['fingerprint', 'datadome', 'deviceatlas', 'threatmetrix', '_fpjs', '_px', 'datadome'],
  essential: ['session', 'csrf', 'xsrf', 'auth', 'login', '__cf', 'cf_', '__stripe', 'cloudflare'],
};

function categorizeCookie(name: string, domain: string): CookieCategory {
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

function assessRisk(cookie: EnhancedCookie): RiskLevel {
  if (cookie.category === 'fingerprinting') return 'critical';
  if (cookie.category === 'advertising') return 'high';
  if (cookie.category === 'social') return 'high';
  if (cookie.category === 'analytics') return 'medium';
  if (cookie.category === 'essential') return 'low';

  // Check for other risk factors
  if (!cookie.secure && cookie.domain.includes('bank')) return 'high';
  if (!cookie.httpOnly && !cookie.session) return 'medium';

  return 'low';
}

function getCategoryColor(category: CookieCategory): string {
  const colors: Record<CookieCategory, string> = {
    analytics: 'bg-purple-100 text-purple-700 border-purple-200',
    advertising: 'bg-red-100 text-red-700 border-red-200',
    social: 'bg-blue-100 text-blue-700 border-blue-200',
    fingerprinting: 'bg-orange-100 text-orange-700 border-orange-200',
    essential: 'bg-green-100 text-green-700 border-green-200',
    functional: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    unknown: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[category];
}

function formatExpiration(cookie: EnhancedCookie): string {
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type SortField = 'name' | 'domain' | 'category' | 'expiration' | 'size' | 'company';
type SortOrder = 'asc' | 'desc';

export default function CookieBrowser({ data, onDeleteCookies }: CookieBrowserProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CookieCategory | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [selectedCookies, setSelectedCookies] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [revealedValues, setRevealedValues] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const itemsPerPage = 25;

  // Enhance cookies with categorization and company info
  const enhancedCookies: EnhancedCookie[] = useMemo(() => {
    // Handle both data structures:
    // 1. data.cookies is an array (from extension's legacyFormat)
    // 2. data.cookies.cookies is an array (original expected format)
    const cookiesArray = Array.isArray(data?.cookies)
      ? data.cookies
      : data?.cookies?.cookies;

    if (!cookiesArray || !Array.isArray(cookiesArray) || cookiesArray.length === 0) return [];

    return cookiesArray.map((cookie: CookieType) => {
      const category = categorizeCookie(cookie.name, cookie.domain);
      const company = getCompanyFromCookie(cookie.name, cookie.domain);
      const size = new Blob([cookie.value]).size;

      const enhanced: EnhancedCookie = {
        ...cookie,
        category,
        company: company || undefined,
        risk: 'low', // Temporary
        size,
      };

      enhanced.risk = assessRisk(enhanced);
      return enhanced;
    });
  }, [data]);

  // Filter and sort cookies
  const filteredCookies = useMemo(() => {
    let filtered = enhancedCookies;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        cookie =>
          cookie.name.toLowerCase().includes(term) ||
          cookie.domain.toLowerCase().includes(term) ||
          cookie.company?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(cookie => cookie.category === categoryFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(cookie => cookie.risk === riskFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'domain':
          compareValue = a.domain.localeCompare(b.domain);
          break;
        case 'category':
          compareValue = a.category.localeCompare(b.category);
          break;
        case 'expiration':
          const aExp = a.session ? 0 : (a.expirationDate || 0);
          const bExp = b.session ? 0 : (b.expirationDate || 0);
          compareValue = aExp - bExp;
          break;
        case 'size':
          compareValue = a.size - b.size;
          break;
        case 'company':
          const aCompany = a.company || '';
          const bCompany = b.company || '';
          compareValue = aCompany.localeCompare(bCompany);
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [enhancedCookies, searchTerm, categoryFilter, riskFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredCookies.length / itemsPerPage);
  const paginatedCookies = filteredCookies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Helper to generate unique cookie ID (includes path since same name+domain can have different paths)
  const getCookieId = (cookie: { name: string; domain: string; path?: string }) =>
    `${cookie.name}_${cookie.domain}_${cookie.path || '/'}`;

  const handleSelectAll = () => {
    if (selectedCookies.size === paginatedCookies.length) {
      setSelectedCookies(new Set());
    } else {
      const allIds = new Set(paginatedCookies.map(c => getCookieId(c)));
      setSelectedCookies(allIds);
    }
  };

  const handleSelectCookie = (cookie: EnhancedCookie) => {
    const id = getCookieId(cookie);
    const newSelected = new Set(selectedCookies);

    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }

    setSelectedCookies(newSelected);
  };

  const handleDeleteSelected = () => {
    const cookiesToDelete = enhancedCookies
      .filter(cookie => selectedCookies.has(getCookieId(cookie)))
      .map(cookie => ({ name: cookie.name, domain: cookie.domain }));

    if (cookiesToDelete.length === 0) return;

    onDeleteCookies(cookiesToDelete);
    setSelectedCookies(new Set());
  };

  const handleToggleRow = (cookie: EnhancedCookie) => {
    const id = getCookieId(cookie);
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleToggleReveal = (cookie: EnhancedCookie) => {
    const id = getCookieId(cookie);
    const newRevealed = new Set(revealedValues);

    if (newRevealed.has(id)) {
      newRevealed.delete(id);
    } else {
      newRevealed.add(id);
    }

    setRevealedValues(newRevealed);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Check if we have cookie data (either as array or nested)
  const cookiesArrayForCheck = Array.isArray(data?.cookies)
    ? data.cookies
    : data?.cookies?.cookies;
  const hasCookieData = cookiesArrayForCheck && Array.isArray(cookiesArrayForCheck) && cookiesArrayForCheck.length > 0;

  if (!data || !hasCookieData) {
    return (
      <div className="rounded-3xl bg-white/95 p-12 text-center shadow-lg backdrop-blur-sm">
        <Cookie className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="text-lg font-medium text-gray-600">No Cookie Data Available</p>
        <p className="text-sm text-gray-500 mb-4">
          {!data ? 'Connect the browser extension and run a scan to view cookies.' : 'No cookies found in your browser.'}
        </p>
        <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 text-sm text-purple-700">
          <span>💡</span>
          <span>Go to the Overview tab and click "Scan Storage" to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/95 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-3">
            <Cookie className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Cookie Browser</h2>
            <p className="text-sm text-gray-600">
              {filteredCookies.length} of {enhancedCookies.length} cookies
              {selectedCookies.size > 0 && ` • ${selectedCookies.size} selected`}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or domain..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 py-2 pl-10 pr-4 text-sm transition-colors focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as CookieCategory | 'all')}
              className="w-full appearance-none rounded-xl border-2 border-gray-200 py-2 pl-10 pr-10 text-sm transition-colors focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="analytics">Analytics</option>
              <option value="advertising">Advertising</option>
              <option value="social">Social</option>
              <option value="fingerprinting">Fingerprinting</option>
              <option value="essential">Essential</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value as RiskLevel | 'all')}
              className="w-full appearance-none rounded-xl border-2 border-gray-200 py-2 pl-10 pr-10 text-sm transition-colors focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCookies.size > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-purple-50 p-3">
            <span className="text-sm font-medium text-purple-700">
              {selectedCookies.size} cookie{selectedCookies.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700 hover:shadow-md active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  checked={paginatedCookies.length > 0 && selectedCookies.size === paginatedCookies.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
              </th>
              <th
                className="cursor-pointer p-4 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name <SortIcon field="name" />
                </div>
              </th>
              <th
                className="cursor-pointer p-4 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('domain')}
              >
                <div className="flex items-center gap-1">
                  Domain <SortIcon field="domain" />
                </div>
              </th>
              <th
                className="cursor-pointer p-4 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Category <SortIcon field="category" />
                </div>
              </th>
              <th
                className="cursor-pointer p-4 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('expiration')}
              >
                <div className="flex items-center gap-1">
                  Expiration <SortIcon field="expiration" />
                </div>
              </th>
              <th className="p-4">Secure</th>
              <th className="p-4">HttpOnly</th>
              <th className="p-4">SameSite</th>
              <th
                className="cursor-pointer p-4 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center gap-1">
                  Size <SortIcon field="size" />
                </div>
              </th>
              <th
                className="cursor-pointer p-4 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('company')}
              >
                <div className="flex items-center gap-1">
                  Company <SortIcon field="company" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedCookies.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-12 text-center">
                  <Cookie className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                  <p className="text-gray-600">No cookies match your filters</p>
                </td>
              </tr>
            ) : (
              paginatedCookies.map((cookie, index) => {
                const cookieId = getCookieId(cookie);
                const isSelected = selectedCookies.has(cookieId);
                const isExpanded = expandedRow === cookieId;
                const isRevealed = revealedValues.has(cookieId);

                return (
                  <React.Fragment key={`${cookieId}_${index}`}>
                    <tr
                      className={`cursor-pointer border-t border-gray-100 text-sm transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      } hover:bg-purple-50 ${isSelected ? 'bg-purple-100' : ''}`}
                      onClick={() => handleToggleRow(cookie)}
                    >
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectCookie(cookie)}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="max-w-xs truncate p-4 font-mono text-xs" title={cookie.name}>
                        {cookie.name}
                      </td>
                      <td className="max-w-xs truncate p-4 text-gray-600" title={cookie.domain}>
                        {cookie.domain}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block rounded-full border px-2 py-1 text-xs font-medium ${getCategoryColor(
                            cookie.category
                          )}`}
                        >
                          {cookie.category.charAt(0).toUpperCase() + cookie.category.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{formatExpiration(cookie)}</td>
                      <td className="p-4">
                        {cookie.secure ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </td>
                      <td className="p-4">
                        {cookie.httpOnly ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </td>
                      <td className="p-4 text-gray-600">
                        {cookie.sameSite === 'unspecified' ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          cookie.sameSite
                        )}
                      </td>
                      <td className="p-4 text-gray-600">{formatBytes(cookie.size)}</td>
                      <td className="p-4 text-gray-600">
                        {cookie.company ? (
                          <span className="font-medium">{cookie.company}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <tr className="border-t border-gray-200 bg-gray-100">
                        <td colSpan={10} className="p-6">
                          <div className="space-y-4">
                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700">Cookie Value</h4>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleToggleReveal(cookie);
                                  }}
                                  className="flex items-center gap-2 rounded-lg bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                                >
                                  {isRevealed ? (
                                    <>
                                      <EyeOff className="h-4 w-4" />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4" />
                                      Reveal
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs">
                                {isRevealed ? (
                                  <pre className="whitespace-pre-wrap break-all">{cookie.value}</pre>
                                ) : (
                                  <pre className="text-gray-400">••••••••••••••••••••</pre>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-500">Path</div>
                                <div className="rounded bg-white px-2 py-1 text-sm font-mono">
                                  {cookie.path}
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-500">Risk Level</div>
                                <div>
                                  <span
                                    className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                                      cookie.risk === 'critical'
                                        ? 'bg-red-100 text-red-700'
                                        : cookie.risk === 'high'
                                        ? 'bg-orange-100 text-orange-700'
                                        : cookie.risk === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}
                                  >
                                    {cookie.risk.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-500">Host Only</div>
                                <div className="text-sm">
                                  {cookie.hostOnly ? (
                                    <span className="text-green-600">Yes</span>
                                  ) : (
                                    <span className="text-gray-600">No</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-500">Store ID</div>
                                <div className="text-sm font-mono text-gray-600">
                                  {cookie.storeId || '—'}
                                </div>
                              </div>
                            </div>

                            {cookie.expirationDate && !cookie.session && (
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-500">
                                  Full Expiration Date
                                </div>
                                <div className="text-sm text-gray-700">
                                  {new Date(cookie.expirationDate * 1000).toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 p-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredCookies.length)} of {filteredCookies.length}{' '}
            cookies
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Add React import for Fragment
import React from 'react';
