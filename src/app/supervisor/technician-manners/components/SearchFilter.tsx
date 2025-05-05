'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface SearchFilters {
  startDate: string;
  endDate: string;
  invoiceNumber: string;
  workOrderId: string;
}

interface SearchFilterProps {
  onSearch: (filters: SearchFilters) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: '',
    endDate: '',
    invoiceNumber: '',
    workOrderId: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      startDate: '',
      endDate: '',
      invoiceNumber: '',
      workOrderId: ''
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label htmlFor="startDate" className="text-sm font-medium">
            Start Date
          </label>
          <Input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="endDate" className="text-sm font-medium">
            End Date
          </label>
          <Input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="invoiceNumber" className="text-sm font-medium">
            Invoice Number
          </label>
          <Input
            type="text"
            id="invoiceNumber"
            name="invoiceNumber"
            placeholder="e.g. INV-12345"
            value={filters.invoiceNumber}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="workOrderId" className="text-sm font-medium">
            Work Order ID
          </label>
          <Input
            type="text"
            id="workOrderId"
            name="workOrderId"
            placeholder="e.g. 1234"
            value={filters.workOrderId}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button type="submit">Search</Button>
      </div>
    </form>
  );
};

export default SearchFilter;