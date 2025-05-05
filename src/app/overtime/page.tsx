"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

export default function OvertimePage() {
  const [overtime, setOvertime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // For the "Add Overtime" form
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [amount, setAmount] = useState("");

  // --- PAGINATION STATES (Main Table) ---
  const [mainPage, setMainPage] = useState(1);
  const PAGE_SIZE_MAIN = 5;

  // --- PAGINATION STATES (Summary Table) ---
  const [summaryPage, setSummaryPage] = useState(1);
  const PAGE_SIZE_SUMMARY = 5;

  // Fetch all existing Overtime records
  const fetchOvertime = async () => {
    try {
      const res = await api.get("/overtime");
      setOvertime(res.data);
    } catch (error) {
      console.error("Failed to fetch overtime records:", error);
      throw new Error("Failed to fetch overtime records");
    }
  };

  // Fetch technicians for the dropdown
  const fetchTechnicians = async () => {
    try {
      const res = await api.get("/technicians");
      setTechnicians(res.data);
    } catch (error) {
      console.error("Failed to fetch technicians:", error);
      throw new Error("Failed to fetch technicians");
    }
  };

  // On component mount, load overtime and technician list
  useEffect(() => {
    Promise.all([fetchOvertime(), fetchTechnicians()])
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Submit new Overtime record
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic front-end validations
    if (!userId || !date || !hours || !amount) {
      alert("Please fill all required fields.");
      return;
    }

    if (Number(hours) <= 0 || Number(amount) <= 0) {
      alert("Hours and Amount must be greater than 0.");
      return;
    }

    try {
      const response = await api.post("/overtime", {
        user_id: userId,
        date,
        hours,
        amount,
      });

      if (response.status === 201 || response.status === 200) {
        await fetchOvertime();
        setModalOpen(false);
        // Reset form fields
        setUserId("");
        setDate("");
        setHours("");
        setAmount("");
      } else {
        alert("Failed to create overtime record.");
      }
    } catch (error) {
      console.error("Error creating overtime record:", error);
      alert("Failed to create overtime record.");
    }
  };

  // Calculate total overtime owed by summing up the amount field
  const totalOwed = overtime.reduce((acc, entry) => acc + Number(entry.amount), 0);

  // Group overtime by employee and month (YYYY-MM)
  const overtimeSummary = overtime.reduce((acc, entry) => {
    const month = entry.date ? entry.date.split("T")[0].slice(0, 7) : "Unknown";
    const key = `${entry.user_name}-${month}`;
    if (!acc[key]) {
      acc[key] = {
        technician: entry.user_name,
        month,
        totalHours: 0,
        totalAmount: 0,
      };
    }
    acc[key].totalHours += Number(entry.hours);
    acc[key].totalAmount += Number(entry.amount);
    return acc;
  }, {} as Record<
    string,
    { technician: string; month: string; totalHours: number; totalAmount: number }
  >);

  const summaryArray = Object.values(overtimeSummary);

  // --- PAGINATED DATA (Main Table) ---
  const mainTotalPages = Math.ceil(overtime.length / PAGE_SIZE_MAIN);
  const startIndexMain = (mainPage - 1) * PAGE_SIZE_MAIN;
  const displayedOvertime = overtime.slice(startIndexMain, startIndexMain + PAGE_SIZE_MAIN);

  // --- PAGINATED DATA (Summary Table) ---
  const summaryTotalPages = Math.ceil(summaryArray.length / PAGE_SIZE_SUMMARY);
  const startIndexSummary = (summaryPage - 1) * PAGE_SIZE_SUMMARY;
  const displayedSummary = summaryArray.slice(
    startIndexSummary,
    startIndexSummary + PAGE_SIZE_SUMMARY
  );

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-semibold mb-4">Overtime Records</h1>

      {/* Display Total Overtime Owed */}
      <div className="mb-6">
        <p className="text-xl font-bold">
          Total Overtime Owed: ${totalOwed.toFixed(2)}
        </p>
      </div>

      {/* Button to open modal */}
      <button
        onClick={() => setModalOpen(true)}
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
      >
        + New Overtime
      </button>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          {/* Main Overtime Records Table */}
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200 mb-8">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Technician
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Hours
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedOvertime.map((entry) => (
                  <tr key={entry.overtime_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{entry.user_name}</td>
                    <td className="px-4 py-2">{entry.date?.split("T")[0]}</td>
                    <td className="px-4 py-2">{entry.hours}</td>
                    <td className="px-4 py-2">{entry.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls (Main Table) */}
            <div className="flex items-center justify-between p-2">
              <button
                onClick={() => setMainPage((p) => p - 1)}
                disabled={mainPage === 1}
                className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-2">
                Page {mainPage} of {mainTotalPages || 1}
              </span>
              <button
                onClick={() => setMainPage((p) => p + 1)}
                disabled={mainPage === mainTotalPages || mainTotalPages === 0}
                className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Overtime Summary Table */}
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 px-4 py-2">
              Overtime Summary by Month &amp; Employee
            </h2>
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Technician
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Month
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Total Hours
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedSummary.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{item.technician}</td>
                    <td className="px-4 py-2">{item.month}</td>
                    <td className="px-4 py-2">{item.totalHours}</td>
                    <td className="px-4 py-2">
                      ${item.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls (Summary Table) */}
            <div className="flex items-center justify-between p-2">
              <button
                onClick={() => setSummaryPage((p) => p - 1)}
                disabled={summaryPage === 1}
                className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-2">
                Page {summaryPage} of {summaryTotalPages || 1}
              </span>
              <button
                onClick={() => setSummaryPage((p) => p + 1)}
                disabled={
                  summaryPage === summaryTotalPages || summaryTotalPages === 0
                }
                className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal for Adding New Overtime */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4">Add Overtime</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Technician dropdown */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Technician <span className="text-red-500">*</span>
                </label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">-- Select Technician --</option>
                  {technicians.map((tech) => (
                    <option key={tech.user_id} value={tech.user_id}>
                      {tech.technician_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Hours */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Hours <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                  min="0.1"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                  min="0.01"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
