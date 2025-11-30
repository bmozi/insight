'use client';

import { useMemo } from 'react';
import {
  LineChart,
  AreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  BarChart3,
  Activity,
  Award,
  AlertTriangle,
  Target,
} from 'lucide-react';
import type { ScanSnapshot } from '@/lib/types';

interface HistoricalTrendsProps {
  scans: ScanSnapshot[];
  currentData: any;
}

type TimeRange = '7days' | '30days' | 'all';

interface ChartDataPoint {
  timestamp: number;
  date: string;
  score: number;
  totalCookies: number;
  trackingCookies: number;
  storageMB: number;
  domains: number;
}

const getScoreColor = (score: number): string => {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Helper to extract numeric score from privacyScore which can be number or object
const extractScore = (privacyScore: any): number => {
  if (typeof privacyScore === 'number') return privacyScore;
  if (typeof privacyScore === 'object' && privacyScore !== null) {
    return privacyScore.score || 0;
  }
  return 0;
};

export default function HistoricalTrends({ scans, currentData }: HistoricalTrendsProps) {
  const [timeRange, setTimeRange] = useMemo(() => {
    let range: TimeRange = '30days';
    const setRange = (r: TimeRange) => { range = r; };
    return [range, setRange];
  }, []);

  // Filter scans by time range
  const filteredScans = useMemo(() => {
    if (!scans || scans.length === 0) return [];

    const now = Date.now();
    const cutoffs: Record<TimeRange, number> = {
      '7days': 7 * 24 * 60 * 60 * 1000,
      '30days': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    };

    return scans
      .filter(scan => now - scan.timestamp < cutoffs[timeRange])
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [scans, timeRange]);

  // Transform data for charts
  const chartData = useMemo((): ChartDataPoint[] => {
    return filteredScans.map(scan => {
      const date = new Date(scan.timestamp);
      const trackingCount = scan.breakdown ?
        (scan.breakdown.analytics || 0) +
        (scan.breakdown.advertising || 0) +
        (scan.breakdown.social || 0) +
        (scan.breakdown.fingerprinting || 0) :
        scan.trackingCookies || 0;

      return {
        timestamp: scan.timestamp,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: extractScore(scan.privacyScore),
        totalCookies: scan.totalCookies || 0,
        trackingCookies: trackingCount,
        storageMB: scan.totalStorageMB || 0,
        domains: scan.uniqueDomains || 0,
      };
    });
  }, [filteredScans]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (chartData.length === 0) {
      return {
        average: 0,
        best: 0,
        worst: 0,
        totalCookiesCleared: 0,
        trend: 'stable' as const,
      };
    }

    const scores = chartData.map(d => d.score);
    const average = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    const best = Math.max(...scores);
    const worst = Math.min(...scores);

    // Calculate trend
    const midpoint = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, midpoint || 1);
    const secondHalf = scores.slice(midpoint || 1);
    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;

    let trend: 'improving' | 'declining' | 'stable';
    if (diff > 5) trend = 'improving';
    else if (diff < -5) trend = 'declining';
    else trend = 'stable';

    // Approximate cookies cleared
    const totalCookiesCleared = chartData.reduce((sum, d, i) => {
      if (i === 0) return sum;
      const prev = chartData[i - 1];
      const cleared = Math.max(0, prev.totalCookies - d.totalCookies);
      return sum + cleared;
    }, 0);

    return { average, best, worst, totalCookiesCleared, trend };
  }, [chartData]);

  // Detect changes between last two scans
  const changeDetection = useMemo(() => {
    if (filteredScans.length < 2) {
      return { scoreChange: 0, cookieChange: 0, storageChange: 0 };
    }

    const current = filteredScans[filteredScans.length - 1];
    const previous = filteredScans[filteredScans.length - 2];

    return {
      scoreChange: extractScore(current.privacyScore) - extractScore(previous.privacyScore),
      cookieChange: (current.totalCookies || 0) - (previous.totalCookies || 0),
      storageChange: (current.totalStorageMB || 0) - (previous.totalStorageMB || 0),
    };
  }, [filteredScans]);

  // Custom tooltips
  const ScoreTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const fullDate = new Date(data.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-lg">
          <p className="text-sm text-gray-600 mb-1">{fullDate}</p>
          <p className="text-lg font-semibold text-gray-900">
            Score: <span className={getScoreColor(data.score)}>{data.score}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CookieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-lg">
          <p className="text-sm text-gray-600 mb-2">{data.date}</p>
          <p className="text-xs"><span className="font-medium text-blue-600">Total Cookies:</span> {data.totalCookies}</p>
          <p className="text-xs"><span className="font-medium text-red-600">Tracking:</span> {data.trackingCookies}</p>
        </div>
      );
    }
    return null;
  };

  if (!scans || scans.length === 0) {
    return (
      <div className="rounded-3xl bg-white/95 p-8 shadow-lg backdrop-blur-sm">
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Historical Data</h3>
          <p className="text-gray-500">
            Scan your browser storage to start tracking privacy trends over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end gap-2">
        {(['7days', '30days', 'all'] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => {}}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              timeRange === range
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/95 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-white/95 p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600">Average</span>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(statistics.average)}`}>
            {statistics.average}
          </p>
        </div>

        <div className="rounded-2xl bg-white/95 p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Best</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{statistics.best}</p>
        </div>

        <div className="rounded-2xl bg-white/95 p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-600">Worst</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{statistics.worst}</p>
        </div>

        <div className="rounded-2xl bg-white/95 p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Cleared</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{statistics.totalCookiesCleared}</p>
        </div>

        <div className="rounded-2xl bg-white/95 p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            {statistics.trend === 'improving' ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : statistics.trend === 'declining' ? (
              <TrendingDown className="h-5 w-5 text-red-600" />
            ) : (
              <Minus className="h-5 w-5 text-gray-600" />
            )}
            <span className="text-sm text-gray-600">Trend</span>
          </div>
          <p className={`text-lg font-bold capitalize ${
            statistics.trend === 'improving' ? 'text-green-600' :
            statistics.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {statistics.trend}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Privacy Score Trend */}
        <div className="rounded-3xl bg-white/95 p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Privacy Score Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip content={<ScoreTooltip />} />
              <ReferenceLine y={70} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Good', position: 'right', fontSize: 10 }} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Fair', position: 'right', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cookie Count Trend */}
        <div className="rounded-3xl bg-white/95 p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Cookie Trends
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip content={<CookieTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalCookies"
                name="Total"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="trackingCookies"
                name="Tracking"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Change Detection Panel */}
      <div className="rounded-3xl bg-white/95 p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-600" />
          Changes Since Last Scan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`rounded-xl p-4 ${changeDetection.scoreChange > 0 ? 'bg-green-50 border border-green-200' : changeDetection.scoreChange < 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="text-sm text-gray-600 mb-1">Score Change</p>
            <div className="flex items-center gap-2">
              {changeDetection.scoreChange > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : changeDetection.scoreChange < 0 ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <Minus className="h-5 w-5 text-gray-600" />
              )}
              <span className={`text-xl font-bold ${changeDetection.scoreChange > 0 ? 'text-green-600' : changeDetection.scoreChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {changeDetection.scoreChange > 0 ? '+' : ''}{changeDetection.scoreChange}
              </span>
            </div>
          </div>

          <div className={`rounded-xl p-4 ${changeDetection.cookieChange < 0 ? 'bg-green-50 border border-green-200' : changeDetection.cookieChange > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="text-sm text-gray-600 mb-1">Cookie Change</p>
            <div className="flex items-center gap-2">
              {changeDetection.cookieChange < 0 ? (
                <TrendingDown className="h-5 w-5 text-green-600" />
              ) : changeDetection.cookieChange > 0 ? (
                <TrendingUp className="h-5 w-5 text-orange-600" />
              ) : (
                <Minus className="h-5 w-5 text-gray-600" />
              )}
              <span className={`text-xl font-bold ${changeDetection.cookieChange < 0 ? 'text-green-600' : changeDetection.cookieChange > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                {changeDetection.cookieChange > 0 ? '+' : ''}{changeDetection.cookieChange}
              </span>
            </div>
          </div>

          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Storage Change</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-600">
                {changeDetection.storageChange > 0 ? '+' : ''}{changeDetection.storageChange.toFixed(2)} MB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scan History */}
      <div className="rounded-3xl bg-white/95 p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          Recent Scans ({filteredScans.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredScans.slice().reverse().slice(0, 10).map((scan, index) => (
            <div
              key={scan.id || index}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getScoreBgColor(extractScore(scan.privacyScore))}`} />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(scan.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {scan.totalCookies} cookies • {scan.uniqueDomains} domains
                  </p>
                </div>
              </div>
              <div className={`text-lg font-bold ${getScoreColor(extractScore(scan.privacyScore))}`}>
                {extractScore(scan.privacyScore)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
