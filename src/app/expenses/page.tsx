// src/app/expenses/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import Select from "react-select";
import api from "@/services/api";

interface Expense {
  expense_id: number;
  expense_type: "internal" | "external";
  description: string;
  amount: number;
  expense_date: string;
  category: string | null;
  vendor_id: number | null;
  vendor_name?: string; // Added vendor name field
  added_by: number | null;
  receipt_image_url: string | null;
}

interface ExpenseForm {
  expense_type: string;
  description: string;
  amount: string;
  expense_date: string;
  category: string;
  vendor_id: string;
  added_by: string;
  receipt_image_url: string;
}

interface VendorOption {
  value: string;
  label: string;
}

interface UserOption {
  value: string;
  label: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Vendors & users for dropdown
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  // Form state
  const [formData, setFormData] = useState<ExpenseForm>({
    expense_type: "internal",
    description: "",
    amount: "",
    expense_date: "",
    category: "",
    vendor_id: "",
    added_by: "",
    receipt_image_url: "",
  });

  // 1) Fetch expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/expenses?page=${page}&limit=10`);
      const data = res.data;

      const expenseArray = Array.isArray(data.expenses) ? data.expenses : [];
      // Sort by date descending
      expenseArray.sort(
        (a: Expense, b: Expense) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      );

      // Get vendor names for expense records
      const expensesWithVendorNames = await Promise.all(
        expenseArray.map(async (expense: Expense) => {
          if (expense.vendor_id) {
            try {
              const vendorRes = await api.get(`/vendors/${expense.vendor_id}`);
              const vendorData = vendorRes.data;
              return {
                ...expense,
                vendor_name: vendorData.vendor_name || 'Unknown'
              };
            } catch (error) {
              console.error(`Error fetching vendor ${expense.vendor_id}:`, error);
              return {
                ...expense,
                vendor_name: 'Unknown'
              };
            }
          }
          return {
            ...expense,
            vendor_name: 'N/A'
          };
        })
      );

      setExpenses(expensesWithVendorNames);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [page]);

  // 2) Fetch vendors on mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await api.get("/vendors");
        const data = res.data;

        let vendorArray: any[] = [];
        if (Array.isArray(data)) {
          vendorArray = data;
        } else if (data && Array.isArray(data.vendors)) {
          vendorArray = data.vendors;
        }

        const options = vendorArray.map((v: any) => ({
          value: String(v.vendor_id),
          label: v.vendor_name,
        }));
        setVendors(options);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };
    fetchVendors();
  }, []);

  // 3) Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        const data = res.data;

        let userArray: any[] = [];
        if (Array.isArray(data)) {
          userArray = data;
        } else if (data && Array.isArray(data.users)) {
          userArray = data.users;
        }

        const options = userArray.map((u: any) => ({
          value: String(u.user_id || u.id),
          label: u.user_name || u.name || u.username || `User ${u.user_id || u.id}`,
        }));
        setUsers(options);
      } catch (error) {
        console.error("Error fetching users:", error);
        // Set an empty array if API fails
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange =
    (fieldName: keyof ExpenseForm) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [fieldName]: e.target.value }));
    };

  const handleVendorChange = (option: VendorOption | null) => {
    setFormData((prev) => ({ ...prev, vendor_id: option ? option.value : "" }));
  };

  const handleUserChange = (option: UserOption | null) => {
    setFormData((prev) => ({ ...prev, added_by: option ? option.value : "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newExpenseData = {
        expense_type: formData.expense_type,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        category: formData.category || null,
        vendor_id: formData.vendor_id ? parseInt(formData.vendor_id, 10) : null,
        added_by: formData.added_by ? parseInt(formData.added_by, 10) : null,
        receipt_image_url: formData.receipt_image_url || null,
      };

      const response = await api.post("/expenses", newExpenseData);

      if (!response) {
        console.error("Failed to create expense");
      } else {
        // Refresh list
        await fetchExpenses();
        setShowModal(false);

        // Reset form
        setFormData({
          expense_type: "internal",
          description: "",
          amount: "",
          expense_date: "",
          category: "",
          vendor_id: "",
          added_by: "",
          receipt_image_url: "",
        });
      }
    } catch (error) {
      console.error("Error creating expense:", error);
    }

    setSubmitting(false);
  };

  // Table row click
  const handleRowClick = (expenseId: number) => {
    // Navigate to the details page (open in same tab):
    window.location.href = `${process.env.NEXT_PUBLIC_APP_URL}/expenses/${expenseId}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Add Expense
        </button>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <p className="text-gray-600 text-lg">Loading expenses...</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded border border-gray-200 bg-white">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Added By</th>
                <th className="px-4 py-3">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {expenses.map((exp) => (
                <tr
                  key={exp.expense_id}
                  onClick={() => handleRowClick(exp.expense_id)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">{exp.expense_type}</td>
                  <td className="px-4 py-3">{exp.description}</td>
                  <td className="px-4 py-3">{exp.amount}</td>
                  <td className="px-4 py-3">
                    {new Date(exp.expense_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{exp.category || "N/A"}</td>
                  <td className="px-4 py-3">{exp.vendor_name || "N/A"}</td>
                  <td className="px-4 py-3">{exp.added_by ?? "N/A"}</td>
                  <td className="px-4 py-3">
                    {exp.receipt_image_url ? (
                      <a
                        href={exp.receipt_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-700 text-lg">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Modal - 2 Columns, Wider Layout */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add New Expense</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {/* Expense Type */}
              <div>
                <label
                  className="block text-gray-700 font-semibold mb-1"
                  htmlFor="expense_type"
                >
                  Expense Type
                </label>
                <select
                  id="expense_type"
                  name="expense_type"
                  value={formData.expense_type}
                  onChange={handleSelectChange("expense_type")}
                  className="w-full border border-gray-300 rounded p-2"
                  required
                >
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label
                  className="block text-gray-700 font-semibold mb-1"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="What is this expense for?"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label
                  className="block text-gray-700 font-semibold mb-1"
                  htmlFor="amount"
                >
                  Amount
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Expense Date */}
              <div>
                <label
                  className="block text-gray-700 font-semibold mb-1"
                  htmlFor="expense_date"
                >
                  Date
                </label>
                <input
                  id="expense_date"
                  name="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded p-2"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label
                  className="block text-gray-700 font-semibold mb-1"
                  htmlFor="category"
                >
                  Category
                </label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="e.g. Supplies"
                />
              </div>

              {/* Vendor dropdown */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Vendor
                </label>
                <Select
                  value={vendors.find((v) => v.value === formData.vendor_id) || null}
                  onChange={handleVendorChange}
                  options={vendors}
                  isClearable
                  placeholder="Search or select vendor..."
                />
              </div>

              {/* Added By dropdown */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Added By
                </label>
                <Select
                  value={users.find((u) => u.value === formData.added_by) || null}
                  onChange={handleUserChange}
                  options={users}
                  isClearable
                  placeholder="Search or select user..."
                />
              </div>

              {/* Receipt Image URL */}
              <div className="col-span-2">
                <label
                  className="block text-gray-700 font-semibold mb-1"
                  htmlFor="receipt_image_url"
                >
                  Receipt Image URL
                </label>
                <input
                  id="receipt_image_url"
                  name="receipt_image_url"
                  type="text"
                  value={formData.receipt_image_url}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded p-2"
                  placeholder="http://example.com/receipt.jpg"
                />
              </div>

              {/* Action Buttons */}
              <div className="col-span-2 flex justify-end space-x-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
