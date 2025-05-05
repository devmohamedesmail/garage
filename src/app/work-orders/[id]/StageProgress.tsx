"use client";

import React from "react";
import { WorkOrderStage } from "./page"; 

interface StageProgressProps {
  stages: WorkOrderStage[];
  currentStageIndex: number;
  onStageClick: (index: number) => void;
}

// Helper function to calculate elapsed time for tooltips
const getElapsedTimeText = (startTime: string): string => {
  if (!startTime) return "";
  
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

const StageProgress: React.FC<StageProgressProps> = ({ 
  stages, 
  currentStageIndex,
  onStageClick 
}) => {
  return (
    <div className="flex items-center w-full my-2">
      <div className="flex items-center w-full">
        {stages.map((stage, idx) => {
          // Get stage properties with fallback values
          const status = (stage.status || "").toLowerCase();
          const wasReverted = stage.was_reverted || false;
          const isAffectedByRevert = stage.affected_by_revert || false;
          const isMarkedNoNeedToRedo = stage.no_need_to_redo || false;
          
          // Check if this stage had previous work (check notes field)
          const hadPreviousWork = stage.notes && 
                               (stage.notes.includes("[STARTED]") || 
                                stage.notes.includes("[COMPLETED]") || 
                                stage.notes.includes("[REVERTED]"));
          
          // Initial state is gray (nothing happened)
          let circleColor = "bg-gray-300"; // default for Not Started
          let customBgColor = "";
          
          // NEW ENHANCED COLOR SCHEME 
          if (status === "completed") {
            circleColor = "bg-[#11b900]"; // GREEN for completed
          } 
          else if (status === "in progress") {
            circleColor = "bg-blue-500"; // BLUE for in progress
          } 
          else if (status === "paused") {
            circleColor = "bg-[#f9df08]"; // YELLOW for on hold
          }
          
          // Override based on revert states
          if (wasReverted) {
            circleColor = "bg-[#f52b00]"; // RED if reverted
          } 
          else if (isAffectedByRevert && !isMarkedNoNeedToRedo) {
            circleColor = "bg-[#eaaa00]"; // ORANGE for affected by revert
          }
          
          const isCurrentStage = idx === currentStageIndex;
          const highlightClass = isCurrentStage ? "ring-2 ring-offset-2 ring-blue-400" : "";
          const displayName = stage.stage_name || `Stage ${idx + 1}`;

          return (
            <div key={stage.work_order_stage_id} className="flex items-center flex-1">
              {/* Stage indicator with text */}
              <div 
                className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 flex-shrink-0 relative"
                onClick={() => onStageClick(idx)}
                title={`${displayName} (${status})${hadPreviousWork ? ' - Had previous work' : ''}${
                  stage.start_time ? ` - Started: ${new Date(stage.start_time).toLocaleString()}` : ''
                }${
                  stage.start_time && !stage.end_time ? 
                  ` - Elapsed: ${getElapsedTimeText(stage.start_time)}` : ''
                }${
                  stage.end_time ? ` - Completed: ${new Date(stage.end_time).toLocaleString()}` : ''
                }`}
              >
                {/* Circle with index */}
                <div
                  className={`h-8 w-8 rounded-full ${circleColor} ${highlightClass} flex items-center justify-center text-white font-bold`}
                  style={customBgColor ? { backgroundColor: customBgColor } : {}}
                >
                  {idx + 1}
                </div>
                
                {/* Red exclamation mark for reverted stages */}
                {wasReverted && (
                  <div className="absolute -top-1 -right-1 bg-[#f52b00] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    !
                  </div>
                )}
                
                {/* Stage name and timer */}
                <div className="flex flex-col items-center">
                  <span className={`mt-1 text-xs ${isCurrentStage ? "font-bold" : "text-gray-700"} text-center max-w-16 truncate`}>
                    {displayName}
                  </span>
                  
                  {/* Add timer status indicator for in-progress stages */}
                  {stage.start_time && !stage.end_time && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded mt-1">
                      {getElapsedTimeText(stage.start_time)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Connecting line, except after the last step */}
              {idx < stages.length - 1 && (
                <div className="h-0.5 bg-gray-300 flex-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StageProgress;