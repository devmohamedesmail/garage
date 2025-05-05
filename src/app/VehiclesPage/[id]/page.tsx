

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/services/api"; // Import the API service

interface Vehicle {
  id: number;
  customer_id: number;
  customer_name?: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
  vehicle_type?: string;
}

interface WorkOrder {
  work_order_id: number;
  status: string;
  is_completed: boolean;
  supervisor: string;
  start_date: string;
  end_date?: string;
}

interface PageProps {
  params: { id: string };
}


export async function generateStaticParams() {
  const response = await api.get('/api/vehicles');
  const vehicles = response.data;

  // Return an array of paths with vehicle IDs
  return vehicles.map((vehicle: Vehicle) => ({
    id: vehicle.id.toString(),
  }));
}

export default function VehicleDetailsPage({ params }: PageProps) {
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state for edit modal
  const [formData, setFormData] = useState({
    vin: '',
    make: '',
    model: '',
    year: '',
    license_plate: '',
    color: '',
    vehicle_type: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // First, resolve the params
  useEffect(() => {
    async function resolveParams() {
      try {
        const resolvedParams = await Promise.resolve(params);
        setVehicleId(resolvedParams.id);
      } catch (error) {
        console.error("Error resolving params:", error);
      }
    }
    
    resolveParams();
  }, [params]);

  // Then fetch data once we have the ID
  useEffect(() => {
    if (!vehicleId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch vehicle data
        const res = await api.get(`/api/vehicles/${vehicleId}`);
        const vehicleData = res.data;
        
        // Format the vehicle data
        const formattedVehicle = {
          id: vehicleData.vehicle_id,
          customer_id: vehicleData.customer_id,
          vin: vehicleData.vin,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          license_plate: vehicleData.license_plate,
          color: vehicleData.color,
          vehicle_type: vehicleData.vehicle_type,
        };
        
        setVehicle(formattedVehicle);
        
        // Initialize form data
        setFormData({
          vin: formattedVehicle.vin || '',
          make: formattedVehicle.make || '',
          model: formattedVehicle.model || '',
          year: formattedVehicle.year ? formattedVehicle.year.toString() : '',
          license_plate: formattedVehicle.license_plate || '',
          color: formattedVehicle.color || '',
          vehicle_type: formattedVehicle.vehicle_type || '',
        });

        // Fetch the customer name
        const customerRes = await api.get(`/api/customers/${vehicleData.customer_id}`);
        const customerData = customerRes.data;
        setVehicle(prev => prev ? {
          ...prev,
          customer_name: `${customerData.first_name} ${customerData.last_name}`
        } : null);

        // Fetch work orders for this vehicle
        const workOrdersRes = await api.get(`/api/work_orders`);
        const workOrdersData = workOrdersRes.data;
        const vehicleWorkOrders = workOrdersData.workOrders.filter(
          (wo: any) => wo.vehicle_id === parseInt(vehicleId)
        );
        setWorkOrders(vehicleWorkOrders);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [vehicleId]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.put(`/api/vehicles/${vehicle?.id}`, {
        customer_id: vehicle?.customer_id,
        vin: formData.vin,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        license_plate: formData.license_plate,
        color: formData.color,
        vehicle_type: formData.vehicle_type,
      });

      // Update the UI with new data
      if (vehicle) {
        const updatedVehicle = {
          ...vehicle,
          vin: formData.vin,
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          license_plate: formData.license_plate,
          color: formData.color,
          vehicle_type: formData.vehicle_type,
        };
        
        setVehicle(updatedVehicle);
      }
      
      closeModal();
    } catch (err) {
      console.error('Error updating vehicle:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Loading vehicle data...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Vehicle not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Vehicle Details
      </h1>

      {/* Vehicle Info Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            Vehicle Information
          </h2>
          <div>
            <button
              onClick={openModal}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Edit Vehicle
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Make:</span> {vehicle.make}
          </p>
          <p>
            <span className="font-medium">Model:</span> {vehicle.model}
          </p>
          <p>
            <span className="font-medium">Year:</span> {vehicle.year}
          </p>
          <p>
            <span className="font-medium">License Plate:</span> {vehicle.license_plate}
          </p>
          <p>
            <span className="font-medium">VIN:</span> {vehicle.vin}
          </p>
          <p>
            <span className="font-medium">Color:</span> {vehicle.color}
          </p>
          {vehicle.vehicle_type && (
            <p>
              <span className="font-medium">Type:</span> {vehicle.vehicle_type}
            </p>
          )}
          <p>
            <span className="font-medium">Owner:</span>{" "}
            {vehicle.customer_name ? (
              <Link href={`/customers/${vehicle.customer_id}`} className="text-blue-500 hover:underline">
                {vehicle.customer_name}
              </Link>
            ) : (
              `Customer ID: ${vehicle.customer_id}`
            )}
          </p>
        </div>
      </div>

      {/* Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Vehicle</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="make">
                  Make
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="make"
                  name="make"
                  type="text"
                  value={formData.make}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="model">
                  Model
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="model"
                  name="model"
                  type="text"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="year">
                  Year
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="license_plate">
                  License Plate
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="license_plate"
                  name="license_plate"
                  type="text"
                  value={formData.license_plate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vin">
                  VIN
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="vin"
                  name="vin"
                  type="text"
                  value={formData.vin}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="color">
                  Color
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="color"
                  name="color"
                  type="text"
                  value={formData.color}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vehicle_type">
                  Vehicle Type
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="vehicle_type"
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                >
                  <option value="">Select type...</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Van">Van</option>
                  <option value="Convertible">Convertible</option>
                  <option value="Wagon">Wagon</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work Orders Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          Work Orders
        </h2>
        {workOrders.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {workOrders.map((wo) => (
              <li
                key={wo.work_order_id}
                className="py-4 hover:bg-gray-50 transition-colors"
              >
                <Link
                  href={`/work-orders/${wo.work_order_id}`}
                  className="block"
                >
                  <div className="flex flex-col md:flex-row md:justify-between">
                    <div>
                      <p>
                        <span className="font-medium">Status:</span> {wo.status}
                      </p>
                      <p>
                        <span className="font-medium">Work Order ID:</span> {wo.work_order_id}
                      </p>
                      <p>
                        <span className="font-medium">Start Date:</span> {new Date(wo.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 text-right">
                      <p>
                        <span className="font-medium">Supervisor:</span> {wo.supervisor || "Not assigned"}
                      </p>
                      <p>
                        <span className="font-medium">Completed:</span> {wo.is_completed ? "Yes" : "No"}
                      </p>
                      {wo.end_date && (
                        <p>
                          <span className="font-medium">End Date:</span> {new Date(wo.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No work orders found for this vehicle.</p>
        )}
      </div>
    </div>
  );
}