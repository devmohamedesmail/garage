"use client";

import React, { useState } from "react";
import api from "@/services/api";
import { toast } from "react-hot-toast";

interface NoNeedToRedoOptionProps {
  stageId: number;
  onComplete: () => void;
}

const NoNeedToRedoOption: React.FC<NoNeedToRedoOptionProps> = ({ stageId, onComplete }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notes.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Call the API to mark this stage as not needing redoing
      await api.post(`/work_order_stages/${stageId}/no-need-to-redo`, {
        no_need_to_redo_notes: notes,
        created_by: 1 // Should be replaced with actual user ID
      });
      
      toast.success('Stage marked as "No need to redo" successfully');
      setShowForm(false);
      onComplete();
    } catch (error: any) {
      console.error('Error marking stage as no need to redo:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="mt-4 pt-4 border-t-2 border-orange-200">
      <h3 className="font-bold text-lg mb-2">Affected Stage Action Required</h3>
      
      {!showForm ? (
        <div>
          <p className="text-sm mb-3">
            This stage is affected by a revert of a later stage.
            If you determine that this stage does not need to be redone, you can mark it accordingly.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Mark as "No Need to Redo"
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Required)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
              placeholder="Explain why this stage does not need to be redone despite the revert..."
              required
            ></textarea>
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isSubmitting || !notes.trim()}
              className={`px-4 py-2 rounded ${
                !isSubmitting && notes.trim()
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NoNeedToRedoOption;