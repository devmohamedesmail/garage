'use client';

import React, { useEffect, useState } from "react";
import api from "@/services/api";
import Link from "next/link";
import { format } from 'date-fns';

interface StaffMember {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id: number;
  is_active: number;
}

interface Role {
  role_id: number;
  role_name: string;
}

interface WorkOrder {
  work_order_id: number;
  status: string;
  start_date: string;
  license_plate: string;
  make: string;
  model: string;
  customer_name: string;
  is_completed: number;
}

interface StageTimeStats {
  stage_id: number;
  stage_name: string;
  tasks_completed: number;
  minutes_spent: number;
  time_spent_formatted: string;
}

interface StaffTimeStats {
  staff: {
    user_id: number;
    staff_name: string;
    role_name: string;
  };
  total_stats: {
    tasks_completed: number;
    total_minutes: number;
    time_spent_formatted: string;
  };
  stage_stats: StageTimeStats[];
}

interface Evaluation {
  manners_id: number;
  category: string;
  rating: number;
  notes: string;
  evaluation_date: string;
  evaluator_name: string;
  work_order_id: number | null;
  invoice_number: string | null;
}

interface MannersCategory {
  category: string;
  average_rating: number;
  evaluation_count: number;
}

interface MannersSummary {
  category_averages: MannersCategory[];
  overall_average: number;
  recent_evaluations: any[];
  technician_id: number;
}

const StaffReportsPage = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentWorkOrders, setCurrentWorkOrders] = useState<WorkOrder[]>([]);
  const [completedWorkOrders, setCompletedWorkOrders] = useState<WorkOrder[]>([]);
  const [timeStats, setTimeStats] = useState<StaffTimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'completed' | 'time' | 'manners'>('current');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [mannersSummary, setMannersSummary] = useState<MannersSummary | null>(null);
  const [mannersLoading, setMannersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [paginationInfo, setPaginationInfo] = useState<{
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  } | null>(null);

  // Load staff list on component mount
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        setLoading(true);
        
        const staffRes = await api.get("/users");
        setStaffList(staffRes.data);
        
        const rolesRes = await api.get("/roles");
        setRoles(rolesRes.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching staff data:", error);
        setError("Failed to load staff information");
        setLoading(false);
      }
    };

    fetchStaffList();
  }, []);

  // Load staff details when a staff member is selected
  useEffect(() => {
    if (!selectedStaffId) return;
    
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        
        const workOrdersRes = await api.get(`/work_orders?assigned_technician=${selectedStaffId}`);
        
        if (workOrdersRes.data && workOrdersRes.data.workOrders) {
          const current = workOrdersRes.data.workOrders.filter((wo: WorkOrder) => wo.is_completed === 0);
          const completed = workOrdersRes.data.workOrders.filter((wo: WorkOrder) => wo.is_completed === 1);
          
          setCurrentWorkOrders(current);
          setCompletedWorkOrders(completed);
        }
        
        const timeStatsRes = await api.get(`/staff/${selectedStaffId}/time-stats`);
        setTimeStats(timeStatsRes.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching staff data:", error);
        setError("Failed to load staff information");
        setLoading(false);
      }
    };

    fetchStaffData();
  }, [selectedStaffId]);

  // Load manners data when manners tab is selected
  useEffect(() => {
    const fetchMannersData = async () => {
      if (activeTab === 'manners' && selectedStaffId) {
        setMannersLoading(true);
        try {
          const [evaluationsRes, summaryRes] = await Promise.all([
            api.get(`/technician-manners/${selectedStaffId}?page=${currentPage}&limit=${itemsPerPage}`),
            api.get(`/technician-manners/summary/${selectedStaffId}`)
          ]);
          
          // Check if response contains paginated data structure
          if (evaluationsRes.data && evaluationsRes.data.data && evaluationsRes.data.pagination) {
            setEvaluations(evaluationsRes.data.data);
            setPaginationInfo(evaluationsRes.data.pagination);
          } else {
            // Fallback for old API format
            setEvaluations(evaluationsRes.data || []);
          }
          
          setMannersSummary(summaryRes.data || null);
        } catch (error) {
          console.error("Error fetching manners evaluations:", error);
          setEvaluations([]);
          setMannersSummary(null);
        } finally {
          setMannersLoading(false);
        }
      }
    };
    
    fetchMannersData();
  }, [activeTab, selectedStaffId, currentPage, itemsPerPage]);

  const fetchTimeStatsWithFilters = async () => {
    if (!selectedStaffId) return;
    
    try {
      let url = `/staff/${selectedStaffId}/time-stats`;
      
      const queryParams = [];
      if (dateFilter.startDate) {
        queryParams.push(`startDate=${dateFilter.startDate}`);
      }
      if (dateFilter.endDate) {
        queryParams.push(`endDate=${dateFilter.endDate}`);
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const response = await api.get(url);
      setTimeStats(response.data);
    } catch (error) {
      console.error("Error fetching filtered time stats:", error);
      setError("Failed to update time statistics");
    }
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFilter({
      ...dateFilter,
      [name]: value
    });
  };

  const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStaffId(e.target.value);
    setCurrentPage(1); // Reset pagination when selecting a new staff
  };

  const totalMannersPages = paginationInfo?.totalPages || Math.ceil(evaluations.length / itemsPerPage);
  const totalItems = paginationInfo?.total || evaluations.length;
  
  // If we're using the API pagination, no need to slice the evaluations as they come pre-sliced
  const currentEvaluations = evaluations;

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getRatingColor = (rating: number): string => {
    switch (rating) {
      case 1: return 'text-red-700 bg-red-100';
      case 2: return 'text-orange-700 bg-orange-100';
      case 3: return 'text-yellow-700 bg-yellow-100';
      case 4: return 'text-green-700 bg-green-100';
      case 5: return 'text-emerald-700 bg-emerald-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getCategoryLabel = (category: string): string => {
    const categories: { [key: string]: string } = {
      punctuality: 'Punctuality',
      attitude: 'Attitude',
      communication: 'Communication',
      cleanliness: 'Cleanliness',
      overall: 'Overall Performance',
    };
    return categories[category] || category;
  };

  const getRoleName = (roleId: number) => {
    const role = roles.find(r => r.role_id === roleId);
    return role ? role.role_name : "Unknown Role";
  };

  const MannersEvaluationPagination = () => {
    return (
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              of <span className="font-medium">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                  currentPage === 1 ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Previous</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              
              {Array.from({ length: Math.min(totalMannersPages, 5) }, (_, i) => {
                let pageNum;
                if (totalMannersPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalMannersPages - 2) {
                  pageNum = totalMannersPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => goToPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      pageNum === currentPage
                        ? 'z-10 bg-blue-600 text-white focus:z-20'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => goToPage(Math.min(totalMannersPages, currentPage + 1))}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                  currentPage === totalMannersPages ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                disabled={currentPage === totalMannersPages}
              >
                <span className="sr-only">Next</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const getSelectedStaffMember = () => {
    return staffList.find(staff => staff.user_id.toString() === selectedStaffId);
  };

  if (loading && !selectedStaffId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Loading staff information...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Staff Reports</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Select Staff Member</h2>
          <select 
            className="w-full p-2 border rounded mb-4"
            value={selectedStaffId || ''}
            onChange={handleStaffSelect}
          >
            <option value="">Select a staff member</option>
            {staffList.map((staff) => (
              <option key={staff.user_id} value={staff.user_id}>
                {staff.first_name} {staff.last_name} - {getRoleName(staff.role_id)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedStaffId ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            {getSelectedStaffMember() && (
              <h2 className="text-xl font-semibold">
                Reports for {getSelectedStaffMember()?.first_name} {getSelectedStaffMember()?.last_name}
              </h2>
            )}
          </div>
          
          <div className="border-b mb-4">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('current')}
                className={`px-4 py-2 ${
                  activeTab === 'current'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Current Work Orders ({currentWorkOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 ${
                  activeTab === 'completed'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Completed Work Orders ({completedWorkOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('time')}
                className={`px-4 py-2 ${
                  activeTab === 'time'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Time Stats
              </button>
              {getSelectedStaffMember()?.role_id === 3 && (
                <button
                  onClick={() => setActiveTab('manners')}
                  className={`px-4 py-2 ${
                    activeTab === 'manners'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Manners
                </button>
              )}
            </div>
          </div>
          
          {activeTab === 'current' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-3">Current Work Orders</h3>
              {currentWorkOrders.length > 0 ? (
                currentWorkOrders.map((wo) => (
                  <div key={wo.work_order_id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">Work Order #{wo.work_order_id}</h3>
                        <p className="text-sm text-gray-500">
                          {wo.make} {wo.model} - {wo.license_plate}
                        </p>
                        <p className="text-sm">Customer: {wo.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {wo.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          Started: {new Date(wo.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Link 
                        href={`/work-orders/${wo.work_order_id}`}
                        className="inline-block px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p>No current work orders assigned.</p>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-3">Completed Work Orders</h3>
              {completedWorkOrders.length > 0 ? (
                completedWorkOrders.map((wo) => (
                  <div key={wo.work_order_id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">Work Order #{wo.work_order_id}</h3>
                        <p className="text-sm text-gray-500">
                          {wo.make} {wo.model} - {wo.license_plate}
                        </p>
                        <p className="text-sm">Customer: {wo.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          Started: {new Date(wo.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Link 
                        href={`/work-orders/${wo.work_order_id}`}
                        className="inline-block px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p>No completed work orders found.</p>
              )}
            </div>
          )}

          {activeTab === 'time' && (
            <div>
              <h3 className="text-lg font-medium mb-3">Time Statistics</h3>
              <div className="mb-4 p-4 bg-gray-50 rounded border">
                <h4 className="font-medium mb-2">Filter by Date</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={dateFilter.startDate}
                      onChange={handleDateFilterChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={dateFilter.endDate}
                      onChange={handleDateFilterChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                <button
                  onClick={fetchTimeStatsWithFilters}
                  className="mt-2 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Apply Filter
                </button>
              </div>
              
              {timeStats && (
                <div>
                  <div className="p-4 bg-blue-50 rounded border mb-4">
                    <h4 className="font-medium mb-2">Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Staff Name:</span> {timeStats.staff.staff_name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Role:</span> {timeStats.staff.role_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Tasks Completed:</span> {timeStats.total_stats.tasks_completed}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Total Time:</span> {timeStats.total_stats.time_spent_formatted}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {timeStats.stage_stats.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Time by Stage</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks Completed</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {timeStats.stage_stats.map((stage) => (
                              <tr key={stage.stage_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stage.stage_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stage.tasks_completed}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stage.time_spent_formatted}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manners' && (
            <div>
              {mannersLoading ? (
                <div className="py-10 text-center text-gray-500">Loading evaluations...</div>
              ) : evaluations.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No manners evaluations found.</div>
              ) : (
                <>
                  {mannersSummary && (
                    <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-100">
                      <h3 className="font-medium mb-3">Performance Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-white rounded shadow">
                          <p className="text-sm text-gray-500">Overall Rating</p>
                          <p className={`text-3xl font-bold ${
                            mannersSummary.overall_average >= 4.5 ? 'text-emerald-700' :
                            mannersSummary.overall_average >= 3.5 ? 'text-green-700' :
                            mannersSummary.overall_average >= 2.5 ? 'text-yellow-700' :
                            mannersSummary.overall_average >= 1.5 ? 'text-orange-700' :
                            'text-red-700'
                          }`}>
                            {mannersSummary.overall_average || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">out of 5</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded shadow">
                          <p className="text-sm text-gray-500">Total Evaluations</p>
                          <p className="text-3xl font-bold text-blue-700">
                            {evaluations.length}
                          </p>
                        </div>
                      </div>

                      <h4 className="font-medium mb-2 text-sm">Rating by Category</h4>
                      <div className="space-y-2">
                        {mannersSummary.category_averages.map((cat) => {
                          const getProgressBarColor = (rating: number): string => {
                            if (rating >= 4.5) return 'bg-emerald-500';
                            if (rating >= 3.5) return 'bg-green-500';
                            if (rating >= 2.5) return 'bg-yellow-500';
                            if (rating >= 1.5) return 'bg-orange-500';
                            return 'bg-red-500';
                          };
                          
                          return (
                            <div key={cat.category}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">{getCategoryLabel(cat.category)}</span>
                                <span className="text-sm font-medium">
                                  {cat.average_rating} ({cat.evaluation_count})
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`${getProgressBarColor(cat.average_rating)} h-2 rounded-full`}
                                  style={{ width: `${(cat.average_rating / 5) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <h3 className="font-medium mb-3">Evaluation History</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluator</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentEvaluations.map((evaluation) => (
                          <tr key={evaluation.manners_id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(evaluation.evaluation_date), 'yyyy-MM-dd HH:mm')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getCategoryLabel(evaluation.category)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${getRatingColor(evaluation.rating)}`}>
                                {evaluation.rating}/5
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {evaluation.evaluator_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {evaluation.notes || <span className="text-gray-400">No notes</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalMannersPages > 1 && <MannersEvaluationPagination />}
                </>
              )}
              
              <div className="mt-6">
                <Link 
                  href={`/supervisor/technician-manners?techId=${selectedStaffId}`}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add New Evaluation
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">Please select a staff member to view their reports.</p>
        </div>
      )}
    </div>
  );
};

export default StaffReportsPage;