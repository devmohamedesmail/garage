"use client";

import { useState, useEffect } from "react";
import garageApi from "@/services/api";

interface TransactionTypeStats {
  transaction_type: string;
  transaction_count: number;
  total_quantity: number;
  average_quantity: number;
  first_transaction: string;
  last_transaction: string;
  total_cost_value: number;
}

export default function StatsByTypeChart() {
  const [stats, setStats] = useState<TransactionTypeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await garageApi.get("/inventory/statistics/by-type");
        if (!response.data) {
          throw new Error(`Error: Failed to load transaction statistics`);
        }
        setStats(response.data);
      } catch (err) {
        setError(err.message || "Failed to load transaction type statistics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading transaction statistics...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(num);
  };

  // Get the max value for scaling the bar chart
  const maxCount = Math.max(...stats.map(stat => stat.transaction_count));
  const maxQuantity = Math.max(...stats.map(stat => stat.total_quantity));

  return (
    <div>
      {/* Simple CSS-based bar chart */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Transaction Distribution</h3>
        
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.transaction_type} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">{stat.transaction_type}</span>
                <span>{stat.transaction_count} transactions</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${(stat.transaction_count / maxCount) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Quantity: {Math.round(stat.total_quantity)}</span>
                <span className="text-sm text-gray-500">
                  {((stat.total_quantity / stats.reduce((sum, s) => sum + s.total_quantity, 0)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(stat.total_quantity / maxQuantity) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Transaction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Transaction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.map((stat) => (
              <tr key={stat.transaction_type}>
                <td className="px-6 py-4 whitespace-nowrap">{stat.transaction_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{stat.transaction_count}</td>
                <td className="px-6 py-4 whitespace-nowrap">{Math.round(stat.total_quantity)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {typeof stat.average_quantity === 'number' ? stat.average_quantity.toFixed(2) : '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(stat.first_transaction)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(stat.last_transaction)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(stat.total_cost_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}