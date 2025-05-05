"use client";

import { useState, useEffect } from "react";
import Modal from "../Common/Modal";
import { useRouter } from "next/navigation";
import garageApi from "@/services/api";

interface Order {
  order_id: string | number;
  vendor_name: string;
  order_date: string;
  expected_delivery_date: string;
  quantity_ordered: number;
  unit_cost: number;
  status: string;
}

interface OrdersResponse {
  orders: Order[];
  totalPages: number;
}

interface OrdersExpectedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "today" | "tomorrow";
}

export default function OrdersExpectedModal({
  isOpen,
  onClose,
  type
}: OrdersExpectedModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, page, type]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Get today's date and tomorrow's date
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // Select which date to filter by based on type prop
      const dateFilter = type === "today" ? todayStr : tomorrowStr;
      
      console.log(`Fetching orders for ${type}: ${dateFilter}`);
      
      // Add status filter to exclude "Received" orders from server-side
      const response = await garageApi.get(
        `/purchase_orders?page=${page}&expected_delivery_date=${dateFilter}&status=Pending,Partially%20Received`
      );
      
      if (!response.data) {
        throw new Error("Failed to fetch orders");
      }
      
      const data: OrdersResponse = response.data;
      console.log(`Received ${data.orders?.length || 0} orders from API:`, data.orders);
      
      // Set the orders directly without additional filtering
      setOrders(data.orders || []);
      setTotalPages(Math.max(1, data.totalPages || 1));
    } catch (err: any) {
      console.error("Error loading orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleOrderClick = (orderId: string | number) => {
    router.push(`/orders/${orderId}`);
    onClose();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getTitle = () => {
    return `Orders Expected ${type === "today" ? "Today" : "Tomorrow"}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} maxWidth="max-w-6xl">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      
      {/* Debug info panel with better styling */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-blue-800">
              Date filter: {type === "today" ? new Date().toISOString().split('T')[0] : 
                new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
            </p>
            <p className="text-sm font-medium text-blue-800 mt-1">
              Orders found: <span className="font-bold">{orders.length}</span>
            </p>
          </div>
          <div className="text-sm text-blue-600">
            Page {page} of {totalPages || 1}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-sm rounded-md">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-gray-700 w-16">Order ID</th>
              <th className="py-3 px-4 text-left font-medium text-gray-700 w-1/5">Vendor</th>
              <th className="py-3 px-4 text-left font-medium text-gray-700 w-28">Order Date</th>
              <th className="py-3 px-4 text-left font-medium text-gray-700 w-28">Delivery Date</th>
              <th className="py-3 px-4 text-right font-medium text-gray-700 w-24">Quantity</th>
              <th className="py-3 px-4 text-right font-medium text-gray-700 w-28">Unit Cost</th>
              <th className="py-3 px-4 text-left font-medium text-gray-700 w-28">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  <div className="flex justify-center items-center">
                    Loading orders...
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-lg font-medium">
                      No orders expected {type === "today" ? "today" : "tomorrow"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Orders will appear here when vendors have scheduled deliveries
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.order_id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleOrderClick(order.order_id)}
                >
                  <td className="py-3 px-4">{order.order_id}</td>
                  <td className="py-3 px-4">{order.vendor_name}</td>
                  <td className="py-3 px-4">{formatDate(order.order_date)}</td>
                  <td className="py-3 px-4">
                    {formatDate(order.expected_delivery_date)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {order.quantity_ordered}
                  </td>
                  <td className="py-3 px-4 text-right">
                    ${Number(order.unit_cost).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "Received"
                          ? "bg-green-100 text-green-800"
                          : order.status === "Partially Received"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Enhanced pagination with better spacing and styling */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-1">
            {page > 1 && (
              <button
                onClick={() => handlePageChange(page - 1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Previous
              </button>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  p === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
            {page < totalPages && (
              <button
                onClick={() => handlePageChange(page + 1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Next
              </button>
            )}
          </nav>
        </div>
      )}
    </Modal>
  );
}
