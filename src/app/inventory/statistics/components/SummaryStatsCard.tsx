"use client";

import { Card, CardContent } from "@/components/ui/card";

interface SummaryStatsProps {
  stats: {
    total_transactions: number;
    total_in: number;
    total_out: number;
    total_adjustments: number;
    total_returns: number;
    net_change: number;
    total_cost_value: number;
  } | null;
}

export default function SummaryStatsCard({ stats }: SummaryStatsProps) {
  if (!stats) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(num);
  };

  return (
    <Card>
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Inventory Overview</h2>
        <p className="text-sm text-gray-500">Summary of all inventory transactions</p>
      </div>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-700 text-sm font-medium">Total In</p>
            <p className="text-2xl font-bold">{formatNumber(stats.total_in)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-red-700 text-sm font-medium">Total Out</p>
            <p className="text-2xl font-bold">{formatNumber(stats.total_out)}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700 text-sm font-medium">Net Change</p>
            <p className="text-2xl font-bold">{formatNumber(stats.net_change)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-purple-700 text-sm font-medium">Total Value</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.total_cost_value)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 text-sm font-medium">Total Transactions</p>
            <p className="text-xl font-bold">{formatNumber(stats.total_transactions)}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-700 text-sm font-medium">Adjustments</p>
            <p className="text-xl font-bold">{formatNumber(stats.total_adjustments)}</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg">
            <p className="text-teal-700 text-sm font-medium">Returns</p>
            <p className="text-xl font-bold">{formatNumber(stats.total_returns)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}