"use client";

import { Card } from '@/components/ui/card';
import { FinancialData } from '../types';

interface InfoNoteProps {
  financialData: FinancialData | null;
}

export function InfoNote({ financialData }: InfoNoteProps) {
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AE', { 
      style: 'currency', 
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow mb-8">
      <h3 className="text-lg font-semibold mb-3">Financial Information</h3>
      <div className="text-sm text-gray-600 space-y-2">
        <p>
          <span className="font-medium">Revenue:</span> Total income from all paid invoices within the selected time period.
        </p>
        <p>
          <span className="font-medium">Expenses:</span> Total costs incurred during the selected time period, including both regular expenses and inventory purchases.
        </p>
        
        {financialData?.expense_breakdown && (
          <div className="pl-4 border-l-2 border-gray-200 mt-2 space-y-1">
            <p>
              <span className="font-medium">Regular Expenses:</span> {formatCurrency(financialData.expense_breakdown.regular_expenses)}
            </p>
            <p>
              <span className="font-medium">Inventory Purchases:</span> {formatCurrency(financialData.expense_breakdown.inventory_purchases)}
            </p>
          </div>
        )}
        
        <p>
          <span className="font-medium">Profit:</span> Net income after subtracting expenses (including inventory purchases) from revenue.
        </p>
        {financialData && financialData.profit < 0 && (
          <p className="text-red-600">
            <span className="font-medium">Warning:</span> You are currently operating at a loss for this period.
          </p>
        )}
      </div>
    </Card>
  );
}