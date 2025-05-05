// src/app/expenses/[id]/page.tsx
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";

interface Expense {
  expense_id: number;
  expense_type: "internal" | "external";
  description: string;
  amount: number;
  expense_date: string;
  category: string | null;
  vendor_id: number | null;
  added_by: number | null;
  receipt_image_url: string | null;
}

export default function ExpenseDetailPage() {
  // Get the expense id from the route params
  const params = useParams();
  const expenseId = params.id as string;
  const router = useRouter();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // For uploading a new receipt
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Fetch expense details when page loads
  useEffect(() => {
    const fetchExpense = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/expenses/${expenseId}`);
        setExpense(res.data);
      } catch (error) {
        console.error("Error fetching expense:", error);
        setExpense(null);
      }
      setLoading(false);
    };
    fetchExpense();
  }, [expenseId]);

  // Handle file input changes
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Send the file to the server
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("receiptImage", selectedFile);

      // We need to use the raw Axios instance for FormData uploads
      // because it requires different Content-Type headers
      const res = await api.post(`/expenses/${expenseId}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!res) {
        console.error("Failed to upload image");
        setUploading(false);
        return;
      }

      // Update the local expense state to reflect the new receipt URL
      setExpense((prev) =>
        prev ? { ...prev, receipt_image_url: res.data.newReceiptUrl } : prev
      );

      // Clear out selected file
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading receipt image:", error);
    }

    setUploading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
      >
        &larr; Back
      </button>

      {loading ? (
        <p className="text-lg text-gray-600">Loading expense details...</p>
      ) : expense ? (
        <div className="bg-white shadow-lg rounded p-6 border border-gray-200">
          <h1 className="text-3xl font-bold mb-4">
            Expense #{expense.expense_id}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-700">
                <span className="font-semibold">Type:</span>{" "}
                {expense.expense_type}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Description:</span>{" "}
                {expense.description}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Amount:</span> AED{" "}
                {expense.amount !== null
                  ? Number(expense.amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "N/A"}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Date:</span>{" "}
                {new Date(expense.expense_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-gray-700">
                <span className="font-semibold">Category:</span>{" "}
                {expense.category || "N/A"}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Vendor:</span>{" "}
                {expense.vendor_id !== null ? expense.vendor_id : "N/A"}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Added By:</span>{" "}
                {expense.added_by !== null ? expense.added_by : "N/A"}
              </p>
            </div>
          </div>

          {/* Receipt image link or preview */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Receipt</h2>
            {expense.receipt_image_url ? (
              <a
                href={expense.receipt_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Receipt Image
              </a>
            ) : (
              <p className="text-gray-600">No receipt available</p>
            )}
          </div>

          {/* Upload a new receipt image */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Upload New Receipt</h2>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-2"
            />

            {selectedFile && (
              <div className="text-sm text-gray-500 mb-2">
                Selected: {selectedFile.name}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-lg text-red-600">Expense not found.</p>
      )}
    </div>
  );
}
