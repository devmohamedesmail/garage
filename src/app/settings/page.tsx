"use client";

import React, { useState, useEffect } from "react";
import api from "@/services/api";
import ProtectedRoute from "@/components/ProtectedRoute";

// Define interfaces for our type safety
interface Role {
  role_id: number;
  role_name: string;
}

// Settings page component
const Settings = () => {
  // State for user settings
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // State for edit/delete actions
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role_id: "",
    password: "", // For new users
    old_password: "", // For password change
    new_password: "", // For password change
    confirm_password: "", // For validation
  });
  
  // Feedback messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // Fetch all users and roles on component mount
  useEffect(() => {
    // Get users
    api.get("/users")
      .then(response => {
        setUsers(response.data);
      })
      .catch(error => {
        console.error("Error fetching users:", error);
        setError("Failed to fetch users.");
      });
      
    // Get roles
    api.get("/roles")
      .then(response => {
        setRoles(response.data);
      })
      .catch(error => {
        console.error("Error fetching roles:", error);
        setError("Failed to fetch roles.");
      });
  }, []);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Reset form and states
  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role_id: "",
      password: "",
      old_password: "",
      new_password: "",
      confirm_password: ""
    });
    setSelectedUser(null);
    setEditMode(false);
    setDeleteConfirm(false);
    setMessage("");
    setError("");
  };
  
  // Select a user for edit/delete
  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role_id: user.role_id?.toString() || "",
      password: "", // Clear password fields
      old_password: "",
      new_password: "",
      confirm_password: ""
    });
    setEditMode(true);
    setDeleteConfirm(false);
  };
  
  // Handle create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Password validation for new users
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    
    try {
      await api.post("/users", {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        role_id: parseInt(formData.role_id),
        password: formData.password
      });
      
      // Refresh users list
      const response = await api.get("/users");
      setUsers(response.data);
      
      setMessage("User created successfully!");
      resetForm();
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.response?.data?.error || "Failed to create user.");
    }
  };
  
  // Handle update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    // Password validation if changing password
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setError("New passwords do not match.");
      return;
    }
    
    try {
      // Prepare the update data
      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        role_id: parseInt(formData.role_id)
      };
      
      // Only include password fields if changing password
      if (formData.old_password && formData.new_password) {
        updateData.old_password = formData.old_password;
        updateData.new_password = formData.new_password;
      }
      
      await api.put(`/users/${selectedUser.user_id}`, updateData);
      
      // Refresh users list
      const response = await api.get("/users");
      setUsers(response.data);
      
      setMessage("User updated successfully!");
      resetForm();
    } catch (err: any) {
      console.error("Error updating user:", err);
      setError(err.response?.data?.error || "Failed to update user.");
    }
  };
  
  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await api.delete(`/users/${selectedUser.user_id}`);
      
      // Refresh users list
      const response = await api.get("/users");
      setUsers(response.data);
      
      setMessage("User deleted successfully!");
      resetForm();
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setError(err.response?.data?.error || "Failed to delete user.");
    }
  };
  
  // Cancel current action
  const handleCancel = () => {
    resetForm();
  };

  // Main render
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">System Settings</h1>
        
        {/* Feedback messages */}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* User Management Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          
          {/* User List */}
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Role</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.user_id}>
                    <td className="px-4 py-2">{`${user.first_name} ${user.last_name}`}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.role_name}</td>
                    <td className="px-4 py-2">
                      <button 
                        onClick={() => handleSelectUser(user)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          handleSelectUser(user);
                          setDeleteConfirm(true);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Create/Edit User Form */}
          {!deleteConfirm && (
            <form onSubmit={editMode ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {editMode ? `Edit User: ${selectedUser?.first_name} ${selectedUser?.last_name}` : "Create New User"}
                </h3>
                {editMode && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              
              {/* User form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium">Role</label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">-- Select Role --</option>
                    {roles.map((role: Role) => (
                      <option key={role.role_id} value={role.role_id}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Password fields - different for create vs edit */}
              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium mb-2">
                  {editMode ? "Change Password (leave blank to keep current)" : "Set Password"}
                </h4>
                
                {/* For edit mode: require old password */}
                {editMode && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium">Current Password</label>
                    <input
                      type="password"
                      name="old_password"
                      value={formData.old_password}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                )}
                
                {/* For create: require password */}
                {!editMode && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required={!editMode} // Required for new users
                    />
                  </div>
                )}
                
                {/* For edit: new password */}
                {editMode && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium">New Password</label>
                    <input
                      type="password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                )}
                
                {/* Confirm password field */}
                <div className="mb-3">
                  <label className="block text-sm font-medium">
                    {editMode ? "Confirm New Password" : "Confirm Password"}
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required={!editMode || (editMode && !!formData.new_password)}
                  />
                </div>
              </div>
              
              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded text-white ${
                    editMode ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {editMode ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          )}
          
          {/* Delete Confirmation */}
          {deleteConfirm && selectedUser && (
            <div className="bg-red-50 border border-red-300 p-4 rounded">
              <h3 className="text-lg font-medium text-red-800 mb-2">Confirm Delete</h3>
              <p className="mb-4">
                Are you sure you want to delete the user <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Settings;