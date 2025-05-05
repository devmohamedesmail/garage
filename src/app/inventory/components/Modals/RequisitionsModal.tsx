"use client";

import { useState, useEffect } from "react";
import Modal from "../Common/Modal";
import Pagination from "../Common/Pagination";
import garageApi from "@/services/api";

interface Requisition {
  requisition_id: number | string;
  item_id: number | string;
  item_name: string;
  quantity_requested: number;
  status: string;
  reason: string;
  created_at: string;
  created_by_first?: string;
  created_by_last?: string;
}

interface RequisitionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (requisition: Requisition) => void;
}

export default function RequisitionsModal({
  isOpen,
  onClose,
  onCreateOrder
}: RequisitionsModalProps) {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError,] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen) {
      loadRequisitions();
    }
  }, [isOpen, page]);

  const loadRequisitions = async () => {
    try {
      setLoading(true);
      // Added is_handled=0 to the query
      const response = await garageApi.get(`/purchase_requisitions?status=Pending&is_handled=0&page=${page}&limit=5`);
      
      setRequisitions(response.data.requisitions || []);
      setTotalPages(response.data.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error("Error loading requisitions:", err);
      setError("Failed to load requisitions. Please try again.");
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRequisitionClick = (requisition: Requisition) => {
    onCreateOrder(requisition);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Pending Requisitions"
      size="full" 
      className="bg-white"
    >
      {/* Summary header with filter info and pagination count */}
      <div className="bg-blue-50 p-4 mb-6 rounded-lg flex justify-between items-center">
        <div>
          <div className="text-blue-800 font-medium text-lg">Filter: Unhandled Pending Requisitions</div>
          <div className="text-blue-700 mt-1">Requisitions found: {requisitions.length}</div>
        </div>
        <div className="text-blue-700 font-medium">
          Page {page} of {totalPages}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : requisitions.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          No pending requisitions found.
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Created By</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((req) => (
                  <tr 
                    key={req.requisition_id}
                    onClick={() => handleRequisitionClick(req)}
                    className="hover:bg-blue-50 cursor-pointer border-b border-gray-200 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{req.item_name}</td>
                    <td className="px-6 py-4 text-sm text-center">{req.quantity_requested}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.reason}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {req.created_by_first && req.created_by_last 
                        ? `${req.created_by_first} ${req.created_by_last}`
                        : "Auto-generated"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            Click on a requisition to create a purchase order
          </div>
        </>
      )}
    </Modal>
  );
}
