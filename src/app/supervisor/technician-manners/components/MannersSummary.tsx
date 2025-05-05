'use client';

import React from 'react';

interface CategoryAverage {
  category: string;
  average_rating: number;
  evaluation_count: number;
}

interface RecentEvaluation {
  manners_id: number;
  category: string;
  rating: number;
  evaluation_date: string;
}

interface MannersSummaryProps {
  summary: {
    category_averages: CategoryAverage[];
    overall_average: number;
    recent_evaluations: RecentEvaluation[];
    technician_id: number;
  } | null;
  loading: boolean;
}

const MannersSummary: React.FC<MannersSummaryProps> = ({ summary, loading }) => {
  const getCategoryLabel = (category: string): string => {
    const categories: { [key: string]: string } = {
      punctuality: 'Punctuality',
      attitude: 'Attitude',
      communication: 'Communication',
      cleanliness: 'Cleanliness',
      overall: 'Overall Performance',
    };
    return categories[category] || category;
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return 'text-emerald-700';
    if (rating >= 3.5) return 'text-green-700';
    if (rating >= 2.5) return 'text-yellow-700';
    if (rating >= 1.5) return 'text-orange-700';
    return 'text-red-700';
  };

  const getProgressBarColor = (rating: number): string => {
    if (rating >= 4.5) return 'bg-emerald-500';
    if (rating >= 3.5) return 'bg-green-500';
    if (rating >= 2.5) return 'bg-yellow-500';
    if (rating >= 1.5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return <div className="py-4 text-center text-gray-500">Loading summary...</div>;
  }

  if (!summary) {
    return <div className="py-4 text-center text-gray-500">No evaluation data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-700">Overall Rating</h3>
        <div className="mt-2">
          <span className={`text-4xl font-bold ${getRatingColor(summary.overall_average)}`}>
            {summary.overall_average || 'N/A'}
          </span>
          <span className="text-lg text-gray-500"> / 5</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-3">By Category</h3>
        <div className="space-y-3">
          {summary.category_averages.map((cat) => (
            <div key={cat.category}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{getCategoryLabel(cat.category)}</span>
                <span className={`text-sm font-bold ${getRatingColor(cat.average_rating)}`}>
                  {cat.average_rating} ({cat.evaluation_count})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getProgressBarColor(cat.average_rating)} h-2 rounded-full`}
                  style={{ width: `${(cat.average_rating / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trend */}
      {summary.recent_evaluations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Recent Evaluations</h3>
          <div className="flex flex-wrap gap-2">
            {summary.recent_evaluations.map((evaluation) => (
              <div
                key={evaluation.manners_id}
                className="inline-flex flex-col items-center p-2 border rounded-md"
                title={`${getCategoryLabel(evaluation.category)}: ${evaluation.rating}/5`}
              >
                <span className={`text-lg font-bold ${getRatingColor(evaluation.rating)}`}>{evaluation.rating}</span>
                <span className="text-xs text-gray-500">{evaluation.category.substring(0, 1).toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MannersSummary;