"use client";

import { Button } from "@/components/ui/button";

interface LoadingErrorStateProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function LoadingErrorState({ loading, error, onRetry }: LoadingErrorStateProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-medium">{error}</p>
        <Button 
          onClick={onRetry}
          variant="outline" 
          className="mt-3"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return null;
}