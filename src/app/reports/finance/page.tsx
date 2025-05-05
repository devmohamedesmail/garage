"use client";

import { useState, useEffect } from 'react';
import api from "@/services/api";
import { FinancialData } from './types';
import { useDateRange } from './hooks/useDateRange';
import { DateRangeFilter } from './components/DateRangeFilter';
import { FinancialMetricsCards } from './components/FinancialMetricsCards';
import { LoadingErrorState } from './components/LoadingErrorState';
import { InfoNote } from './components/InfoNote';
import { ExpenseBreakdownCard } from './components/ExpenseBreakdownCard';

export default function FinanceDashboardPage() {
  // State for financial data
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<string>('');
  
  // Use the custom hook for date range
  const {
    dateRange,
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    getDateRange,
    formatDateForApi
  } = useDateRange();

  // Format date for display (DD/MM/YYYY)
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // Parse the date and ensure it's valid
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format as DD/MM/YYYY
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error('Error formatting date for display:', e);
      return '';
    }
  };

  // Fetch financial data with the selected date range
  const fetchFinancialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dateRangeResult = getDateRange();
      const { startDate, endDate, periodLabel } = dateRangeResult;
      
      // Set the active period label
      setActivePeriod(periodLabel || '');
      
      // Ensure dates are in the correct format for the API (YYYY-MM-DD)
      const apiStartDate = formatDateForApi(startDate);
      const apiEndDate = formatDateForApi(endDate);
      
      // Use the api service instead of direct fetch
      const response = await api.get(
        `/financial/profit?startDate=${apiStartDate}&endDate=${apiEndDate}`
      );
      
      const data = response.data;
      
      // Add display formatted dates to the data
      if (data.filters) {
        data.filters.displayStartDate = formatDateForDisplay(data.filters.startDate);
        data.filters.displayEndDate = formatDateForDisplay(data.filters.endDate);
      }
      
      setFinancialData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchFinancialData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        <p className="text-gray-600">View your garage's financial performance</p>
      </div>

      {/* Date Range Filter Component */}
      <DateRangeFilter 
        dateRange={dateRange}
        setDateRange={setDateRange}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        onApplyFilter={fetchFinancialData}
        activePeriod={activePeriod}
      />

      {/* Loading and Error State Component */}
      <LoadingErrorState
        loading={loading}
        error={error}
        onRetry={fetchFinancialData}
      />

      {!loading && !error && (
        <>
          {/* Financial Metrics Cards Component */}
          <FinancialMetricsCards financialData={financialData} />

          {/* Expense Breakdown Card */}
          <ExpenseBreakdownCard financialData={financialData} />

          {/* Info Note Component */}
          <InfoNote financialData={financialData} />

          {/* Future expansion: Add charts, payroll, etc. */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold mb-3">Coming Soon</h3>
            <p className="text-gray-600">
              Future updates will include detailed financial charts, payroll information, 
              and expense breakdowns by category.
            </p>
          </div>
        </>
      )}
    </div>
  );
}