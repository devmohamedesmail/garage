import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CaseReason, FilterParams } from "../page";
import api from "@/services/api"; // Import the API service

interface FilterPanelProps {
  reasons: CaseReason[];
  onFilterChange: (filters: FilterParams) => void;
  currentFilters: FilterParams;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ reasons, onFilterChange, currentFilters }) => {
  const [filters, setFilters] = useState<FilterParams>({ 
    status: "",
    reason_id: undefined,
    start_date: "",
    end_date: "",
    search: "",
    show_late_only: false
  });
  
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);

  // Initialize filters from currentFilters
  useEffect(() => {
    setFilters({
      status: currentFilters.status || "",
      reason_id: currentFilters.reason_id,
      start_date: currentFilters.start_date || "",
      end_date: currentFilters.end_date || "",
      search: currentFilters.search || "",
      show_late_only: currentFilters.show_late_only || false
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "reason_id" && value) {
      setFilters((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFilters((prev) => ({ ...prev, [name]: checked }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a clean filter object, removing empty strings and undefined values
    const cleanFilters: FilterParams = {};
    
    if (filters.status) cleanFilters.status = filters.status;
    if (filters.reason_id) cleanFilters.reason_id = filters.reason_id;
    if (filters.start_date) cleanFilters.start_date = filters.start_date;
    if (filters.end_date) cleanFilters.end_date = filters.end_date;
    if (filters.search) cleanFilters.search = filters.search;
    if (filters.show_late_only) cleanFilters.show_late_only = filters.show_late_only;
    
    onFilterChange(cleanFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      reason_id: undefined,
      start_date: "",
      end_date: "",
      search: "",
      show_late_only: false
    });
    onFilterChange({});
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <h2 className="text-xl font-semibold">Filters</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="text-blue-600 hover:underline text-sm"
          >
            {filtersExpanded ? "Hide Advanced Filters" : "Show Advanced Filters"}
          </button>
          <button 
            onClick={handleClearFilters}
            className="text-red-600 hover:underline text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      <form onSubmit={handleApplyFilters} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleInputChange}
              placeholder="Customer, VIN, License Plate..."
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Show Late Only Checkbox */}
          <div className="flex items-center mt-7">
            <input
              type="checkbox"
              name="show_late_only"
              id="show_late_only"
              checked={filters.show_late_only || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="show_late_only" className="text-sm font-medium text-gray-700">
              Show Late Cases Only
            </label>
          </div>

          {/* Apply Button */}
          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto">
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters (hidden by default) */}
        {filtersExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-200 pt-4">
            {/* Date Range Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            {/* Case Reason Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <select
                name="reason_id"
                value={filters.reason_id || ""}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">All Reasons</option>
                {reasons.map((reason) => (
                  <option key={reason.reason_id} value={reason.reason_id}>
                    {reason.reason_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
};

export default FilterPanel;