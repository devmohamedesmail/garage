'use client';

import React, { useState, useEffect } from 'react';
import api from "@/services/api";

interface WorkOrder {
  work_order_id: number;
  invoice_id?: number;
  invoice_number?: string;
  invoice_name?: string;
}

interface AddEvaluationFormProps {
  onSubmit: (evaluation: {
    evaluator_id: number;
    work_order_id: number | null;
    rating: number;
    category: string;
    notes: string;
  }) => void;
}

// Fallback mock data to use if API call fails
const mockWorkOrders: WorkOrder[] = [
  { work_order_id: 101, invoice_id: 1001 },
  { work_order_id: 102, invoice_id: 1002 },
  { work_order_id: 103, invoice_id: 1003 },
  { work_order_id: 104, invoice_id: 1004 },
];

const AddEvaluationForm: React.FC<AddEvaluationFormProps> = ({ onSubmit }) => {
  const [category, setCategory] = useState<string>('attitude');
  const [rating, setRating] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [workOrderId, setWorkOrderId] = useState<string>('');
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([]);
  
  // For now, hardcode the evaluator ID to 1 until authentication is implemented
  const temporaryEvaluatorId = 1;

  useEffect(() => {
    // Fetch recent work orders with correct backend URL
    const fetchRecentWorkOrders = async () => {
      try {
        // Using the centralized API service
        const response = await api.get('/work_orders?limit=10');
        if (response.data && response.data.workOrders) {
          setRecentWorkOrders(response.data.workOrders);
        } else {
          console.warn('Work orders data not in expected format', response.data);
          setRecentWorkOrders(mockWorkOrders); // Use mock data as fallback
        }
      } catch (error) {
        console.error('Error fetching work orders:', error);
        // Use mock data as fallback if API call fails
        setRecentWorkOrders(mockWorkOrders);
      }
    };

    fetchRecentWorkOrders();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      evaluator_id: temporaryEvaluatorId, // Using the temporary ID
      work_order_id: workOrderId ? parseInt(workOrderId) : null,
      rating,
      category,
      notes
    });

    // Reset form after submission
    setCategory('attitude');
    setRating(3);
    setNotes('');
    setWorkOrderId('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="punctuality">Punctuality</option>
            <option value="attitude">Attitude</option>
            <option value="communication">Communication</option>
            <option value="cleanliness">Cleanliness</option>
            <option value="overall">Overall</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Rating (1-5)</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-lg font-bold">{rating}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Related Work Order (Optional)</label>
        <select
          value={workOrderId}
          onChange={(e) => setWorkOrderId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">-- No specific work order --</option>
          {recentWorkOrders.map((wo) => (
            <option key={wo.work_order_id} value={wo.work_order_id}>
              Work Order #{wo.work_order_id} 
              {wo.invoice_name ? ` (Invoice #${wo.invoice_name})` : 
               wo.invoice_number ? ` (Invoice #${wo.invoice_number})` : 
               wo.invoice_id ? ` (Invoice #${wo.invoice_id})` : ''}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md resize-none"
          rows={4}
          placeholder="Add specific details about the technician's behavior or performance..."
        />
      </div>
      
      <div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Submit Evaluation
        </button>
      </div>
    </form>
  );
};

export default AddEvaluationForm;