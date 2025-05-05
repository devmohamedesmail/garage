"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StaffMember {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id: number;
  role_name?: string;
  is_active: number;
  password_hash?: string;
}

interface Role {
  role_id: number;
  role_name: string;
}

const StaffPage = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filter, setFilter] = useState({
    roleId: 0,
    name: "",
  });

  useEffect(() => {
    const fetchStaffAndRoles = async () => {
      try {
        setLoading(true);

        const [staffRes, rolesRes] = await Promise.all([
          api.get("/users"),
          api.get("/roles"),
        ]);

        setStaffList(staffRes.data);
        setRoles(rolesRes.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch staff information");
        setLoading(false);
      }
    };

    fetchStaffAndRoles();
  }, []);

  useEffect(() => {
    // Update the filter.name whenever searchTerm changes
    setFilter((prev) => ({
      ...prev,
      name: searchTerm,
    }));
  }, [searchTerm]);

  const getFilteredStaff = () => {
    return staffList.filter((staff) => {
      // Filter by role if a role is selected
      if (filter.roleId !== 0 && staff.role_id !== filter.roleId) {
        return false;
      }

      // Filter by name if search term exists
      if (filter.name) {
        const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
        if (!fullName.includes(filter.name.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: name === "roleId" ? parseInt(value) : value,
    });
  };

  const getRoleName = (roleId: number) => {
    const role = roles.find((r) => r.role_id === roleId);
    return role ? role.role_name : "Unknown Role";
  };

  const filteredStaff = getFilteredStaff();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Loading staff...</p>
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Staff</h1>
        {/* Optionally add an "Add New Staff" button here */}
      </div>

      {/* Full-width Search Bar */}
      <div className="mb-6 w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCurrentPage(1);
          }}
          className="flex w-full"
        >
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" className="rounded-r-md">
            Search
          </Button>
        </form>
      </div>

      <Card className="p-4">
        {filteredStaff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.map((staff) => {
                  return (
                    <tr key={staff.user_id} className="hover:bg-gray-100">
                      <td className="px-4 py-3">
                        {staff.first_name} {staff.last_name}
                      </td>
                      <td className="px-4 py-3">
                        {getRoleName(staff.role_id) || "Unknown"}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/staff/${staff.user_id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No staff found.</p>
        )}
      </Card>
    </div>
  );
};

export default StaffPage;