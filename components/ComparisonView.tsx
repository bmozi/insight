'use client';

import React, { useState, useMemo } from 'react';
import {
  Camera,
  GitCompare,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Users,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ComparisonSnapshot, ComparisonResult } from '@/lib/types';

interface ComparisonViewProps {
  currentData: any;
  snapshots: ComparisonSnapshot[];
  onSaveSnapshot: (name: string) => void;
  onDeleteSnapshot: (id: string) => void;
}

type SnapshotOption = 'current' | string;

export default function ComparisonView({
  currentData,
  snapshots,
  onSaveSnapshot,
  onDeleteSnapshot,
}: ComparisonViewProps) {
  const [snapshotName, setSnapshotName] = useState('');
  const [beforeSnapshot, setBeforeSnapshot] = useState<SnapshotOption | null>(null);
  const [afterSnapshot, setAfterSnapshot] = useState<SnapshotOption>('current');
  const [showNameInput, setShowNameInput] = useState(false);

  // Convert current data to snapshot format
  const currentSnapshot = useMemo((): ComparisonSnapshot | null => {
    if (!currentData || !currentData._privacyAnalysis) return null;

    const analysis = currentData._privacyAnalysis;
    const summary = currentData.summary;

    // Extract unique domains
    const domains: string[] = currentData.cookies?.cookies
      ? Array.from(new Set(currentData.cookies.cookies.map((c: any) => c.domain as string)))
      : [];

    // Extract tracker names (simplified)
    const trackers: string[] = currentData.cookies?.cookies
      ? currentData.cookies.cookies
          .filter((c: any) => c.isTracking || c.category !== 'essential')
          .map((c: any) => c.name as string)
      : [];

    // Handle privacyScore being either a number or an object with score property
    const score = typeof analysis.privacyScore === 'object'
      ? analysis.privacyScore.score
      : analysis.privacyScore;

    return {
      id: 'current',
      name: 'Current State',
      timestamp: Date.now(),
      privacyScore: score || 0,
      metrics: {
        totalCookies: summary.cookieCount,
        trackingCookies: Object.values(analysis.breakdown).reduce((sum: number, val) => {
          if (typeof val === 'number') return sum + val;
          return sum;
        }, 0) - (analysis.breakdown.essential || 0),
        uniqueDomains: summary.uniqueDomains,
        totalStorageMB: parseFloat(summary.totalSizeMB),
      },
      breakdown: {
        analytics: analysis.breakdown.analytics || 0,
        advertising: analysis.breakdown.advertising || 0,
        social: analysis.breakdown.social || 0,
        fingerprinting: analysis.breakdown.fingerprinting || 0,
      },
      domains,
      trackers,
    };
  }, [currentData]);

  // Calculate comparison result
  const comparisonResult = useMemo((): ComparisonResult | null => {
    if (!beforeSnapshot || !afterSnapshot) return null;

    const before =
      beforeSnapshot === 'current'
        ? currentSnapshot
        : snapshots.find((s) => s.id === beforeSnapshot);
    const after =
      afterSnapshot === 'current'
        ? currentSnapshot
        : snapshots.find((s) => s.id === afterSnapshot);

    if (!before || !after) return null;

    // Calculate changes
    const domainsAdded = after.domains.filter((d) => !before.domains.includes(d));
    const domainsRemoved = before.domains.filter((d) => !after.domains.includes(d));
    const trackersAdded = after.trackers.filter((t) => !before.trackers.includes(t));
    const trackersRemoved = before.trackers.filter((t) => !after.trackers.includes(t));

    return {
      before,
      after,
      changes: {
        scoreChange: after.privacyScore - before.privacyScore,
        cookiesAdded: Math.max(0, after.metrics.totalCookies - before.metrics.totalCookies),
        cookiesRemoved: Math.max(0, before.metrics.totalCookies - after.metrics.totalCookies),
        domainsAdded,
        domainsRemoved,
        trackersAdded,
        trackersRemoved,
        storageChange: after.metrics.totalStorageMB - before.metrics.totalStorageMB,
      },
    };
  }, [beforeSnapshot, afterSnapshot, currentSnapshot, snapshots]);

  // Handle save snapshot
  const handleSaveSnapshot = () => {
    if (snapshotName.trim() && currentSnapshot) {
      onSaveSnapshot(snapshotName.trim());
      setSnapshotName('');
      setShowNameInput(false);
    }
  };

  // Quick comparison with last snapshot
  const handleCompareWithLast = () => {
    if (snapshots.length > 0) {
      setBeforeSnapshot(snapshots[0].id);
      setAfterSnapshot('current');
    }
  };

  // Chart data for comparison
  const chartData = useMemo(() => {
    if (!comparisonResult) return [];

    return [
      {
        name: 'Total Cookies',
        Before: comparisonResult.before.metrics.totalCookies,
        After: comparisonResult.after.metrics.totalCookies,
      },
      {
        name: 'Tracking',
        Before: comparisonResult.before.metrics.trackingCookies,
        After: comparisonResult.after.metrics.trackingCookies,
      },
      {
        name: 'Domains',
        Before: comparisonResult.before.metrics.uniqueDomains,
        After: comparisonResult.after.metrics.uniqueDomains,
      },
      {
        name: 'Storage (MB)',
        Before: Math.round(comparisonResult.before.metrics.totalStorageMB * 10) / 10,
        After: Math.round(comparisonResult.after.metrics.totalStorageMB * 10) / 10,
      },
    ];
  }, [comparisonResult]);

  // Benchmark data (mock)
  const benchmarkData = useMemo(() => {
    if (!currentSnapshot) return null;

    return {
      average: {
        privacyScore: 65,
        totalCookies: 150,
        trackingCookies: 75,
        uniqueDomains: 45,
      },
      privacyFocused: {
        privacyScore: 85,
        totalCookies: 50,
        trackingCookies: 10,
        uniqueDomains: 15,
      },
      current: {
        privacyScore: currentSnapshot.privacyScore,
        totalCookies: currentSnapshot.metrics.totalCookies,
        trackingCookies: currentSnapshot.metrics.trackingCookies,
        uniqueDomains: currentSnapshot.metrics.uniqueDomains,
      },
    };
  }, [currentSnapshot]);

  // Show help message when no data or snapshots
  if (!currentData && snapshots.length === 0) {
    return (
      <div className="rounded-3xl bg-white/95 p-12 text-center shadow-lg backdrop-blur-sm">
        <GitCompare className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 text-xl font-bold text-gray-600">No Comparison Data</h3>
        <p className="text-gray-500 mb-4">
          You can save snapshots of your privacy state and compare them over time.
        </p>
        <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 text-sm text-purple-700">
          <span>💡</span>
          <span>Run a scan first, then come back here to save a snapshot</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comparison Views</h2>
          <p className="text-gray-600 mt-1">
            Compare snapshots to track privacy improvements over time
          </p>
        </div>
      </div>

      {/* Snapshot Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Saved Snapshots
          </h3>
          <button
            onClick={() => setShowNameInput(!showNameInput)}
            disabled={!currentData || snapshots.length >= 10}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Save Current Snapshot
          </button>
        </div>

        {/* Snapshot name input */}
        {showNameInput && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="Enter snapshot name (e.g., 'After cleanup')"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSnapshot()}
                autoFocus
              />
              <button
                onClick={handleSaveSnapshot}
                disabled={!snapshotName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setShowNameInput(false);
                  setSnapshotName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Snapshots list */}
        <div className="space-y-2">
          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No snapshots saved yet</p>
              <p className="text-sm mt-1">Save a snapshot to start tracking changes</p>
            </div>
          ) : (
            snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{snapshot.name}</h4>
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        snapshot.privacyScore >= 80
                          ? 'bg-green-100 text-green-800'
                          : snapshot.privacyScore >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      Score: {snapshot.privacyScore}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>{new Date(snapshot.timestamp).toLocaleString()}</span>
                    <span>{snapshot.metrics.totalCookies} cookies</span>
                    <span>{snapshot.metrics.trackingCookies} tracking</span>
                    <span>{snapshot.metrics.uniqueDomains} domains</span>
                    <span>{snapshot.metrics.totalStorageMB.toFixed(2)} MB</span>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteSnapshot(snapshot.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete snapshot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {snapshots.length >= 10 && (
          <p className="text-sm text-amber-600 mt-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Maximum snapshots reached. Delete old snapshots to save new ones.
          </p>
        )}
      </div>

      {/* Comparison Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <GitCompare className="w-5 h-5" />
          Compare Snapshots
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Before</label>
            <select
              value={beforeSnapshot || ''}
              onChange={(e) => setBeforeSnapshot(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select snapshot...</option>
              {currentSnapshot && <option value="current">Current State</option>}
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {new Date(s.timestamp).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* After */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">After</label>
            <select
              value={afterSnapshot || ''}
              onChange={(e) => setAfterSnapshot(e.target.value as SnapshotOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {currentSnapshot && <option value="current">Current State</option>}
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {new Date(s.timestamp).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleCompareWithLast}
            disabled={snapshots.length === 0 || !currentSnapshot}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Compare with Last Scan
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {comparisonResult && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Before</h4>
                <span className="text-sm text-gray-600">
                  {new Date(comparisonResult.before.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-4">
                {comparisonResult.before.privacyScore}
                <span className="text-sm font-normal text-gray-600 ml-2">Privacy Score</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Cookies</p>
                  <p className="font-semibold">{comparisonResult.before.metrics.totalCookies}</p>
                </div>
                <div>
                  <p className="text-gray-600">Tracking</p>
                  <p className="font-semibold">
                    {comparisonResult.before.metrics.trackingCookies}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Domains</p>
                  <p className="font-semibold">
                    {comparisonResult.before.metrics.uniqueDomains}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Storage</p>
                  <p className="font-semibold">
                    {comparisonResult.before.metrics.totalStorageMB.toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            {/* After Card with Change Indicators */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">After</h4>
                <span className="text-sm text-gray-600">
                  {new Date(comparisonResult.after.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  {comparisonResult.after.privacyScore}
                  <span className="text-sm font-normal text-gray-600 ml-2">Privacy Score</span>
                </div>
                {comparisonResult.changes.scoreChange !== 0 && (
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${
                      comparisonResult.changes.scoreChange > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {comparisonResult.changes.scoreChange > 0 ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    {Math.abs(comparisonResult.changes.scoreChange)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Cookies</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{comparisonResult.after.metrics.totalCookies}</p>
                    {comparisonResult.changes.cookiesAdded > 0 && (
                      <span className="text-red-600 text-xs">
                        +{comparisonResult.changes.cookiesAdded}
                      </span>
                    )}
                    {comparisonResult.changes.cookiesRemoved > 0 && (
                      <span className="text-green-600 text-xs">
                        -{comparisonResult.changes.cookiesRemoved}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-600">Tracking</p>
                  <p className="font-semibold">{comparisonResult.after.metrics.trackingCookies}</p>
                </div>
                <div>
                  <p className="text-gray-600">Domains</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {comparisonResult.after.metrics.uniqueDomains}
                    </p>
                    {comparisonResult.changes.domainsAdded.length > 0 && (
                      <span className="text-red-600 text-xs">
                        +{comparisonResult.changes.domainsAdded.length}
                      </span>
                    )}
                    {comparisonResult.changes.domainsRemoved.length > 0 && (
                      <span className="text-green-600 text-xs">
                        -{comparisonResult.changes.domainsRemoved.length}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-600">Storage</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {comparisonResult.after.metrics.totalStorageMB.toFixed(2)} MB
                    </p>
                    {comparisonResult.changes.storageChange !== 0 && (
                      <span
                        className={`text-xs ${
                          comparisonResult.changes.storageChange > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {comparisonResult.changes.storageChange > 0 ? '+' : ''}
                        {comparisonResult.changes.storageChange.toFixed(2)} MB
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net Change Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    comparisonResult.changes.scoreChange > 0
                      ? 'text-green-600'
                      : comparisonResult.changes.scoreChange < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {comparisonResult.changes.scoreChange > 0 && '+'}
                  {comparisonResult.changes.scoreChange}
                </div>
                <div className="text-sm text-gray-600 mt-1">Score Change</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {comparisonResult.changes.trackersRemoved.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Trackers Removed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {comparisonResult.changes.trackersAdded.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Trackers Added</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {comparisonResult.changes.domainsRemoved.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Domains Removed</div>
              </div>
            </div>
            {comparisonResult.changes.scoreChange > 0 && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg text-green-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">
                  Privacy improved by {comparisonResult.changes.scoreChange} points!
                </span>
              </div>
            )}
            {comparisonResult.changes.scoreChange < 0 && (
              <div className="mt-4 p-3 bg-red-100 rounded-lg text-red-800 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                <span className="font-medium">
                  Privacy decreased by {Math.abs(comparisonResult.changes.scoreChange)} points
                </span>
              </div>
            )}
            {comparisonResult.changes.scoreChange === 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-gray-800 flex items-center gap-2">
                <Minus className="w-5 h-5" />
                <span className="font-medium">No change in privacy score</span>
              </div>
            )}
          </div>

          {/* Visual Comparison Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Before" fill="#94a3b8" />
                <Bar dataKey="After" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Changes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trackers Removed */}
            {comparisonResult.changes.trackersRemoved.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Trackers Removed ({comparisonResult.changes.trackersRemoved.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comparisonResult.changes.trackersRemoved.slice(0, 10).map((tracker, idx) => (
                    <div key={idx} className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                      {tracker}
                    </div>
                  ))}
                  {comparisonResult.changes.trackersRemoved.length > 10 && (
                    <p className="text-sm text-gray-500 italic">
                      +{comparisonResult.changes.trackersRemoved.length - 10} more...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Trackers Added */}
            {comparisonResult.changes.trackersAdded.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-6">
                <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Trackers Added ({comparisonResult.changes.trackersAdded.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comparisonResult.changes.trackersAdded.slice(0, 10).map((tracker, idx) => (
                    <div key={idx} className="text-sm text-gray-700 bg-orange-50 p-2 rounded">
                      {tracker}
                    </div>
                  ))}
                  {comparisonResult.changes.trackersAdded.length > 10 && (
                    <p className="text-sm text-gray-500 italic">
                      +{comparisonResult.changes.trackersAdded.length - 10} more...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Domains Removed */}
            {comparisonResult.changes.domainsRemoved.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Domains Removed ({comparisonResult.changes.domainsRemoved.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comparisonResult.changes.domainsRemoved.map((domain, idx) => (
                    <div key={idx} className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                      {domain}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Domains Added */}
            {comparisonResult.changes.domainsAdded.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-6">
                <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Domains Added ({comparisonResult.changes.domainsAdded.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comparisonResult.changes.domainsAdded.map((domain, idx) => (
                    <div key={idx} className="text-sm text-gray-700 bg-orange-50 p-2 rounded">
                      {domain}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Benchmark Comparison */}
      {benchmarkData && currentSnapshot && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Benchmark Comparison</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Your Browser */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Your Browser</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Privacy Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {benchmarkData.current.privacyScore}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Cookies</p>
                    <p className="font-semibold">{benchmarkData.current.totalCookies}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tracking</p>
                    <p className="font-semibold">{benchmarkData.current.trackingCookies}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Average User */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Average User</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Privacy Score</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {benchmarkData.average.privacyScore}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Cookies</p>
                    <p className="font-semibold">{benchmarkData.average.totalCookies}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tracking</p>
                    <p className="font-semibold">{benchmarkData.average.trackingCookies}</p>
                  </div>
                </div>
              </div>
              {benchmarkData.current.privacyScore > benchmarkData.average.privacyScore && (
                <div className="mt-3 text-xs text-green-600 font-medium">
                  You're {benchmarkData.current.privacyScore - benchmarkData.average.privacyScore}{' '}
                  points better!
                </div>
              )}
            </div>

            {/* Privacy-Focused User */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Privacy-Focused</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Privacy Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {benchmarkData.privacyFocused.privacyScore}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Cookies</p>
                    <p className="font-semibold">{benchmarkData.privacyFocused.totalCookies}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tracking</p>
                    <p className="font-semibold">{benchmarkData.privacyFocused.trackingCookies}</p>
                  </div>
                </div>
              </div>
              {benchmarkData.current.privacyScore < benchmarkData.privacyFocused.privacyScore && (
                <div className="mt-3 text-xs text-amber-600 font-medium">
                  {benchmarkData.privacyFocused.privacyScore - benchmarkData.current.privacyScore}{' '}
                  points to goal
                </div>
              )}
            </div>
          </div>

          {/* Benchmark insights */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Insights</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {benchmarkData.current.privacyScore > benchmarkData.average.privacyScore ? (
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  Your privacy is{' '}
                  {Math.round(
                    ((benchmarkData.current.privacyScore - benchmarkData.average.privacyScore) /
                      benchmarkData.average.privacyScore) *
                      100
                  )}
                  % better than average
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  Your privacy is below average. Consider clearing tracking cookies.
                </li>
              )}
              {benchmarkData.current.trackingCookies > benchmarkData.privacyFocused.trackingCookies && (
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  You could remove{' '}
                  {benchmarkData.current.trackingCookies -
                    benchmarkData.privacyFocused.trackingCookies}{' '}
                  more tracking cookies to reach privacy-focused level
                </li>
              )}
              {benchmarkData.current.privacyScore >= benchmarkData.privacyFocused.privacyScore && (
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  Excellent! You've reached privacy-focused user level
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
