"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DateRange } from '../types';

interface DateRangeFilterProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  onApplyFilter: () => void;
  activePeriod?: string;
}

export function DateRangeFilter({
  dateRange,
  setDateRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  onApplyFilter,
  activePeriod
}: DateRangeFilterProps) {
  const [showCustomDateRange, setShowCustomDateRange] = useState<boolean>(dateRange === 'custom');
  
  // Format dates for the input fields (YYYY-MM-DD format required by date inputs)
  const formatDateForInput = (dateString: string): string => {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If it's DD/MM/YYYY format, convert it to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month}-${day}`;
    }
    
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Invalid date format:', dateString);
    }
    
    return '';
  };
  
  // Format displayed dates in the UI (DD/MM/YYYY format)
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

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setShowCustomDateRange(range === 'custom');
    
    // If not custom date range, apply filter immediately
    if (range !== 'custom') {
      onApplyFilter();
    }
  };
  
  // Set initial custom dates if they're empty
  useEffect(() => {
    if (dateRange === 'custom' && !customStartDate) {
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      setCustomStartDate(lastMonth.toISOString().split('T')[0]);
      setCustomEndDate(today.toISOString().split('T')[0]);
    }
  }, [dateRange, customStartDate, customEndDate, setCustomStartDate, setCustomEndDate]);

  // Get current date info for labels
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentQuarter = Math.floor(today.getMonth() / 3) + 1;

  return (
    <div className="mb-8 bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
        <h2 className="text-lg font-semibold">Date Range</h2>
        {activePeriod && (
          <div className="mt-1 md:mt-0 text-sm font-medium text-blue-600">
            Currently viewing: {activePeriod}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={dateRange === 'day' ? 'default' : 'outline'}
          onClick={() => handleDateRangeChange('day')}
        >
          Today
        </Button>
        <Button 
          variant={dateRange === 'week' ? 'default' : 'outline'}
          onClick={() => handleDateRangeChange('week')}
        >
          Last 7 Days
        </Button>
        <Button 
          variant={dateRange === 'month' ? 'default' : 'outline'}
          onClick={() => handleDateRangeChange('month')}
        >
          This Month
        </Button>
        <Button 
          variant={dateRange === 'quarter' ? 'default' : 'outline'}
          onClick={() => handleDateRangeChange('quarter')}
        >
          Q{currentQuarter} {currentYear}
        </Button>
        <Button 
          variant={dateRange === 'year' ? 'default' : 'outline'}
          onClick={() => handleDateRangeChange('year')}
        >
          Year {currentYear}
        </Button>
        <Button 
          variant={dateRange === 'custom' ? 'default' : 'outline'}
          onClick={() => handleDateRangeChange('custom')}
        >
          Custom
        </Button>
      </div>

      {showCustomDateRange && (
        <div className="mt-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formatDateForInput(customStartDate)}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={formatDateForInput(customEndDate)}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="border rounded p-2"
            />
          </div>
          <Button 
            onClick={onApplyFilter}
            disabled={!customStartDate || !customEndDate}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}