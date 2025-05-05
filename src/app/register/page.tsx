"use client";

import React, { useState, useEffect } from "react";
import api from "@/services/api";
import ProtectedRoute from "@/components/ProtectedRoute";


const Register = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role_id: "", // Updated: Empty role by default
  });
  const [roles, setRoles] = useState([]); // Stores roles from the backend
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch roles from API
  useEffect(() => {
    api.get("/roles")
      .then(response => {
        setRoles(response.data);
      })
      .catch(error => console.error("Error fetching roles:", error));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post("/register", formData);
      setSuccess("Registration successful! You can now log in.");
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed.");
      setSuccess("");
    }
  };

  return (
    // <ProtectedRoute allowedRoles={["Admin"]}>
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4">Register</h2>
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}
          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="block font-semibold">First Name</label>
              <input
                type="text"
                name="first_name"
                className="w-full p-2 border rounded"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="block font-semibold">Last Name</label>
              <input
                type="text"
                name="last_name"
                className="w-full p-2 border rounded"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="block font-semibold">Email</label>
              <input
                type="email"
                name="email"
                className="w-full p-2 border rounded"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="block font-semibold">Phone</label>
              <input
                type="text"
                name="phone"
                className="w-full p-2 border rounded"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="block font-semibold">Password</label>
              <input
                type="password"
                name="password"
                className="w-full p-2 border rounded"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            {/* Role Selection Dropdown */}
            <div className="mb-3">
              <label className="block font-semibold">Select Role</label>
              <select
                name="role_id"
                className="w-full p-2 border rounded"
                value={formData.role_id}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Role --</option>
                {roles.map((role: any) => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">
              Register
            </button>
          </form>
          <p className="mt-4 text-sm">
            Already have an account? <a href="/login" className="text-blue-500">Login</a>
          </p>
        </div>
      </div>
    // </ProtectedRoute>
  );
};

export default Register;
