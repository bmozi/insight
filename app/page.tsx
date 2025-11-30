'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Cookie,
  Database,
  Shield,
  Target,
  Download,
  Settings,
  Trash2,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe,
  Building2,
  History,
  HardDrive,
  GitCompare,
  LayoutDashboard,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useExtensionData } from '@/lib/useExtensionData';
import { analyzePrivacy } from '@/lib/privacy-analyzer-web';
import { storageDB } from '@/lib/storage-db';
import { UserSettings, ComparisonSnapshot, ScanSnapshot } from '@/lib/types';

// Import all new components
import DomainExplorer from '@/components/DomainExplorer';
import CookieBrowser from '@/components/CookieBrowser';
import TrackerAttribution from '@/components/TrackerAttribution';
import HistoricalTrends from '@/components/HistoricalTrends';
import StorageDetails from '@/components/StorageDetails';
import ControlPanel from '@/components/ControlPanel';
import ComparisonView from '@/components/ComparisonView';
import LearnPrivacy from '@/components/LearnPrivacy';

// Tab definitions
type TabId = 'overview' | 'domains' | 'cookies' | 'trackers' | 'history' | 'storage' | 'settings' | 'compare' | 'learn';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'domains', label: 'Domains', icon: <Globe className="h-4 w-4" /> },
  { id: 'cookies', label: 'Cookies', icon: <Cookie className="h-4 w-4" /> },
  { id: 'trackers', label: 'Trackers', icon: <Building2 className="h-4 w-4" /> },
  { id: 'history', label: 'History', icon: <History className="h-4 w-4" /> },
  { id: 'storage', label: 'Storage', icon: <HardDrive className="h-4 w-4" /> },
  { id: 'compare', label: 'Compare', icon: <GitCompare className="h-4 w-4" /> },
  { id: 'learn', label: 'Learn', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

// Default settings
const defaultSettings: UserSettings = {
  theme: 'system',
  notifications: true,
  autoScan: false,
  scanInterval: 60,
  retainHistory: 30,
  domainRules: [],
  autoCleanupRules: [
    { id: '1', name: 'Clear advertising cookies', enabled: false, target: 'advertising', schedule: 'daily' },
    { id: '2', name: 'Clear analytics cookies', enabled: false, target: 'analytics', schedule: 'weekly' },
    { id: '3', name: 'Clear all tracking on close', enabled: false, target: 'all-tracking', schedule: 'on-close' },
    { id: '4', name: 'Clear expired cookies', enabled: true, target: 'expired', schedule: 'daily' },
    { id: '5', name: 'Clear large localStorage', enabled: false, target: 'large-storage', schedule: 'weekly' },
  ],
  allowlist: [],
  blocklist: [],
};

// Sample data for initial state
const initialMetrics = {
  totalCookies: 0,
  trackingCookies: 0,
  uniqueDomains: 0,
  totalStorageMB: 0,
  privacyScore: 0,
};

const sampleStorageData = [
  { name: 'Cookies', value: 2.4, color: '#8b5cf6' },
  { name: 'Local Storage', value: 5.8, color: '#3b82f6' },
  { name: 'Session Storage', value: 1.2, color: '#06b6d4' },
  { name: 'IndexedDB', value: 12.6, color: '#6366f1' },
];

export default function Home() {
  // Core state
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [privacyAnalysis, setPrivacyAnalysis] = useState<any>(null);

  // Feature-specific state
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [snapshots, setSnapshots] = useState<ComparisonSnapshot[]>([]);
  const [historicalScans, setHistoricalScans] = useState<ScanSnapshot[]>([]);

  // Use the extension data hook
  const { data: extensionData, loading, isConnected, lastUpdated, refresh } = useExtensionData();

  // Load settings and snapshots from IndexedDB on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        await storageDB.init();

        // Load settings
        const storedSettings = await storageDB.getSetting('userSettings');
        if (storedSettings) {
          setSettings({ ...defaultSettings, ...storedSettings });
        }

        // Load snapshots
        const storedSnapshots = await storageDB.getSetting('comparisonSnapshots');
        if (storedSnapshots) {
          setSnapshots(storedSnapshots);
        }

        // Load historical scans
        const scans = await storageDB.getAllScans();
        const formattedScans: ScanSnapshot[] = scans.map((scan: any) => {
          // Extract breakdown from privacy analysis
          const breakdown = scan.data?._privacyAnalysis?.breakdown?.byCategory ||
                           scan.data?._privacyAnalysis?.breakdown || {
            analytics: 0,
            advertising: 0,
            social: 0,
            fingerprinting: 0,
            essential: 0,
            unknown: 0,
          };

          // Calculate tracking cookies from breakdown
          const trackingCookies = (breakdown.Analytics || breakdown.analytics || 0) +
                                  (breakdown.Advertising || breakdown.advertising || 0) +
                                  (breakdown.Social || breakdown.social || 0) +
                                  (breakdown.Fingerprinting || breakdown.fingerprinting || 0);

          // Helper to extract numeric score from privacyScore (can be number or object with score property)
          const extractNumericScore = (ps: any): number => {
            if (typeof ps === 'number') return ps;
            if (typeof ps === 'object' && ps !== null) return ps.score || 0;
            return 0;
          };

          const rawScore = scan.privacyScore || scan.data?.privacyScore || scan.data?._privacyAnalysis?.privacyScore;

          return {
            id: scan.timestamp.toString(),
            timestamp: scan.timestamp,
            privacyScore: extractNumericScore(rawScore),
            totalCookies: scan.summary?.totalCookies || scan.data?.totalCookies || 0,
            trackingCookies,
            uniqueDomains: scan.summary?.uniqueDomains || scan.data?.uniqueDomains || 0,
            totalStorageMB: parseFloat(scan.summary?.totalStorageMB || scan.data?.totalStorageMB || '0'),
            breakdown: {
              analytics: breakdown.Analytics || breakdown.analytics || 0,
              advertising: breakdown.Advertising || breakdown.advertising || 0,
              social: breakdown.Social || breakdown.social || 0,
              fingerprinting: breakdown.Fingerprinting || breakdown.fingerprinting || 0,
              essential: breakdown.Essential || breakdown.essential || 0,
              unknown: breakdown.Unknown || breakdown.unknown || 0,
            },
          };
        });
        setHistoricalScans(formattedScans);
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };

    loadStoredData();
  }, []);

  // Update metrics when extension data changes
  useEffect(() => {
    if (extensionData) {
      const extAnalysis = (extensionData as any)._privacyAnalysis;
      let analysis;
      let trackingCount = 0;
      let privacyScore = 0;

      if (extAnalysis) {
        analysis = {
          ...extAnalysis,
          privacyScore: typeof extAnalysis.privacyScore === 'object'
            ? extAnalysis.privacyScore.score
            : extAnalysis.privacyScore,
        };

        const breakdown = extAnalysis.breakdown || {};
        const byCategory = breakdown.byCategory || breakdown;
        trackingCount = (byCategory.Analytics || byCategory.analytics || 0) +
                       (byCategory.Advertising || byCategory.advertising || 0) +
                       (byCategory.Social || byCategory.social || 0) +
                       (byCategory.Fingerprinting || byCategory.fingerprinting || 0);
        privacyScore = analysis.privacyScore;
      } else {
        analysis = analyzePrivacy(extensionData);
        trackingCount = analysis.breakdown.analytics +
                       analysis.breakdown.advertising +
                       analysis.breakdown.social +
                       analysis.breakdown.fingerprinting;
        privacyScore = analysis.privacyScore;
      }

      setPrivacyAnalysis(analysis);

      setMetrics({
        totalCookies: extensionData.summary?.cookieCount || (extensionData as any).totalCookies || 0,
        trackingCookies: (extensionData as any).trackingCookies || trackingCount,
        uniqueDomains: extensionData.summary?.uniqueDomains || (extensionData as any).uniqueDomains || 0,
        totalStorageMB: parseFloat(extensionData.summary?.totalSizeMB || (extensionData as any).totalStorageMB || '0'),
        privacyScore: privacyScore,
      });
      setHasScanned(true);

      // Refresh historical scans from IndexedDB after new scan data arrives
      const refreshHistoricalScans = async () => {
        try {
          const scans = await storageDB.getAllScans();
          const formattedScans: ScanSnapshot[] = scans.map((scan: any) => {
            const breakdown = scan.data?._privacyAnalysis?.breakdown?.byCategory ||
                             scan.data?._privacyAnalysis?.breakdown || {
              analytics: 0,
              advertising: 0,
              social: 0,
              fingerprinting: 0,
              essential: 0,
              unknown: 0,
            };

            const scanTrackingCookies = (breakdown.Analytics || breakdown.analytics || 0) +
                                        (breakdown.Advertising || breakdown.advertising || 0) +
                                        (breakdown.Social || breakdown.social || 0) +
                                        (breakdown.Fingerprinting || breakdown.fingerprinting || 0);

            const extractNumericScore = (ps: any): number => {
              if (typeof ps === 'number') return ps;
              if (typeof ps === 'object' && ps !== null) return ps.score || 0;
              return 0;
            };

            const rawScore = scan.privacyScore || scan.data?.privacyScore || scan.data?._privacyAnalysis?.privacyScore;

            return {
              id: scan.timestamp.toString(),
              timestamp: scan.timestamp,
              privacyScore: extractNumericScore(rawScore),
              totalCookies: scan.summary?.totalCookies || scan.data?.totalCookies || 0,
              trackingCookies: scanTrackingCookies,
              uniqueDomains: scan.summary?.uniqueDomains || scan.data?.uniqueDomains || 0,
              totalStorageMB: parseFloat(scan.summary?.totalStorageMB || scan.data?.totalStorageMB || '0'),
              breakdown: {
                analytics: breakdown.Analytics || breakdown.analytics || 0,
                advertising: breakdown.Advertising || breakdown.advertising || 0,
                social: breakdown.Social || breakdown.social || 0,
                fingerprinting: breakdown.Fingerprinting || breakdown.fingerprinting || 0,
                essential: breakdown.Essential || breakdown.essential || 0,
                unknown: breakdown.Unknown || breakdown.unknown || 0,
              },
            };
          });
          setHistoricalScans(formattedScans);
          console.log('📊 Refreshed historical scans:', formattedScans.length);
        } catch (error) {
          console.error('Error refreshing historical scans:', error);
        }
      };

      refreshHistoricalScans();
    }
  }, [extensionData]);

  // Prepare storage chart data
  const storageData = extensionData
    ? [
        {
          name: 'Cookies',
          value: parseFloat((((extensionData._detailed?.cookies?.totalSize || extensionData.cookies?.totalSize || 0) / (1024 * 1024)).toFixed(2))),
          color: '#8b5cf6'
        },
        {
          name: 'Local Storage',
          value: parseFloat((((extensionData._detailed?.localStorage?.totalSize || extensionData.localStorage?.totalSize || 0) / (1024 * 1024)).toFixed(2))),
          color: '#3b82f6'
        },
        {
          name: 'Session Storage',
          value: parseFloat((((extensionData._detailed?.sessionStorage?.totalSize || extensionData.sessionStorage?.totalSize || 0) / (1024 * 1024)).toFixed(2))),
          color: '#06b6d4'
        },
        {
          name: 'IndexedDB',
          value: parseFloat((((extensionData._detailed?.indexedDB?.estimatedSize || extensionData.indexedDB?.estimatedSize || 0) / (1024 * 1024)).toFixed(2))),
          color: '#6366f1'
        }
      ]
    : sampleStorageData;

  // Handler functions
  const handleScan = () => {
    if (isConnected) {
      // Show loading state while refreshing
      setIsScanning(true);
      refresh();
      // Reset scanning state after a short delay (data will update via the hook)
      setTimeout(() => {
        setIsScanning(false);
      }, 3000);
    } else {
      setIsScanning(true);
      setHasScanned(false);
      setTimeout(() => {
        setMetrics({
          totalCookies: 127,
          trackingCookies: 43,
          uniqueDomains: 24,
          totalStorageMB: 22.0,
          privacyScore: 68,
        });
        setIsScanning(false);
        setHasScanned(true);
      }, 2000);
    }
  };

  const handleRecommendationAction = async (action: string) => {
    if (!isConnected) {
      alert('Extension not connected. Please install and enable the StorageInsight extension.');
      return;
    }

    const actionMessages: { [key: string]: string } = {
      'CLEAR_ADVERTISING': 'Clear all advertising cookies?',
      'CLEAR_FINGERPRINTING': 'Remove all fingerprinting trackers?',
      'CLEAR_TRACKING': 'Clear all cross-site tracking cookies?',
      'CLEAR_ANALYTICS': 'Clear all analytics cookies?',
      'CLEAR_LONG_LIVED': 'Clear long-lived tracking cookies?',
      'CLEAR_LOCALSTORAGE': 'Clear excessive localStorage data?',
      'CLEAR_INSECURE': 'Clear insecure cookies on sensitive domains?',
    };

    const confirmMsg = actionMessages[action.toUpperCase()] || 'Perform this action?';
    if (!confirm(confirmMsg + ' This cannot be undone.')) return;

    window.postMessage({
      source: 'storageinsight-webapp',
      type: 'EXECUTE_ACTION',
      action: action.toUpperCase(),
    }, window.location.origin);

    alert('Action sent to extension.');
    setTimeout(() => refresh(), 2000);
  };

  const handleClearAllTracking = async () => {
    if (!isConnected) {
      alert('Extension not connected. Please install and enable the StorageInsight extension.');
      return;
    }
    if (!confirm('Clear all tracking cookies? This cannot be undone.')) return;

    console.log('📡 Sending CLEAR_TRACKING action to extension...');
    window.postMessage({
      source: 'storageinsight-webapp',
      type: 'EXECUTE_ACTION',
      action: 'CLEAR_TRACKING',
    }, window.location.origin);

    // The ACTION_RESPONSE handler in useExtensionData will handle the response
    // and automatically refresh the data
  };

  const handleExportData = () => {
    if (!extensionData) {
      alert('No data to export.');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      summary: metrics,
      privacyAnalysis,
      rawData: extensionData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insight-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Domain Explorer handlers
  const handleDeleteDomain = useCallback((domain: string) => {
    if (!isConnected) {
      alert('Extension not connected.');
      return;
    }
    window.postMessage({
      source: 'storageinsight-webapp',
      type: 'DELETE_DOMAIN_DATA',
      domain,
    }, window.location.origin);
    setTimeout(() => refresh(), 1500);
  }, [isConnected, refresh]);

  const handleViewDomainDetails = useCallback((domain: string) => {
    console.log('View details for domain:', domain);
  }, []);

  // Cookie Browser handlers
  const handleDeleteCookies = useCallback((cookies: Array<{name: string, domain: string}>) => {
    if (!isConnected) {
      alert('Extension not connected.');
      return;
    }
    window.postMessage({
      source: 'storageinsight-webapp',
      type: 'DELETE_COOKIES',
      cookies,
    }, window.location.origin);
    setTimeout(() => refresh(), 1500);
  }, [isConnected, refresh]);

  // Tracker Attribution handlers
  const handleDeleteCompanyTrackers = useCallback((company: string) => {
    if (!isConnected) {
      alert('Extension not connected.');
      return;
    }
    window.postMessage({
      source: 'storageinsight-webapp',
      type: 'DELETE_COMPANY_TRACKERS',
      company,
    }, window.location.origin);
    setTimeout(() => refresh(), 1500);
  }, [isConnected, refresh]);

  // Storage Details handlers
  const handleClearDomainStorage = useCallback((domain: string, type: 'localStorage' | 'sessionStorage') => {
    if (!isConnected) {
      alert('Extension not connected.');
      return;
    }
    window.postMessage({
      source: 'storageinsight-webapp',
      type: 'CLEAR_DOMAIN_STORAGE',
      domain,
      storageType: type,
    }, window.location.origin);
    setTimeout(() => refresh(), 1500);
  }, [isConnected, refresh]);

  const handleClearIndexedDB = useCallback((dbName: string) => {
    if (!isConnected) {
      alert('Extension not connected.');
      return;
    }
    window.postMessage({
      source: 'storageinsight-webapp',
      type: 'CLEAR_INDEXEDDB',
      dbName,
    }, window.location.origin);
    setTimeout(() => refresh(), 1500);
  }, [isConnected, refresh]);

  const handleDeleteKey = useCallback((domain: string, key: string, type: 'localStorage' | 'sessionStorage') => {
    if (!isConnected) {
      alert('Extension not connected.');
      return;
    }
    window.postMessage({
      source: 'storageinsight-webapp',
      type: 'DELETE_STORAGE_KEY',
      domain,
      key,
      storageType: type,
    }, window.location.origin);
    setTimeout(() => refresh(), 1500);
  }, [isConnected, refresh]);

  // Control Panel handlers
  const handleUpdateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await storageDB.setSetting('userSettings', updated);
  }, [settings]);

  const handleClearHistory = useCallback(async () => {
    if (!confirm('Clear all scan history? This cannot be undone.')) return;
    await storageDB.clearAllScans();
    setHistoricalScans([]);
  }, []);

  const handleExportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insight-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings]);

  const handleImportSettings = useCallback(async (imported: UserSettings) => {
    setSettings(imported);
    await storageDB.setSetting('userSettings', imported);
  }, []);

  // Comparison View handlers
  const handleSaveSnapshot = useCallback(async (name: string) => {
    if (!extensionData) return;

    const snapshot: ComparisonSnapshot = {
      id: Date.now().toString(),
      name,
      timestamp: Date.now(),
      privacyScore: metrics.privacyScore,
      metrics: {
        totalCookies: metrics.totalCookies,
        trackingCookies: metrics.trackingCookies,
        uniqueDomains: metrics.uniqueDomains,
        totalStorageMB: metrics.totalStorageMB,
      },
      breakdown: privacyAnalysis?.breakdown || {
        analytics: 0,
        advertising: 0,
        social: 0,
        fingerprinting: 0,
      },
      domains: [],
      trackers: [],
    };

    const updated = [snapshot, ...snapshots].slice(0, 10);
    setSnapshots(updated);
    await storageDB.setSetting('comparisonSnapshots', updated);
  }, [extensionData, metrics, privacyAnalysis, snapshots]);

  const handleDeleteSnapshot = useCallback(async (id: string) => {
    const updated = snapshots.filter(s => s.id !== id);
    setSnapshots(updated);
    await storageDB.setSetting('comparisonSnapshots', updated);
  }, [snapshots]);

  // Helper functions
  const getPrivacyScoreColor = (score: number) => {
    if (score < 40) return 'text-red-500';
    if (score < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPrivacyScoreBg = (score: number) => {
    if (score < 40) return 'bg-red-100 border-red-200';
    if (score < 70) return 'bg-yellow-100 border-yellow-200';
    return 'bg-green-100 border-green-200';
  };

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, value }: any) => {
    const RADIAN = Math.PI / 180;
    if (percent < 0.05 && value < 1) return null;

    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="13"
        fontWeight="600"
      >
        {`${value}MB`}
      </text>
    );
  };

  // Render Overview Tab content
  const renderOverview = () => (
    <>
      {/* Metrics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="group rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-purple-100 p-3">
              <Cookie className="h-6 w-6 text-[#8b5cf6]" />
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mb-1 text-3xl font-bold text-gray-800">
            {hasScanned ? metrics.totalCookies : '—'}
          </div>
          <div className="text-sm font-medium text-gray-600">Cookies</div>
        </div>

        <div className="group rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-red-100 p-3">
              <Target className="h-6 w-6 text-red-600" />
            </div>
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="mb-1 text-3xl font-bold text-gray-800">
            {hasScanned ? metrics.trackingCookies : '—'}
          </div>
          <div className="text-sm font-medium text-gray-600">Tracking</div>
        </div>

        <div className="group rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-cyan-100 p-3">
              <Globe className="h-6 w-6 text-cyan-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mb-1 text-3xl font-bold text-gray-800">
            {hasScanned ? metrics.uniqueDomains : '—'}
          </div>
          <div className="text-sm font-medium text-gray-600">Domains</div>
        </div>

        <div className="group rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-blue-100 p-3">
              <Database className="h-6 w-6 text-[#3b82f6]" />
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mb-1 text-3xl font-bold text-gray-800">
            {hasScanned ? `${metrics.totalStorageMB}` : '—'}
            {hasScanned && <span className="text-lg"> MB</span>}
          </div>
          <div className="text-sm font-medium text-gray-600">Storage</div>
        </div>

        <div
          className={`group rounded-3xl p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-xl ${
            hasScanned ? getPrivacyScoreBg(metrics.privacyScore) + ' border-2' : 'bg-white/95'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-green-100 p-3">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            {hasScanned && metrics.privacyScore >= 70 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : hasScanned ? (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            ) : null}
          </div>
          <div className={`mb-1 text-3xl font-bold ${hasScanned ? getPrivacyScoreColor(metrics.privacyScore) : 'text-gray-800'}`}>
            {hasScanned ? metrics.privacyScore : '—'}
            {hasScanned && <span className="text-lg">/100</span>}
          </div>
          <div className="text-sm font-medium text-gray-600">Privacy Score</div>
        </div>
      </div>

      {/* Privacy Analysis */}
      {privacyAnalysis && (
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {privacyAnalysis.recommendations?.length > 0 && (
            <div className="rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Recommendations</h2>
              </div>
              <div className="space-y-3">
                {privacyAnalysis.recommendations.map((rec: any, index: number) => {
                  const title = typeof rec === 'object' ? rec.title : rec;
                  const description = typeof rec === 'object' ? rec.description : '';
                  const action = typeof rec === 'object' ? rec.action : null;

                  return (
                    <div key={index} className="flex items-start gap-3 rounded-xl border-l-4 border-purple-500 bg-purple-50 p-4">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{title}</p>
                        {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
                      </div>
                      {action && (
                        <button
                          onClick={() => handleRecommendationAction(action)}
                          className="flex-shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
                        >
                          Fix
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* High Risk Items - Always show this section */}
          <div className="rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${privacyAnalysis.highRiskItems?.length > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <h2 className="text-xl font-bold text-gray-800">High Risk Items</h2>
            </div>
            {privacyAnalysis.highRiskItems?.length > 0 ? (
              <div className="space-y-3">
                {privacyAnalysis.highRiskItems.map((item: any, index: number) => {
                  const actionMap: { [key: string]: string } = {
                    'fingerprinting': 'CLEAR_FINGERPRINTING',
                    'cross_site_tracking': 'CLEAR_TRACKING',
                    'large_storage': 'CLEAR_LOCALSTORAGE',
                    'insecure_sensitive': 'CLEAR_INSECURE',
                  };
                  const action = actionMap[item.type];

                  return (
                    <div
                      key={index}
                      className={`rounded-xl border-l-4 p-4 ${
                        item.severity === 'critical' ? 'border-red-600 bg-red-50' :
                        item.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                        'border-yellow-500 bg-yellow-50'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {item.severity === 'critical' ? '🔴' : item.severity === 'high' ? '⚠️' : '⚠️'}
                          </span>
                          <h3 className="font-semibold text-gray-800">{item.title}</h3>
                        </div>
                        {action && (
                          <button
                            onClick={() => handleRecommendationAction(action)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95 ${
                              item.severity === 'critical'
                                ? 'bg-red-600 hover:bg-red-700'
                                : item.severity === 'high'
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : 'bg-yellow-500 hover:bg-yellow-600'
                            }`}
                          >
                            {action === 'CLEAR_FINGERPRINTING' ? 'Remove' : 'Clear'}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      {item.items && item.items.length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700">
                            View {item.items.length} detected item{item.items.length !== 1 ? 's' : ''}
                          </summary>
                          <div className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-white/50 p-2">
                            {item.items.slice(0, 10).map((detected: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between border-b border-gray-100 py-1 text-xs last:border-0">
                                <span className="font-mono text-gray-700">
                                  {detected.name || detected.tracker || detected.key || (typeof detected === 'string' ? detected : JSON.stringify(detected))}
                                </span>
                                {detected.domain && <span className="text-gray-400">{detected.domain}</span>}
                              </div>
                            ))}
                            {item.items.length > 10 && (
                              <p className="pt-2 text-center text-xs text-gray-400">
                                ... and {item.items.length - 10} more
                              </p>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl bg-green-50 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-lg font-medium text-green-700">No high-risk items detected</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Storage Chart and Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur-sm lg:col-span-2">
          <h2 className="mb-6 text-xl font-bold text-gray-800">Storage Usage by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={storageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {storageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value} MB`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value: string) => {
                  const dataEntry = storageData.find(d => d.name === value);
                  return `${value} (${dataEntry?.value || 0}MB)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-bold text-gray-800">Quick Actions</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={handleClearAllTracking}
              className="group flex items-center gap-3 rounded-2xl bg-red-50 px-5 py-4 text-left font-semibold text-red-700 hover:bg-red-100"
            >
              <div className="rounded-lg bg-red-100 p-2">
                <Trash2 className="h-5 w-5" />
              </div>
              <span>Clear All Tracking</span>
            </button>

            <button
              onClick={handleExportData}
              className="group flex items-center gap-3 rounded-2xl bg-blue-50 px-5 py-4 text-left font-semibold text-blue-700 hover:bg-blue-100"
            >
              <div className="rounded-lg bg-blue-100 p-2">
                <Download className="h-5 w-5" />
              </div>
              <span>Export Data</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="group flex items-center gap-3 rounded-2xl bg-gray-50 px-5 py-4 text-left font-semibold text-gray-700 hover:bg-gray-100"
            >
              <div className="rounded-lg bg-gray-100 p-2">
                <Settings className="h-5 w-5" />
              </div>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Learn About Privacy Card */}
      <div className="mt-6 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-lg">
        <div className="rounded-[22px] bg-white/95 p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 p-4">
                <Lightbulb className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">New to Online Privacy?</h3>
                <p className="text-gray-600">
                  Learn how cookies work and why companies track you across the web
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('learn')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <BookOpen className="h-5 w-5" />
              <span>Learn More</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur-sm">
              <Shield className="h-10 w-10 text-[#8b5cf6]" />
            </div>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">Insight</h1>
          </div>
          <p className="text-xl text-white/90 drop-shadow">Take Control of Your Data</p>
        </header>

        {/* Connection Status */}
        {isConnected ? (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className="h-5 w-5 text-white" />
                <div>
                  <p className="font-semibold text-white">Extension Connected</p>
                  <p className="text-sm text-white/90">
                    Real browser data {lastUpdated && `• Updated ${new Date(lastUpdated).toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
              <button onClick={refresh} className="rounded-lg bg-white/20 px-3 py-2 text-white hover:bg-white/30">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-white" />
              <div>
                <p className="font-semibold text-white">Extension Not Connected</p>
                <p className="text-sm text-white/90">Install the extension for real browser data</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur-sm">
          <div className="mb-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
            Navigate to:
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700 hover:shadow-md'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scan Button (show on Overview) */}
        {activeTab === 'overview' && (
          <div className="mb-8 flex justify-center">
            <button
              onClick={handleScan}
              disabled={isScanning || loading}
              className="group flex items-center gap-3 rounded-full bg-white px-8 py-4 text-lg font-semibold text-[#8b5cf6] shadow-xl hover:scale-105 hover:shadow-2xl disabled:opacity-70"
            >
              {isScanning || loading ? (
                <>
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#8b5cf6] border-t-transparent"></div>
                  <span>{loading ? 'Loading...' : 'Scanning...'}</span>
                </>
              ) : (
                <>
                  {isConnected ? <RefreshCw className="h-6 w-6" /> : <Search className="h-6 w-6" />}
                  <span>{isConnected ? 'Refresh Data' : 'Scan Storage'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'overview' && renderOverview()}

          {activeTab === 'domains' && (
            <DomainExplorer
              data={extensionData}
              onDeleteDomain={handleDeleteDomain}
              onViewDomainDetails={handleViewDomainDetails}
            />
          )}

          {activeTab === 'cookies' && (
            <CookieBrowser
              data={extensionData}
              onDeleteCookies={handleDeleteCookies}
            />
          )}

          {activeTab === 'trackers' && (
            <TrackerAttribution
              data={extensionData}
              onDeleteCompanyTrackers={handleDeleteCompanyTrackers}
            />
          )}

          {activeTab === 'history' && (
            <HistoricalTrends
              scans={historicalScans}
              currentData={extensionData}
            />
          )}

          {activeTab === 'storage' && (
            <StorageDetails
              data={extensionData}
              onClearDomainStorage={handleClearDomainStorage}
              onClearIndexedDB={handleClearIndexedDB}
              onDeleteKey={handleDeleteKey}
            />
          )}

          {activeTab === 'compare' && (
            <ComparisonView
              currentData={extensionData}
              snapshots={snapshots}
              onSaveSnapshot={handleSaveSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
            />
          )}

          {activeTab === 'settings' && (
            <ControlPanel
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onClearHistory={handleClearHistory}
              onExportSettings={handleExportSettings}
              onImportSettings={handleImportSettings}
            />
          )}

          {activeTab === 'learn' && (
            <LearnPrivacy />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="mb-3 text-sm text-white/80">
            Insight helps you understand and manage your browser storage for better privacy
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/70">
            <a href="/storageinsight-extension/SETUP.md" target="_blank" className="hover:text-white">
              Extension Setup
            </a>
            <span>•</span>
            <a href="/storageinsight-extension/PERMISSIONS.md" target="_blank" className="hover:text-white">
              Privacy & Permissions
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
