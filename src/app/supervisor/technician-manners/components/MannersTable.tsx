'use client';

import React from 'react';
import { format } from 'date-fns';

interface Evaluation {
  manners_id: number;
  category: string;
  rating: number;
  notes: string;
  evaluation_date: string;
  evaluator_name: string;
  work_order_id: number | null;
  invoice_number: string | null;
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface MannersTableProps {
  evaluations: Evaluation[];
  loading: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
}

const MannersTable: React.FC<MannersTableProps> = ({ evaluations, loading, pagination, onPageChange }) => {
  const getCategoryLabel = (category: string): string => {
    const categories: { [key: string]: string } = {
      punctuality: 'Punctuality',
      attitude: 'Attitude',
      communication: 'Communication',
      cleanliness: 'Cleanliness',
      overall: 'Overall Performance',
    };
    return categories[category] || category;
  };

  const getRatingColor = (rating: number): string => {
    switch (rating) {
      case 1: return 'text-red-700 bg-red-100';
      case 2: return 'text-orange-700 bg-orange-100';
      case 3: return 'text-yellow-700 bg-yellow-100';
      case 4: return 'text-green-700 bg-green-100';
      case 5: return 'text-emerald-700 bg-emerald-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-gray-500">Loading evaluations...</div>;
  }

  if (!evaluations || evaluations.length === 0) {
    return <div className="py-10 text-center text-gray-500">No evaluations found for this technician.</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluator</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Order</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {evaluations.map((evaluation) => (
              <tr key={evaluation.manners_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(evaluation.evaluation_date), 'yyyy-MM-dd HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getCategoryLabel(evaluation.category)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${getRatingColor(evaluation.rating)}`}>
                    {evaluation.rating}/5
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {evaluation.evaluator_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {evaluation.work_order_id ? (
                    <span>
                      WO #{evaluation.work_order_id}
                      {evaluation.invoice_number && <span> (Inv #{evaluation.invoice_number})</span>}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {evaluation.notes || <span className="text-gray-400">No notes</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      {pagination && (
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="text-sm text-gray-500">
            Showing {pagination.total === 0 ? 0 : ((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of {pagination.total} entries
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onPageChange && onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`px-3 py-1 rounded ${pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              // Logic to show pages around current page
              let pageNum = i + 1;
              if (pagination.totalPages > 5) {
                if (pagination.currentPage > 3) {
                  pageNum = pagination.currentPage - 3 + i;
                }
                if (pagination.currentPage + 2 > pagination.totalPages) {
                  pageNum = pagination.totalPages - 4 + i;
                }
                if (pageNum <= 0) return null;
                if (pageNum > pagination.totalPages) return null;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange && onPageChange(pageNum)}
                  className={`px-3 py-1 rounded ${pagination.currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange && onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
              className={`px-3 py-1 rounded ${pagination.currentPage === pagination.totalPages || pagination.totalPages === 0 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MannersTable;