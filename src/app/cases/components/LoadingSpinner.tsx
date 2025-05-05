import React from "react";
import api from "@/services/api"; // Import the API service

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
      <p className="text-gray-500">{text}</p>
    </div>
  );
};

export default LoadingSpinner;