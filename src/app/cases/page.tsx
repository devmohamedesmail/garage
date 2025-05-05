"use client";

import { useState, useEffect } from "react";
import api from "@/services/api"; // Import the API service
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Components
import StatisticsPanel from "./components/StatisticsPanel";
import CasesDataTable from "./components/CasesDataTable";
import FilterPanel from "./components/FilterPanel";
import DeadlinePanel from "./components/DeadlinePanel";
import LatePanel from "./components/LatePanel";
import LoadingSpinner from "./components/LoadingSpinner";

// Types
export interface Case {
  case_id: number;
  case_number: string;
  invoice_id: number;
  reason_id: number;
  reason_name?: string;
  custom_reason?: string;
  description: string;
  status: 'open' | 'closed' | 'approved' | 'rejected';
  created_by: number;
  created_by_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  deadline_date: string;
  created_at: string;
  updated_at: string;
  is_late: boolean;
  invoice_number?: string;
  license_plate?: string;
  make?: string;
  model?: string;
  customer_name?: string;
  customer_phone?: string;
  image_count?: number;
}

export interface CaseReason {
  reason_id: number;
  reason_name: string;
  description?: string;
  is_active: boolean;
}

export interface DashboardStatistics {
  total_cases: number;
  cases_by_status: {
    status: string;
    count: number;
  }[];
  cases_by_reason: {
    reason_name: string;
    count: number;
  }[];
  late_cases: number;
  due_today: number;
  due_tomorrow: number;
}

export interface FilterParams {
  status?: string;
  reason_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  show_late_only?: boolean;
}

export default function CasesDashboardPage() {
  // State
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Case[]>([]);
  const [lateCases, setLateCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [caseReasons, setCaseReasons] = useState<CaseReason[]>([]);
  const [filterParams, setFilterParams] = useState<FilterParams>({});
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Fetch case statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await api.get("/cases-dashboard/statistics", {
          params: { 
            start_date: filterParams.start_date,
            end_date: filterParams.end_date
          }
        });
        setStatistics(response.data);
      } catch (err: any) {
        console.error("Error fetching case statistics:", err);
        setError(err.response?.data?.error || "Failed to load statistics");
      }
    };

    fetchStatistics();
  }, [filterParams.start_date, filterParams.end_date]);

  // Fetch case reasons
  useEffect(() => {
    const fetchCaseReasons = async () => {
      try {
        const response = await api.get("/case-reasons");
        setCaseReasons(response.data);
      } catch (err: any) {
        console.error("Error fetching case reasons:", err);
      }
    };

    fetchCaseReasons();
  }, []);

  // Fetch cases with filters
  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const response = await api.get("/invoice-cases", {
          params: {
            page,
            limit: 10,
            ...filterParams
          }
        });
        setCases(response.data.cases);
        setTotalPages(response.data.pagination.totalPages);
      } catch (err: any) {
        console.error("Error fetching cases:", err);
        setError(err.response?.data?.error || "Failed to load cases");
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [page, filterParams]);

  // Fetch upcoming deadlines
  useEffect(() => {
    const fetchUpcomingDeadlines = async () => {
      try {
        const response = await api.get("/cases-dashboard/upcoming-deadlines");
        setUpcomingDeadlines(response.data);
      } catch (err: any) {
        console.error("Error fetching upcoming deadlines:", err);
      }
    };

    fetchUpcomingDeadlines();
  }, []);

  // Fetch late cases
  useEffect(() => {
    const fetchLateCases = async () => {
      try {
        const response = await api.get("/cases-dashboard/late-cases");
        setLateCases(response.data);
      } catch (err: any) {
        console.error("Error fetching late cases:", err);
      }
    };

    fetchLateCases();
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterParams) => {
    setFilterParams(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Cases Dashboard</h1>
        <Button onClick={() => window.location.href = "/cases/reasons"}>
          Manage Case Reasons
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Statistics Panel */}
      {statistics ? (
        <StatisticsPanel statistics={statistics} />
      ) : (
        <Card className="p-4 mb-6">
          <LoadingSpinner text="Loading statistics..." />
        </Card>
      )}

      {/* Filter Panel */}
      <FilterPanel 
        reasons={caseReasons}
        onFilterChange={handleFilterChange}
        currentFilters={filterParams}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Cases Table - Takes 2/3 of screen on larger displays */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Cases</h2>
            {loading ? (
              <LoadingSpinner text="Loading cases..." />
            ) : (
              <CasesDataTable 
                cases={cases}
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </Card>
        </div>

        {/* Right Sidebar - Takes 1/3 of screen on larger displays */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>
            <DeadlinePanel cases={upcomingDeadlines} />
          </Card>

          {/* Late Cases */}
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Late Cases</h2>
            <LatePanel cases={lateCases} />
          </Card>
        </div>
      </div>
    </div>
  );
}