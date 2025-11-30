'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Globe,
  Cookie as CookieIcon,
  Shield,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  AlertTriangle,
  TrendingUp,
  Filter,
  Search,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import {
  CategorizedCookie,
  Cookie,
  CookieCategory,
  RiskLevel,
  CompanyTrackerData,
} from '@/lib/types';
import {
  getCompanyFromDomain,
  getCompanyFromCookie,
  getCompanyInfo,
  companyDatabase,
} from '@/lib/tracker-companies';

interface TrackerAttributionProps {
  data: any;
  onDeleteCompanyTrackers: (company: string) => void;
}

type SortOption = 'cookie-count' | 'risk' | 'alphabetical';

const COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#06b6d4', '#84cc16'];

const COMPANY_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-green-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-red-500',
  'bg-yellow-500',
];

const TrackerAttribution: React.FC<TrackerAttributionProps> = ({ data, onDeleteCompanyTrackers }) => {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('cookie-count');
  const [filterCategory, setFilterCategory] = useState<CookieCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Group cookies by company
  const companyTrackers = useMemo(() => {
    // Handle both data structures:
    // 1. data.cookies is an array (from extension's legacyFormat)
    // 2. data.cookies.cookies is an array (original expected format)
    const cookiesArray = Array.isArray(data?.cookies)
      ? data.cookies
      : data?.cookies?.cookies;

    if (!cookiesArray || !Array.isArray(cookiesArray) || cookiesArray.length === 0) return [];

    const companyMap = new Map<string, CompanyTrackerData>();
    const cookies = cookiesArray as Cookie[];

    // Track which domains we've seen cookies from (to count cross-site presence)
    const sitesPerCompany = new Map<string, Set<string>>();

    cookies.forEach((cookie) => {
      // Try to identify the company
      let company = getCompanyFromCookie(cookie.name, cookie.domain);
      if (!company) {
        company = getCompanyFromDomain(cookie.domain);
      }

      // If we still don't have a company, skip or use "Unknown"
      if (!company) return;

      const companyInfo = getCompanyInfo(company);
      if (!companyInfo) return;

      // Track sites
      if (!sitesPerCompany.has(company)) {
        sitesPerCompany.set(company, new Set());
      }
      sitesPerCompany.get(company)!.add(cookie.domain);

      // Get or create company entry
      if (!companyMap.has(company)) {
        companyMap.set(company, {
          company,
          domains: [],
          cookieCount: 0,
          cookies: [],
          category: companyInfo.category,
          risk: companyInfo.risk,
          description: companyInfo.description,
          siteCount: 0,
        });
      }

      const companyData = companyMap.get(company)!;

      // Add domain if not already present
      if (!companyData.domains.includes(cookie.domain)) {
        companyData.domains.push(cookie.domain);
      }

      // Add cookie (with category from company info)
      const categorizedCookie: CategorizedCookie = {
        ...cookie,
        category: companyInfo.category,
        risk: companyInfo.risk,
        isTracking: companyInfo.category !== 'essential',
        company,
      };

      companyData.cookies.push(categorizedCookie);
      companyData.cookieCount++;
    });

    // Update site counts
    companyMap.forEach((companyData, company) => {
      companyData.siteCount = sitesPerCompany.get(company)?.size || 0;
    });

    return Array.from(companyMap.values());
  }, [data]);

  // Filter and sort companies
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = companyTrackers;

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === filterCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.company.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.domains.some((d) => d.toLowerCase().includes(query))
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'cookie-count':
        sorted.sort((a, b) => b.cookieCount - a.cookieCount);
        break;
      case 'risk':
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        sorted.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.company.localeCompare(b.company));
        break;
    }

    return sorted;
  }, [companyTrackers, filterCategory, searchQuery, sortBy]);

  // Prepare pie chart data (top 5 + others)
  const pieChartData = useMemo(() => {
    const sorted = [...companyTrackers].sort((a, b) => b.cookieCount - a.cookieCount);
    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5);

    const data = top5.map((c) => ({
      name: c.company,
      value: c.cookieCount,
    }));

    if (others.length > 0) {
      const othersTotal = others.reduce((sum, c) => sum + c.cookieCount, 0);
      data.push({
        name: 'Others',
        value: othersTotal,
      });
    }

    return data;
  }, [companyTrackers]);

  // Prepare bar chart data (reversed so top companies appear at top of chart)
  const barChartData = useMemo(() => {
    return [...companyTrackers]
      .sort((a, b) => b.cookieCount - a.cookieCount)
      .slice(0, 8)
      .map((c) => ({
        company: c.company.length > 15 ? c.company.substring(0, 12) + '...' : c.company,
        cookies: c.cookieCount,
      }))
      .reverse(); // Reverse so highest values appear at top of vertical bar chart
  }, [companyTrackers]);

  const toggleCompany = (company: string) => {
    setExpandedCompanies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(company)) {
        newSet.delete(company);
      } else {
        newSet.add(company);
      }
      return newSet;
    });
  };

  const getRiskColor = (risk: RiskLevel): string => {
    return COLORS[risk];
  };

  const getRiskBorderColor = (risk: RiskLevel): string => {
    const colors = {
      low: 'border-green-500',
      medium: 'border-orange-500',
      high: 'border-red-500',
      critical: 'border-red-600',
    };
    return colors[risk];
  };

  const getRiskBgGradient = (risk: RiskLevel): string => {
    const gradients = {
      low: 'from-green-500/5 to-green-500/0',
      medium: 'from-orange-500/5 to-orange-500/0',
      high: 'from-red-500/10 to-red-500/0',
      critical: 'from-red-600/15 to-red-600/0',
    };
    return gradients[risk];
  };

  const getCategoryBadgeColor = (category: CookieCategory): string => {
    const colors = {
      analytics: 'bg-blue-100 text-blue-800',
      advertising: 'bg-purple-100 text-purple-800',
      social: 'bg-pink-100 text-pink-800',
      fingerprinting: 'bg-red-100 text-red-800',
      essential: 'bg-green-100 text-green-800',
      functional: 'bg-gray-100 text-gray-800',
      unknown: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.unknown;
  };

  const getCompanyColor = (index: number): string => {
    return COMPANY_COLORS[index % COMPANY_COLORS.length];
  };

  const getCompanyInitial = (company: string): string => {
    return company.charAt(0).toUpperCase();
  };

  // Check if we have cookie data (either as array or nested)
  const cookiesArrayForCheck = Array.isArray(data?.cookies)
    ? data.cookies
    : data?.cookies?.cookies;
  const hasCookieData = cookiesArrayForCheck && Array.isArray(cookiesArrayForCheck) && cookiesArrayForCheck.length > 0;

  if (!data || !hasCookieData) {
    return (
      <div className="rounded-3xl bg-white/95 p-12 text-center shadow-lg backdrop-blur-sm">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-600">No Tracker Data Available</p>
        <p className="text-sm text-gray-500 mb-4">
          Connect the browser extension and run a scan to see which companies are tracking you.
        </p>
        <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 text-sm text-purple-700">
          <span>💡</span>
          <span>Go to the Overview tab and click "Scan Storage" to get started</span>
        </div>
      </div>
    );
  }

  if (companyTrackers.length === 0) {
    return (
      <div className="rounded-3xl bg-white/95 p-12 text-center shadow-lg backdrop-blur-sm">
        <Building2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-green-600">No Tracking Companies Detected!</p>
        <p className="text-sm text-gray-500">
          Great news! We didn't find any known tracking companies in your browser storage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tracker Attribution</h2>
            <p className="text-gray-600">
              <span className="text-3xl font-bold text-blue-600">{companyTrackers.length}</span> companies are tracking
              you
            </p>
          </div>
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {companyTrackers.filter((c) => c.risk === 'high' || c.risk === 'critical').length} high-risk
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cookies by Company</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Companies (by cookies)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barChartData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" />
                <YAxis dataKey="company" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="cookies" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as CookieCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="analytics">Analytics</option>
              <option value="advertising">Advertising</option>
              <option value="social">Social</option>
              <option value="fingerprinting">Fingerprinting</option>
              <option value="essential">Essential</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cookie-count">Most Cookies</option>
              <option value="risk">Risk Level</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Company Cards */}
      <div className="space-y-4">
        {filteredAndSortedCompanies.map((company, index) => {
          const isExpanded = expandedCompanies.has(company.company);
          const cookiesByDomain = company.cookies.reduce((acc, cookie) => {
            if (!acc[cookie.domain]) {
              acc[cookie.domain] = [];
            }
            acc[cookie.domain].push(cookie);
            return acc;
          }, {} as Record<string, CategorizedCookie[]>);

          return (
            <div
              key={company.company}
              className={`bg-white rounded-3xl shadow-lg border-2 ${getRiskBorderColor(
                company.risk
              )} overflow-hidden transition-all hover:shadow-xl`}
            >
              {/* Company Header */}
              <div
                className={`bg-gradient-to-br ${getRiskBgGradient(company.risk)} p-6 cursor-pointer`}
                onClick={() => toggleCompany(company.company)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Company Logo/Initial */}
                    <div
                      className={`${getCompanyColor(
                        index
                      )} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0`}
                    >
                      {getCompanyInitial(company.company)}
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900">{company.company}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadgeColor(company.category)}`}>
                          {company.category}
                        </span>
                        <div className="flex items-center gap-1" style={{ color: getRiskColor(company.risk) }}>
                          <Shield className="w-4 h-4" />
                          <span className="text-xs font-semibold uppercase">{company.risk}</span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-3">{company.description}</p>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <CookieIcon className="w-4 h-4" />
                          <span className="font-semibold">{company.cookieCount}</span>
                          <span className="text-gray-500">cookies</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Globe className="w-4 h-4" />
                          <span className="font-semibold">{company.domains.length}</span>
                          <span className="text-gray-500">domains</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Users className="w-4 h-4" />
                          <span className="text-gray-500">Found on</span>
                          <span className="font-semibold">{company.siteCount}</span>
                          <span className="text-gray-500">sites</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCompanyTrackers(company.company);
                      }}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
                      title="Delete all trackers from this company"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-6 bg-gray-50 space-y-4">
                  {/* Domains List */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Domains ({company.domains.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {company.domains.map((domain) => (
                        <span
                          key={domain}
                          className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-700"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cookies by Domain */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <CookieIcon className="w-4 h-4" />
                      Cookies by Domain
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(cookiesByDomain).map(([domain, cookies]) => (
                        <div key={domain} className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm font-semibold text-gray-700">{domain}</span>
                            <span className="text-xs text-gray-500">{cookies.length} cookies</span>
                          </div>
                          <div className="space-y-1">
                            {cookies.map((cookie, idx) => (
                              <div
                                key={`${cookie.name}-${idx}`}
                                className="flex items-center justify-between text-xs py-1"
                              >
                                <span className="font-mono text-gray-600 truncate flex-1">{cookie.name}</span>
                                <div className="flex items-center gap-2 ml-2">
                                  {cookie.secure && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">Secure</span>
                                  )}
                                  {cookie.httpOnly && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">HttpOnly</span>
                                  )}
                                  {!cookie.session && cookie.expirationDate && (
                                    <span className="text-gray-500">
                                      {new Date(cookie.expirationDate * 1000).toLocaleDateString()}
                                    </span>
                                  )}
                                  {cookie.session && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">Session</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delete All Button */}
                  <div className="pt-3 border-t border-gray-200">
                    <button
                      onClick={() => onDeleteCompanyTrackers(company.company)}
                      className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete All {company.cookieCount} Cookies from {company.company}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State for Filtered Results */}
      {filteredAndSortedCompanies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl shadow-lg">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No companies match your filters</p>
          <button
            onClick={() => {
              setFilterCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default TrackerAttribution;
