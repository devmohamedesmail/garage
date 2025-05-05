"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import garageApi from "@/services/api";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Invoice {
  invoice_id: number;
  invoice_number: string;
  customer_name: string;
  vehicle_id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  total_amount: string;
  payment_status: string;
  locked_for_editing: boolean;
  created_at: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState<string>(""); // optional search
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>(""); // e.g. "Paid", "Pending", etc.
  const [startDate, setStartDate] = useState<string>(""); // for a date range filter
  const [endDate, setEndDate] = useState<string>("");

  // Fetch invoices from our /api/invoices endpoint
  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await garageApi.get("/invoices", {
        params: {
          page,
          search,
          paymentStatus,
          startDate,
          endDate,
        },
      });
      setInvoices(response.data.invoices);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch invoices.");
    } finally {
      setLoading(false);
    }
  };

  // Run fetch on component mount or whenever page changes
  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Optional search handler: resets to page 1 and fetches again
  const handleSearch = () => {
    setPage(1);
    fetchInvoices();
  };

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setPaymentStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    fetchInvoices();
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  // Loading & error states
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg">Loading invoices...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 bg-gray-100">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 mt-10">
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800 mt-5">
              Error Loading Invoices
            </h1>
            <p className="text-gray-600 mt-2">{error}</p>
            <Button onClick={fetchInvoices} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Top row: Title + "Create New Invoice" button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Link href="/newInvoice">
          <Button className="px-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Create New Invoice
          </Button>
        </Link>
      </div>

      {/* Improved Search Filters */}
      <Card className="p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <Input
              type="text"
              placeholder="Invoice #, License, Customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button onClick={handleSearch}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search
          </Button>
        </div>
      </Card>

      {/* Enhanced Table of Invoices */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm leading-normal">
                <th className="py-3 px-6 text-left font-semibold">Invoice #</th>
                <th className="py-3 px-6 text-left font-semibold">License Plate</th>
                <th className="py-3 px-6 text-left font-semibold">Customer</th>
                <th className="py-3 px-6 text-left font-semibold">Car Info</th>
                <th className="py-3 px-6 text-left font-semibold">Total</th>
                <th className="py-3 px-6 text-left font-semibold">Payment Status</th>
                <th className="py-3 px-6 text-left font-semibold">Created At</th>
                <th className="py-3 px-6 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.invoice_id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <span className="font-medium">{invoice.invoice_number}</span>
                    </td>
                    <td className="py-3 px-6 text-left">
                      {invoice.license_plate || "N/A"}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {invoice.customer_name}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {invoice.year} {invoice.make} {invoice.model}
                    </td>
                    <td className="py-3 px-6 text-left font-medium">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="py-3 px-6 text-left">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          invoice.payment_status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : invoice.payment_status === "Partially Paid"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invoice.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-left">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <Link href={`/invoices/${invoice.invoice_id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Improved Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 bg-white p-4 rounded-lg shadow-sm">
          <Button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            variant={page === 1 ? "outline" : "default"}
            className="flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Previous
          </Button>
          <span className="text-sm">
            Page{" "}
            <span className="font-bold">{page}</span> of{" "}
            <span className="font-bold">{totalPages}</span>
          </span>
          <Button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            variant={page === totalPages ? "outline" : "default"}
            className="flex items-center"
          >
            Next
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
