"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

export default function AdminDashboard() {
  const [summary, setSummary] = useState({ openInvoices: 0, openWorkOrders: 0 });
  const [error, setError] = useState<string | null>(null);

  // Fetch summary data from your API endpoint, similar to your invoice page pattern
  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await api.get("/dashboard/summary");
        setSummary(res.data);
      } catch (err) {
        console.error("Failed to fetch summary", err);
        setError("Failed to load summary");
      }
    }
    fetchSummary();
  }, []);

  return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Links Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
            <div className="flex flex-col space-y-3">
              <Link href="/sales/dashboard">
                <Button>Sales Dashboard (requires sign-in)</Button>
              </Link>
              <Link href="/invoices">
                <Button>Invoices Dashboard</Button>
              </Link>
              <Link href="/WorkOrders">
                <Button>Work Orders Dashboard</Button>
              </Link>
            </div>
          </Card>

          {/* Summary Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Open Invoices:</span>
                  <span>{summary.openInvoices}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Open Work Orders:</span>
                  <span>{summary.openWorkOrders}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Alerts Section */}
          <Card className="p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Alerts</h2>
            <p className="text-gray-500">No alerts at the moment.</p>
          </Card>
        </div>
      </div>
      // Add a protected route component to wrap the page
  );
}
