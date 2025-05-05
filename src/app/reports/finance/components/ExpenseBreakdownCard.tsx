"use client";

import { Card } from '@/components/ui/card';
import { FinancialData } from '../types';
import { PieChart } from 'lucide-react';

interface ExpenseBreakdownCardProps {
  financialData: FinancialData | null;
}

export function ExpenseBreakdownCard({ financialData }: ExpenseBreakdownCardProps) {
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

  // Format percentage with NaN handling
  const formatPercentage = (part: number, total: number): string => {
    if (total === 0 || isNaN(part) || isNaN(total)) return '0%';
    return `${Math.round((part / total) * 100)}%`;
  };

  // Calculate width percentage safely
  const getWidthPercentage = (part: number, total: number): string => {
    if (total === 0 || isNaN(part) || isNaN(total)) return '0%';
    const percentage = (part / total) * 100;
    return `${percentage}%`;
  };

  // If no expense breakdown data, don't show anything
  if (!financialData) {
    return null;
  }

  // Get expense breakdown values with NaN protection
  const totalExpenses = financialData.expenses && !isNaN(financialData.expenses) ? financialData.expenses : 0;
  
  // If no expense breakdown or expenses is 0, show a message instead
  if (!financialData.expense_breakdown || totalExpenses === 0) {
    return (
      <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow mb-8">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Expense Breakdown</h3>
          <div className="p-2 bg-indigo-50 rounded-full text-indigo-600">
            <PieChart size={20} />
          </div>
        </div>
        <p className="text-gray-600">No expense data available for the selected period.</p>
      </Card>
    );
  }

  const regular_expenses = financialData.expense_breakdown.regular_expenses && 
                           !isNaN(financialData.expense_breakdown.regular_expenses) ? 
                           financialData.expense_breakdown.regular_expenses : 0;
  
  const inventory_purchases = financialData.expense_breakdown.inventory_purchases && 
                              !isNaN(financialData.expense_breakdown.inventory_purchases) ? 
                              financialData.expense_breakdown.inventory_purchases : 0;

  return (
    <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow mb-8">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Expense Breakdown</h3>
        <div className="p-2 bg-indigo-50 rounded-full text-indigo-600">
          <PieChart size={20} />
        </div>
      </div>

      <div className="space-y-4">
        {/* Regular Expenses */}
        <div className="flex flex-col">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Regular Expenses</span>
            <span className="text-sm font-medium text-gray-700">
              {formatPercentage(regular_expenses, totalExpenses)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: getWidthPercentage(regular_expenses, totalExpenses) }}
            ></div>
          </div>
          <span className="mt-1 text-sm text-gray-600">{formatCurrency(regular_expenses)}</span>
        </div>

        {/* Inventory Purchases */}
        <div className="flex flex-col">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Inventory Purchases</span>
            <span className="text-sm font-medium text-gray-700">
              {formatPercentage(inventory_purchases, totalExpenses)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-amber-500 h-2.5 rounded-full" 
              style={{ width: getWidthPercentage(inventory_purchases, totalExpenses) }}
            ></div>
          </div>
          <span className="mt-1 text-sm text-gray-600">{formatCurrency(inventory_purchases)}</span>
        </div>

        {/* Total */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="font-medium">Total Expenses</span>
            <span className="font-medium">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}