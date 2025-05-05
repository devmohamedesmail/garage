"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api"; // Import the API service
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  vehicleCount?: number;
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch customers with pagination, search and sorting
  const fetchCustomers = async (pageNum: number, query: string = "", perPage: number = 10) => {
    setLoading(true);
    try {
      const response = await api.get(
        `/customers?page=${pageNum}&search=${query}&limit=${perPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      
      // Check if response.data is an array (old API format) or an object with customers property (new format)
      if (Array.isArray(response.data)) {
        setCustomers(response.data);
        setTotalPages(1);
        setTotalCustomers(response.data.length);
      } else {
        // Set default values if the API doesn't return them
        const fetchedCustomers = response.data.customers || [];
        const fetchedTotalPages = response.data.totalPages || 1;
        const fetchedTotalCount = response.data.totalCount || fetchedCustomers.length;

        setCustomers(fetchedCustomers);
        setTotalPages(fetchedTotalPages);
        setTotalCustomers(fetchedTotalCount);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to fetch customers.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch when component mounts
  useEffect(() => {
    fetchCustomers(page, searchQuery, itemsPerPage);
  }, []);

  // Fetch when pagination, sorting or items per page changes
  useEffect(() => {
    fetchCustomers(page, searchQuery, itemsPerPage);
  }, [page, itemsPerPage, sortBy, sortOrder]);

  // Search customers by name or phone
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    fetchCustomers(1, searchQuery, itemsPerPage);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Default to ascending when changing column
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Calculate pagination values
  const startItem = customers.length > 0 ? (page - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(page * itemsPerPage, totalCustomers);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
      </div>

      {/* Search and filters section */}
      <Card className="p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by name, email, phone, or vehicle details (make, model, license plate)..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
          <select 
            className="border rounded px-3 py-2"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </form>
        <div className="mt-2 text-xs text-gray-500">
          Search includes customers' vehicle information (make, model, license plate, and VIN)
        </div>
      </Card>

      {/* Results section */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : customers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No customers found. Try adjusting your search criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name
                        {sortBy === "name" && (
                          <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center">
                        Email
                        {sortBy === "email" && (
                          <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("phone")}
                    >
                      <div className="flex items-center">
                        Phone
                        {sortBy === "phone" && (
                          <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3">Vehicles</th>
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center">
                        Customer Since
                        {sortBy === "createdAt" && (
                          <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link href={`/customers/${customer.id}`} className="flex items-center text-blue-600 hover:text-blue-800">
                          <svg className="mr-2 h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <svg className="mr-2 h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
                          {customer.email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <svg className="mr-2 h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          {customer.phone || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {`${typeof customer.vehicleCount === 'number' ? customer.vehicleCount : 0} vehicle(s)`}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
              <div className="text-sm text-gray-500">
                {totalCustomers > 0 ? 
                  `Showing ${startItem} to ${endItem} of ${totalCustomers} customers` : 
                  "No customers found"}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="flex items-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-1">Previous</span>
                </Button>
                <div className="text-sm">
                  Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages || 1}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages || customers.length === 0}
                  className="flex items-center"
                >
                  <span className="mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default CustomersPage;