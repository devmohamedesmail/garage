"use client";

import React, { useState, useEffect } from "react";
import Pagination from "../Common/Pagination";
import { useRouter } from "next/navigation";
import garageApi from "@/services/api";

interface Order {
  order_id: number;
  vendor_name: string;
  order_date: string;
  expected_delivery_date: string;
  status: string;
}

interface OrdersTableProps {
  onDataChange: () => void;
}

export default function OrdersTable({ onDataChange }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await garageApi.get(
        `/purchase_orders?page=${page}&search=${encodeURIComponent(debouncedSearchQuery)}`
      );

      setOrders(response.data.orders || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle row click to view order details
  const handleRowClick = (order: Order) => {
    router.push(`/orders/${order.order_id}`);
  };

  // Format date strings
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "received":
        return "bg-green-100 text-green-800";
      case "partially received":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [page, debouncedSearchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  // When order data changes
  useEffect(() => {
    if (onDataChange) {
      fetchOrders();
    }
  }, [onDataChange]);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search orders..."
          className="px-4 py-2 border rounded-lg w-full md:w-1/3"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Order ID</th>
              <th className="py-3 px-4 text-left">Vendor</th>
              <th className="py-3 px-4 text-left">Order Date</th>
              <th className="py-3 px-4 text-left">Expected Delivery</th>
              <th className="py-3 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-4 text-center">Loading orders...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center">No orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr 
                  key={order.order_id} 
                  className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(order)}
                >
                  <td className="py-3 px-4">{order.order_id}</td>
                  <td className="py-3 px-4">{order.vendor_name}</td>
                  <td className="py-3 px-4">{formatDate(order.order_date)}</td>
                  <td className="py-3 px-4">{formatDate(order.expected_delivery_date)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
