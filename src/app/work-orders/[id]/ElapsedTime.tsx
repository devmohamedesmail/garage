import React, { useState, useEffect } from "react";

interface ElapsedTimeProps {
  startTime: string | null;
  endTime?: string | null;
}

const ElapsedTime: React.FC<ElapsedTimeProps> = ({ startTime, endTime }) => {
  const [timeDisplay, setTimeDisplay] = useState<string>("Not started");
  
  // Format number to have 2 digits
  const formatTimeUnit = (unit: number): string => {
    return unit.toString().padStart(2, '0');
  };
  
  // Format seconds to appropriate time format based on duration
  const formatTime = (totalSeconds: number): string => {
    // Convert to days when over 24 hours
    if (totalSeconds >= 86400) { // 24 hours in seconds
      const days = Math.floor(totalSeconds / 86400);
      const remainingHours = Math.floor((totalSeconds % 86400) / 3600);
      const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
      
      // Format the output based on available parts
      let timeString = `${days} day${days !== 1 ? 's' : ''}`;
      
      if (remainingHours > 0) {
        timeString += ` ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
      }
      
      if (remainingMinutes > 0) {
        timeString += ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
      }
      
      return timeString;
    }
    
    // Standard HH:MM:SS format for durations under 24 hours
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${formatTimeUnit(hours)}:${formatTimeUnit(minutes)}:${formatTimeUnit(seconds)}`;
  };

  useEffect(() => {
    // No start time = not started
    if (!startTime) {
      setTimeDisplay("Not started");
      return;
    }

    // Simple update function
    const updateTimer = () => {
      try {
        // For completed stages, calculate from start to end
        if (endTime) {
          const start = new Date(startTime).getTime();
          const end = new Date(endTime).getTime();
          const elapsed = Math.max(0, Math.floor((end - start) / 1000));
          setTimeDisplay(formatTime(elapsed));
          return;
        }
        
        // For running stages, calculate from start to now
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        const elapsed = Math.max(0, Math.floor((now - start) / 1000));
        setTimeDisplay(formatTime(elapsed));
      } catch (error) {
        console.error("Elapsed time calculation error:", error);
        setTimeDisplay("Error");
      }
    };
    
    // Run once immediately
    updateTimer();
    
    // Set interval only for running stages
    let intervalId: NodeJS.Timeout | null = null;
    if (!endTime) {
      intervalId = setInterval(updateTimer, 1000);
    }
    
    // Cleanup
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [startTime, endTime]);

  // Determine if running
  const isRunning = startTime && !endTime;

  return (
    <div className="flex flex-col">
      <span className={`font-bold ${
        timeDisplay === "Not started" ? "text-gray-500" :
        timeDisplay === "Error" ? "text-red-600" :
        endTime ? "text-blue-600" : "text-blue-700"
      }`}>
        {timeDisplay}
      </span>
      
      {isRunning && (
        <span className="text-xs text-blue-600">
          Running
        </span>
      )}
    </div>
  );
};

export default ElapsedTime;