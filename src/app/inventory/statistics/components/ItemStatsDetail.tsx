"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import garageApi from "@/services/api";

interface ItemStatsDetailProps {
  itemId: number;
}

interface ItemDetailData {
  item: {
    item_id: number;
    item_name: string;
    item_type: string;
    description: string;
    cost_price: number;
    quantity_on_hand: number;
    reorder_level: number;
    reorder_quantity: number;
    vendor_id: number | null;
    serial_number: string;
  };
  summary: {
    total_transactions: number;
    total_in: number;
    total_out: number;
    net_change: number;
    total_cost_value: number;
  };
  transactions: Array<{
    transaction_id: number;
    item_id: number;
    transaction_type: string;
    quantity_change: number;
    unit_cost: number;
    total_cost: number;
    notes: string;
    user_name: string | null;
    work_order_id: number | null;
    invoice_number: string | null;
    created_at: string;
  }>;
}

export default function ItemStatsDetail({ itemId }: ItemStatsDetailProps) {
  const [data, setData] = useState<ItemDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await garageApi.get(`/inventory/statistics/by-item/${itemId}`);
        if (!response.data) {
          throw new Error(`Error: Failed to load item details`);
        }
        setData(response.data);
      } catch (err) {
        setError(err.message || "Failed to load item details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId]);

  if (loading) {
    return <div className="text-center py-10">Loading item details...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  if (!data) {
    return <div className="text-center py-10">No data available for this item</div>;
  }

  // Format currency
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(num);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate percentage of in/out transactions
  const totalTransactions = data.summary.total_in + data.summary.total_out;
  const inPercentage = totalTransactions > 0 
    ? ((data.summary.total_in / totalTransactions) * 100).toFixed(1) 
    : "0";
  const outPercentage = totalTransactions > 0 
    ? ((data.summary.total_out / totalTransactions) * 100).toFixed(1) 
    : "0";

  // Check if item is below reorder level
  const isLowStock = data.item.quantity_on_hand <= data.item.reorder_level;

  return (
    <div className="space-y-6">
      {/* Item Details Card */}
      <Card className="bg-gray-50">
        <div className="p-4 border-b">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold">{data.item.item_name}</h2>
            {isLowStock && (
              <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
                Low Stock
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Type: {data.item.item_type}</p>
        </div>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Current Quantity</h3>
              <p className="text-lg font-bold">{data.item.quantity_on_hand}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reorder Level</h3>
              <p className="text-lg font-bold">{data.item.reorder_level}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reorder Quantity</h3>
              <p className="text-lg font-bold">{data.item.reorder_quantity}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Unit Cost</h3>
              <p className="text-lg font-bold">{formatCurrency(data.item.cost_price)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Serial Number</h3>
              <p className="text-lg font-bold">{data.item.serial_number || "N/A"}</p>
            </div>
          </div>

          {data.item.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="text-gray-700">{data.item.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Summary Statistics</h2>
          </div>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
                <p className="text-lg font-bold">{data.summary.total_transactions}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Net Change</h3>
                <p className={`text-lg font-bold ${data.summary.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.summary.net_change}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total In</h3>
                <p className="text-lg font-bold text-green-600">{data.summary.total_in} ({inPercentage}%)</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Out</h3>
                <p className="text-lg font-bold text-red-600">{data.summary.total_out} ({outPercentage}%)</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Cost Value</h3>
              <p className="text-lg font-bold">{formatCurrency(data.summary.total_cost_value)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Transaction Distribution</h2>
          </div>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              {totalTransactions > 0 ? (
                <div className="w-full max-w-[200px] h-[200px] rounded-full border-8 border-gray-200 relative">
                  {/* Visual representation of in/out percentage */}
                  <div 
                    className="absolute inset-0 bg-green-500 rounded-full"
                    style={{ 
                      clipPath: `inset(0 0 0 0 round 100%)`, 
                      background: `conic-gradient(
                        #22c55e 0% ${inPercentage}%, 
                        #ef4444 ${inPercentage}% 100%
                      )`
                    }}
                  ></div>
                  <div className="absolute inset-0 rounded-full bg-white m-4 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex justify-center space-x-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 mr-1"></div>
                          <span className="text-xs">In</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 mr-1"></div>
                          <span className="text-xs">Out</span>
                        </div>
                      </div>
                      <p className="text-lg font-bold mt-2">{totalTransactions}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No transaction data to display</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Transaction History</h2>
          <p className="text-sm text-gray-500">Recent inventory movements for this item</p>
        </div>
        <CardContent>
          {data.transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No transaction history available for this item
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.transactions.map((transaction) => (
                    <tr key={transaction.transaction_id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(transaction.created_at)}</td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                        transaction.transaction_type === 'IN' || transaction.transaction_type === 'RETURN' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.transaction_type}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{transaction.quantity_change}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(transaction.unit_cost)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(transaction.total_cost)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{transaction.user_name || 'System'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {transaction.work_order_id ? `WO #${transaction.work_order_id}` : ''}
                        {transaction.invoice_number ? `INV #${transaction.invoice_number}` : ''}
                      </td>
                      <td className="px-4 py-2 text-sm max-w-xs truncate">{transaction.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}