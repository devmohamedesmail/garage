"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/services/api";
import { Toaster, toast } from "react-hot-toast";
import StageCard from "./StageCard"; // Adjust import path if needed
import ElapsedTime from "./ElapsedTime"; // Adjust import path if needed
import StageProgress from "./StageProgress"; // Adjust import path if needed

// New interface for revert reasons
interface RevertReason {
  reason_id: number;
  reason_text: string;
  is_default: number;
  created_by: number | null;
  created_at: string;
}

// ============ INTERFACES ============
// Extended to include stage_name if we fetch it via a join or a separate method
interface WorkOrder {
  work_order_id: number;
  invoice_id: number;
  assigned_technician: number | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  notes: string | null;
  supervisor: string | null;
  is_completed: number;
  // optional fields
  invoice_number?: string;
  license_plate?: string;
  make?: string;
  model?: string;
  color?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  technician_first_name?: string;
  technician_last_name?: string;
}

interface WorkOrderStage {
  work_order_stage_id: number;
  work_order_id: number;
  stage_id: number;
  stage_order: number;
  assigned_technician: number | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // If your new endpoint includes stage_name:
  stage_name?: string;
  // New fields for revert functionality
  was_reverted?: boolean;
  reverted_by?: number;
  revert_reason?: string;
  revert_date?: string;
  affected_by_revert?: boolean;
  no_need_to_redo?: boolean;
  no_need_to_redo_by?: number;
  no_need_to_redo_notes?: string;
  no_need_to_redo_date?: string;
}

interface StageOption {
  stage_id: number;
  stage_name: string;
}

interface TechnicianOption {
  user_id: number;
  first_name: string;
  last_name: string;
  role_id: number;
  is_active: number;
}

// Export these interfaces for use in StageCard
export type { WorkOrderStage, TechnicianOption, StageOption };

// ============ MAIN PAGE COMPONENT ============
const WorkOrderPage: React.FC = () => {
  const params = useParams();
  const workOrderId = params?.id as string;
  const router = useRouter();

  // States for work order & stages
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [workOrderStages, setWorkOrderStages] = useState<WorkOrderStage[]>([]);
  const [stagesList, setStagesList] = useState<StageOption[]>([]);
  const [techniciansList, setTechniciansList] = useState<TechnicianOption[]>([]);
  const [loading, setLoading] = useState(true);

  // For controlling which stage is displayed
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [didSetDefaultIndex, setDidSetDefaultIndex] = useState(false);

  // For resuming / pausing / ending controls
  const [startData, setStartData] = useState({ assigned_technician: "", note: "", estimated_hours: undefined });
  const [endData, setEndData] = useState({ note: "" });

  // Revert state variables
  const [isRevertModalOpen, setIsRevertModalOpen] = useState<boolean>(false);
  const [revertReason, setRevertReason] = useState<string>("");
  const [revertImage, setRevertImage] = useState<File | null>(null);
  const [isReverting, setIsReverting] = useState<boolean>(false);
  const [selectedRevertReasonId, setSelectedRevertReasonId] = useState<string>("");
  const [showCustomReasonField, setShowCustomReasonField] = useState<boolean>(false);
  const [revertReasons, setRevertReasons] = useState<RevertReason[]>([]);

  // ------------------------------
  // Fetch Work Order Info
  // ------------------------------
  const fetchWorkOrderInfo = async () => {
    try {
      console.log("Fetching work order:", workOrderId);
      const response = await api.get(`/work_orders/${workOrderId}`);
      setWorkOrder(response.data);
    } catch (error) {
      console.error("Error fetching work order info:", error);
      toast.error("Failed to load work order details");
    }
  };
  
  // Then in useEffect:
  useEffect(() => {
    if (workOrderId) fetchWorkOrderInfo();
  }, [workOrderId]);
  
  // ------------------------------
  // Fetch Linked Stages (Using the NEW endpoint)
  // ------------------------------
  useEffect(() => {
    const fetchWorkOrderStagesWithNames = async () => {
      try {
        // Use the new endpoint that joins the stages table and returns stage_name
        const response = await api.get(
          `/work_order_stages_with_names?work_order_id=${workOrderId}`
        );
        setWorkOrderStages(response.data);
      } catch (error) {
        console.error("Error fetching work order stages with names:", error);
        toast.error("Failed to load work order stages");
      } finally {
        setLoading(false);
      }
    };
    if (workOrderId) fetchWorkOrderStagesWithNames();
  }, [workOrderId]);

  // ------------------------------
  // Fetch Stage Options + Technicians + Revert Reasons
  // ------------------------------
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [stagesRes, techRes, reasonsRes] = await Promise.all([
          api.get("/stages"),
          api.get("/users"),
          api.get("/revert-reasons")
        ]);
        setStagesList(stagesRes.data);
        setTechniciansList(techRes.data);
        setRevertReasons(reasonsRes.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast.error("Failed to load dropdown options");
      }
    };
    fetchDropdownData();
  }, []);

  // ------------------------------
  // Helper Function: Technician Name
  // ------------------------------
  const getTechnicianName = (technicianId: number | null) => {
    if (!technicianId) return "Not Assigned";
    const tech = techniciansList.find((t) => t.user_id === technicianId);
    return tech ? `${tech.first_name} ${tech.last_name}` : "Unknown Tech";
  };

  // ------------------------------
  // Handlers for Revert functionality
  // ------------------------------
  const handleRevertImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRevertImage(e.target.files[0]);
    }
  };

  const handleRevertReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedRevertReasonId(value);
    setShowCustomReasonField(value === 'other');
    
    // If selecting a predefined reason, clear the custom reason field
    if (value !== 'other') {
      setRevertReason("");
    }
  };

  const handleRevertClick = () => {
    setIsRevertModalOpen(true);
    setSelectedRevertReasonId(''); // Reset selection
    setRevertReason(''); // Reset custom reason
    setShowCustomReasonField(false);
  };

  const handleRevertConfirm = async () => {
    // Get the current stage ID
    if (!stageToShow) {
      toast.error("No stage selected");
      return;
    }
    
    // Validate input
    if (selectedRevertReasonId === '') {
      toast.error("Please select a reason for reverting");
      return;
    }
    
    // Get current user - in a real implementation, this would come from your auth system
    const currentUserId = 1; // Example user ID
    
    setIsReverting(true);
    try {
      // Create FormData for image upload (if needed)
      let imageUrl = null;
      if (revertImage) {
        const formData = new FormData();
        formData.append("image", revertImage);
        // Add image upload logic here if needed
        // const uploadResponse = await api.post("/api/upload", formData);
        // imageUrl = uploadResponse.data.url;
      }

      // Prepare the request payload
      const payload: any = {
        created_by: currentUserId,
        image_url: imageUrl,
        target_status: "Not Started"
      };

      // Add either the selected predefined reason ID or custom reason
      if (selectedRevertReasonId === 'other') {
        if (!revertReason.trim()) {
          toast.error("Please enter a custom reason");
          setIsReverting(false);
          return;
        }
        payload.revert_reason = revertReason;
      } else {
        payload.revert_reason_id = selectedRevertReasonId;
      }

      console.log("Sending revert payload:", payload);

      // Make the API call
      const response = await api.post(
        `/work_order_stages/${stageToShow.work_order_stage_id}/revert`,
        payload
      );

      // Close modal
      setIsRevertModalOpen(false);
      setRevertReason('');
      setSelectedRevertReasonId('');
      setRevertImage(null);
      
      // Show success message
      toast.success("Stage reverted successfully");
      
      // Refresh the page
      window.location.reload();
      
    } catch (error: any) {
      console.error("Error reverting stage:", error);
      toast.error("Failed to revert stage: " + (error.response?.data?.error || error.message));
    } finally {
      setIsReverting(false);
    }
  };

  // ------------------------------
  // Action Handlers for Stage Control
  // ------------------------------
  const handleResumeStage = async (stageId: number, techId: string, note: string, estimatedHours?: number) => {
    try {
      // Log if estimatedHours is not provided
      if (estimatedHours === undefined) {
        console.log("Warning: estimatedHours parameter not provided, using default value of 1");
      } else {
        console.log(`Using provided estimatedHours: ${estimatedHours}`);
      }

      const defaultHours = 1;
      const hoursToUse = estimatedHours !== undefined ? estimatedHours : defaultHours;
      
      await api.post(`/work_order_stages/${stageId}/resume`, {
        assigned_technician: techId ? parseInt(techId, 10) : null,
        note,
        estimated_hours: hoursToUse
      });
  
      // Re-fetch
      const [woRes, stagesRes] = await Promise.all([
        api.get(`/work_orders/${workOrderId}`),
        api.get(`/work_order_stages_with_names?work_order_id=${workOrderId}`)
      ]);
  
      setWorkOrder(woRes.data);
      setWorkOrderStages(stagesRes.data);
      toast.success("Stage resumed successfully");
  
    } catch (error: any) {
      console.error("Error resuming stage:", error.response?.data || error);
      toast.error("Failed to resume stage");
    }
  };
  
  const handlePauseStage = async (stageId: number) => {
    try {
      await api.post(`/work_order_stages/${stageId}/pause`);
  
      // Re-fetch both the Work Order and the Stages
      const [woRes, stagesRes] = await Promise.all([
        api.get(`/work_orders/${workOrderId}`),
        api.get(`/work_order_stages_with_names?work_order_id=${workOrderId}`)
      ]);
  
      setWorkOrder(woRes.data);
      setWorkOrderStages(stagesRes.data);
      toast.success("Stage paused successfully");
  
    } catch (error: any) {
      console.error("Error pausing stage:", error.response?.data || error);
      toast.error("Failed to pause stage");
    }
  };
  
  const handleEndStage = async (stageId: number, note: string) => {
    try {
      await api.post(`/work_order_stages/${stageId}/end`, { note });
  
      // Re-fetch
      const [woRes, stagesRes] = await Promise.all([
        api.get(`/work_orders/${workOrderId}`),
        api.get(`/work_order_stages_with_names?work_order_id=${workOrderId}`)
      ]);
  
      setWorkOrder(woRes.data);
      setWorkOrderStages(stagesRes.data);
      toast.success("Stage completed successfully");
  
    } catch (error: any) {
      console.error("Error ending stage:", error.response?.data || error);
      toast.error("Failed to end stage");
    }
  };
  
  // ------------------------------
  // Determine the Active Stage
  // ------------------------------
  const sortedStages = [...workOrderStages].sort((a, b) => a.stage_order - b.stage_order);

  // 1) Find a stage "In Progress"
  const inProgressStage = sortedStages.find((s) => s.status.toLowerCase() === "in progress");
  // 2) If none in progress, see if there's a "Paused" stage
  const pausedStage = sortedStages.find((s) => s.status.toLowerCase() === "paused");
  // 3) If none in progress or paused, find next "Not Started"
  let nextStartableStage: WorkOrderStage | undefined;
  if (!inProgressStage && !pausedStage) {
    nextStartableStage = sortedStages.find((s, idx) => {
      if (s.status.toLowerCase() !== "not started") return false;
      return idx === 0 || sortedStages[idx - 1].status.toLowerCase() === "completed";
    });
  }
  // 4) Determine active stage (paused stage is now treated as active if no stage is in progress)
  const activeStage = inProgressStage || pausedStage || nextStartableStage || null;

  // Auto-jump to active stage once
  useEffect(() => {
    if (!didSetDefaultIndex && sortedStages.length > 0) {
      if (activeStage) {
        const idx = sortedStages.findIndex(
          (s) => s.work_order_stage_id === activeStage.work_order_stage_id
        );
        setCurrentStageIndex(idx >= 0 ? idx : 0);
      } else {
        setCurrentStageIndex(0);
      }
      setDidSetDefaultIndex(true);
    }
  }, [activeStage, sortedStages, didSetDefaultIndex]);

  // Determine which stage to show
  const safeIndex = Math.min(Math.max(currentStageIndex, 0), sortedStages.length - 1);
  const stageToShow = sortedStages[safeIndex] || null;
  const isActive =
    activeStage &&
    stageToShow &&
    activeStage.work_order_stage_id === stageToShow.work_order_stage_id;

  if (loading) {
    return <p className="text-center mt-10">Loading work order data...</p>;
  }

  // ------------------------------
  // Render UI
  // ------------------------------
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Add the Toaster component */}
      <Toaster position="top-right" />
      
      {/* Work Order Details */}
      {workOrder && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          {/* Header */}
          <h2 className="text-2xl font-bold border-b pb-2">
            Work Order #{workOrder.work_order_id}
          </h2>
          {/* Add total elapsed time */}
            {workOrder.start_date && (
              <div className="text-base font-normal bg-blue-50 px-3 py-1 rounded-lg">
                <span className="font-medium text-blue-800">Total Time: </span>
                <ElapsedTime 
                  startTime={workOrder.start_date} 
                  endTime={workOrder.is_completed ? workOrder.end_date : null} 
                />
              </div>
            )}
          {/* Grid for main details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-1">
              <p>
                <span className="font-semibold text-gray-700">Invoice #:</span>{" "}
                <span className="text-gray-900">{workOrder.invoice_number ?? "N/A"}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-700">Status:</span>{" "}
                <span className="text-gray-900">{workOrder.status || "N/A"}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-700">Assigned Technician (ID):</span>{" "}
                <span className="text-gray-900">
                  {workOrder.assigned_technician ?? "None"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-gray-700">Supervisor:</span>{" "}
                <span className="text-gray-900">{workOrder.supervisor || "N/A"}</span>
              </p>
            </div>

            {/* Right column */}
            <div className="space-y-1">
              <p>
                <span className="font-semibold text-gray-700">Start Date:</span>{" "}
                <span className="text-gray-900">
                  {workOrder.start_date
                    ? new Date(workOrder.start_date).toLocaleString()
                    : "N/A"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-gray-700">End Date:</span>{" "}
                <span className="text-gray-900">
                  {workOrder.end_date
                    ? new Date(workOrder.end_date).toLocaleString()
                    : "N/A"}
                </span>
              </p>
            </div>
          </div>

          {/* Notes (if any) */}
          {workOrder.notes && (
            <p className="mt-2">
              <span className="font-semibold text-gray-700">Notes:</span>{" "}
              <span className="text-gray-900">{workOrder.notes}</span>
            </p>
          )}

          {/* Car info */}
          <div className="border-t pt-3 mt-4">
            <p>
              <span className="font-semibold text-gray-700">Car Info:</span>{" "}
              <span className="text-gray-900">
                {`${workOrder.make || "N/A"} ${workOrder.model || ""} ${
                  workOrder.color ? "- " + workOrder.color : ""
                } (License: ${workOrder.license_plate || "N/A"})`}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Stage Progress Display */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Stage Progress</h2>
          <StageProgress 
          stages={sortedStages} 
          currentStageIndex={safeIndex} 
          onStageClick={(index) => setCurrentStageIndex(index)} 
           />
        </div>
      {/* Active Stage Display with Navigation */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Stage</h2>
        {sortedStages.length === 0 ? (
          <p className="text-gray-600">No stages linked to this work order.</p>
        ) : (
          stageToShow && (
            <StageCard
              stageToShow={stageToShow}
              isActive={isActive}
              stageIndex={safeIndex}
              stagesList={stagesList}
              techniciansList={techniciansList}
              getTechnicianName={getTechnicianName}
              startData={startData}
              setStartData={setStartData}
              endData={endData}
              setEndData={setEndData}
              handleResumeStage={handleResumeStage}
              handlePauseStage={handlePauseStage}
              handleEndStage={handleEndStage}
            />
          )
        )}

        {/* Revert Confirmation Modal */}
        {isRevertModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Revert Stage</h3>
              <p className="mb-4 text-gray-700">
                Please select a reason for reverting this stage. This will be recorded in the system.
              </p>
              
              {/* Predefined Reasons Dropdown */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Reason for Reverting: <span className="text-red-500">*</span></label>
                <select
                  className="w-full border rounded p-2"
                  value={selectedRevertReasonId}
                  onChange={handleRevertReasonChange}
                >
                  <option value="">Select a reason</option>
                  {revertReasons.map((reason) => (
                    <option key={reason.reason_id} value={reason.reason_id.toString()}>
                      {reason.reason_text}
                    </option>
                  ))}
                  <option value="other">Other (specify)</option>
                </select>
              </div>
              
              {/* Custom Reason Text Field - only shown when "Other" is selected */}
              {showCustomReasonField && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">
                    Specify Reason: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full border rounded p-2"
                    rows={3}
                    placeholder="Enter custom reason for reverting..."
                    value={revertReason}
                    onChange={(e) => setRevertReason(e.target.value)}
                  />
                </div>
              )}
              
              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Attach Image (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleRevertImageChange}
                  className="w-full"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsRevertModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevertConfirm}
                  disabled={(!selectedRevertReasonId || (selectedRevertReasonId === 'other' && !revertReason.trim())) || isReverting}
                  className={`px-4 py-2 rounded ${
                    (selectedRevertReasonId && (selectedRevertReasonId !== 'other' || revertReason.trim())) && !isReverting
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : "bg-red-300 text-gray-100 cursor-not-allowed"
                  }`}
                >
                  {isReverting ? "Reverting..." : "Revert Stage"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentStageIndex((prev) => Math.max(prev - 1, 0))}
            disabled={safeIndex <= 0}
            className={`px-4 py-2 mr-2 rounded ${
              safeIndex > 0
                ? "bg-gray-200 hover:bg-gray-300"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Back
          </button>
          <button
            onClick={() =>
              setCurrentStageIndex((prev) =>
                Math.min(prev + 1, sortedStages.length - 1)
              )
            }
            disabled={safeIndex >= sortedStages.length - 1}
            className={`px-4 py-2 rounded ${
              safeIndex < sortedStages.length - 1
                ? "bg-gray-200 hover:bg-gray-300"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderPage;