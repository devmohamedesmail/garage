"use client";

import React, { useState, useEffect } from "react";
import api from "@/services/api";
import ElapsedTime from "./ElapsedTime";
import { toast } from "react-hot-toast";

interface TechnicianTask {
  work_order_stage_id: number;
  work_order_id: number;
  stage_id: number;
  stage_name: string;
  start_time: string;
  status: string;
  estimated_completion: string;
  estimated_hours: number; // Make sure this field is properly typed
}

interface Technician {
  user_id: number;
  first_name: string;
  last_name: string;
  role_id: number;
  is_active: number;
  is_available: boolean;
  current_tasks: TechnicianTask[];
}

interface TechnicianSelectorProps {
  value: string;
  onChange: (value: string, estimatedHours?: number) => void;
  workOrderId: number;
  stageId: number;
  onAssignmentComplete: () => void;
}

const TechnicianSelector: React.FC<TechnicianSelectorProps> = ({
  value,
  onChange,
  workOrderId,
  stageId,
  onAssignmentComplete
}) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Time estimation states
  const [estimationMethod, setEstimationMethod] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<number>(60); // Default to 60 minutes
  const [customHours, setCustomHours] = useState<number>(1);
  const [customMinutes, setCustomMinutes] = useState<number>(0);

  // Calculate total hours for backend
  const getTotalEstimatedHours = (): number => {
    if (estimationMethod === 'preset') {
      return selectedPreset / 60; // Convert minutes to hours
    } else {
      return customHours + (customMinutes / 60); // Convert hours and minutes to hours
    }
  };

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setLoading(true);
        
        // Use the dedicated availability endpoint instead of constructing data
        const response = await api.get('/technicians/availability');
        console.log("Technician availability data:", response.data);
        
        // Process the received data
        setTechnicians(response.data);
      } catch (error) {
        console.error("Error fetching technicians:", error);
        
        // Fallback to original implementation if the endpoint fails
        try {
          // Fetch all technicians as a fallback
          const response = await api.get('/users');
          
          // Filter technicians by role (if role 3 is for technicians)
          const techsOnly = response.data.filter((user: any) => user.role_id === 3);
          
          // Create a formatted list
          const formattedTechs = techsOnly.map((tech: any) => ({
            user_id: tech.user_id,
            first_name: tech.first_name,
            last_name: tech.last_name,
            role_id: tech.role_id,
            is_active: tech.is_active,
            is_available: true, // Assume available by default
            current_tasks: [] // Empty tasks by default
          }));
          
          // Now fetch work_order_stages to determine busy technicians
          const stagesResponse = await api.get('/work_order_stages');
          
          // Filter for active stages and include proper stage info
          const activeStages = stagesResponse.data.filter((stage: any) => 
            stage.status === 'In Progress' && stage.assigned_technician
          );
          
          // Mark technicians as busy if they have active tasks
          formattedTechs.forEach(tech => {
            const activeTasks = activeStages.filter((stage: any) => 
              stage.assigned_technician === tech.user_id
            );
            
            if (activeTasks.length > 0) {
              tech.is_available = false;
              tech.current_tasks = activeTasks.map((task: any) => ({
                ...task,
                // Use actual estimated_hours from the stage if available
                estimated_hours: task.estimated_hours || 1,
                // Calculate completion time using actual estimated hours
                estimated_completion: new Date(
                  new Date(task.start_time).getTime() + 
                  (task.estimated_hours || 1) * 60 * 60 * 1000
                )
              }));
            }
          });
          
          console.log("Fallback technician data:", formattedTechs);
          setTechnicians(formattedTechs);
        } catch (fallbackError) {
          console.error("Fallback technician loading also failed:", fallbackError);
          toast.error("Failed to load technicians");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, []);

  const handleTechnicianChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const techId = e.target.value;
    
    if (!techId) {
      onChange(techId);
      return;
    }
    
    const tech = technicians.find(t => t.user_id.toString() === techId);
    
    if (tech && !tech.is_available) {
      setSelectedTechnician(tech);
      setShowModal(true);
    } else {
      onChange(techId, getTotalEstimatedHours());
    }
  };

  const handleCustomHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setCustomHours(isNaN(value) ? 0 : Math.min(Math.max(0, value), 12)); // Clamp between 0-12
  };

  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setCustomMinutes(isNaN(value) ? 0 : Math.min(Math.max(0, value), 59)); // Clamp between 0-59
  };

  // Helper function to format time for display
  const formatEstimatedTime = (): string => {
    if (estimationMethod === 'preset') {
      const hours = Math.floor(selectedPreset / 60);
      const minutes = selectedPreset % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } else {
      return `${customHours}h ${customMinutes}m`;
    }
  };

  const handleAddToQueue = async () => {
    if (!selectedTechnician) return;
    
    setIsProcessing(true);
    try {
      // Calculate estimated hours based on selection
      const estimatedHours = getTotalEstimatedHours();
      console.log("Adding to queue with estimated hours:", estimatedHours);
      
      // First update the parent component value with both technician ID and estimated hours
      onChange(selectedTechnician.user_id.toString(), estimatedHours);
      
      // Then make the API call with the estimated time
      await api.post(`/work_order_stages/${stageId}/queue`, {
        technician_id: selectedTechnician.user_id,
        note,
        estimated_hours: estimatedHours // Make sure this is passed correctly
      });
      
      // Show success and close modal
      toast.success(`Added to ${selectedTechnician.first_name}'s queue`);
      setShowModal(false);
      
      // Allow state to update before completing
      setTimeout(() => {
        onAssignmentComplete();
      }, 100);
    } catch (error) {
      console.error("Error adding to queue:", error);
      toast.error("Failed to add to queue");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePauseAndStart = async () => {
    if (!selectedTechnician) return;
    
    setIsProcessing(true);
    try {
      // Calculate estimated hours based on selection
      const estimatedHours = getTotalEstimatedHours();
      console.log("Starting task with estimated hours:", estimatedHours);
      
      // First update the parent component value with both technician ID and estimated hours
      onChange(selectedTechnician.user_id.toString(), estimatedHours);
      
      // Then make the API call with the estimated time
      await api.post(`/work_order_stages/${stageId}/pause-and-start`, {
        technician_id: selectedTechnician.user_id,
        note,
        estimated_hours: estimatedHours // Make sure this is passed correctly
      });
      
      // Show success and close modal
      toast.success(`Paused ongoing tasks and assigned to ${selectedTechnician.first_name}`);
      setShowModal(false);
      
      // Allow state to update before completing
      setTimeout(() => {
        onAssignmentComplete();
      }, 100);
    } catch (error) {
      console.error("Error pausing and starting:", error);
      toast.error("Failed to assign task");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate the time left for a technician to be free
  const calculateTimeLeft = (task: TechnicianTask) => {
    try {
      const startTime = new Date(task.start_time);
      const now = new Date();
      const elapsedMs = now.getTime() - startTime.getTime();
      
      // Use task.estimated_hours if available, don't fall back to a default
      // This is important to ensure we're using actual stored values
      if (!task.estimated_hours) {
        console.warn(`Task ${task.work_order_stage_id} missing estimated_hours, cannot calculate remaining time accurately`);
      }
      
      // Get estimated hours (in milliseconds)
      const totalTaskTimeMs = (task.estimated_hours || 1) * 60 * 60 * 1000;
      const remainingMs = Math.max(0, totalTaskTimeMs - elapsedMs);
      
      // Calculate hours and minutes
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      
      // For debugging
      console.log("Time calculation:", {
        taskId: task.work_order_stage_id,
        startTime: startTime.toISOString(),
        now: now.toISOString(),
        elapsedMs,
        estimatedHours: task.estimated_hours,
        totalTaskTimeMs,
        remainingMs,
        hours,
        minutes
      });
      
      return { hours, minutes, text: `${hours}h ${minutes}m` };
    } catch (error) {
      console.error("Error calculating time left:", error);
      return { hours: 0, minutes: 0, text: "Error" };
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-10 w-full rounded"></div>;
  }

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Assign Technician
      </label>
      <select
        value={value}
        onChange={handleTechnicianChange}
        className="block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Select Technician</option>
        {technicians.map((tech) => {
          // Calculate time left if the technician is busy
          const timeLeft = tech.is_available 
            ? null 
            : tech.current_tasks.length > 0 
              ? calculateTimeLeft(tech.current_tasks[0]) 
              : null;
              
          return (
            <option key={tech.user_id} value={tech.user_id.toString()}>
              {tech.first_name} {tech.last_name} 
              {!tech.is_available && timeLeft
                ? ` (Busy - Est. ${timeLeft?.text} left)` 
                : ' (Available)'}
            </option>
          );
        })}
      </select>

      {/* Time estimate section */}
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estimated Time to Complete ({formatEstimatedTime()})
        </label>
        
        {/* Preset buttons */}
        <div className="flex space-x-2 mb-3">
          <button
            type="button"
            onClick={() => { setEstimationMethod('preset'); setSelectedPreset(30); }}
            className={`px-3 py-1 rounded ${
              estimationMethod === 'preset' && selectedPreset === 30 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            30 min
          </button>
          <button
            type="button"
            onClick={() => { setEstimationMethod('preset'); setSelectedPreset(60); }}
            className={`px-3 py-1 rounded ${
              estimationMethod === 'preset' && selectedPreset === 60 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            60 min
          </button>
          <button
            type="button"
            onClick={() => { setEstimationMethod('preset'); setSelectedPreset(90); }}
            className={`px-3 py-1 rounded ${
              estimationMethod === 'preset' && selectedPreset === 90 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            90 min
          </button>
          <button
            type="button"
            onClick={() => setEstimationMethod('custom')}
            className={`px-3 py-1 rounded ${
              estimationMethod === 'custom' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Custom
          </button>
        </div>
        
        {/* Custom time inputs */}
        {estimationMethod === 'custom' && (
          <div className="flex space-x-2">
            <div className="w-1/2">
              <label className="block text-xs text-gray-500 mb-1">Hours (0-12)</label>
              <input
                type="number"
                min="0"
                max="12"
                value={customHours}
                onChange={handleCustomHoursChange}
                className="block w-full rounded-md border border-gray-300 p-2"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs text-gray-500 mb-1">Minutes (0-59)</label>
              <input
                type="number"
                min="0"
                max="59"
                value={customMinutes}
                onChange={handleCustomMinutesChange}
                className="block w-full rounded-md border border-gray-300 p-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal for busy technicians */}
      {showModal && selectedTechnician && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Technician is busy</h3>
            {selectedTechnician.current_tasks.length > 0 ? (
              <>
                <p className="mb-4">
                  {selectedTechnician.first_name} {selectedTechnician.last_name} is currently assigned to:
                </p>
                
                <ul className="mb-4 list-disc pl-5 space-y-3">
                  {selectedTechnician.current_tasks.map(task => {
                    const timeLeft = calculateTimeLeft(task);
                    return (
                      <li key={task.work_order_stage_id} className="p-2 bg-gray-50 rounded">
                        <div className="font-medium">Work Order #{task.work_order_id}</div>
                        <div>{task.stage_name || `Stage ${task.stage_id}`}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Started: {new Date(task.start_time).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Time elapsed: <ElapsedTime startTime={task.start_time} />
                        </div>
                        <div className="text-sm font-medium text-blue-600 mt-1">
                          Estimated time left: {timeLeft.text}
                        </div>
                        <div className="text-xs text-gray-500">
                          (Based on {task.estimated_hours}h estimate)
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="mb-4">
                {selectedTechnician.first_name} {selectedTechnician.last_name} may be busy with other tasks.
              </p>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="block w-full rounded-md border border-gray-300 p-2"
                placeholder="Explain priority or special instructions..."
              ></textarea>
            </div>
            
            {/* Time estimate in modal */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time to Complete ({formatEstimatedTime()})
              </label>
              
              {/* Preset buttons */}
              <div className="flex space-x-2 mb-3">
                <button
                  type="button"
                  onClick={() => { setEstimationMethod('preset'); setSelectedPreset(30); }}
                  className={`px-3 py-1 rounded ${
                    estimationMethod === 'preset' && selectedPreset === 30 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  30 min
                </button>
                <button
                  type="button"
                  onClick={() => { setEstimationMethod('preset'); setSelectedPreset(60); }}
                  className={`px-3 py-1 rounded ${
                    estimationMethod === 'preset' && selectedPreset === 60 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  60 min
                </button>
                <button
                  type="button"
                  onClick={() => { setEstimationMethod('preset'); setSelectedPreset(90); }}
                  className={`px-3 py-1 rounded ${
                    estimationMethod === 'preset' && selectedPreset === 90 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  90 min
                </button>
                <button
                  type="button"
                  onClick={() => setEstimationMethod('custom')}
                  className={`px-3 py-1 rounded ${
                    estimationMethod === 'custom' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Custom
                </button>
              </div>
              
              {/* Custom time inputs */}
              {estimationMethod === 'custom' && (
                <div className="flex space-x-2">
                  <div className="w-1/2">
                    <label className="block text-xs text-gray-500 mb-1">Hours (0-12)</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={customHours}
                      onChange={handleCustomHoursChange}
                      className="block w-full rounded-md border border-gray-300 p-2"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs text-gray-500 mb-1">Minutes (0-59)</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={customMinutes}
                      onChange={handleCustomMinutesChange}
                      className="block w-full rounded-md border border-gray-300 p-2"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <p className="mb-4">What would you like to do?</p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleAddToQueue}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Add to Queue"}
              </button>
              <button
                onClick={handlePauseAndStart}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Pause Current & Start This"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianSelector;