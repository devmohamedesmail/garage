"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import Link from "next/link";
import { CaseReason } from "../page";

export default function CaseReasonsPage() {
  const [reasons, setReasons] = useState<CaseReason[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingReason, setEditingReason] = useState<CaseReason | null>(null);
  const [formData, setFormData] = useState({
    reason_name: "",
    description: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Fetch case reasons
  useEffect(() => {
    const fetchReasons = async () => {
      setLoading(true);
      try {
        const response = await api.get("/case-reasons");
        setReasons(response.data);
      } catch (error) {
        console.error("Error fetching case reasons:", error);
        setError("Failed to load case reasons");
      } finally {
        setLoading(false);
      }
    };

    fetchReasons();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle checkbox input changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handle edit reason button click
  const handleEditClick = (reason: CaseReason) => {
    setEditingReason(reason);
    setFormData({
      reason_name: reason.reason_name,
      description: reason.description || "",
      is_active: reason.is_active,
    });
    setShowAddModal(true);
  };

  // Handle form submission for adding/editing reason
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingReason) {
        // Update existing reason
        await api.put(`/case-reasons/${editingReason.reason_id}`, formData);
        
        setReasons((prev) =>
          prev.map((reason) =>
            reason.reason_id === editingReason.reason_id
              ? { ...reason, ...formData }
              : reason
          )
        );
      } else {
        // Create new reason
        const response = await api.post("/case-reasons", formData);
        const newReason = {
          reason_id: response.data.reason_id,
          ...formData,
        };
        setReasons((prev) => [...prev, newReason]);
      }

      // Reset form and close modal
      setFormData({
        reason_name: "",
        description: "",
        is_active: true,
      });
      setEditingReason(null);
      setShowAddModal(false);
      setSuccessMessage(`Reason ${editingReason ? 'updated' : 'added'} successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error("Error saving case reason:", err);
      setError(err.response?.data?.error || "Failed to save case reason");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete reason
  const handleDelete = async (reasonId: number) => {
    if (!window.confirm("Are you sure you want to delete this case reason?")) {
      return;
    }

    try {
      await api.delete(`/case-reasons/${reasonId}`);
      setReasons((prev) => prev.filter((reason) => reason.reason_id !== reasonId));
    } catch (err: any) {
      console.error("Error deleting case reason:", err);
      setError(err.response?.data?.error || "Failed to delete case reason");
    }
  };

  // Handle toggling the active status of a reason
  const handleToggleActive = async (reasonId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/case-reasons/${reasonId}/toggle-active`, {
        is_active: !currentStatus,
      });

      // Update the reason in the list
      setReasons((prev) =>
        prev.map((reason) =>
          reason.reason_id === reasonId ? { ...reason, is_active: !currentStatus } : reason
        )
      );

      setSuccessMessage(`Reason ${currentStatus ? 'deactivated' : 'activated'} successfully`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error toggling reason status:", error);
      setError("Failed to update reason status");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Case Reasons Management</h1>
        <div className="space-x-4">
          <Link href="/cases">
            <Button variant="outline">Back to Cases Dashboard</Button>
          </Link>
          <Button onClick={() => setShowAddModal(true)}>Add New Reason</Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}

      <Card className="p-4">
        {loading ? (
          <div className="text-center py-6">Loading case reasons...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reasons.length > 0 ? (
                  reasons.map((reason) => (
                    <tr key={reason.reason_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {reason.reason_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reason.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            reason.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {reason.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleActive(reason.reason_id, reason.is_active)}
                          className={`mr-2 text-xs px-2 py-1 rounded ${
                            reason.is_active
                              ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                              : "bg-green-200 hover:bg-green-300 text-green-700"
                          }`}
                        >
                          {reason.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleEditClick(reason)}
                          className="mr-2 text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(reason.reason_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No case reasons found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Reason Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingReason ? "Edit Case Reason" : "Add New Case Reason"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingReason(null);
                  setFormData({
                    reason_name: "",
                    description: "",
                    is_active: true,
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reason_name">
                  Reason Name *
                </label>
                <input
                  type="text"
                  id="reason_name"
                  name="reason_name"
                  value={formData.reason_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingReason(null);
                    setFormData({
                      reason_name: "",
                      description: "",
                      is_active: true,
                    });
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <Button type="submit" isLoading={submitting}>
                  {editingReason ? "Update" : "Add"} Reason
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}