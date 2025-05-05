"use client";

import React, { useState, useEffect } from "react";
import Pagination from "../Common/Pagination";
import { useRouter } from "next/navigation";
import garageApi from "@/services/api";

interface Vendor {
  vendor_id: number;
  vendor_name: string;
  contact_person: string;
  phone: string;
  email: string;
}

interface VendorsTableProps {
  onDataChange: () => void;
}

export default function VendorsTable({ onDataChange }: VendorsTableProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const router = useRouter();

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await garageApi.get(
        `/vendors?page=${page}&search=${encodeURIComponent(debouncedSearchQuery)}`
      );

      setVendors(response.data.vendors || []);
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

  // Handle row click to view vendor details
  const handleRowClick = (vendor: Vendor) => {
    router.push(`/vendors/${vendor.vendor_id}`);
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchVendors();
  }, [page, debouncedSearchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  // When vendor data changes
  useEffect(() => {
    if (onDataChange) {
      fetchVendors();
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
          placeholder="Search vendors..."
          className="px-4 py-2 border rounded-lg w-full md:w-1/3"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Vendors Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Vendor Name</th>
              <th className="py-3 px-4 text-left">Contact Person</th>
              <th className="py-3 px-4 text-left">Phone</th>
              <th className="py-3 px-4 text-left">Email</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-4 text-center">Loading vendors...</td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center">No vendors found</td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr 
                  key={vendor.vendor_id} 
                  className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(vendor)}
                >
                  <td className="py-3 px-4">{vendor.vendor_name}</td>
                  <td className="py-3 px-4">{vendor.contact_person}</td>
                  <td className="py-3 px-4">{vendor.phone}</td>
                  <td className="py-3 px-4">{vendor.email}</td>
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
