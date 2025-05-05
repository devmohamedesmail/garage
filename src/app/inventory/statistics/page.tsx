"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SummaryStatsCard from "./components/SummaryStatsCard";
import StatsByItemTable from "./components/StatsByItemTable";
import StatsByTypeChart from "./components/StatsByTypeChart";
import DateRangeStats from "./components/DateRangeStats";
import ItemStatsDetail from "./components/ItemStatsDetail";
import { DatePickerWithRange } from "./components/DateRangePicker";
import garageApi from "@/services/api";

export default function InventoryStatisticsPage() {
  const [summaryStats, setSummaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [activeTab, setActiveTab] = useState("by-item");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date(),
  });
  
  const router = useRouter();

  // Load summary statistics
  useEffect(() => {
    const fetchSummaryStats = async () => {
      try {
        setLoading(true);
        const response = await garageApi.get("/inventory/statistics/summary");
        if (!response.data) {
          throw new Error("Failed to load inventory statistics");
        }
        setSummaryStats(response.data);
      } catch (err) {
        setError(err.message || "Failed to load inventory statistics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryStats();
  }, []);

  const handleBackToInventory = () => {
    router.push("/inventory");
  };

  const handleItemSelect = (itemId) => {
    setSelectedItemId(itemId);
    setActiveTab("item-detail");
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };
  
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Inventory Statistics</h1>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Inventory Statistics</h1>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">Error: {error}</p>
          <p className="mt-2">Please make sure the server is running and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Statistics</h1>
        <button
          onClick={handleBackToInventory}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Inventory
        </button>
      </div>

      {/* Summary Card */}
      <div className="mb-6">
        <SummaryStatsCard stats={summaryStats} />
      </div>

      {/* Tabs for different views */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => handleTabChange("by-item")}
              className={`py-2 px-4 mr-2 font-medium ${
                activeTab === "by-item"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              By Item
            </button>
            <button
              onClick={() => handleTabChange("by-type")}
              className={`py-2 px-4 mr-2 font-medium ${
                activeTab === "by-type"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              By Type
            </button>
            <button
              onClick={() => handleTabChange("by-date")}
              className={`py-2 px-4 mr-2 font-medium ${
                activeTab === "by-date"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              By Date Range
            </button>
            {selectedItemId && (
              <button
                onClick={() => handleTabChange("item-detail")}
                className={`py-2 px-4 mr-2 font-medium ${
                  activeTab === "item-detail"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Item Detail
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Tab contents */}
      <div className="bg-white border rounded-md shadow-sm p-4">
        {activeTab === "by-item" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Item Statistics</h2>
            <p className="text-gray-600 mb-4">View transaction statistics by item</p>
            <StatsByItemTable onItemSelect={handleItemSelect} />
          </div>
        )}

        {activeTab === "by-type" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Transaction Type Statistics</h2>
            <p className="text-gray-600 mb-4">View statistics by transaction type</p>
            <StatsByTypeChart />
          </div>
        )}

        {activeTab === "by-date" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Date Range Statistics</h2>
            <p className="text-gray-600 mb-4">View statistics within a specific date range</p>
            <div className="mb-4">
              <DatePickerWithRange date={dateRange} onDateChange={handleDateRangeChange} />
            </div>
            <DateRangeStats dateRange={dateRange} />
          </div>
        )}

        {activeTab === "item-detail" && selectedItemId && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Item Details</h2>
            <p className="text-gray-600 mb-4">View detailed statistics for the selected item</p>
            <ItemStatsDetail itemId={selectedItemId} />
          </div>
        )}
      </div>
    </div>
  );
}