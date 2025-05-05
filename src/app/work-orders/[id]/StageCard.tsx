"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { WorkOrderStage, TechnicianOption, StageOption } from "./WorkOrderPage";
import ElapsedTime from "./ElapsedTime"; // Adjust import path if needed
import NoNeedToRedoOption from "./NoNeedToRedoOption"; // Import the new component
import TechnicianSelector from "./TechnicianSelector";
import CountdownTimer from "./CountdownTimer"; // Import the new countdown timer
import api from "@/services/api"; // Import the centralized API service

// Interface for stage time logs
interface StageTimeLog {
  stage_time_log_id: number;
  work_order_stage_id: number;
  assigned_technician: number | null;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  estimated_hours?: number;
}

// New interface for revert reasons
interface RevertReason {
  reason_id: number;
  reason_text: string;
  is_default: number;
  created_by: number | null;
  created_at: string;
}

interface StageCardProps {
  stageToShow: WorkOrderStage;
  isActive: boolean;
  stageIndex: number;
  stagesList: StageOption[];
  techniciansList: TechnicianOption[];
  getTechnicianName: (technicianId: number | null) => string;
  startData: { assigned_technician: string; note: string; estimated_hours?: number };
  setStartData: React.Dispatch<React.SetStateAction<{ assigned_technician: string; note: string; estimated_hours?: number }>>;
  endData: { note: string };
  setEndData: React.Dispatch<React.SetStateAction<{ note: string }>>;
  handleResumeStage: (stageId: number, techId: string, note: string, estimatedHours?: number) => Promise<void>;
  handlePauseStage: (stageId: number) => Promise<void>;
  handleEndStage: (stageId: number, note: string) => Promise<void>;
}

const StageCard: React.FC<StageCardProps> = ({
  stageToShow,
  isActive,
  stageIndex,
  stagesList,
  techniciansList,
  getTechnicianName,
  startData,
  setStartData,
  endData,
  setEndData,
  handleResumeStage,
  handlePauseStage,
  handleEndStage,
}) => {
  const isCompleted = stageToShow.status?.toLowerCase() === "completed";
  const isInProgress = stageToShow.status?.toLowerCase() === "in progress";
  const isPaused = stageToShow.status?.toLowerCase() === "paused";
  const isWaitingToStart = !isCompleted && !isInProgress && !isPaused;
  
  // Check if this stage was reverted or affected by a revert
  const wasReverted = stageToShow.was_reverted || false;
  const isAffectedByRevert = stageToShow.affected_by_revert || false;
  const isMarkedNoNeedToRedo = stageToShow.no_need_to_redo || false;

  // Local state for showing/hiding input forms
  const [showStartForm, setShowStartForm] = useState(false);
  const [showEndForm, setShowEndForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [revertReason, setRevertReason] = useState("");
  const [selectedRevertReasonId, setSelectedRevertReasonId] = useState<string>("");
  const [revertImage, setRevertImage] = useState<File | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  
  // New state for predefined revert reasons
  const [revertReasons, setRevertReasons] = useState<RevertReason[]>([]);
  const [showCustomReasonField, setShowCustomReasonField] = useState(false);
  
  // NEW: State for time logs
  const [timeLogs, setTimeLogs] = useState<StageTimeLog[]>([]);
  const [showTimeLogs, setShowTimeLogs] = useState(false);
  const [timeLogsLoading, setTimeLogsLoading] = useState(false);
  const [timeLogsError, setTimeLogsError] = useState<string | null>(null);

  // Fetch predefined revert reasons on component mount
  useEffect(() => {
    const fetchRevertReasons = async () => {
      try {
        const response = await api.get('/revert-reasons');
        setRevertReasons(response.data);
      } catch (error) {
        console.error("Error fetching revert reasons:", error);
      }
    };
    
    fetchRevertReasons();
  }, []);
  
  // NEW: Fetch time logs when component mounts or stage changes
  useEffect(() => {
    const fetchTimeLogs = async () => {
      if (!stageToShow?.work_order_stage_id || !showTimeLogs) return;
      
      setTimeLogsLoading(true);
      setTimeLogsError(null);
      
      try {
        const response = await api.get(
          `/work_order_stages/${stageToShow.work_order_stage_id}/logs`
        );
        setTimeLogs(response.data);
      } catch (error) {
        console.error("Error fetching time logs:", error);
        setTimeLogsError("Failed to load time logs history.");
      } finally {
        setTimeLogsLoading(false);
      }
    };
    
    if (showTimeLogs) {
      fetchTimeLogs();
    }
  }, [stageToShow.work_order_stage_id, showTimeLogs]);

  // NEW: Function to calculate duration between two timestamps
  const calculateDuration = (startTime: string, endTime: string | null): string => {
    if (!endTime) return "In progress";

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    // Convert to appropriate units
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Handle refresh of data after no-need-to-redo action
  const handleNoNeedToRedoComplete = () => {
    // You would typically refresh the stage data here
    window.location.reload(); // Simple refresh for demo
  };

  // Handle image file selection for revert
  const handleRevertImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRevertImage(e.target.files[0]);
    }
  };

  // Handle revert reason selection change
  const handleRevertReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedRevertReasonId(value);
    setShowCustomReasonField(value === 'other');
    
    // If selecting a predefined reason, clear the custom reason field
    if (value !== 'other') {
      setRevertReason("");
    }
  };

  // Handle revert button click
  const handleRevertClick = () => {
    setIsRevertModalOpen(true);
    setSelectedRevertReasonId(''); // Reset selection
    setRevertReason(''); // Reset custom reason
    setShowCustomReasonField(false);
  };

  // Handle confirmation of revert - FIXED VERSION
  const handleRevertConfirm = async () => {
    // Basic validation
    if (!selectedRevertReasonId) {
      alert("Please select a reason for reverting");
      return;
    }
    
    setIsReverting(true);
    try {
      // IMPORTANT: API only accepts "revert_reason" and "created_by" fields
      const currentUserId = 1; // Fixed user ID (replace with actual auth in production)
      
      // Create payload with exactly the fields the API expects
      let revertPayload;
      
      if (selectedRevertReasonId === 'other') {
        if (!revertReason.trim()) {
          alert("Please enter a custom reason");
          setIsReverting(false);
          return;
        }
        
        // Use the exact field name "revert_reason" as expected by API
        revertPayload = {
          revert_reason: revertReason,
          created_by: currentUserId
        };
      } else {
        // If using a predefined reason, we need to LOOK UP its text, not pass the ID
        // API does not accept revert_reason_id but requires revert_reason
        const selectedReason = revertReasons.find(r => r.reason_id.toString() === selectedRevertReasonId);
        
        if (!selectedReason) {
          alert("Selected reason not found");
          setIsReverting(false);
          return;
        }
        
        revertPayload = {
          revert_reason: selectedReason.reason_text, // Use the text, not the ID
          created_by: currentUserId
        };
      }
      
      console.log("Sending revert payload:", JSON.stringify(revertPayload));
  
      // Direct API call with exactly the expected fields
      const response = await api.post(
        `/work_order_stages/${stageToShow.work_order_stage_id}/revert`,
        revertPayload
      );
  
      // Process the response
      if (!response.data) {
        throw new Error('Failed to revert stage');
      }
  
      // Success - close modal and refresh
      setIsRevertModalOpen(false);
      setRevertReason('');
      setSelectedRevertReasonId('');
      setRevertImage(null);
      alert("Stage reverted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error reverting stage:", error);
      alert("Failed to revert stage: " + (error.message || 'Unknown error'));
    } finally {
      setIsReverting(false);
    }
  };

  // Handle Stage Control Actions
  const onResumeClick = async () => {
    if (!startData.assigned_technician) {
      alert("Please select a technician");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Pass estimated_hours from startData to handleResumeStage
      await handleResumeStage(
        stageToShow.work_order_stage_id,
        startData.assigned_technician,
        startData.note,
        startData.estimated_hours // Pass the estimated hours value
      );
      setShowStartForm(false);
      setStartData({ assigned_technician: "", note: "", estimated_hours: undefined });
    } catch (error) {
      console.error("Error resuming stage:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPauseClick = async () => {
    setIsSubmitting(true);
    try {
      await handlePauseStage(stageToShow.work_order_stage_id);
    } catch (error) {
      console.error("Error pausing stage:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEndClick = async () => {
    setIsSubmitting(true);
    try {
      await handleEndStage(stageToShow.work_order_stage_id, endData.note);
      setShowEndForm(false);
      setEndData({ note: "" });
    } catch (error) {
      console.error("Error ending stage:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 relative ${wasReverted ? "border-2 border-red-500" : isAffectedByRevert && !isMarkedNoNeedToRedo ? "border-2 border-orange-500" : ""}`}>
      {/* Stage information header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold flex items-center flex-wrap">
          Stage {stageIndex + 1}: {stageToShow.stage_name || "Unknown Stage"}
          
          {/* Show status badges */}
          <span
            className={`ml-2 text-xs font-medium px-2.5 py-0.5 rounded ${
              isCompleted
                ? "bg-green-100 text-green-800"
                : isInProgress
                ? "bg-blue-100 text-blue-800"
                : isPaused
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {stageToShow.status}
          </span>
          
          {/* Badge for reverted stages */}
          {wasReverted && (
            <span className="ml-2 text-xs font-medium px-2.5 py-0.5 rounded bg-red-100 text-red-800">
              Reverted
            </span>
          )}
          
          {/* Badge for affected stages */}
          {isAffectedByRevert && !isMarkedNoNeedToRedo && (
            <span className="ml-2 text-xs font-medium px-2.5 py-0.5 rounded bg-orange-100 text-orange-800">
              Affected by Revert
            </span>
          )}
          
          {/* Badge for stages marked as no need to redo */}
          {isMarkedNoNeedToRedo && (
            <span className="ml-2 text-xs font-medium px-2.5 py-0.5 rounded bg-purple-100 text-purple-800">
              No Need to Redo
            </span>
          )}
        </h3>
        
        {/* Display revert information if applicable */}
        {wasReverted && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
            <p className="font-semibold text-red-800">This stage was reverted</p>
            <p>Reason: {stageToShow.revert_reason || "Not specified"}</p>
            <p>Reverted by: {getTechnicianName(stageToShow.reverted_by || null)}</p>
            <p>Date: {stageToShow.revert_date ? new Date(stageToShow.revert_date).toLocaleString() : "Unknown"}</p>
          </div>
        )}
        
        {/* Display "No Need to Redo" information if applicable */}
        {isMarkedNoNeedToRedo && (
          <div className="mt-2 p-3 bg-purple-50 rounded border border-purple-200 text-sm">
            <p className="font-semibold text-purple-800">Marked as "No Need to Redo"</p>
            <p>By: {getTechnicianName(stageToShow.no_need_to_redo_by || null)}</p>
            <p>Notes: {stageToShow.no_need_to_redo_notes || "No notes provided"}</p>
            <p>Date: {stageToShow.no_need_to_redo_date ? new Date(stageToShow.no_need_to_redo_date).toLocaleString() : "Unknown"}</p>
          </div>
        )}
        
        {/* Option to mark affected stages as "No Need to Redo" */}
        {isAffectedByRevert && !isMarkedNoNeedToRedo && (
          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded text-sm">
            <p className="font-semibold text-orange-800">This stage is affected by a later revert</p>
            <p>This stage may need to be redone due to a revert of a later stage in the workflow.</p>
          </div>
        )}
      </div>

      {/* Stage details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">Assigned Technician:</p>
          <p className="font-medium">
            {getTechnicianName(stageToShow.assigned_technician)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Status:</p>
          <p className="font-medium">{stageToShow.status}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Start Time:</p>
          <p className="font-medium">
            {stageToShow.start_time
              ? new Date(stageToShow.start_time).toLocaleString()
              : "Not Started"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">End Time:</p>
          <p className="font-medium">
            {stageToShow.end_time
              ? new Date(stageToShow.end_time).toLocaleString()
              : "Not Completed"}
          </p>
        </div>
        
        {/* ALWAYS VISIBLE TIMER SECTION - FIXED */}
        <div className="col-span-2 bg-gray-50 p-4 rounded-lg my-4 border border-gray-200">
          <h4 className="font-bold text-lg mb-3">Stage Timing</h4>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Elapsed Time (counts up) */}
            <div className="bg-blue-50 p-3 rounded-lg shadow-sm">
              <div className="text-sm text-blue-700 font-medium mb-1">Elapsed Time:</div>
              <div className="text-2xl font-bold text-blue-800">
                <ElapsedTime 
                  startTime={stageToShow.start_time} 
                  endTime={stageToShow.end_time} 
                />
              </div>
            </div>
            
            {/* Countdown Timer (counts down) */}
            <div className="bg-green-50 p-3 rounded-lg shadow-sm">
              <div className="text-sm text-green-700 font-medium mb-1">Remaining Time:</div>
              <div className="text-2xl font-bold" id="countdown-timer">
                <CountdownTimer 
                  startTime={stageToShow.start_time} 
                  estimatedHours={Number(stageToShow.estimated_hours || 1)}
                  status={stageToShow.status} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Show stage notes if any */}
        {stageToShow.notes && (
          <div className="col-span-2">
            <p className="text-sm text-gray-600">Notes:</p>
            <p className="font-medium">{stageToShow.notes}</p>
          </div>
        )}
      </div>
      
      {/* NEW SECTION: Stage Time Logs */}
      <div className="mt-4 border rounded-lg overflow-hidden">
        <button
          className="w-full p-3 text-left bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
          onClick={() => setShowTimeLogs(!showTimeLogs)}
        >
          <span className="font-medium">Time Logs History</span>
          <span>{showTimeLogs ? "▲" : "▼"}</span>
        </button>
        
        {showTimeLogs && (
          <div className="p-4">
            {timeLogsLoading && (
              <p className="text-center text-gray-500">Loading time logs...</p>
            )}
            
            {timeLogsError && (
              <p className="text-center text-red-500">{timeLogsError}</p>
            )}
            
            {!timeLogsLoading && !timeLogsError && timeLogs.length === 0 && (
              <p className="text-center text-gray-500">No time logs found for this stage.</p>
            )}
            
            {!timeLogsLoading && !timeLogsError && timeLogs.length > 0 && (
              <div className="space-y-4">
                {timeLogs.map((log) => (
                  <div key={log.stage_time_log_id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          !log.end_time ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                        }`}>
                          {!log.end_time ? "Started" : "Completed"}
                        </span>
                        <p className="font-medium mt-1">
                          Technician: {getTechnicianName(log.assigned_technician)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Duration: {calculateDuration(log.start_time, log.end_time)}
                        </p>
                        {log.estimated_hours && (
                          <p className="text-sm text-gray-500">
                            Estimated: {log.estimated_hours}h
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Started: {new Date(log.start_time).toLocaleString()}</p>
                      {log.end_time && (
                        <p>Completed: {new Date(log.end_time).toLocaleString()}</p>
                      )}
                    </div>
                    {log.notes && (
                      <div className="mt-2 p-2 bg-white rounded border text-sm">
                        <p className="font-medium text-gray-700">Notes:</p>
                        <p className="text-gray-600">{log.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Controls Section */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-bold text-lg mb-3">Stage Controls</h4>
        
        {/* Different controls based on stage status */}
        <div className="space-y-4">
          {/* Controls for Paused/Not Started stages */}
          {(isPaused || isWaitingToStart) && (
            <div>
              {!showStartForm ? (
                <button
                  onClick={() => setShowStartForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {isPaused ? "Resume Stage" : "Start Stage"}
                </button>
              ) : (
                <div className="bg-gray-50 p-4 rounded">
                  <h5 className="font-semibold mb-2">
                    {isPaused ? "Resume Stage" : "Start Stage"}
                  </h5>
                  
                  {/* Technician Selection */}
                  <TechnicianSelector
                    value={startData.assigned_technician}
                    onChange={(value, estimatedHours) => 
                      setStartData({
                        ...startData,
                        assigned_technician: value,
                        estimated_hours: estimatedHours
                      })
                    }
                    workOrderId={stageToShow.work_order_id}
                    stageId={stageToShow.work_order_stage_id}
                    onAssignmentComplete={() => {
                      setShowStartForm(false);
                      // Refresh the stage data - this would typically be handled by a parent component
                      window.location.reload();
                    }}
                  />
                  
                  {/* Notes */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={startData.note}
                      onChange={(e) =>
                        setStartData({ ...startData, note: e.target.value })
                      }
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Add any notes about starting this stage..."
                    ></textarea>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={onResumeClick}
                      disabled={!startData.assigned_technician || isSubmitting}
                      className={`px-4 py-2 rounded ${
                        startData.assigned_technician && !isSubmitting
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isSubmitting ? "Processing..." : "Submit"}
                    </button>
                    <button
                      onClick={() => setShowStartForm(false)}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Controls for In Progress stages */}
          {isInProgress && (
            <div className="flex space-x-2">
              <button
                onClick={onPauseClick}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded ${
                  isSubmitting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white"
                }`}
              >
                {isSubmitting ? "Processing..." : "Pause Stage"}
              </button>
              
              {!showEndForm ? (
                <button
                  onClick={() => setShowEndForm(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Complete Stage
                </button>
              ) : (
                <div className="bg-gray-50 p-4 rounded mt-2 w-full">
                  <h5 className="font-semibold mb-2">Complete Stage</h5>
                  
                  {/* Notes for completion */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Completion Notes (Optional)
                    </label>
                    <textarea
                      value={endData.note}
                      onChange={(e) =>
                        setEndData({ ...endData, note: e.target.value })
                      }
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Add any notes about completing this stage..."
                    ></textarea>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={onEndClick}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded ${
                        !isSubmitting
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isSubmitting ? "Processing..." : "Complete"}
                    </button>
                    <button
                      onClick={() => setShowEndForm(false)}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Revert button - always present to allow stage reverting */}
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={handleRevertClick}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Revert Stage
            </button>
          </div>
        </div>
      </div>
      
      {/* Revert Confirmation Modal - UPDATED with predefined reasons */}
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
      
      {/* No Need to Redo Component */}
      {isAffectedByRevert && !isMarkedNoNeedToRedo && (
        <NoNeedToRedoOption 
          stageId={stageToShow.work_order_stage_id}
          onComplete={handleNoNeedToRedoComplete}
        />
      )}
    </div>
  );
};

export default StageCard;