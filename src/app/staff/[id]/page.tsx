'use client';

import React, { useEffect, useState } from "react";
import api from "@/services/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface StaffMember {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id: number;
  is_active: number;
  password_hash?: string;
}

interface Role {
  role_id: number;
  role_name: string;
}

interface StaffTimeStats {
  staff: {
    user_id: number;
    staff_name: string;
    role_name: string;
  };
  total_stats: {
    tasks_completed: number;
    total_minutes: number;
    time_spent_formatted: string;
  };
}

const StaffDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [timeStats, setTimeStats] = useState<StaffTimeStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role_id: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        
        const staffRes = await api.get(`/users/${userId}`);
        setStaff(staffRes.data);
        
        setEditForm({
          first_name: staffRes.data.first_name,
          last_name: staffRes.data.last_name,
          email: staffRes.data.email,
          phone: staffRes.data.phone || "",
          role_id: staffRes.data.role_id,
        });
        
        const rolesRes = await api.get("/roles");
        setRoles(rolesRes.data);
        
        const timeStatsRes = await api.get(`/staff/${userId}/time-stats`);
        setTimeStats(timeStatsRes.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching staff data:", error);
        setError("Failed to load staff information");
        setLoading(false);
      }
    };

    if (userId) {
      fetchStaffData();
    }
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: name === "role_id" ? parseInt(value, 10) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/users/${userId}`, {
        ...editForm,
        password_hash: staff?.password_hash || "",
        is_active: staff?.is_active || 1,
      });
      
      const updatedStaff = await api.get(`/users/${userId}`);
      setStaff(updatedStaff.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating staff:", error);
      setError("Failed to update staff information");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Loading staff information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold text-red-600">{error}</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Staff member not found</p>
      </div>
    );
  }

  const getRoleName = (roleId: number) => {
    const role = roles.find(r => r.role_id === roleId);
    return role ? role.role_name : "Unknown Role";
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Staff Details</h1>
        <div className="flex space-x-4">
          <Link 
            href={`/reports/staff?techId=${userId}`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            View Staff Reports
          </Link>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Back to Staff List
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Staff Information</h2>
        
        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{staff.first_name} {staff.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{staff.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{staff.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{getRoleName(staff.role_id)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{staff.is_active ? "Active" : "Inactive"}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-2">Work Summary</p>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm">
                  <span className="font-medium">Tasks Completed:</span> {timeStats?.total_stats.tasks_completed || 0}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Total Time:</span> {timeStats?.total_stats.time_spent_formatted || "0h 0m"}
                </p>
              </div>
            </div>
            
            <div className="pt-4 flex justify-center">
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Edit Information
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={editForm.first_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={editForm.last_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Role</label>
                <select
                  name="role_id"
                  value={editForm.role_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4 justify-center">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StaffDetailPage;