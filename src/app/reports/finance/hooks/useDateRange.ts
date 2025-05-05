"use client";

import { useState } from 'react';
import { DateRange } from '../types';

interface DateRangeResult {
  startDate: string;
  endDate: string;
  periodLabel?: string; // For displaying which period we're looking at
}

export function useDateRange() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Format a date to YYYY-MM-DD format for API calls
  const formatDateForApi = (dateString: string): string => {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If it's in DD/MM/YYYY format, convert it
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month}-${day}`;
    }
    
    // For dates from the date picker in MM/DD/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [month, day, year] = dateString.split('/');
      return `${year}-${month}-${day}`;
    }
    
    // If it's a Date object or can be parsed as a date
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error("Invalid date format:", dateString);
    }
    
    // Return today's date as fallback
    return new Date().toISOString().split('T')[0];
  };
  
  // Get the first day of the current month
  const getFirstDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };
  
  // Get the last day of the current month
  const getLastDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };
  
  // Get the first day of the current quarter
  const getFirstDayOfQuarter = (date: Date): Date => {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3, 1);
  };
  
  // Get the last day of the current quarter
  const getLastDayOfQuarter = (date: Date): Date => {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), (quarter + 1) * 3, 0);
  };
  
  // Get quarter name based on month
  const getQuarterName = (date: Date): string => {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  };
  
  // Get quarter months range
  const getQuarterMonthsRange = (date: Date): string => {
    const quarter = Math.floor(date.getMonth() / 3);
    const firstMonth = new Date(date.getFullYear(), quarter * 3, 1);
    const lastMonth = new Date(date.getFullYear(), (quarter + 1) * 3 - 1, 1);
    return `${firstMonth.toLocaleString('default', { month: 'short' })} - ${lastMonth.toLocaleString('default', { month: 'short' })}`;
  };
  
  // Get the first day of the current year
  const getFirstDayOfYear = (date: Date): Date => {
    return new Date(date.getFullYear(), 0, 1);
  };
  
  // Get the last day of the current year
  const getLastDayOfYear = (date: Date): Date => {
    return new Date(date.getFullYear(), 11, 31);
  };
  
  const getDateRangeFromType = (): DateRangeResult => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;
    
    switch(dateRange) {
      case 'day':
        // Today only (just this day)
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        periodLabel = `Today (${today.toLocaleDateString()})`;
        break;
        
      case 'week':
        // Last 7 days (keeping this as a relative period)
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6); // Make it inclusive of today
        endDate = new Date(today);
        periodLabel = `Last 7 Days`;
        break;
        
      case 'month':
        // Current month (May 1-31, 2025)
        startDate = getFirstDayOfMonth(today);
        endDate = getLastDayOfMonth(today);
        periodLabel = `${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;
        break;
        
      case 'quarter':
        // Current quarter (Q2 2025: Apr 1 - Jun 30)
        startDate = getFirstDayOfQuarter(today);
        endDate = getLastDayOfQuarter(today);
        periodLabel = `${getQuarterName(today)} (${getQuarterMonthsRange(today)})`;
        break;
        
      case 'year':
        // Current year (Jan 1 - Dec 31, 2025)
        startDate = getFirstDayOfYear(today);
        endDate = getLastDayOfYear(today);
        periodLabel = `Year ${today.getFullYear()}`;
        break;
        
      case 'custom':
        if (customStartDate && customEndDate) {
          try {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
            const startFormatted = startDate.toLocaleDateString();
            const endFormatted = endDate.toLocaleDateString();
            periodLabel = `Custom: ${startFormatted} - ${endFormatted}`;
          } catch (e) {
            // Use default as fallback
            console.error("Invalid custom date", e);
            startDate = getFirstDayOfMonth(today);
            endDate = getLastDayOfMonth(today);
            periodLabel = "Invalid custom range";
          }
        } else {
          // Default to current month if no custom dates
          startDate = getFirstDayOfMonth(today);
          endDate = getLastDayOfMonth(today);
          periodLabel = "Custom range not set";
        }
        break;
        
      default:
        // Default to current month
        startDate = getFirstDayOfMonth(today);
        endDate = getLastDayOfMonth(today);
        periodLabel = `${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;
    }
    
    // Add time to end date to include the entire day
    endDate.setHours(23, 59, 59, 999);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      periodLabel
    };
  };

  return {
    dateRange,
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    getDateRange: getDateRangeFromType,
    formatDateForApi
  };
}