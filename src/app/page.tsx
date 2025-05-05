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




  return (
    <div className="min-h-screen bg-gray-100 p-6">
      

    
    </div>
  );
}
