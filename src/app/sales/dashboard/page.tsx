"use client";

import React from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";

const SalesDashboard = () => {
  return (
    <ProtectedRoute allowedRoles={["Sales"]}>
    <div className="p-6">
      <h1 className="text-3xl font-bold">Sales Dashboard</h1>
      <p>Welcome, Sales! You have Sales access.</p>
    </div>
  </ProtectedRoute>
  );
};

export default SalesDashboard;
