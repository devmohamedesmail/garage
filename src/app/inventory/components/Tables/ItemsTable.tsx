"use client";

import React, { useState, useEffect } from "react";
import Pagination from "../Common/Pagination";
import { useRouter } from "next/navigation";
import garageApi from "@/services/api";

interface Item {
  item_id: number;
  item_name: string;
  item_type: string;
  serial_number: string;
  quantity_on_hand: number;
  cost_price: number;
}

interface ItemsTableProps {
  onDataChange: () => void;
}

export default function ItemsTable({ onDataChange }: ItemsTableProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const router = useRouter();

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await garageApi.get(
        `/items?page=${page}&search=${encodeURIComponent(debouncedSearchQuery)}`
      );

      setItems(response.data.items || []);
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

  // Helper function to safely format currency values
  const formatCurrency = (value: any): string => {
    if (value === null || value === undefined) return "$0.00";
    const num = parseFloat(value);
    return !isNaN(num) ? `$${num.toFixed(2)}` : "$0.00";
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle row click to view item details
  const handleRowClick = (item: Item) => {
    router.push(`/inventory/${item.item_id}`);
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchItems();
  }, [page, debouncedSearchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  // When item data changes
  useEffect(() => {
    // Add a listener to refresh data when called from parent
    if (onDataChange) {
      fetchItems();
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
          placeholder="Search items..."
          className="px-4 py-2 border rounded-lg w-full md:w-1/3"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Item Name</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Serial Number</th>
              <th className="py-3 px-4 text-right">Quantity</th>
              <th className="py-3 px-4 text-right">Cost Price</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-4 text-center">Loading items...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center">No items found</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.item_id}
                  className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  <td className="py-3 px-4">{item.item_name}</td>
                  <td className="py-3 px-4">{item.item_type}</td>
                  <td className="py-3 px-4">{item.serial_number}</td>
                  <td className="py-3 px-4 text-right">{item.quantity_on_hand}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.cost_price)}</td>
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
