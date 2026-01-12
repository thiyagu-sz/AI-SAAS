'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, TrendingUp, Users, MessageSquare, ArrowUp } from 'lucide-react';

interface FeedbackStats {
  total: number;
  averageRating: number;
  categoryBreakdown: Record<string, number>;
  recentFeedback: any[];
}

export default function FeedbackAnalyticsDashboard() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/feedback', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const CATEGORY_COLORS: Record<string, string> = {
    bug: 'bg-red-500/20',
    feature: 'bg-blue-500/20',
    improvement: 'bg-purple-500/20',
    experience: 'bg-green-500/20',
    performance: 'bg-yellow-500/20',
    documentation: 'bg-pink-500/20',
    other: 'bg-gray-500/20',
  };

  const CATEGORY_BORDER: Record<string, string> = {
    bug: 'border-red-500/30',
    feature: 'border-blue-500/30',
    improvement: 'border-purple-500/30',
    experience: 'border-green-500/30',
    performance: 'border-yellow-500/30',
    documentation: 'border-pink-500/30',
    other: 'border-gray-500/30',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#667eea]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-200 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Error Loading Feedback Analytics</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const categoryEntries = stats ? Object.entries(stats.categoryBreakdown) : [];
  const maxCount = categoryEntries.length > 0 ? Math.max(...categoryEntries.map(([, count]) => count)) : 0;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Feedback Analytics</h1>
          <p className="text-gray-400">Monitor user feedback and satisfaction metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Feedback */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Feedback</p>
                <p className="text-3xl font-bold">{stats?.total || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-[#667eea] opacity-50" />
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Average Rating</p>
                <p className="text-3xl font-bold">{stats?.averageRating || 0}</p>
                <p className="text-xs text-gray-500 mt-1">out of 5</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#667eea] opacity-50" />
            </div>
          </div>

          {/* Satisfaction Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Status</p>
                <p className={`text-3xl font-bold ${(stats?.averageRating || 0) >= 4 ? 'text-green-400' : (stats?.averageRating || 0) >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {(stats?.averageRating || 0) >= 4 ? '✓ Good' : (stats?.averageRating || 0) >= 3 ? '~ Fair' : '✗ Needs Work'}
                </p>
              </div>
              <Users className="w-8 h-8 text-[#667eea] opacity-50" />
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryEntries.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Feedback by Category</h2>
            <div className="space-y-4">
              {categoryEntries.map(([category, count]) => {
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
                const categoryBorder = CATEGORY_BORDER[category] || CATEGORY_BORDER.other;
                
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{category}</span>
                      <span className="text-xs text-gray-400">{count} feedback{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${categoryColor}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        {stats?.recentFeedback && stats.recentFeedback.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Recent Feedback</h2>
            <div className="space-y-4">
              {stats.recentFeedback.map((feedback, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 hover:border-[#667eea]/50 transition-colors ${
                    CATEGORY_BORDER[feedback.category] || CATEGORY_BORDER.other
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{feedback.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 capitalize">{feedback.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{'⭐'.repeat(feedback.rating)}</span>
                      <span className="text-xs text-gray-400 ml-2">{feedback.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">{feedback.message}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{feedback.email}</span>
                    <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!stats?.total && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No feedback collected yet</p>
            <p className="text-xs text-gray-500 mt-2">Feedback submissions will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
