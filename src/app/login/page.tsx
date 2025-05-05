"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Use Next.js router for redirection
import api from "@/services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter(); // Initialize router

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      // Store token
      localStorage.setItem("token", response.data.token);

      // Redirect based on role
      switch (response.data.role) {
        case "Admin":
          router.push("/admin/dashboard");
          break;
        case "Technician":
          router.push("/technician/dashboard");
          break;
        case "Supervisor":
          router.push("/supervisor/dashboard");
          break;
        case "Sales":
          router.push("/sales/dashboard");
          break;
        default:
          router.push("/dashboard"); // Default dashboard
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="block font-semibold">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="block font-semibold">Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
