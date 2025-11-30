'use client';

import React, { useState, useMemo } from 'react';
import {
  Shield,
  Globe,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  AlertTriangle,
  Eye,
  Cookie,
  HardDrive,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import { CookieCategory, RiskLevel, Cookie as CookieType } from '@/lib/types';
import { getCompanyFromDomain, getTrackerInfo } from '@/lib/tracker-companies';

interface DomainExplorerProps {
  data: any;
  onDeleteDomain: (domain: string) => void;
  onViewDomainDetails: (domain: string) => void;
}

interface DomainInfo {
  domain: string;
  cookieCount: number;
  storageSize: number;
  riskLevel: RiskLevel;
  category: CookieCategory;
  isThirdParty: boolean;
  company: string | null;
  cookies: CookieType[];
}

type SortField = 'domain' | 'cookieCount' | 'storageSize' | 'riskLevel';
type SortOrder = 'asc' | 'desc';

export default function DomainExplorer({ data, onDeleteDomain, onViewDomainDetails }: DomainExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CookieCategory | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('riskLevel');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  // Calculate current page URL to detect third-party domains
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  // Process domain data from extension scan
  const domains = useMemo((): DomainInfo[] => {
    // Handle both data structures:
    // 1. data.cookies is an array (from extension's legacyFormat)
    // 2. data.cookies.cookies is an array (original expected format)
    const cookiesArray = Array.isArray(data?.cookies)
      ? data.cookies
      : data?.cookies?.cookies;

    if (!cookiesArray || !Array.isArray(cookiesArray) || cookiesArray.length === 0) return [];

    const domainMap = new Map<string, DomainInfo>();

    // Group cookies by domain
    cookiesArray.forEach((cookie: CookieType) => {
      const domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;

      if (!domainMap.has(domain)) {
        const trackerInfo = getTrackerInfo(domain);
        const company = getCompanyFromDomain(domain);

        // Determine category based on tracker info or cookie patterns
        let category: CookieCategory = 'unknown';
        if (trackerInfo) {
          category = trackerInfo.category;
        } else {
          // Heuristic categorization
          const cookieName = cookie.name.toLowerCase();
          if (/_ga|_gid|analytics|_pk|utm_/.test(cookieName)) {
            category = 'analytics';
          } else if (/_fb|_twitter|_pin|social/.test(cookieName)) {
            category = 'social';
          } else if (/ad|doubleclick|criteo/.test(cookieName)) {
            category = 'advertising';
          } else if (/_fp|fingerprint|datadome/.test(cookieName)) {
            category = 'fingerprinting';
          } else if (/session|auth|login|csrf/.test(cookieName)) {
            category = 'essential';
          }
        }

        // Calculate risk level
        let riskLevel: RiskLevel = 'low';
        if (category === 'fingerprinting') {
          riskLevel = 'critical';
        } else if (category === 'advertising') {
          riskLevel = 'high';
        } else if (category === 'social' || category === 'analytics') {
          riskLevel = 'medium';
        }

        // Detect third-party
        const isThirdParty = !currentDomain.endsWith(domain) && !domain.endsWith(currentDomain);

        domainMap.set(domain, {
          domain,
          cookieCount: 0,
          storageSize: 0,
          riskLevel,
          category,
          isThirdParty,
          company,
          cookies: [],
        });
      }

      const domainInfo = domainMap.get(domain)!;
      domainInfo.cookieCount++;
      domainInfo.storageSize += (cookie.name.length + cookie.value.length);
      domainInfo.cookies.push(cookie);

      // Update risk level if cookie has higher risk
      if (cookie.name.toLowerCase().includes('fingerprint') || cookie.name.toLowerCase().includes('_fp')) {
        if (domainInfo.riskLevel !== 'critical') domainInfo.riskLevel = 'critical';
      }
    });

    // Add localStorage and sessionStorage sizes
    if (data.localStorage?.byDomain) {
      Object.entries(data.localStorage.byDomain).forEach(([domain, rawInfo]) => {
        const info = rawInfo as { size: number; keys?: string[] };
        const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;
        const existing = domainMap.get(cleanDomain);
        if (existing) {
          existing.storageSize += info.size || 0;
        } else {
          const company = getCompanyFromDomain(cleanDomain);
          const isThirdParty = !currentDomain.endsWith(cleanDomain) && !cleanDomain.endsWith(currentDomain);
          domainMap.set(cleanDomain, {
            domain: cleanDomain,
            cookieCount: 0,
            storageSize: info.size || 0,
            riskLevel: 'low',
            category: 'unknown',
            isThirdParty,
            company,
            cookies: [],
          });
        }
      });
    }

    if (data.sessionStorage?.byDomain) {
      Object.entries(data.sessionStorage.byDomain).forEach(([domain, rawInfo]) => {
        const info = rawInfo as { size: number; keys?: string[] };
        const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;
        const existing = domainMap.get(cleanDomain);
        if (existing) {
          existing.storageSize += info.size || 0;
        }
      });
    }

    return Array.from(domainMap.values());
  }, [data, currentDomain]);

  // Filter and sort domains
  const filteredAndSortedDomains = useMemo(() => {
    let filtered = domains;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.domain.toLowerCase().includes(query) ||
        d.company?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(d => d.category === categoryFilter);
    }

    // Apply risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(d => d.riskLevel === riskFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'domain':
          comparison = a.domain.localeCompare(b.domain);
          break;
        case 'cookieCount':
          comparison = a.cookieCount - b.cookieCount;
          break;
        case 'storageSize':
          comparison = a.storageSize - b.storageSize;
          break;
        case 'riskLevel':
          const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          comparison = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [domains, searchQuery, categoryFilter, riskFilter, sortField, sortOrder]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const highRiskCount = domains.filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical').length;
    const thirdPartyCount = domains.filter(d => d.isThirdParty).length;

    return {
      totalDomains: domains.length,
      highRiskDomains: highRiskCount,
      thirdPartyDomains: thirdPartyCount,
    };
  }, [domains]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'domain' ? 'asc' : 'desc');
    }
  };

  // Toggle expanded domain
  const toggleExpanded = (domain: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  // Handle delete with confirmation
  const handleDelete = (domain: string) => {
    if (confirm(`Delete all data for ${domain}? This action cannot be undone.`)) {
      onDeleteDomain(domain);
    }
  };

  // Get risk color classes
  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  // Get category color classes
  const getCategoryColor = (category: CookieCategory) => {
    switch (category) {
      case 'analytics':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'advertising':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'social':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'fingerprinting':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'essential':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'functional':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'unknown':
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Format storage size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="h-4 w-4 text-purple-600" />
      : <ArrowDown className="h-4 w-4 text-purple-600" />;
  };

  // Check if we have cookie data (either as array or nested)
  const cookiesArray = Array.isArray(data?.cookies)
    ? data.cookies
    : data?.cookies?.cookies;
  const hasCookieData = cookiesArray && Array.isArray(cookiesArray) && cookiesArray.length > 0;

  if (!data || !hasCookieData) {
    return (
      <div className="rounded-3xl bg-white/95 p-8 text-center shadow-lg backdrop-blur-sm">
        <Globe className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">No Domain Data Available</p>
        <p className="text-sm text-gray-400 mb-4">
          {!data ? 'Connect the browser extension and run a scan to see domains storing data.' : 'No cookies found in your browser.'}
        </p>
        <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 text-sm text-purple-700">
          <span>💡</span>
          <span>Go to the Overview tab and click "Scan Storage" to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-purple-100 p-3">
          <Globe className="h-6 w-6 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Domain Explorer</h2>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4">
          <div className="text-2xl font-bold text-purple-700">{summaryStats.totalDomains}</div>
          <div className="text-sm font-medium text-purple-600">Total Domains</div>
        </div>
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
          <div className="text-2xl font-bold text-red-700">{summaryStats.highRiskDomains}</div>
          <div className="text-sm font-medium text-red-600">High Risk Domains</div>
        </div>
        <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4">
          <div className="text-2xl font-bold text-orange-700">{summaryStats.thirdPartyDomains}</div>
          <div className="text-sm font-medium text-orange-600">Third-Party Domains</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search domains or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 bg-white py-2 pl-10 pr-10 text-sm font-medium text-gray-800 placeholder-gray-400 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CookieCategory | 'all')}
            className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-white py-2 pl-10 pr-10 text-sm font-medium text-gray-800 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="analytics">Analytics</option>
            <option value="advertising">Advertising</option>
            <option value="social">Social</option>
            <option value="fingerprinting">Fingerprinting</option>
            <option value="essential">Essential</option>
            <option value="functional">Functional</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        {/* Risk Filter */}
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}
            className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-white py-2 pl-10 pr-10 text-sm font-medium text-gray-800 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:w-auto"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th
                onClick={() => handleSort('domain')}
                className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  Domain
                  <SortIcon field="domain" />
                </div>
              </th>
              <th
                onClick={() => handleSort('cookieCount')}
                className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  Cookies
                  <SortIcon field="cookieCount" />
                </div>
              </th>
              <th
                onClick={() => handleSort('storageSize')}
                className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  Size
                  <SortIcon field="storageSize" />
                </div>
              </th>
              <th
                onClick={() => handleSort('riskLevel')}
                className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  Risk
                  <SortIcon field="riskLevel" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedDomains.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No domains found matching your filters
                </td>
              </tr>
            ) : (
              filteredAndSortedDomains.map((domain) => (
                <React.Fragment key={domain.domain}>
                  <tr
                    className="group cursor-pointer border-b border-gray-100 transition-colors hover:bg-purple-50"
                    onClick={() => toggleExpanded(domain.domain)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 transition-transform">
                          {expandedDomains.has(domain.domain) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{domain.domain}</span>
                            {domain.isThirdParty && (
                              <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                                3rd Party
                              </span>
                            )}
                          </div>
                          {domain.company && (
                            <div className="text-xs text-gray-500">{domain.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Cookie className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">{domain.cookieCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">{formatSize(domain.storageSize)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase ${getRiskColor(domain.riskLevel)}`}>
                        {domain.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ${getCategoryColor(domain.category)}`}>
                        {domain.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDomainDetails(domain.domain);
                          }}
                          className="rounded-lg bg-purple-100 p-2 text-purple-600 transition-all hover:bg-purple-200 hover:scale-110"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(domain.domain);
                          }}
                          className="rounded-lg bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200 hover:scale-110"
                          title="Delete All"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Row - Cookie List */}
                  {expandedDomains.has(domain.domain) && domain.cookies.length > 0 && (
                    <tr className="bg-purple-50/50">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="ml-6 rounded-xl bg-white p-4 shadow-sm">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Cookie className="h-4 w-4" />
                            Cookies ({domain.cookies.length})
                          </h4>
                          <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-white">
                                <tr className="border-b border-gray-200">
                                  <th className="pb-2 text-left text-xs font-semibold text-gray-600">Name</th>
                                  <th className="pb-2 text-left text-xs font-semibold text-gray-600">Value</th>
                                  <th className="pb-2 text-left text-xs font-semibold text-gray-600">Secure</th>
                                  <th className="pb-2 text-left text-xs font-semibold text-gray-600">HttpOnly</th>
                                  <th className="pb-2 text-left text-xs font-semibold text-gray-600">SameSite</th>
                                </tr>
                              </thead>
                              <tbody>
                                {domain.cookies.map((cookie, idx) => (
                                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                                    <td className="py-2 pr-4">
                                      <span className="font-mono text-xs text-gray-700">{cookie.name}</span>
                                    </td>
                                    <td className="py-2 pr-4">
                                      <span className="font-mono text-xs text-gray-500 truncate max-w-xs block">
                                        {cookie.value.length > 50 ? `${cookie.value.substring(0, 50)}...` : cookie.value}
                                      </span>
                                    </td>
                                    <td className="py-2 pr-4">
                                      {cookie.secure ? (
                                        <span className="text-green-600">✓</span>
                                      ) : (
                                        <span className="text-red-600">✗</span>
                                      )}
                                    </td>
                                    <td className="py-2 pr-4">
                                      {cookie.httpOnly ? (
                                        <span className="text-green-600">✓</span>
                                      ) : (
                                        <span className="text-gray-400">✗</span>
                                      )}
                                    </td>
                                    <td className="py-2">
                                      <span className="text-xs text-gray-600 capitalize">{cookie.sameSite}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Showing {filteredAndSortedDomains.length} of {domains.length} domains
      </div>
    </div>
  );
}
