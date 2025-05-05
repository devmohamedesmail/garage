'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupervisorDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Supervisor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Technician Manners</CardTitle>
            <CardDescription>Evaluate and monitor technician behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              Record and track technician behavior, create performance evaluations, and review history.
            </p>
            <Link href="/supervisor/technician-manners">
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                Open Evaluations
              </button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Work Orders</CardTitle>
            <CardDescription>Review and manage work orders</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              Monitor ongoing work, assign technicians, and check work order status.
            </p>
            <Link href="/WorkOrders">
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                View Work Orders
              </button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Quality Control</CardTitle>
            <CardDescription>Verify completed work</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              Review completed work by technicians and provide quality ratings.
            </p>
            <button className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md cursor-not-allowed">
              Coming Soon
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-700">Active Work Orders</h3>
            <p className="text-3xl font-bold text-blue-800">--</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-medium text-green-700">Completed Today</h3>
            <p className="text-3xl font-bold text-green-800">--</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-700">Pending Review</h3>
            <p className="text-3xl font-bold text-yellow-800">--</p>
          </div>
        </div>
      </div>
    </div>
  );
}
