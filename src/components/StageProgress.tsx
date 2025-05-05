"use client";

import React from "react";

// For example, define your stage labels:
const STAGES = ["PPR", "Pember", "Mason", "Paint", "Polish", "Done"];

/**
 * Props:
 *   currentStage: the string that matches one of STAGES
 */
interface StageProgressProps {
  currentStage: string;
}

const StageProgress: React.FC<StageProgressProps> = ({ currentStage }) => {
  // 1) Map stage name to an index
  //    If the stage doesn't exist in STAGES, fallback to 0
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="flex items-center justify-center">
      {STAGES.map((stage, idx) => {
        // If the idx <= currentIndex, we consider it 'active/completed'
        const isActive = idx <= currentIndex && currentIndex !== -1;

        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${isActive ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}
                `}
              >
                {idx + 1}
              </div>
              {/* Stage Label (optional) */}
              <span className="mt-1 text-xs whitespace-nowrap">
                {stage}
              </span>
            </div>
            {/* Connector line, except after the last stage */}
            {idx < STAGES.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 
                  ${isActive ? "bg-blue-500" : "bg-gray-200"}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StageProgress;
