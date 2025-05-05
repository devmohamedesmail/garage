"use client";

import { Card } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { FinancialData } from '../types';

interface FinancialMetricsCardsProps {
  financialData: FinancialData | null;
}

export function FinancialMetricsCards({ financialData }: FinancialMetricsCardsProps) {
  // Format currency for display
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'AED 0.00';
    }
    return new Intl.NumberFormat('en-AE', { 
      style: 'currency', 
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Function to determine the color class based on value (for profit)
  const getProfitColorClass = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'text-gray-600';
    }
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Make sure all numeric values are valid numbers
  const revenue = financialData?.revenue && !isNaN(financialData.revenue) ? financialData.revenue : 0;
  const expenses = financialData?.expenses && !isNaN(financialData.expenses) ? financialData.expenses : 0;
  const profit = financialData?.profit && !isNaN(financialData.profit) ? financialData.profit : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Revenue Card */}
      <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Revenue</h3>
          <div className="p-2 bg-blue-50 rounded-full text-blue-600">
            <DollarSign size={20} />
          </div>
        </div>
        <p className="text-3xl font-bold">
          {formatCurrency(revenue)}
        </p>
        <div className="text-sm text-gray-500 mt-2">
          {financialData?.filters?.startDate && financialData?.filters?.endDate ? (
            <span>
              {new Date(financialData.filters.startDate).toLocaleDateString()} - 
              {new Date(financialData.filters.endDate).toLocaleDateString()}
            </span>
          ) : (
            <span>All time</span>
          )}
        </div>
      </Card>

      {/* Expenses Card */}
      <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Expenses</h3>
          <div className="p-2 bg-amber-50 rounded-full text-amber-600">
            <TrendingDown size={20} />
          </div>
        </div>
        <p className="text-3xl font-bold">
          {formatCurrency(expenses)}
        </p>
        <div className="text-sm text-gray-500 mt-2">
          {financialData?.filters?.startDate && financialData?.filters?.endDate ? (
            <span>
              {new Date(financialData.filters.startDate).toLocaleDateString()} - 
              {new Date(financialData.filters.endDate).toLocaleDateString()}
            </span>
          ) : (
            <span>All time</span>
          )}
        </div>
      </Card>

      {/* Profit Card */}
      <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Net Profit</h3>
          <div className={`p-2 ${profit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} rounded-full`}>
            {profit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
        </div>
        <p className={`text-3xl font-bold ${getProfitColorClass(profit)}`}>
          {formatCurrency(profit)}
        </p>
        <div className="text-sm text-gray-500 mt-2">
          {financialData?.filters?.startDate && financialData?.filters?.endDate ? (
            <span>
              {new Date(financialData.filters.startDate).toLocaleDateString()} - 
              {new Date(financialData.filters.endDate).toLocaleDateString()}
            </span>
          ) : (
            <span>All time</span>
          )}
        </div>
      </Card>
    </div>
  );
}