"use client";

import React, { useState, useEffect } from "react";
import api from "@/services/api"; // Import the API service
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddVehicleToast from "@/app/VehiclesPage/AddVehicleToast";

interface Vehicle {
  id: number;
  customerId: number;
  customerName: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
}

const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  // Fetch vehicles when component mounts or page changes
  useEffect(() => {
    const fetchVehicles = async (currentPage = 1) => {
      try {
        setLoading(true);
        // Use the api service for paginated vehicles
        const response = await api.get(
          `/api/vehicles?page=${currentPage}&limit=10`
        );

        if (response.data && Array.isArray(response.data.vehicles)) {
          setVehicles(response.data.vehicles);
          setTotalPages(response.data.totalPages || 1);
        } else {
          throw new Error("Invalid response format");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        setError("Failed to load vehicles. Please try again later.");
        setLoading(false);
      }
    };

    fetchVehicles(page);
  }, [page]);

  // Search vehicles by plate number or VIN
  const handleSearch = async () => {
    if (!search.trim()) {
      // If search is empty, fetch all vehicles with pagination
      fetchVehicles(1);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(
        `/api/vehicles/search?term=${encodeURIComponent(search)}`
      );

      if (response.data && Array.isArray(response.data.vehicles)) {
        setVehicles(response.data.vehicles);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setVehicles([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error searching vehicles:", error);
      setError("Failed to search vehicles.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (data: {
    customerId: number;
    vin: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color: string;
  }) => {
    try {
      await api.post("/api/vehicles", {
        customer_id: data.customerId,
        vin: data.vin,
        make: data.make,
        model: data.model,
        year: data.year,
        license_plate: data.licensePlate,
        color: data.color,
      });
      // Refresh the vehicles list after adding a new one
      fetchVehicles(page);
    } catch (err) {
      console.error("Error adding vehicle:", err);
      alert("Failed to add vehicle.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <Button onClick={() => setShowToast(true)}>Add New Vehicle</Button>
      </div>

      <div className="flex items-center mb-4">
        <Input
          type="text"
          placeholder="Search by license plate, model, or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mr-2"
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <Card className="p-4">
        {vehicles && vehicles.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {vehicles.map((vehicle) => (
              <li
                key={vehicle.id}
                className="py-4 hover:bg-gray-50 transition-colors"
              >
                <Link href={`/vehicles/${vehicle.id}`} className="block">
                  <div className="flex flex-col md:flex-row md:justify-between">
                    <div>
                      <p>
                        <span className="font-medium">Owner:</span>{" "}
                        {vehicle.customerName}
                      </p>
                      <p>
                        <span className="font-medium">VIN:</span>{" "}
                        {vehicle.vin || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Make & Model:</span>{" "}
                        {vehicle.make} {vehicle.model}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 text-right">
                      <p>
                        <span className="font-medium">License Plate:</span>{" "}
                        {vehicle.licensePlate}
                      </p>
                      <p>
                        <span className="font-medium">Year:</span> {vehicle.year}
                      </p>
                      <p>
                        <span className="font-medium">Color:</span> {vehicle.color}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent the link click
                          window.location.href = `/VehiclesPage/${vehicle.id}`;
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No vehicles found.</p>
        )}
      </Card>

      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>

      <AddVehicleToast
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        onAddVehicle={handleAddVehicle}
      />
    </div>
  );
};

export default VehiclesPage;