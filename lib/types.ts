/**
 * Shared Types for Insight Dashboard
 * Common interfaces used across all components
 */

// Cookie Types
export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none' | 'unspecified';
  session: boolean;
  expirationDate?: number;
  hostOnly?: boolean;
  storeId?: string;
}

export interface CategorizedCookie extends Cookie {
  category: CookieCategory;
  risk: RiskLevel;
  isTracking: boolean;
  company?: string;
  trackerInfo?: TrackerInfo;
}

export type CookieCategory =
  | 'analytics'
  | 'advertising'
  | 'social'
  | 'fingerprinting'
  | 'essential'
  | 'functional'
  | 'unknown';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Domain Types
export interface DomainData {
  domain: string;
  cookieCount: number;
  cookies: CategorizedCookie[];
  localStorageSize: number;
  localStorageKeys: string[];
  sessionStorageSize: number;
  sessionStorageKeys: string[];
  indexedDBSize: number;
  totalSize: number;
  riskLevel: RiskLevel;
  category: CookieCategory;
  isThirdParty: boolean;
  lastAccessed?: number;
  company?: string;
}

// Tracker Types
export interface TrackerInfo {
  name: string;
  company: string;
  category: CookieCategory;
  risk: RiskLevel;
  domain: string;
  description: string;
  prevalence?: number; // How many sites use this tracker
}

export interface CompanyTrackerData {
  company: string;
  logo?: string;
  domains: string[];
  cookieCount: number;
  cookies: CategorizedCookie[];
  category: CookieCategory;
  risk: RiskLevel;
  description: string;
  siteCount: number; // Number of sites where found
}

// Storage Types
export interface LocalStorageItem {
  key: string;
  value: string;
  size: number;
  domain: string;
}

export interface SessionStorageItem {
  key: string;
  value: string;
  size: number;
  domain: string;
}

export interface IndexedDBInfo {
  name: string;
  version: number;
  objectStores: string[];
  estimatedSize: number;
  domain: string;
}

export interface StorageBreakdown {
  cookies: {
    totalSize: number;
    count: number;
  };
  localStorage: {
    totalSize: number;
    count: number;
    byDomain: Record<string, { size: number; keys: string[] }>;
  };
  sessionStorage: {
    totalSize: number;
    count: number;
    byDomain: Record<string, { size: number; keys: string[] }>;
  };
  indexedDB: {
    estimatedSize: number;
    databases: IndexedDBInfo[];
  };
}

// Historical Data Types
export interface ScanSnapshot {
  id: string;
  timestamp: number;
  privacyScore: number;
  totalCookies: number;
  trackingCookies: number;
  uniqueDomains: number;
  totalStorageMB: number;
  breakdown: {
    analytics: number;
    advertising: number;
    social: number;
    fingerprinting: number;
    essential: number;
    unknown: number;
  };
  newTrackers?: string[];
  removedTrackers?: string[];
}

export interface TrendData {
  date: string;
  timestamp: number;
  privacyScore: number;
  totalCookies: number;
  trackingCookies: number;
  storageMB: number;
}

// Control Panel Types
export interface DomainRule {
  id: string;
  domain: string;
  action: 'allow' | 'block' | 'session-only';
  createdAt: number;
  lastTriggered?: number;
}

export interface AutoCleanupRule {
  id: string;
  name: string;
  enabled: boolean;
  target: 'advertising' | 'analytics' | 'social' | 'fingerprinting' | 'all-tracking' | 'expired' | 'large-storage';
  schedule: 'manual' | 'daily' | 'weekly' | 'on-close';
  lastRun?: number;
  cookiesCleared?: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoScan: boolean;
  scanInterval: number; // minutes
  retainHistory: number; // days
  domainRules: DomainRule[];
  autoCleanupRules: AutoCleanupRule[];
  allowlist: string[];
  blocklist: string[];
}

// Comparison Types
export interface ComparisonSnapshot {
  id: string;
  name: string;
  timestamp: number;
  privacyScore: number;
  metrics: {
    totalCookies: number;
    trackingCookies: number;
    uniqueDomains: number;
    totalStorageMB: number;
  };
  breakdown: {
    analytics: number;
    advertising: number;
    social: number;
    fingerprinting: number;
  };
  domains: string[];
  trackers: string[];
}

export interface ComparisonResult {
  before: ComparisonSnapshot;
  after: ComparisonSnapshot;
  changes: {
    scoreChange: number;
    cookiesAdded: number;
    cookiesRemoved: number;
    domainsAdded: string[];
    domainsRemoved: string[];
    trackersAdded: string[];
    trackersRemoved: string[];
    storageChange: number;
  };
}

// Extension Data (from extension)
export interface ExtensionScanData {
  summary: {
    cookieCount: number;
    totalSizeMB: string;
    totalSizeBytes: number;
    uniqueDomains: number;
  };
  cookies: {
    cookies: Cookie[];
    totalSize: number;
    byDomain?: Record<string, Cookie[]>;
  };
  localStorage: {
    totalSize: number;
    byDomain?: Record<string, { size: number; keys: string[] }>;
  };
  sessionStorage: {
    totalSize: number;
    byDomain?: Record<string, { size: number; keys: string[] }>;
  };
  indexedDB: {
    estimatedSize: number;
    databases?: IndexedDBInfo[];
  };
  metadata: {
    scanTime: string;
    scanDurationMs: number;
    version: string;
  };
  _privacyAnalysis?: PrivacyAnalysis;
  _detailed?: {
    cookies?: { totalSize: number };
    localStorage?: { totalSize: number };
    sessionStorage?: { totalSize: number };
    indexedDB?: { estimatedSize: number };
  };
}

export interface PrivacyAnalysis {
  privacyScore: number;
  breakdown: {
    analytics: number;
    advertising: number;
    social: number;
    fingerprinting: number;
    essential: number;
    unknown: number;
  };
  recommendations: Recommendation[];
  highRiskItems: HighRiskItem[];
  deductions: Deduction[];
}

export interface Recommendation {
  title: string;
  description: string;
  icon?: string;
  action?: string;
  impact: number;
}

export interface HighRiskItem {
  type: string;
  severity: RiskLevel;
  title: string;
  description: string;
  items?: Array<{ name: string; domain: string }>;
}

export interface Deduction {
  type: string;
  count?: number;
  points: number;
  units?: number;
}

// Dashboard State
export interface DashboardState {
  activeView: 'overview' | 'domains' | 'cookies' | 'trackers' | 'history' | 'storage' | 'settings' | 'compare';
  selectedDomain: string | null;
  selectedCookies: string[];
  filters: {
    category: CookieCategory | 'all';
    risk: RiskLevel | 'all';
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  comparison: {
    snapshotA: string | null;
    snapshotB: string | null;
  };
}
