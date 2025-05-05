import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import api from "@/services/api";

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  role_id: number;
  role_name?: string;
}

interface AddAppointmentToastProps {
  isVisible: boolean;
  onClose: () => void;
  onAddAppointment: (data: {
    customerId: number;
    vehicleId: number;
    date: string;
    technician: string;  // or number
    serviceType: string;
    notes: string;
  }) => void;
}

const AddAppointmentToast: React.FC<AddAppointmentToastProps> = ({
  isVisible,
  onClose,
  onAddAppointment,
}) => {
  const [formData, setFormData] = useState({
    customerId: "",
    vehicleId: "",
    vehicleDisplay: "",
    date: "",
    technician: "",
    serviceType: "",
    notes: "",
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/customers");
        setCustomers(response.data.customers);
        setFilteredCustomers(response.data.customers);
      } catch (err) {
        console.error("Failed to fetch customers", err);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch technicians
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const userRes = await api.get("/users?role=technician");
        const techUsers: User[] = userRes.data;
        setTechnicians(techUsers);
      } catch (err) {
        console.error("Failed to fetch technicians", err);
      }
    };

    fetchTechnicians();
  }, []);

  // Filter for customers
  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setFormData((prev) => ({ ...prev, customerId: query }));

    const filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  };

  const handleSelectCustomer = async (id: number, name: string) => {
    setFormData((prev) => ({ ...prev, customerId: id.toString() }));
    setFilteredCustomers([]);

    try {
      const response = await api.get("/vehicles");
      const customerVehicles = response.data.vehicles.filter(
        (vehicle: any) => vehicle.customer_id === id
      );
      setVehicles(customerVehicles);
      setFilteredVehicles(customerVehicles);
    } catch (err) {
      console.error("Failed to fetch vehicles", err);
    }
  };

  // Filter for vehicles
  const handleVehicleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setFormData((prev) => ({ ...prev, vehicleDisplay: query }));

    const filtered = vehicles.filter((vehicle: any) => {
      const displayName = `${vehicle.license_plate} - ${vehicle.make} ${vehicle.model} (${vehicle.year})`;
      return displayName.toLowerCase().includes(query);
    });

    setFilteredVehicles(filtered);
  };

  const handleSelectVehicle = (vehicle: any) => {
    const displayName = `${vehicle.license_plate} - ${vehicle.make} ${vehicle.model} (${vehicle.year})`;
    setFormData((prev) => ({
      ...prev,
      vehicleId: vehicle.vehicle_id.toString(),
      vehicleDisplay: displayName,
    }));
    setFilteredVehicles([]);
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || !formData.vehicleId) {
      alert("Please select a valid customer and vehicle.");
      return;
    }

    onAddAppointment({
      customerId: parseInt(formData.customerId, 10),
      vehicleId: parseInt(formData.vehicleId, 10),
      date: formData.date,
      technician: formData.technician,
      serviceType: formData.serviceType,
      notes: formData.notes,
    });

    onClose();
  };

  // Hide if not visible
  if (!isVisible) return null;

  return (
    <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 shadow-lg w-96 z-50">
      <h2 className="text-xl font-bold mb-4">Add New Appointment</h2>
      <form onSubmit={handleSubmit}>
        {/* Customer */}
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Search Customer"
            value={
              customers.find(
                (customer: any) =>
                  customer.id.toString() === formData.customerId
              )?.name || formData.customerId
            }
            onChange={handleCustomerSearch}
            className="mb-2"
          />
          {filteredCustomers.length > 0 && (
            <ul className="absolute bg-white border rounded-md shadow-md max-h-40 overflow-y-auto w-full z-10">
              {filteredCustomers.map((customer: any) => (
                <li
                  key={customer.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectCustomer(customer.id, customer.name)}
                >
                  {customer.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Vehicle */}
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Search Vehicle"
            value={formData.vehicleDisplay}
            onChange={handleVehicleSearch}
            className="mb-2"
          />
          {filteredVehicles.length > 0 && (
            <ul className="absolute bg-white border rounded-md shadow-md max-h-40 overflow-y-auto w-full z-10">
              {filteredVehicles.map((vehicle: any) => (
                <li
                  key={vehicle.vehicle_id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectVehicle(vehicle)}
                >
                  {`${vehicle.license_plate} - ${vehicle.make} ${vehicle.model} (${vehicle.year})`}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Date (will map to "service_date" on the server) */}
        <Input
          type="date"
          placeholder="Date"
          value={formData.date}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, date: e.target.value }))
          }
          className="mb-2"
        />

        {/* Technician Dropdown */}
        <div className="mb-2">
          <label htmlFor="technician" className="block text-sm font-medium">
            Technician
          </label>
          <select
            id="technician"
            className="border rounded w-full p-2"
            value={formData.technician}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, technician: e.target.value }))
            }
          >
            <option value="">-- Select Technician --</option>
            {technicians.map((tech) => (
              <option key={tech.user_id} value={tech.user_id.toString()}>
                {`${tech.first_name} ${tech.last_name}`}
              </option>
            ))}
          </select>
        </div>

        {/* Service Type */}
        <Input
          type="text"
          name="serviceType"
          placeholder="Service Type"
          value={formData.serviceType}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, serviceType: e.target.value }))
          }
          className="mb-2"
        />

        {/* Notes */}
        <Input
          type="text"
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          className="mb-2"
        />

        <div className="flex justify-end">
          <Button type="submit" className="mr-2">
            Submit
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddAppointmentToast;
