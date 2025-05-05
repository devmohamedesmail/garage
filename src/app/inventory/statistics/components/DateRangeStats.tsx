"use client";

import { useState, useEffect } from "react";
import garageApi from "@/services/api";

interface DateRangeStatsProps {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

interface DailyStats {
  transaction_date: string;
  transaction_count: number;
  total_in: number;
  total_out: number;
  net_change: number;
  total_cost_value: number;
}

export default function DateRangeStats({ dateRange }: DateRangeStatsProps) {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only fetch if we have both dates
    if (!dateRange.from || !dateRange.to) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Format dates as ISO strings for the API
        const startDate = dateRange.from.toISOString().split('T')[0];
        const endDate = dateRange.to.toISOString().split('T')[0];
        
        const response = await garageApi.get(
          `/inventory/statistics/by-date-range?startDate=${startDate}&endDate=${endDate}`
        );
        
        if (!response.data) {
          throw new Error(`Error: Failed to load date range statistics`);
        }
        
        setStats(response.data);
      } catch (err) {
        setError(err.message || "Failed to load date range statistics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (loading) {
    return <div className="text-center py-10">Loading date range statistics...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  if (stats.length === 0) {
    return <div className="text-center py-10">No data available for the selected date range</div>;
  }

  // Sort data by date for the chart
  const sortedStats = [...stats].sort((a, b) => 
    new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate totals for the summary
  const totalIn = stats.reduce((sum, stat) => sum + stat.total_in, 0);
  const totalOut = stats.reduce((sum, stat) => sum + stat.total_out, 0);
  const totalNetChange = stats.reduce((sum, stat) => sum + stat.net_change, 0);
  const totalValue = stats.reduce((sum, stat) => sum + stat.total_cost_value, 0);

  // Format currency
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(num);
  };

  // Calculate maximum values for visualizing data
  const maxIn = Math.max(...stats.map(s => s.total_in));
  const maxOut = Math.max(...stats.map(s => s.total_out));
  const absMaxNetChange = Math.max(...stats.map(s => Math.abs(s.net_change)));

  return (
    <div>
      <div className="mb-6 p-4 bg-gray-50 rounded-md grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <h3 className="text-sm text-gray-500">Total In</h3>
          <p className="text-xl font-semibold text-green-600">{Math.round(totalIn)}</p>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">Total Out</h3>
          <p className="text-xl font-semibold text-red-600">{Math.round(totalOut)}</p>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">Net Change</h3>
          <p className={`text-xl font-semibold ${totalNetChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.round(totalNetChange)}
          </p>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">Total Value</h3>
          <p className="text-xl font-semibold">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Visual representation of data using CSS only */}
      <div className="mb-8 overflow-x-auto">
        <div className="min-w-[800px]">
          <h3 className="text-lg font-medium mb-4">Inventory Movement Over Time</h3>
          <div className="space-y-6">
            {sortedStats.map((stat) => (
              <div key={stat.transaction_date} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{formatDate(stat.transaction_date)}</span>
                  <span>{stat.transaction_count} transactions</span>
                </div>
                
                <div className="flex space-x-2 items-center text-sm">
                  <span className="w-20">In:</span>
                  <div className="flex-grow bg-gray-100 h-6 relative">
                    <div 
                      className="bg-green-500 h-6"
                      style={{ width: `${(stat.total_in / maxIn * 100) || 0}%` }}
                    ></div>
                    <span className="absolute right-2 top-0.5 text-xs">{Math.round(stat.total_in)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 items-center text-sm">
                  <span className="w-20">Out:</span>
                  <div className="flex-grow bg-gray-100 h-6 relative">
                    <div 
                      className="bg-red-500 h-6"
                      style={{ width: `${(stat.total_out / maxOut * 100) || 0}%` }}
                    ></div>
                    <span className="absolute right-2 top-0.5 text-xs">{Math.round(stat.total_out)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 items-center text-sm">
                  <span className="w-20">Net:</span>
                  <div className="flex-grow bg-gray-100 h-6 relative flex items-center">
                    <div className="w-1/2 flex justify-end">
                      {stat.net_change < 0 && (
                        <div 
                          className="bg-red-500 h-6"
                          style={{ 
                            width: `${(Math.abs(stat.net_change) / absMaxNetChange * 50) || 0}%` 
                          }}
                        ></div>
                      )}
                    </div>
                    <div className="w-0 h-full border-r border-gray-400"></div>
                    <div className="w-1/2">
                      {stat.net_change > 0 && (
                        <div 
                          className="bg-blue-500 h-6"
                          style={{ 
                            width: `${(Math.abs(stat.net_change) / absMaxNetChange * 50) || 0}%` 
                          }}
                        ></div>
                      )}
                    </div>
                    <span className="absolute right-2 top-0.5 text-xs">
                      {stat.net_change > 0 ? "+" : ""}{Math.round(stat.net_change)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">In</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Out</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStats.map((stat) => (
              <tr key={stat.transaction_date}>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(stat.transaction_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{stat.transaction_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">{Math.round(stat.total_in)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">{Math.round(stat.total_out)}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-right ${stat.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.round(stat.net_change)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(stat.total_cost_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}