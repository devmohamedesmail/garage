"use client";

import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { toast } from "react-hot-toast";

interface QueueItem {
  queue_id: number;
  technician_id: number;
  technician_name: string;
  work_order_id: number;
  work_order_stage_id: number;
  stage_name: string;
  queue_time: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
}

const TechnicianQueueManager: React.FC = () => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('all');
  const [technicians, setTechnicians] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    fetchQueueData();
  }, [selectedTechnicianId]);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      
      // Fetch technicians if not already loaded
      if (technicians.length === 0) {
        const techResponse = await api.get('/technicians');
        const techData = techResponse.data.map((tech: any) => ({
          id: tech.user_id,
          name: `${tech.first_name} ${tech.last_name}`
        }));
        setTechnicians(techData);
      }
      
      // Fetch queue items for all or specific technician
      const url = selectedTechnicianId === 'all' 
        ? '/technician-queue' 
        : `/technician-queue?technician_id=${selectedTechnicianId}`;
        
      const response = await api.get(url);
      setQueueItems(response.data);
    } catch (error) {
      console.error("Error fetching queue data:", error);
      toast.error("Failed to load queue data");
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = async (queueId: number, newPriority: number) => {
    try {
      await api.put(`/technician-queue/${queueId}`, {
        priority: newPriority
      });
      
      // Update local state
      setQueueItems(items => 
        items.map(item => 
          item.queue_id === queueId 
            ? {...item, priority: newPriority} 
            : item
        )
      );
      
      toast.success("Priority updated");
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update priority");
    }
  };

  const handleCancelTask = async (queueId: number) => {
    if (!confirm("Are you sure you want to cancel this queued task?")) return;
    
    try {
      await api.put(`/technician-queue/${queueId}`, {
        status: 'cancelled'
      });
      
      // Update local state
      setQueueItems(items => 
        items.filter(item => item.queue_id !== queueId)
      );
      
      toast.success("Task removed from queue");
    } catch (error) {
      console.error("Error cancelling task:", error);
      toast.error("Failed to cancel task");
    }
  };

  const handleStartNext = async (technicianId: number) => {
    try {
      await api.post(`/technician-queue/process`, {
        technician_id: technicianId
      });
      
      toast.success("Started next task for technician");
      fetchQueueData(); // Refresh data
    } catch (error) {
      console.error("Error starting next task:", error);
      toast.error("Failed to start next task");
    }
  };

  // Group queue items by technician
  const groupedByTechnician = queueItems.reduce((acc, item) => {
    if (!acc[item.technician_id]) {
      acc[item.technician_id] = {
        technician_id: item.technician_id,
        technician_name: item.technician_name,
        items: []
      };
    }
    acc[item.technician_id].items.push(item);
    return acc;
  }, {} as Record<number, { technician_id: number, technician_name: string, items: QueueItem[] }>);

  if (loading && queueItems.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Technician Queue Manager</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Technician Queue Manager</h2>
      
      {/* Filter by technician */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Technician
        </label>
        <select 
          value={selectedTechnicianId}
          onChange={(e) => setSelectedTechnicianId(e.target.value)}
          className="block w-full rounded-md border border-gray-300 p-2"
        >
          <option value="all">All Technicians</option>
          {technicians.map(tech => (
            <option key={tech.id} value={tech.id.toString()}>
              {tech.name}
            </option>
          ))}
        </select>
      </div>
      
      {Object.values(groupedByTechnician).length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No queued tasks found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedByTechnician).map(group => (
            <div key={group.technician_id} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-4 flex justify-between items-center">
                <h3 className="font-medium">{group.technician_name}'s Queue</h3>
                <button 
                  onClick={() => handleStartNext(group.technician_id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Start Next Task
                </button>
              </div>
              
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Queue Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.items
                    .sort((a, b) => b.priority - a.priority || new Date(a.queue_time).getTime() - new Date(b.queue_time).getTime())
                    .map(item => (
                    <tr key={item.queue_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        #{item.work_order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.stage_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(item.queue_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={item.priority}
                          onChange={(e) => handlePriorityChange(item.queue_id, parseInt(e.target.value))}
                          className="block w-20 rounded border border-gray-300 p-1 text-sm"
                        >
                          <option value="0">Low</option>
                          <option value="5">Medium</option>
                          <option value="10">High</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleCancelTask(item.queue_id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicianQueueManager;