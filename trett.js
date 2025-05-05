// src/app/dashboard/page.tsx
import React from "react";
import Link from "next/link";

interface DashboardData {
  customers: number;
  vehicles: number;
  workOrders: number;
}

interface WorkOrder {
  work_order_id: number;
  status: string;
  make: string;
  model: string;
  supervisor: string;
  is_completed: boolean;
}

interface WorkOrdersResponse {
  workOrders: WorkOrder[];
  totalPages: number;
}

export default async function DashboardPage() {
  // Fetch aggregate totals from the new endpoint.
  const dashboardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
    cache: "no-store",
  });
  
  // Add error handling to check response status
  if (!dashboardRes.ok) {
    console.error('Dashboard API error:', await dashboardRes.text());
    throw new Error(`API error ${dashboardRes.status}: Failed to fetch dashboard data`);
  }
  
  const dashboardData: DashboardData = await dashboardRes.json();

  // Fetch recent work orders.
  const workOrdersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/work_orders?page=1`, {
    cache: "no-store",
  });
  
  // Add error handling for work orders request
  if (!workOrdersRes.ok) {
    console.error('Work orders API error:', await workOrdersRes.text());
    throw new Error(`API error ${workOrdersRes.status}: Failed to fetch work orders`);
  }
  
  const workOrdersData: WorkOrdersResponse = await workOrdersRes.json();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Customers Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Total Customers</h2>
          <p className="text-3xl font-bold">{dashboardData.customers}</p>
        </div>

        {/* Total Vehicles Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Total Vehicles</h2>
          <p className="text-3xl font-bold">{dashboardData.vehicles}</p>
        </div>

        {/* Total Work Orders Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Total Work Orders</h2>
          <p className="text-3xl font-bold">{dashboardData.workOrders}</p>
        </div>
      </div>

      {/* Recent Work Orders Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Recent Work Orders</h2>
        <ul className="divide-y divide-gray-200 bg-white shadow rounded-lg">
          {workOrdersData.workOrders.map((wo: WorkOrder) => (
            <li key={wo.work_order_id} className="p-4 hover:bg-gray-50 transition-colors">
              <Link href={`/work-orders/${wo.work_order_id}`} className="block">
                <div className="flex justify-between">
                  <div>
                    <p>
                      <span className="font-medium">ID:</span> {wo.work_order_id}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span> {wo.status}
                    </p>
                    <p>
                      <span className="font-medium">Vehicle:</span> {wo.make} {wo.model}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>
                      <span className="font-medium">Supervisor:</span> {wo.supervisor || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Completed:</span> {wo.is_completed ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
