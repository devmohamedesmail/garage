"use client";

import React from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";

const TechnicianDashboard = () => {
  return (
    <ProtectedRoute allowedRoles={["Technician"]}>
    <div className="p-6">
      <h1 className="text-3xl font-bold">Technician Dashboard</h1>
      <p>Welcome, Technician! You have Sales access.</p>
    </div>
  </ProtectedRoute>
  );
};

export default TechnicianDashboard;
