import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  startTime: string | null;
  estimatedHours: number;
  status: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  startTime, 
  estimatedHours,
  status 
}) => {
  const [timeDisplay, setTimeDisplay] = useState<string>("00:00:00");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Format number to have 2 digits
  const formatTimeUnit = (unit: number): string => {
    return unit.toString().padStart(2, '0');
  };
  
  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) {
      const absSeconds = Math.abs(totalSeconds);
      const hours = Math.floor(absSeconds / 3600);
      const minutes = Math.floor((absSeconds % 3600) / 60);
      const seconds = Math.floor(absSeconds % 60);
      return `-${formatTimeUnit(hours)}:${formatTimeUnit(minutes)}:${formatTimeUnit(seconds)}`;
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      return `${formatTimeUnit(hours)}:${formatTimeUnit(minutes)}:${formatTimeUnit(seconds)}`;
    }
  };

  useEffect(() => {
    // For non-running stages, just show the estimated time
    if (!startTime || status?.toLowerCase() !== "in progress") {
      const estSeconds = Math.floor((estimatedHours || 1) * 3600);
      setTimeDisplay(formatTime(estSeconds));
      setIsExpired(false);
      return;
    }
    
    // Update function that runs every second for running timers
    const updateTimer = () => {
      try {
        // Simple calculation based on start time and current time
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - start) / 1000);
        const estSeconds = Math.floor((estimatedHours || 1) * 3600);
        const remaining = estSeconds - elapsed;
        
        setIsExpired(remaining <= 0);
        setTimeDisplay(formatTime(remaining));
      } catch (error) {
        console.error("Timer calculation error:", error);
        setTimeDisplay(formatTime(Math.floor((estimatedHours || 1) * 3600)));
      }
    };
    
    // Run once immediately
    updateTimer();
    
    // Set up interval for running stages
    const intervalId = setInterval(updateTimer, 1000);
    
    // Cleanup
    return () => clearInterval(intervalId);
  }, [startTime, estimatedHours, status]);

  // Simple rendering logic
  const isInProgress = status?.toLowerCase() === "in progress";
  
  return (
    <div className="font-mono">
      <span 
        className={`font-bold ${
          timeDisplay.startsWith('-') ? "text-orange-600" : 
          isExpired ? "text-red-600" : 
          isInProgress ? "text-green-700" : 
          "text-gray-500"
        }`}
      >
        {timeDisplay}
      </span>
      
      {!isInProgress && (
        <span className="text-xs text-gray-500">
          Estimated time
        </span>
      )}
      
      {isInProgress && timeDisplay.startsWith('-') && (
        <span className="text-xs text-orange-600">
          Exceeded estimated time
        </span>
      )}
    </div>
  );
};

export default CountdownTimer;