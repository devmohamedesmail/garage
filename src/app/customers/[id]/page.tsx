'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/services/api"; // Import the API service

interface Customer {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  city?: string;
  country?: string;
}

interface Vehicle {
  vehicle_id: number;
  customer_id: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
}

interface WorkOrder {
  work_order_id: number;
  customer_id: number;
  status: string;
  is_completed: boolean;
  license_plate: string;
  make: string;
  model: string;
  color: string;
  supervisor: string;
}

interface PageProps {
  params: { id: string };
}

export default function CustomerPage({ params }: PageProps) {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [customerWorkOrders, setCustomerWorkOrders] = useState<WorkOrder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state for edit modal
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // First, resolve the params
  useEffect(() => {
    if (params && params.id) {
      setCustomerId(params.id);
    }
  }, [params]);

  // Then fetch data once we have the ID
  useEffect(() => {
    if (!customerId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch customer data
        const res = await api.get(`/customers/${customerId}`);
        
        const customerData = res.data;
        const formattedCustomer = {
          id: customerData.customer_id || customerData.id,
          name:
            customerData.name ||
            `${customerData.first_name} ${customerData.last_name}`,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          email: customerData.email,
          phone: customerData.phone,
          city: customerData.city,
          country: customerData.country,
        };
        
        setCustomer(formattedCustomer);
        
        // Initialize form data
        const nameParts = formattedCustomer.name ? formattedCustomer.name.split(' ') : [];
        const initialFirstName = formattedCustomer.first_name || nameParts[0] || '';
        const initialLastName = formattedCustomer.last_name || nameParts.slice(1).join(' ') || '';
        
        setFormData({
          first_name: initialFirstName,
          last_name: initialLastName,
          email: formattedCustomer.email || '',
          phone: formattedCustomer.phone || '',
          city: formattedCustomer.city || '',
          country: formattedCustomer.country || '',
        });

        // Fetch vehicles and filter by customer
        const vehiclesRes = await api.get('/vehicles');
        
        if (vehiclesRes.data) {
          const allVehicles: Vehicle[] = vehiclesRes.data.vehicles;
          setCustomerVehicles(allVehicles.filter(
            (v) => v.customer_id === Number(customerId)
          ));
        }

        // Fetch work orders and filter by customer
        const workOrdersRes = await api.get('/work_orders');
        
        if (workOrdersRes.data) {
          const allWorkOrders: WorkOrder[] = workOrdersRes.data.workOrders;
          setCustomerWorkOrders(allWorkOrders.filter(
            (wo) => wo.customer_id === Number(customerId)
          ));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.put(`/customers/${customer?.id}`, formData);

      // Update the UI with new data
      const updatedCustomer = {
        ...customer!,
        name: `${formData.first_name} ${formData.last_name}`,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        country: formData.country,
      };
      
      setCustomer(updatedCustomer);
      closeModal();
      
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Loading customer data...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Customer Details
      </h1>

      {/* Customer Info Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            Personal Information
          </h2>
          <div>
            <button
              onClick={openModal}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Edit Customer
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Name:</span> {customer.name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {customer.email}
          </p>
          <p>
            <span className="font-medium">Phone:</span> {customer.phone}
          </p>
          {customer.city && (
            <p>
              <span className="font-medium">City:</span> {customer.city}
            </p>
          )}
          {customer.country && (
            <p>
              <span className="font-medium">Country:</span> {customer.country}
            </p>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Customer</h2>
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="first_name">
                  First Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="last_name">
                  Last Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                  Phone
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
                  City
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
                  Country
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                />
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

      {/* Vehicles Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          Vehicles
        </h2>
        {customerVehicles.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {customerVehicles.map((vehicle) => (
              <li
                key={vehicle.vehicle_id}
                className="py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div>
                    <p>
                      <span className="font-medium">Make:</span> {vehicle.make}
                    </p>
                    <p>
                      <span className="font-medium">Model:</span> {vehicle.model}
                    </p>
                    <p>
                      <span className="font-medium">VIN:</span> {vehicle.vin}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0 text-right">
                    <p>
                      <span className="font-medium">License Plate:</span> {vehicle.license_plate}
                    </p>
                    <p>
                      <span className="font-medium">Year:</span> {vehicle.year}
                    </p>
                    <p>
                      <span className="font-medium">Color:</span> {vehicle.color}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No vehicles found for this customer.</p>
        )}
      </div>

      {/* Work Orders Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          Work Orders
        </h2>
        {customerWorkOrders.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {customerWorkOrders.map((wo) => (
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
                        <span className="font-medium">License Plate:</span> {wo.license_plate}
                      </p>
                      <p>
                        <span className="font-medium">Vehicle:</span> {wo.make} {wo.model} ({wo.color})
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 text-right">
                      <p>
                        <span className="font-medium">Supervisor:</span> {wo.supervisor || "Not assigned"}
                      </p>
                      <p>
                        <span className="font-medium">Completed:</span> {wo.is_completed ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No work orders found for this customer.</p>
        )}
      </div>
    </div>
  );
}