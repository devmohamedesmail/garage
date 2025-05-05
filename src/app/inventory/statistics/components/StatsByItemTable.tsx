"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import garageApi from "@/services/api";

interface ItemStats {
  item_id: number;
  item_name: string;
  item_type: string;
  transaction_count: number;
  total_in: number;
  total_out: number;
  net_change: number;
  current_stock: number;
  total_cost_value: number;
}

interface StatsByItemTableProps {
  onItemSelect: (itemId: number) => void;
}

export default function StatsByItemTable({ onItemSelect }: StatsByItemTableProps) {
  const [stats, setStats] = useState<ItemStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await garageApi.get("/inventory/statistics/by-item");
        if (!response.data) {
          throw new Error(`Error: Failed to load item statistics`);
        }
        setStats(response.data);
      } catch (err) {
        setError(err.message || "Failed to load item statistics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStats = stats.filter(item => 
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-10">Loading item statistics...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(num);
  };

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Search items by name or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total In</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Out</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Change</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center px-6 py-4 whitespace-nowrap">
                  {searchTerm ? "No items match your search" : "No item statistics available"}
                </td>
              </tr>
            ) : (
              filteredStats.map((item) => (
                <tr key={item.item_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{item.item_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.item_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">{formatNumber(item.total_in)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">{formatNumber(item.total_out)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${item.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(item.net_change)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">{formatNumber(item.current_stock)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item.total_cost_value)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => onItemSelect(item.item_id)}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}