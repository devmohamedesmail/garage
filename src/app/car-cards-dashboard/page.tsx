"use client";

import React, { useState, useEffect } from 'react';
import api from '@/services/api'; // Import the API service object instead of axios
import { Card } from '@/components/ui/card';
import Link from 'next/link';

// Define interfaces for our data types
interface WorkOrder {
  work_order_id: number;
  status: string;
  start_date: string;
  end_time?: string;
  stage_name?: string;
  make?: string;
  model?: string;
  license_plate?: string;
  customer_name?: string;
  technician_name?: string;
  estimated_hours?: number;
  invoice_number?: string;
  color?: string;
}

interface ActiveStage {
  work_order_stage_id: number;
  work_order_id: number;
  stage_name: string;
  status: string;
  start_time: string;
  estimated_hours?: number;
}

// Component for the upward counting timer 
const ElapsedTimer: React.FC<{ startTime: string; endTime?: string }> = ({ startTime, endTime }) => {
  const [elapsed, setElapsed] = useState<string>("Calculating...");

  useEffect(() => {
    // Function to calculate elapsed time
    const calculateElapsed = () => {
      const start = new Date(startTime).getTime();
      const end = endTime ? new Date(endTime).getTime() : Date.now();
      const diff = end - start;
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeString = '';
      if (days > 0) timeString += `${days}d `;
      timeString += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      return timeString;
    };

    // Initial calculation
    setElapsed(calculateElapsed());
    
    // Only set up the interval if we don't have an end time
    if (!endTime) {
      const timer = setInterval(() => {
        setElapsed(calculateElapsed());
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [startTime, endTime]);

  return <span className="font-medium">{elapsed}</span>;
};

// Component for the countdown timer
const CountdownTimer: React.FC<{ startTime: string; estimatedHours?: number }> = ({ startTime, estimatedHours = 1 }) => {
  const [timeLeft, setTimeLeft] = useState<string>("Calculating...");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    // Function to calculate time left before estimated completion
    const calculateTimeLeft = () => {
      const start = new Date(startTime).getTime();
      const estimatedEndTime = start + (estimatedHours * 60 * 60 * 1000);
      const now = Date.now();
      const diff = estimatedEndTime - now;
      
      // If time's up, show overdue time
      if (diff <= 0) {
        setIsOverdue(true);
        const overdueDiff = Math.abs(diff);
        const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
        const minutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((overdueDiff % (1000 * 60)) / 1000);
        
        return `Overdue: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // If still within time, show countdown
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime, estimatedHours]);

  return (
    <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
      {timeLeft}
    </span>
  );
};

// Car Card Component
const CarCard: React.FC<{ workOrder: WorkOrder; activeStage?: ActiveStage }> = ({ workOrder, activeStage }) => {
  // Determine card status styling
  const getStatusColor = (status: string) => {
    if (status.includes('Paused')) return 'border-yellow-400 bg-yellow-50';
    if (status.includes('In Progress')) return 'border-blue-400 bg-blue-50';
    if (status.includes('Not Started')) return 'border-gray-400 bg-gray-50';
    if (status.includes('Completed')) return 'border-green-400 bg-green-50';
    return 'border-gray-300';
  };

  const warningLevel = () => {
    if (!activeStage || !activeStage.start_time || !activeStage.estimated_hours) return null;
    
    const start = new Date(activeStage.start_time).getTime();
    const estimatedEndTime = start + (activeStage.estimated_hours * 60 * 60 * 1000);
    const now = Date.now();
    const timeLeft = estimatedEndTime - now;
    
    // If overdue
    if (timeLeft < 0) return { color: 'bg-red-500', text: 'Overdue' };
    
    // Less than 30 minutes left
    if (timeLeft < 30 * 60 * 1000) return { color: 'bg-orange-500', text: 'Critical' };
    
    // Less than 1 hour left
    if (timeLeft < 60 * 60 * 1000) return { color: 'bg-yellow-500', text: 'Warning' };
    
    // Everything is fine
    return { color: 'bg-green-500', text: 'On Time' };
  };
  
  const warning = warningLevel();

  return (
    <Card className={`p-4 border-l-4 ${getStatusColor(workOrder.status)} shadow-md hover:shadow-lg transition-shadow`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">
            {workOrder.make} {workOrder.model}
            <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded-md">
              {workOrder.license_plate}
            </span>
          </h3>
          <p className="text-gray-700 text-sm">Customer: {workOrder.customer_name}</p>
        </div>
        
        {warning && (
          <div className={`${warning.color} text-white text-xs font-bold px-2 py-1 rounded`}>
            {warning.text}
          </div>
        )}
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <p className="text-sm text-gray-500">Work Order #</p>
          <p className="font-medium">{workOrder.work_order_id}</p>
        </div>
        {workOrder.invoice_number && (
          <div>
            <p className="text-sm text-gray-500">Invoice #</p>
            <p className="font-medium">{workOrder.invoice_number}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-medium">{workOrder.status}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Technician</p>
          <p className="font-medium">{workOrder.technician_name || 'Not assigned'}</p>
        </div>
      </div>
      
      <div className="mt-4 border-t pt-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-gray-500">Total Time</p>
            <ElapsedTimer startTime={workOrder.start_date} />
          </div>
          
          {activeStage && activeStage.status === 'In Progress' && (
            <div>
              <p className="text-sm text-gray-500">Time Left</p>
              <CountdownTimer 
                startTime={activeStage.start_time} 
                estimatedHours={activeStage.estimated_hours} 
              />
            </div>
          )}
        </div>
        
        {activeStage && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">Current Stage</p>
            <p className="font-medium">{activeStage.stage_name}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <Link 
          href={`/work-orders/${workOrder.work_order_id}`}
          className="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          View Details
        </Link>
      </div>
    </Card>
  );
};

// Main Dashboard Component
const CarCardsDashboard: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activeStages, setActiveStages] = useState<{[key: number]: ActiveStage}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Fetch work orders and their active stages
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch active work orders (not completed)
        const workOrdersResponse = await api.get('/work_orders', {
          params: {
            is_completed: 0,
            limit: 50 // Get more results to filter on the client side
          }
        });
        
        const orders = workOrdersResponse.data.workOrders;
        
        // For each work order, get its stages to find the active one
        const stagesPromises = orders.map((order: any) => 
          api.get(`/work_order_stages_with_names`, {
            params: {
              work_order_id: order.work_order_id
            }
          })
        );
        
        const stagesResults = await Promise.all(stagesPromises);
        
        // Process each work order's stages to find active ones
        const activeStagesMap: {[key: number]: ActiveStage} = {};
        
        stagesResults.forEach((result, index) => {
          const stages = result.data;
          const workOrderId = orders[index].work_order_id;
          
          // Find an in-progress or paused stage
          const inProgressStage = stages.find((s: any) => s.status === 'In Progress');
          const pausedStage = stages.find((s: any) => s.status === 'Paused');
          const activeStage = inProgressStage || pausedStage;
          
          if (activeStage) {
            activeStagesMap[workOrderId] = {
              work_order_stage_id: activeStage.work_order_stage_id,
              work_order_id: workOrderId,
              stage_name: activeStage.stage_name,
              status: activeStage.status,
              start_time: activeStage.start_time,
              estimated_hours: activeStage.estimated_hours
            };
          }
        });
        
        setWorkOrders(orders);
        setActiveStages(activeStagesMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up a refresh interval (every 5 minutes)
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter work orders based on selected status
  const filteredWorkOrders = filterStatus
    ? workOrders.filter(wo => wo.status.includes(filterStatus))
    : workOrders;

  // Group unique statuses for filter
  const uniqueStatuses = Array.from(new Set(workOrders.map(wo => wo.status)));

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Car Cards Dashboard</h1>
      
      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Filter by Status</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilterStatus('')}
            className={`px-3 py-1 rounded-full text-sm ${!filterStatus ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            All
          </button>
          {uniqueStatuses.map(status => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-full text-sm ${filterStatus === status ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center p-10">
          <p className="text-lg">Loading work orders...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Cards Grid */}
      {!loading && !error && (
        <>
          <p className="mb-4 text-gray-700">Showing {filteredWorkOrders.length} active work orders</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkOrders.length > 0 ? (
              filteredWorkOrders.map(workOrder => (
                <CarCard 
                  key={workOrder.work_order_id}
                  workOrder={workOrder}
                  activeStage={activeStages[workOrder.work_order_id]}
                />
              ))
            ) : (
              <p>No work orders match the selected filter.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CarCardsDashboard;